import time,datetime
from flask import Flask,Blueprint,request,jsonify,current_app,render_template
from python_files.blueprint_mongodb import db 
from python_files.api_calls import upload_training_data

bp_mongodb = Blueprint('bp_mongodb_api',__name__,template_folder='myfolder')

@bp_mongodb.before_request
def setup_database_connection():
    uri=db.constructFullDbURI(current_app.config['DB_SRV'],current_app.config['DB_USERNAME'],current_app.config['DB_PASSWORD'],current_app.config['DB_NAME'])
    client=db.connectMongoDB(uri)

@bp_mongodb.route('/load-dated-conversations-items',methods=['POST'])
def load_conversations():
    incoming_JSON=request.get_json()
    if 'initial_date' in incoming_JSON and 'final_date' in incoming_JSON:
        conversation_details=db.getDatedUnreviewedConversation(incoming_JSON['initial_date'],incoming_JSON['final_date']) 
        if len(conversation_details)!=0:
            for anItem in conversation_details:
                datalist=db.getConversationStartedDateForAConversation(anItem['sender_id'])
                anItem['start_date']=datalist[0]['events']['timestamp']
        return jsonify(conversation_details)



@bp_mongodb.route('/markReviewed',methods=['POST'])
def mark_conversation_reviewed():
    incoming_JSON=request.get_json()
    if 'sender_id' in incoming_JSON:
        sender_id = incoming_JSON['sender_id']
    else:
        return jsonify({'status':'Sender ID is not provided'})
    return jsonify({'status': db.markConversationAsReviewed(sender_id)})




@bp_mongodb.route('/getconversation',methods=['POST'])
def get_conversation():
    incoming_JSON=request.get_json()
    if 'conv_id' not in incoming_JSON:
        return jsonify({'error':'Sorry but no conversation id was supplied'})
    conv_id=incoming_JSON['conv_id']

    conversation=api_calls.get_a_conversation(bearer_token,conv_id)
    conversation=json.dumps(conversation)
    return json.dumps(conversation)


@bp_mongodb.route('/get-reviewd-conversations')
def get_review_history():
    try:
        return jsonify(db.get_reviewed_conversations_summary())
    except Exception as instance:
        return jsonify({'error':str(instance)})


@bp_mongodb.route('/unmarkConversation',methods=['POST'])
def unmark_conversation():
    incoming_JSON=request.get_json()
    if 'sender_id' in incoming_JSON:
        sender_id = incoming_JSON['sender_id']
    else:
        return jsonify({'error':'Sender ID is not provided'})
    
    try:
        return jsonify({'status': db.unmarkConversationAsUnReviewed(sender_id)})
    except:
        return jsonify({'error':'Service not available at the moment'})
        


@bp_mongodb.route('/getAConversation',methods=['POST'])
def getAConversation():
    incoming_JSON=request.get_json()
    if 'sender_id' in incoming_JSON:
        sender_id = incoming_JSON['sender_id']
    else:
        return jsonify({'error':'Sender ID is not provided'})
    
    try:
        return jsonify(db.getAConversation(sender_id))
    except:
        return jsonify({'error':'Service not available at the moment'})


@bp_mongodb.route('/markMessageAsReviewed',methods=['POST'])
def upload_new_trainingdata():
    incoming_JSON=request.get_json()
    if set(['text','intent','entities', 'intent_mapped_to','sender_id','message_id']).issubset(set(incoming_JSON)):
        sender_id = incoming_JSON['sender_id']
        message_id = incoming_JSON['message_id']
    else:
        return jsonify({'error':'Required fields not provided.'})
    
    try:
        db.markMessageAsReviewed(sender_id,message_id)
    except:
        return jsonify({'error': 'Sorry,Message cound not be reviewed at this time'})
    
    response=upload_training_data(current_app.config['bearer_token'],incoming_JSON)
    return jsonify({'status':True}) if response else jsonify({'status':False})
