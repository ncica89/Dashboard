from flask import jsonify, request, Blueprint,current_app,send_file
from requests.auth import HTTPBasicAuth
from .helpers import extract_info
import requests
import pandas as pd
import os


# Create a Blueprint
app = Blueprint("services", __name__, url_prefix="/services")

@app.route("/GS", methods=["GET"])
def get_services_GS():
    result = []

    portal = request.args.get('portal')
    # Debugging: Print the received portal ID
    print(f"Primljeni portal ID: {portal}")

    # Access the configuration from current_app
    portal_info = current_app.config['PORTALS'].get(portal)

    if not portal_info:
        print("Nevažeći portal ID")
        return jsonify({'message': 'Invalid portal ID'}), 400

    BASE_URL = portal_info['GEOSERVER_URL']
    USERNAME = portal_info['USER_GS']
    PASSWORD = portal_info['PASS_GS']

    services_basic_URL = f"{BASE_URL}/layers.json"

    services_response = requests.get(services_basic_URL, auth=HTTPBasicAuth(USERNAME, PASSWORD))
    if services_response.status_code != 200:
        print(f"Neuspješno dohvaćanje popisa servisa. Statusni kod: {services_response.status_code}")
        return jsonify(result)


    try:
        services_json = services_response.json().get('layers', {}).get('layer', [])
    except requests.exceptions.JSONDecodeError as e:
        print(f"Error parsing JSON response for services: {e}")
        return jsonify(result)

    for service in services_json:
        href_service = service['href']
        href_resource_response = requests.get(href_service, auth=HTTPBasicAuth(USERNAME, PASSWORD))

        try:
            href_resource_json = href_resource_response.json()
        except requests.exceptions.JSONDecodeError as e:
            print(f"Error parsing JSON response for href_service {href_service}: {e}")
            continue

        resourceType = href_resource_json.get('layer', {}).get('resource', {}).get('@class', None)
        resource_URL = href_resource_json.get('layer', {}).get('resource', {}).get('href', None)

        if not resourceType or not resource_URL:
            print(f"Missing resourceType or resource_URL for href_service {href_service}")
            continue

        services_details_response = requests.get(resource_URL, auth=HTTPBasicAuth(USERNAME, PASSWORD))

        try:
            services_details = services_details_response.json()
        except requests.exceptions.JSONDecodeError as e:
            print(f"Error parsing JSON response for resource_URL {resource_URL}: {e}")
            continue

        result.append(extract_info(services_details, resourceType))

    return jsonify(result)


@app.route("/admin", methods=["GET"])
def get_services_admin():
    result = []

    portal = request.args.get('portal')
    print(f"Primljeni portal ID: {portal}")

    portal_info = current_app.config['PORTALS'].get(portal)

    if not portal_info:
        print("Nevažeći portal ID")
        return jsonify({'message': 'Invalid portal ID'}), 400

    BASE_URL = portal_info['ADMIN_URL']
    USERNAME = portal_info['USER_ADMIN']
    PASSWORD = portal_info['PASS_ADMIN']

    if BASE_URL == '':
    # If admin is not integrated
        return result
    else:
        # Get AUTH_TOKEN using POST request
        token_URL = f"{BASE_URL}/api/auth"
        print(token_URL)
        payload = {
            "username": USERNAME,
            "password": PASSWORD
        }
        response = requests.post(token_URL, json=payload)

        if response.status_code != 200:
            print(f"Neuspješno dohvaćanje tokena. Statusni kod: {response.status_code}")
            return jsonify(result)

        try:
            AUTH_TOKEN = response.json().get('token')
        except requests.exceptions.JSONDecodeError as e:
            print(f"Error parsing JSON response for token: {e}")
            return jsonify(result)

        HEADERS = {'Authorization': f"Bearer {AUTH_TOKEN}"}

        admin_layers_URL = f"{BASE_URL}/api/admin/layer/all"
        admin_response = requests.get(admin_layers_URL, headers=HEADERS)
        if admin_response.status_code != 200:
            print(f"Neuspješno dohvaćanje slojeva s admina. Statusni kod: {admin_response.status_code}")
            return jsonify(result)

        try:
            admin_layers_json = admin_response.json()
        except requests.exceptions.JSONDecodeError as e:
            print(f"Error parsing JSON response for admin layers: {e}")
            return jsonify(result)

        for layer in admin_layers_json:
            result.append({'layersName' : layer['layerConfig']['label'],
                'layersBodId' : layer['layerConfig']['serverLayerName'],
                })

        return jsonify(result)


@app.route("/combined", methods=["GET"])
def get_combined_services():
    result = []

    portal = request.args.get('portal')
    gs_response = requests.get(f"{request.host_url}services/GS?portal={portal}").json()
    try:
        admin_response = requests.get(f"{request.host_url}services/admin?portal={portal}").json()
    except:
        admin_response = None

    for item in gs_response:
        flag = False  # Reset flag for each item in gs_response
        if admin_response:
            for layer in admin_response:
                if item['Geoserver WMS name'] == layer['layersBodId']:
                    merged_item = item.copy()
                    merged_item['Geoportal Name'] = layer['layersName']
                    #merged_item['Geoportal Topic'] = layer['layersName']
                    result.append(merged_item)
                    flag = True
                    break
        if not flag:
            merged_item = item.copy()
            merged_item['Geoportal Name'] = "NOT INTEGRATED"
            merged_item['Geoportal Topic'] = "NOT INTEGRATED"
            result.append(merged_item)

    return jsonify(result)


@app.route('/export', methods=['POST'])
def export_data():
    data = request.json.get('data', [])
    df = pd.DataFrame(data)
    file_path = os.path.expanduser("~/Desktop/geoportal_data.xlsx")
    df.to_excel(file_path, index=False)
    return send_file(file_path, as_attachment=True)


