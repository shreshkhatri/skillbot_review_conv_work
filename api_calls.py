import requests,json

#get list of entities
def get_list_of_entities(token):
    data=requests.get(
        'http://localhost:5002/api/projects/default/entities',
        headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            }
            )
    return data.json()


#upload training data
def upload_training_data(token,training_data):
    data=requests.post(
        ' http://localhost:5002/api/projects/default/training_examples',headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            },
            json=training_data
            )
    return data.json()


#get list of existing conversations
def get_list_of_conversation(token):
    data=requests.get(
        ' http://localhost:5002/api/conversations',
        headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            }
            )
    return data.json()

#get a single conversation
def get_a_conversation(token, conv_id):
    url='http://localhost:5002/api/conversations/'+conv_id
    conversation=requests.get(
       'http://localhost:5002/api/conversations/'+conv_id, 
       headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            }
            )
    print(url)
    return conversation.json()

#get a list of intents data
def get_intent_list(token):
    data=requests.get(
        'http://localhost:5002/api/projects/default/intents',
        headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            }
            )
    return data.json()