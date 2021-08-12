import json
import requests

#perform authentication for using rasa x apis
def performauthentication(username,password):
    authpayload={'username':username,'password':password}
    headers={'Accept':'application/json','Content-Type':'application/json'}
    
    try:
        response=requests.post(' http://localhost:5002/api/auth',headers=headers, json=authpayload)
        jsonbody=response.json()
        if response.status_code==200:
            return jsonbody['access_token']
        elif response.status_code==401:
            return {'error_message': 'Authentication failed with chat server'}
    except:
        return {'error_message': 'Chat Server Authentication failed'}

