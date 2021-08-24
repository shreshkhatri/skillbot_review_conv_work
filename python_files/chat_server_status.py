import sys
import requests,json


#get list of entities
def check_server_status(server_domain):
    try:
        response=requests.get(server_domain,headers={'Content-Type':'text/plain','Accept': '*/*'})
        return True if response.status_code==200 else False
    except Exception as instance:
        return 'Error : '+str(instance)