import csv
import json
import pandas as pd
import re
import sys
import numpy as np

raw_data = pd.read_csv('SteamAppDetail.csv', low_memory=False)


raw_data.head(10) #Show the first 10 rows of the data


# How many columns and Rows we have
print('We have ', raw_data.shape[0], "Rows in SteamAPI")
print('We have ', raw_data.shape[1], "Columns in SteamAPI\n")

null_counts = raw_data.isnull().sum() #How many null Columns and Rows we have
print('The empty rows in each Column:')
print(null_counts)

'''
For the data from SteamAPI, we will keep the data which can be used. Those rows which misses names and steamappid will be cleaned.
We also find out that the rows with empty release_date were all removed after removing those with empty steamappid and names.
For the price_overview part, since we have another data source which is SteamSpy, we choose to keep them regardless of NAN.
'''

necessary_column = ['name', 'steam_appid', 'release_date']
optional_column = ['is_free', 'required_age']
for column in necessary_column:
    print('Rows to remove:', column, raw_data[raw_data[column].isnull()].shape[0])

df = raw_data.drop(raw_data[raw_data['type'] != 'game'].index, inplace = False) #Remove all the rows with type not useable

column_keep = necessary_column + optional_column

df = df[column_keep] #only keep the columns we need

df = df.drop(df[df['name'].isnull() == True].index, inplace = False).reset_index(drop=True)

null_counts = df.isnull().sum() #How many null Columns and Rows we have
print(null_counts)
'''
After we remove the column names and steamappid with empty rows, we notice that the release_date column includes the 'Coming Soon', which we
should exclude in the final visualization
'''
index_coming_list = []
index_coming = 0
release_year = []
release_date = df['release_date']
for i in range(len(release_date)):
    release_date[i].strip()
    target = release_date[i][16:21]
    year = release_date[i][-6:-2]
    release_year.append(year)
    if target != 'False':
        index_coming_list.append(index_coming)
        release_year.pop()
    index_coming += 1

df = df.drop(index_coming_list, inplace = False).reset_index(drop=True)
df['release_date'] = release_year

'''
After cleaning most of the data in SteamAPI, the columns we want in SteamAPI have been filtered out.
However, in order to complete our visualization goals, we need more features including how many people own the game, the average rating on the game and the tags of the game.
In this case, we also mine data from the SteamSpy to provide a more comprehensive visualization
'''
raw_Spy = pd.read_csv('SteamSpyAppDetail.csv', low_memory=False)

raw_Spy.head(5)
# How many columns and Rows we have
print('We have ', raw_Spy.shape[0], "Rows in SteamSpy")
print('We have ', raw_Spy.shape[1], "Columns in SteamSpy\n")

null_counts = raw_Spy.isnull().sum() #How many null Columns and Rows we have
print('The empty rows in each Column:')
print(null_counts)

'''
For the data from SteamSpy, we need to the similar thing we did in SteamAPI which is to keep the features we need.
'''

necessary_column = ['appid', 'positive', 'negative', 'owners', 'price', 'tags']
optional_column = ['name', 'publisher']
for column in necessary_column:
    print('Rows to remove:', column, raw_Spy[raw_Spy[column].isnull()].shape[0])

df_spy = raw_Spy.drop(raw_Spy[raw_Spy['price'].isnull() == True].index, inplace = False).reset_index(drop=True)

df_spy = df_spy.drop(df_spy[df_spy['appid'] == 'appid'].index, inplace = False).reset_index(drop=True)

Spy_column_keep = necessary_column + optional_column

df_spy = df_spy[Spy_column_keep] #only keep the columns we need


df_spy = df_spy.drop(df_spy[df_spy['tags'] == '[]'].index, inplace = False).reset_index(drop=True)

tags = df_spy['tags']

'''
Deal with the tag object and split them into the list
'''

tag= []
for i in range(len(df_spy['tags'])):
    tag_object = df_spy['tags'][i]
    tag_split = tag_object.split(("\'"))
    temp = []
    for i in range(int((len(tag_split)-1)/2)):
        target = 2*i+1
        temp.append(tag_split[target])
    tag.append(temp)
df_spy['tags'] = tag
owners = []
for i in range(len(df_spy['owners'])):
    owner_object = df_spy['owners'][i]
    n1 = owner_object.split("..")[0].strip()
    n2 = owner_object.split("..")[1].strip()
    n1 = int(n1.replace(',' , ''))
    n2 = int(n2.replace(',' , ''))
    res = (n1+n2)/2
    owners.append(int(res))
df_spy['owners'] = owners
rate = []
for i in range(len(df_spy['positive'])):
    positive_rate = int(df_spy['positive'][i])
    negative_rate = int(df_spy['negative'][i])
    if positive_rate+negative_rate == 0:
        res = None
    else:
        res = positive_rate/(positive_rate+negative_rate)
    rate.append(res)
df_spy['rate'] = rate
df = df.sort_values(by="steam_appid", ascending=True)
df_spy = df_spy.sort_values(by="appid", ascending=True)
df.to_csv('SteamAPI.csv')
df_spy.to_csv('SteamSpy.csv')

miss_count = 0
miss_index = []
hit_index = []
rate_list = []
price_list = []
owners_list = []
tags_list = []
for i in range(len(df['steam_appid'])):
    find_flag = 1
    target = df['steam_appid'][i]
    res = df_spy[df_spy.appid == target].index.to_list()
    if res == []:
        find_flag = 0
    else:
        hit_index.append(res[0])
    if i % 100 == 0:
        print('We now on the ' + str(i) +' steam_appid')
    if find_flag == 0:
        miss_count += 1
        hit_index.append(0)
        miss_index.append(i)
    else:
        continue

for i in hit_index:
    rate_list.append(df_spy['rate'][i])
    price_list.append(df_spy['price'][i])
    owners_list.append(df_spy['owners'][i])
    tags_list.append(df_spy['tags'][i])
df['rate'] = rate_list
df['price'] = price_list
df['owners'] = owners_list
df['tags'] = tags_list

df = df.drop(labels = miss_index, axis = 0, inplace=False).reset_index(drop=True)

df.to_csv('Final.csv')

