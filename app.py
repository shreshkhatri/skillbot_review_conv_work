import sys
from flask.json import JSONEncoder
from bson import json_util, ObjectId
from configparser import ConfigParser
from flask import Flask,render_template,request,jsonify
from flask_fontawesome import FontAwesome
from python_files import auth, api_calls, helper
from python_files.chat_server_status import check_server_status
from python_files.blueprint_mongodb.mongodb_bp import bp_mongodb
from python_files.blueprint_analytics.analytics_bp import bp_analytics
from datetime import datetime
import json
from python_files.blueprint_mongodb import db

class MongoJsonEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, float):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(obj, ObjectId):
            return str(obj)
        return json_util.default(obj, json_util.CANONICAL_JSON_OPTIONS)


app=Flask(__name__)
config=ConfigParser()
config.read('configuration.cfg')

app.json_encoder=MongoJsonEncoder

#Reading of MongoDB data configuration
app.config['DB_SRV']=config['db_credentials']['DB_SRV']
app.config['DB_NAME']=config['db_credentials']['DB_NAME']
app.config['DB_USERNAME']=config['db_credentials']['DB_USERNAME']
app.config['DB_PASSWORD']=config['db_credentials']['DB_PASSWORD']
app.config['CHAT_SERVER_DOMAIN']=config['chat_server_details']['DOMAIN_NAME']
app.config['CHAT_SERVER_USERNAME']=config['chat_server_details']['RASA_X_USERNAME']
app.config['CHAT_SERVER_PASSWORD']=config['chat_server_details']['RASA_X_PASSWORD']

#Scss(app,static_dir='static/css',asset_dir='static/sass')
fa = FontAwesome(app)

check_server_status(app.config['CHAT_SERVER_DOMAIN'])!=True and sys.exit(check_server_status(app.config['CHAT_SERVER_DOMAIN']))

bearer_token=auth.performauthentication(app.config['CHAT_SERVER_USERNAME'],app.config['CHAT_SERVER_PASSWORD'])
isinstance(bearer_token,dict) and sys.exit(bearer_token['error_message'])
app.config['bearer_token']=bearer_token

app.register_blueprint(bp_mongodb,url_prefix='/mongo')
app.register_blueprint(bp_analytics,url_prefix='/analytics')

#route for serving code snippet for review confirmation of a message
@app.route('/templates/mark-conv-review')
def serve_confirmation_dialog():
    return render_template('mark-conv-review.html')

@app.route('/getEntityList')
def get_entity_list():
    response=api_calls.get_list_of_entities(bearer_token)
    response=json.dumps(response)
    return json.dumps(response)


@app.route('/getIntentList')
def get_intent_list():
    intent_list=api_calls.get_intent_list(bearer_token)
    intent_list=json.dumps(intent_list)
    return json.dumps(intent_list)

@app.route('/')
def index():
    try:
        db.constructFullDbURI(app.config['DB_SRV'],app.config['DB_USERNAME'],app.config['DB_PASSWORD'],app.config['DB_NAME'])
        db.connectMongoDB()
        convlist=db.getUnDatedUnreviewedConversation()
        if(len(convlist)!=0):
            return render_template('index.html',title="Skillbot Conversation Review",conv=convlist,message_count=len(convlist))
        else:
            return render_template('index.html',title="Index Page for my site",message_count=0,conv=convlist,no_conversation_list=True)
    except Exception as instance:
        print('Error :'+str(instance))
        return '<h2>Service not available, Please try again later.</h2>'

app.run(debug=True)