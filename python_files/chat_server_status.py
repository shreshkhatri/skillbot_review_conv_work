import sys
import requests,json

#get list of entities
def check_server_status():
    try:
        response=requests.get('http://localhost:5005/',headers={'Content-Type':'text/plain','Accept': '*/*'})
        return True if response.status_code==200 else False
    except Exception as exc:
        return 'Error : Chat server seems offline please turn it on'