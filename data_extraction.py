import extractor

steam_columns = [
    'type', 'name', 'steam_appid', 'required_age', 'is_free', 'controller_support',
    'dlc', 'fullgame', 'supported_languages', 'header_image', 'website', 'pc_requirements', 'mac_requirements',
    'linux_requirements', 'legal_notice', 'drm_notice', 'ext_user_account_notice',
    'developers', 'publishers', 'demos', 'price_overview', 'packages', 'package_groups',
    'platforms', 'metacritic', 'reviews', 'categories', 'genres', 'screenshots',
    'movies', 'recommendations', 'achievements', 'release_date', 'support_info',
    'background', 'content_descriptors'
]


SteamAppDetail = extractor.detailExtractor("SteamAppDetail",1,0,10)
SteamAppDetail.set_fieldnames(steam_columns)
SteamAppDetail.run()