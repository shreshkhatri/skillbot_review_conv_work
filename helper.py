from datetime import datetime

def timestamp_to_datetime(timestamp):
    return datetime.fromtimestamp(timestamp).strftime('%Y %m %d %H: %M')
    

def format_datetime(conversation_list):
    for aConversation in conversation_list:
        aConversation['latest_event_time']=timestamp_to_datetime(aConversation['latest_event_time'])