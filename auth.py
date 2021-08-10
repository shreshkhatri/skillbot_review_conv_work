import json
import requests

#perform authentication for using rasa x apis
def performauthentication(username,password):
    authpayload={
        'username':username,
        'password':password
    }
    # convert into JSON:
    authpayload = json.dumps(authpayload)
    try:
        response=requests.post(' http://localhost:5002/api/auth', data=authpayload)
        jsonbody=response.json()
        bearer_token=jsonbody['access_token']
        return bearer_token
    except:
        return {'error_message': 'Authentication Error occured.\nYou might need to update authentication password'}

