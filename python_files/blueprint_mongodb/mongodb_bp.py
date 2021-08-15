import time,datetime
from python_files.blueprint_mongodb.pipelines import pl_datedUnreviewedConversation,pl_normalUnreviewedConversation
from flask import Flask,Blueprint,request,jsonify,current_app,render_template
from python_files.blueprint_mongodb import db 


bp_mongodb = Blueprint('bp_mongodb_api',__name__,template_folder='myfolder')


@bp_mongodb.route('/load-dated-conversations-items',methods=['POST'])
def load_conversations():
    incoming_JSON=request.get_json()
    if 'initial_date' in incoming_JSON and 'final_date' in incoming_JSON:
        pipe=pl_datedUnreviewedConversation(incoming_JSON['initial_date'],incoming_JSON['final_date']) 
        uri=db.constructFullDbURI(current_app.config['DB_SRV'],current_app.config['DB_USERNAME'],current_app.config['DB_PASSWORD'],current_app.config['DB_NAME'])
        client=db.connectMongoDB(uri)
        conversation_details=client.newdatabase.conversations.aggregate(pipe)
        conversation_details=list(conversation_details)
        if len(conversation_details)!=0:
            for anItem in conversation_details:
                datalist=db.getConversationStartedDateForAConversation(anItem['sender_id'])
                anItem['start_date']=datalist[0]['start_date']
        return jsonify(conversation_details)



@bp_mongodb.route('/markReviewed',methods=['POST'])
def mark_conversation_reviewed():
    incoming_JSON=request.get_json()
    if 'sender_id' in incoming_JSON:
        sender_id = incoming_JSON['sender_id']
    else:
        return jsonify({'status':'Sender ID is not provided'})
    uri=db.constructFullDbURI(current_app.config['DB_SRV'],current_app.config['DB_USERNAME'],current_app.config['DB_PASSWORD'],current_app.config['DB_NAME'])
    client=db.connectMongoDB(uri)
    return jsonify({'status': db.markConversationAsReviewed(sender_id)})




@bp_mongodb.route('/getconversation',methods=['POST'])
def get_conversation():
    incoming_JSON=request.get_json()
    if 'conv_id' not in incoming_JSON:
        return jsonify({'error':'Sorry but no conversation id was supplied'})
    conv_id=incoming_JSON['conv_id']
    
    uri=db.constructFullDbURI(current_app.config['DB_SRV'],current_app.config['DB_USERNAME'],current_app.config['DB_PASSWORD'],current_app.config['DB_NAME'])
    client=db.connectMongoDB(uri)

    conversation=api_calls.get_a_conversation(bearer_token,conv_id)
    conversation=json.dumps(conversation)
    return json.dumps(conversation)


@bp_mongodb.route('/get-reviewd-conversations')
def get_review_history():

    uri=db.constructFullDbURI(current_app.config['DB_SRV'],current_app.config['DB_USERNAME'],current_app.config['DB_PASSWORD'],current_app.config['DB_NAME'])
    client=db.connectMongoDB(uri)

    return jsonify(db.get_reviewed_conversations_summary() or{'error':'Sorry some error occured'})


@bp_mongodb.route('/unmarkConversation',methods=['POST'])
def unmark_conversation():
    incoming_JSON=request.get_json()
    if 'sender_id' in incoming_JSON:
        sender_id = incoming_JSON['sender_id']
    else:
        return jsonify({'error':'Sender ID is not provided'})
    
    try:
        uri=db.constructFullDbURI(current_app.config['DB_SRV'],current_app.config['DB_USERNAME'],current_app.config['DB_PASSWORD'],current_app.config['DB_NAME'])
        client=db.connectMongoDB(uri)
        return jsonify({'status': db.unmarkConversationAsUnReviewed(sender_id)})
    except:
        return jsonify({'error':'Service not available at the moment'})
        
