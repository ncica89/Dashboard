
def extract_info(data, key_name):
    try:
        item = data.get(key_name, {})
        feature_name = item.get("name")
        feature_title = item.get("title")
        store = item.get("store", {})
        store_name = store.get("name")
        store_href = store.get("href").split('/g')[0]

        return {
            "Geoserver Title": feature_title,
            "Geoserver WMS name": feature_name,
            "Source": store_name,
            "Server": store_href,
            "SQL": find_sql(data)
        }
    except Exception as e:
        print(f"Error extracting info: {e}")
        return None


def find_sql(data):
    if isinstance(data, dict):
        if 'sql' in data:
            return data['sql']
        else:
            for value in data.values():
                sql = find_sql(value)
                if sql is not None:
                    return sql
    elif isinstance(data, list):
        for item in data:
            sql = find_sql(item)
            if sql is not None:
                return sql
    return None