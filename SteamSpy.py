import extractor

steamspy_columns = [
    'appid', 'name', 'developer', 'publisher', 'score_rank', 'positive',
    'negative', 'userscore', 'owners', 'average_forever', 'average_2weeks',
    'median_forever', 'median_2weeks', 'price', 'initialprice', 'discount',
    'languages', 'genre', 'ccu', 'tags'
]

SteamSpyAppDetail = extractor.detailExtractor("SteamSpyAppDetail",1,1,100)
SteamSpyAppDetail.set_fieldnames(steamspy_columns)
SteamSpyAppDetail.run()