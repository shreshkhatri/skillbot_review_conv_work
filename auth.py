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

    response=requests.post(' http://localhost:5002/api/auth', data=authpayload)
    jsonbody=response.json()
    bearer_token=jsonbody['access_token']

    if bearer_token!=None:
        return bearer_token
    else:
        return False
#performauthentication("me","67pmRgJV4dQp")

