# standard library imports
import csv
import datetime as dt
import json
import os
import statistics
import time

# third-party imports
import numpy as np
import pandas as pd
import requests


def query(url, parameter, interval, maxtrial, verbose):
    '''
    return json of requesting url with parameters, otherwise retry with an interval
    -----------------
    Parameters:
    -- url: string, API
    -- parameter: {'parameters' : 'value'}, parameters attached
    -- interval: int, time of sleep if request fail
    -- maxtrial: int, maximum number of attempt
    -----------------
    Returns:
    -- json
    '''
    if maxtrial == 0:
        if verbose:
            print("request failed, stop trying!")
        return None
    response = requests.get(url=url, params=parameter)
    if response.status_code == 200:
        if verbose:
            print('request successful!')
        return response.json()
    else:
        if verbose:
            print('An error occurs! Retry after {} seconds'.format(interval))
        time.sleep(interval)
        return query(url, parameter, interval, maxtrial-1)


class appidExtractor:
    '''
    extract appid from given url
    Parameters:
    --- url: string, API
    --- name: string, data will be stored in name.csv
    --- interval: int, time of sleep if request fail
    '''

    def __init__(self, name, interval):
        '''
        -- csvpath: path of csv file
        -- tracepath: path of txt that stores pathidx
        -- trace: next page index to request. !!It is a string!!
        -- fieldnames: names of the columns to be written into .csv file
        '''
        csvfile = name+".csv"
        tracefile = name+"_trace.txt"
        self.interval = interval
        self.trace = 0
        self.fieldnames = []
        self.csvpath = os.path.join(os.getcwd(), csvfile)
        self.tracepath = os.path.join(os.getcwd(), tracefile)

    def writeheader(self):
        '''
        write header of csvfile based fieldnames
        '''
        with open(self.csvpath, mode='a', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(
                csvfile, fieldnames=self.fieldnames, extrasaction='ignore')
            writer.writeheader()
        return

    def initialize(self):
        '''
        initialize csv and page file if no previous request made
        otherwise, read page idx from tracefile
        if only one file exists, reset the progress
        '''
        try:
            csvfile = open(self.csvpath, 'r')
            try:
                tracefile = open(self.tracepath, 'r')
                self.trace = int(tracefile.read())
                tracefile.close()
                csvfile.close()
            except FileNotFoundError:
                csvfile.close()
                csvfile = open(self.csvpath, 'w')
                csvfile.write("")
                csvfile.close()
                tracefile = open(self.tracepath, 'w')
                tracefile.write("0")
                tracefile.close()
            except:
                print("something else went wrong!")
                exit()

        except FileNotFoundError:
            csvfile = open(self.csvpath, 'x')
            tracefile = open(self.tracepath, 'w')
            tracefile.write("0")
            csvfile.close()
            tracefile.close()
        except:
            print("something else went wrong!")
            exit()

        self.writeheader()
        return

    def deleteAll(self):
        '''delete both csvfile and tracefile'''
        if os.path.exists(self.csvpath):
            os.remove(self.csvpath)
        if os.path.exists(self.tracepath):
            os.remove(self.tracepath)

        return

    def get_trace(self):
        '''
        read page idx from tracefile and set self.trace
        '''
        with open(self.tracepath, 'r') as tracefile:
            self.trace = tracefile.read()
        return

    def set_trace(self, val):
        '''
        set page idx in both self.trace and tracefile
        -- val: int
        '''
        self.trace = str(val)
        with open(self.tracepath, 'w') as tracefile:
            tracefile.write(self.trace)
        return

    def set_fieldnames(self, fieldnames):
        '''
        set the names of the columns to be written into .csv file
        !!! must be set before run() !!!
        -- fieldnames: list of string
        '''
        self.fieldnames = fieldnames
        return

    def process_query(self):
        '''
        recursion to request data with all page idx
        '''
        self.get_trace()
        para = {"request": "all", "page": self.trace}
        url = "https://steamspy.com/api.php"
        data = query(url, para, self.interval, 3, True)  # request data
        time.sleep(10)
        if data == None:  # if request faied, exit
            exit()
        # write dictionary data into csv
        with open(self.csvpath, mode='a', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['appid', 'name']
            writer = csv.DictWriter(
                csvfile, fieldnames=fieldnames, extrasaction='ignore')
            for key in data:
                writer.writerow(data[key])
        print("successfully write {number} entries, page {trace}".format(
            number=len(data), trace=self.trace))
        # update trace locally
        self.set_trace(int(self.trace)+1)
        if len(data) < 1000:  # check if it is the last page
            print("request finished")
            return
        else:
            return self.process_query()

    def run(self):
        '''
        request data from API
        '''
        if len(self.fieldnames) == 0:
            # if the fieldnames are not set, raise
            raise ValueError("fieldnames cannot be None")
        self.initialize()
        self.process_query()

        return


class detailExtractor(appidExtractor):
    def __init__(self, name, interval, parseID, batchsize):
        super().__init__(name, interval)
        appidpath = os.path.join(os.getcwd(), "appid.csv")
        self.appid_df = pd.read_csv(appidpath)
        self.check_null_response = False
        if parseID == 0:
            self.check_null_response = True
            print("About to request Steam API")
        else:
            print("About to request Steam Spy API")
        parselist = [self.parseSteam, self.parseSteamSpy]
        writerlist = [self.writeSteam, self.writeSteamSpy]
        self.parse = parselist[parseID]
        self.write = writerlist[parseID]
        self.batchsize = batchsize
        self.Null_response = {}

    def parseSteamSpy(self, appid):
        '''
        parse SteamSpy API to request app detail
        -- appid: string
        -- return: dict
        '''
        url = "https://steamspy.com/api.php"
        parameters = {"request": "appdetails", "appid": appid}
        data = query(url, parameters, self.interval, 3, False)
        return data

    def parseSteam(self, appid):
        '''
        parse Steam API to request app detail
        -- appid: string
        -- return: dict
        '''
        url = "http://store.steampowered.com/api/appdetails/"
        parameters = {"appids": appid}
        data = query(url, parameters, self.interval, 3, False)
        return data

    def writeSteam(self, data_batch):
        with open(self.csvpath, mode='a', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(
                csvfile, fieldnames=self.fieldnames, extrasaction='ignore')
            for data in data_batch:
                detail_dict = list(data.values())[0]['data']
                writer.writerow(detail_dict)
        return

    def writeSteamSpy(self,data_batch):
        with open(self.csvpath, mode='a', newline='',encoding='utf-8') as csvfile:
            writer = csv.DictWriter(
                csvfile, fieldnames=self.fieldnames, extrasaction='ignore')
            for data in data_batch:
                writer.writerow(data)
        return

    def process_batch(self, start, end):
        '''
        resume requesting based on tracefile
        read appids from appid.csv
        request app details in batch
        update trace
        -- return: list of dict
        '''
        appid_batch = []
        data_batch = []
        for idx, row in self.appid_df.loc[start:end].iterrows():
            appid_batch.append(row['appid'])
        for appid in appid_batch:
            response = self.parse(appid)
            # check if response is false for Steam API
            if self.check_null_response:
                if not list(response.values())[0]['success']:
                    response = self.Null_response
            data_batch.append(response)
            time.sleep(1)
        print("successfully request detail {} to {}".format(start, end))
        return data_batch

    def get_Steam_Null_response(self):
        Null_data = {}
        for key in self.fieldnames:
            Null_data[key] = "NaN"
        Null_response = {'NaN': {'success': True, 'data': Null_data}}
        self.Null_response = Null_response
        return

    def run(self):
        '''
        request data from API
        '''
        if len(self.fieldnames) == 0:
            # if the fieldnames are not set, raise
            raise ValueError("fieldnames cannot be None")
        #self.get_Steam_Null_response()
        self.initialize()
        proceed = True
        length = self.appid_df.shape[0]
        #length = 10
        while proceed:
            start = int(self.trace)
            end = start + self.batchsize - 1
            if end >= length:
                end = length - 1
                proceed = False
            data_batch = self.process_batch(start, end)
            self.write(data_batch)
            self.set_trace(end+1)

        return

