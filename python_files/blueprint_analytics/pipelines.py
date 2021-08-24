import time
from datetime import date,datetime

#pipeline for getting un-reviewed conversations between 2 dates as starting date and end date
def pl_conversation_count(initial_date,final_date):
    return [
    {
        '$match': {
            '$and': [
                {
                    'events.0.timestamp': {
                        '$gte': time.mktime(datetime.strptime(initial_date, "%Y-%m-%d").timetuple())
                    }
                }, {
                    'events.0.timestamp': {
                        '$lte': time.mktime(datetime.strptime(final_date, "%Y-%m-%d").timetuple())+86400
                    }
                }
            ]
        }
    }, {
        '$count': 'conversation_count'
    }
]
 
def pl_unidentified_messages_summary(initial_date,final_date):
    return [
        {
        '$match': {
            '$and': [
                {
                    'events.0.timestamp': {
                        '$gte': time.mktime(datetime.strptime(initial_date, "%Y-%m-%d").timetuple())
                    }
                }, {
                    'events.0.timestamp': {
                        '$lte': time.mktime(datetime.strptime(final_date, "%Y-%m-%d").timetuple())+86400
                    }
                }
            ]
        }
    },
    {
        '$unwind': {
            'path': '$events'
        }
    }, {
        '$group': {
            '_id': '$sender_id', 
            'unidentified_message': {
                '$sum': {
                    '$cond': [
                        {
                            '$eq': [
                                '$events.parse_data.intent.name', 'nlu_fallback'
                            ]
                        }, 1, 0
                    ]
                }
            }
        }
    }, {
        '$group': {
            '_id': None, 
            'conversation_count': {
                '$sum': 1
            }, 
            'max': {
                '$max': '$unidentified_message'
            }, 
            'min': {
                '$min': '$unidentified_message'
            }, 
            'avg': {
                '$avg': '$unidentified_message'
            }
        }
    }, {
        '$project': {
            '_id': 0
        }
    }
]

def pl_conversation_sessions():
    return [
    {
        '$unwind': {
            'path': '$events', 
            'includeArrayIndex': 'event_number'
        }
    }, {
        '$match': {
            'events.name': 'action_session_start'
        }
    }, {
        '$project': {
            '_id': 0, 
            'sender_id': 1, 
            'event_number': 1, 
            'timestamp': '$events.timestamp', 
            'latest_event_time': 1
        }
    }, {
        '$sort': {
            'event_number': 1
        }
    }, {
        '$group': {
            '_id': '$sender_id', 
            'event_indexes': {
                '$push': {
                    'index': '$event_number', 
                    'timestamp': '$timestamp', 
                    'latest_event_time': '$latest_event_time'
                }
            }
        }
    }, {
        '$project': {
            '_id': 0, 
            'sender_id': '$_id', 
            'event_indexes': 1
        }
    }
]

def pl_timestamp_for_an_event(sender_id,event_index):
    return [
    {
        '$match': {
            'sender_id': sender_id
        }
    }, {
        '$unwind': {
            'path': '$events', 
            'includeArrayIndex': 'index'
        }
    }, {
        '$match': {
            'index': event_index
        }
    }, {
        '$project': {
            '_id': 0, 
            'timestamp': '$events.timestamp'
        }
    }
]