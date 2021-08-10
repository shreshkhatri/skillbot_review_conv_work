import requests,json

#function for updating the status of a conversation
def update_conv_status(token,conversation_id,status):

    response=requests.put('http://localhost:5002/api/conversations/'+conversation_id+'/reviewStatus',
    headers={'Accept':'application/json','Authorization':'Bearer '+token},
    json={"review_status":status}
    )
    if response.status_code==204:
        return True
    else:
        return 'Updating failed'

#this message will be executed if the training data is uploaded as a message review
def mark_message_as_reviewed(token,conversation_id,message_timestamp):

    response=requests.put('http://localhost:5002/api/conversations/'+conversation_id+'/messages/'+message_timestamp+'/flag',
    headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            }
    )
    print(response.status_code)


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
    response=requests.post(
        ' http://localhost:5002/api/projects/default/training_examples',headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            },
            json=training_data
            )
    if response.status_code==200:
        return True
    else:
        return False


#get list of existing unread conversations
def get_list_of_conversation(token):
    data=requests.get(
        ' http://localhost:5002/api/conversations?review_status=unread&minimumUserMessages=1',
        headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            }
            )
    return get_conversations_summary(token,data.json())
    

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


#check existing of fallback intents in conversation and get the count of it
def get_conversations_summary(token,conversation_list):
    
    count_fallback_intent=0

    for an_item in conversation_list:
        if 'sender_id' in an_item:
            conversation=get_a_conversation(token, an_item['sender_id'])
            for an_event in conversation['events']:
                if an_event['event']=='user':
                    intent_name=an_event['parse_data']['intent']['name']
                    if (intent_name=='nlu_fallback'):
                        count_fallback_intent+=1
        an_item['count_fallback_intent']=count_fallback_intent
        count_fallback_intent=0
    
    return conversation_list


#correcting the intent only
def correct_intent(token,incoming_JSON):
    print('url :'+'http://localhost:5002/api/conversations/'+incoming_JSON['sender_id']+'/messages/'+incoming_JSON['message_timestamp']+'/intent')
    print(type(json.dumps({'intent':incoming_JSON['intent'],'mapped_to':incoming_JSON['mapped_to']})))
    response=requests.put(
        'http://localhost:5002/api/conversations/'+incoming_JSON['sender_id']+'/messages/'+incoming_JSON['message_timestamp']+'/intent',
        headers={
            'Accept':'application/json',
            'Authorization':'Bearer '+token
            },json={'intent':incoming_JSON['intent'],'mapped_to':incoming_JSON['mapped_to']}
            )
    if response.status_code==200:
        return True
    else:
        return False
        