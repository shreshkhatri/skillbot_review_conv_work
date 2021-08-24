import time,datetime
from flask import Flask,Blueprint,request,jsonify,current_app,render_template
from python_files.blueprint_analytics import db 

bp_analytics = Blueprint('bp_analytics_api',__name__)

def calculateSessionDuration(sender_id,session_index_data):
    pass    


@bp_analytics.before_request
def setup_database_connection():
    uri=db.constructFullDbURI(current_app.config['DB_SRV'],current_app.config['DB_USERNAME'],current_app.config['DB_PASSWORD'],current_app.config['DB_NAME'])
    client=db.connectMongoDB(uri)

@bp_analytics.route('/totalusers')
@bp_analytics.route('/totalusers/<initial_date>')
@bp_analytics.route('/totalusers/<initial_date>/<final_date>')
def get_total(initial_date=None,final_date=None):
    #use of unpacking operator * for list items
    try:
        if initial_date==None and final_date!=None:
            return jsonify(*db.getconversationCount('1970-1-1',final_date))
        elif initial_date!=None and final_date==None:
            return jsonify(*db.getconversationCount(initial_date,'2038-1-1'))
        elif initial_date==None and final_date==None:
            return jsonify(*db.getconversationCount('1970-1-1','2038-1-1'))
        else:
            return jsonify(*db.getconversationCount(initial_date,final_date))
    except Exception as instance:
        return jsonify({'error':str(instance)})

@bp_analytics.route('/unidentified-message-summary')
@bp_analytics.route('/unidentified-message-summary/<initial_date>')
@bp_analytics.route('/unidentified-message-summary/<initial_date>/<final_date>')
def get_unidentified_message_summay(initial_date=None,final_date=None):
    #use of unpacking operator * for list items
    try:
        if initial_date==None and final_date!=None:
            return jsonify(*db.getUnidentifiedMessageSummary('1970-1-1',final_date))
        elif initial_date!=None and final_date==None:
            return jsonify(*db.getUnidentifiedMessageSummary(initial_date,'2038-1-1'))
        elif initial_date==None and final_date==None:
            return jsonify(*db.getUnidentifiedMessageSummary('1970-1-1','2038-1-1'))
        else:
            return jsonify(*db.getUnidentifiedMessageSummary(initial_date,final_date))
    except Exception as instance:
        return jsonify({'error':str(instance)})

@bp_analytics.route('/interactive-sessions')
def get_interaction_time():

    """Note: One conversation can have more than one session at different times
    this function gets all number of sessions present in a conversation since the chatbot started operating"""
    
    sessions_data=db.getSessionsInConversations()
    session_duration_list=[]
    
    if len(sessions_data) != 0:

        for an_item in sessions_data:
            
            num_of_sessions=len(an_item['event_indexes'])
            
            if num_of_sessions==1:
                #means the user has interacted only once

                session_start_timestamp=an_item['event_indexes'][0]['timestamp']
                session_end_timestamp=an_item['event_indexes'][0]['latest_event_time']
                interaction_time=session_end_timestamp-session_start_timestamp
                session_duration_list.append(interaction_time)
                continue
            
            for current_index,an_event in enumerate(an_item['event_indexes']):
                #comming upto this loop means that user interacted more than once and have different chat session
                #with the chatbot
                if current_index<(num_of_sessions-1):

                    next_index=current_index+1
                    
                    sender_id=an_item['sender_id']
                    session_start_timestamp=an_event['timestamp']
                    session_end_timestamp=db.get_an_event_timestamp(sender_id,an_item['event_indexes'][next_index]['index']-1)
                    interaction_time=session_end_timestamp[0]['timestamp']-session_start_timestamp
                    session_duration_list.append(interaction_time)
                
                else:
                    
                    sender_id=an_item['sender_id']
                    session_start_timestamp=an_event['timestamp']
                    session_end_timestamp=an_event['latest_event_time']
                    interaction_time=session_end_timestamp-session_start_timestamp
                    session_duration_list.append(interaction_time)
    
    return jsonify(session_duration_list)

