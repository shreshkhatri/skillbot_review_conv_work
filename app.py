import sys
from flask import Flask,render_template,request
from flask_fontawesome import FontAwesome
import auth, api_calls, helper
from datetime import datetime
from flask_scss import Scss
import json

app=Flask(__name__)
app.debug=True
#Scss(app,static_dir='static/css',asset_dir='static/sass')
fa = FontAwesome(app)

bearer_token=auth.performauthentication('me','Iybdw0cCbLyt')
if 'error_message' in bearer_token:
    sys.exit(bearer_token['error_message'])


@app.route('/getEntityList')
def get_entity_list():
    response=api_calls.get_list_of_entities(bearer_token)
    response=json.dumps(response)
    return json.dumps(response)

@app.route('/update_intent',methods=['POST'])
def update_intent():
    incoming_JSON=request.get_json()
    response=api_calls.correct_intent(bearer_token,incoming_JSON)
    if (response):
        return json.dumps({'response':True})
    else:
        return json.dumps({'response':False})

@app.route('/uploadTrainingdata',methods=['POST'])
def upload_new_trainingdata():
    incoming_JSON=request.get_json()
    response=api_calls.upload_training_data(bearer_token,incoming_JSON)
    if response:
        return json.dumps({'status':True})
    else:
        return json.dumps({'status':False})


@app.route('/getIntentList')
def get_intent_list():
    intent_list=api_calls.get_intent_list(bearer_token)
    intent_list=json.dumps(intent_list)
    return json.dumps(intent_list)

@app.route('/getlConversationList')
def get_conversation_list():
    conversation_list=api_calls.get_list_of_conversation(bearer_token)
    conversation_list=json.dumps(conversation_list)
    return json.dumps(conversation_list)

@app.route('/getAConversation',methods=['POST'])
def load_conv():
    incoming_JSON=request.get_json()
    if 'conv_id' not in incoming_JSON:
        var={'error':'Sorrry but no conversation id was supplied'}
        var=json.dumps(var)
        return json.dumps(var)
    conv_id=incoming_JSON['conv_id']
    conversation=api_calls.get_a_conversation(bearer_token,conv_id)
    conversation=json.dumps(conversation)
    return json.dumps(conversation)

@app.route('/')
def index():
    convlist=api_calls.get_list_of_conversation(bearer_token)
    if(len(convlist)!=0):
        helper.format_datetime(convlist)
        return render_template('index.html',title="Index Page for my site",conv=convlist)
    else:
        return render_template('index.html',title="Index Page for my site",conv=convlist,no_conversation_list=True)

@app.route('/temproute')
def temproute():
    return render_template('seaerchbox.html')

if __name__=="__main__":
    app.run(debug=True)