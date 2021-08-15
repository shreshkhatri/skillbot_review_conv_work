import sys
from flask.json import JSONEncoder
from bson import json_util, ObjectId
from configparser import ConfigParser
from flask import Flask,render_template,request,jsonify
from flask_fontawesome import FontAwesome
from python_files import auth, api_calls, helper
from python_files.chat_server_status import check_server_status
from python_files.blueprint_mongodb.mongodb_bp import bp_mongodb
from datetime import datetime
from flask_scss import Scss
import json
from python_files.blueprint_mongodb import db

class MongoJsonEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, float):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(obj, ObjectId):
            return str(obj)
        return json_util.default(obj, json_util.CANONICAL_JSON_OPTIONS)

if __name__=='__main__':
    app=Flask(__name__)
    config=ConfigParser()
    config.read('configuration.cfg')

    app.json_encoder=MongoJsonEncoder

    #Reading of MongoDB data configuration
    app.config['DB_SRV']=config['db_credentials']['DB_SRV']
    app.config['DB_NAME']=config['db_credentials']['DB_NAME']
    app.config['DB_USERNAME']=config['db_credentials']['DB_USERNAME']
    app.config['DB_PASSWORD']=config['db_credentials']['DB_PASSWORD']
    
    #Scss(app,static_dir='static/css',asset_dir='static/sass')
    fa = FontAwesome(app)

    check_server_status()!=True and sys.exit(check_server_status())

    bearer_token=auth.performauthentication('me','1qhvvA52GTtG')
    isinstance(bearer_token,dict) and sys.exit(bearer_token['error_message'])

    app.register_blueprint(bp_mongodb,url_prefix='/mongo')
    
    """ #route for updating the status of the conversation as 'reviewed','unread' or 'saved_for_later'
    @app.route('/update-conversation-status',methods=['POST'])
    def update_conv_status():
        STATUS=['reviewed','unread','saved_for_later'];
        flag=True
        incoming_JSON=request.get_json()
        
        for item in ['conv_id','status']:
            if item not in incoming_JSON:
                flag=False
                break
        
        if flag!=True:
            return jsonify({'status':'Required properties are missing'})

        if incoming_JSON['status'] not in STATUS:
            return jsonify({'status':'Incorrect status code'})
        
        return jsonify({'status':api_calls.update_conv_status(bearer_token,incoming_JSON['conv_id'],incoming_JSON['status'])})
 """

    #route for serving code snippet for review confirmation of a message
    @app.route('/templates/mark-conv-review')
    def serve_confirmation_dialog():
        return render_template('mark-conv-review.html')

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
        if 'message_reviewed_flag' in incoming_JSON:
            api_calls.mark_message_as_reviewed(bearer_token,incoming_JSON['conversation_id'],incoming_JSON['message_timestamp'])
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
            return jsonify({'error':'Sorry but no conversation id was supplied'})
        conv_id=incoming_JSON['conv_id']
        conversation=api_calls.get_a_conversation(bearer_token,conv_id)
        conversation=json.dumps(conversation)
        return json.dumps(conversation)

    @app.route('/')
    def index():
        try:
            db.constructFullDbURI(app.config['DB_SRV'],app.config['DB_USERNAME'],app.config['DB_PASSWORD'],app.config['DB_NAME'])
            db.connectMongoDB()
            convlist=db.getUnDatedUnreviewedConversation()
            if(len(convlist)!=0):
                return render_template('index.html',title="Index Page for my site",conv=convlist,message_count=len(convlist))
            else:
                return render_template('index.html',title="Index Page for my site",message_count=0,conv=convlist,no_conversation_list=True)
        except Exception as instance:
            print('Error :'+str(instance))
            return '<h2>Service not available, Please try again later.</h2>'
    



    @app.route('/temproute')
    def temproute():
        return render_template('index.html')
        
    app.run(debug=True)