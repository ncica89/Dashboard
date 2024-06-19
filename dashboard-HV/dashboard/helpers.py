
def extract_info(data, key_name):
    try:
        item = data.get(key_name, {})
        feature_name = item.get("name")
        feature_title = item.get("title")
        store = item.get("store", {})
        store_name = store.get("name")

        SQL = find_sql(data)
        if SQL:
            return {
                "Geoserver Title": feature_title,
                "Geoserver WMS name": feature_name,
                "Source": store_name,
                "SQL": SQL
            }
        else:
            return {
                "Geoserver Title": feature_title,
                "Geoserver WMS name": feature_name,
                "Source": store_name,
                "SQL": item.get("nativeName")#nativName
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


def find_items(node, kv):
    if isinstance(node, list):
        for i in node:
            for x in find_items(i, kv):
               yield x
    elif isinstance(node, dict):
        if kv in node:
            yield node[kv]
        for j in node.values():
            for x in find_items(j, kv):
                yield x


def find_tema_for_layer(data, layer):
    result = []
    for item in data:
        for key, value in item.items():
            if layer in value:
                result.append(key)
    if result:
        return result
    else:
        return 'NO CONFIG'


def find_source_for_stora(data, stora):
    result = None
    try:
        stora = stora.split(':')[1]
    except:
        pass
    for item in data:
        for key, value in item.items():
            if key == stora:
                result =  value
    return result