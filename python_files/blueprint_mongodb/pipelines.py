import time
from datetime import date,datetime

#pipeline for getting un-reviewed conversations between 2 dates as starting date and end date
def pl_datedUnreviewedConversation(initial_date,final_date):
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
                }, {
                    'review_status': {
                        '$ne': 'reviewed'
                    }
                }
            ]
        }
    },{
        '$sort': {
            'events.0.timestamp': -1
        }
    }
    ,{
        '$project': {
            'sender_id': 1, 
            'events': 1, 
            'latest_event_time': 1
        }
    }, {
        '$unwind': {
            'path': '$events'
        }
    }, {
        '$match': {
            'events.event': 'user', 
            'events.parse_data.intent.name': 'nlu_fallback'
        }
    }, {
        '$group': {
            '_id': '$sender_id', 
            'count': {
                '$sum': 1
            }, 
            'sender_id': {
                '$first': '$sender_id'
            }, 
            'latest_event_time': {
                '$first': '$latest_event_time'
            }
        }
    },
    {
        '$sort': {
            '_id': -1
        }
    }
]

#pipeline for getting un-reviewed conversations in chronologically descending order with reference to today's date
def pl_normalUnreviewedConversation():
    return [
    {
        '$match': {
            'events.0.timestamp': {
                '$lte': time.mktime(datetime.strptime(str(date.today()), "%Y-%m-%d").timetuple())+86400
                }, 
            'review_status': {
                '$ne': 'reviewed'
            }
        }
    },
    {
        '$sort': {
            'events.0.timestamp': -1
        }
    }
    ,{
        '$project': {
            'sender_id': 1, 
            'events': 1, 
            'latest_event_time': 1, 
        }
    }, {
        '$unwind': {
            'path': '$events'
        }
    }, {
        '$match': {
            'events.event': 'user', 
            'events.parse_data.intent.name': 'nlu_fallback'
        }
    }, {
        '$group': {
            '_id': '$sender_id', 
            'count': {
                '$sum': 1
            }, 
            'sender_id': {
                '$first': '$sender_id'
            }, 
            'latest_event_time': {
                '$first': '$latest_event_time'
            }
        }
    },
    {
        '$sort': {
            '_id': -1
        }
    }
]

#pipeline for getting conversation starting date for a one user
def pl_startingDateForAConversation(sender_id):
    return [
    {
        '$match': {
            'sender_id': sender_id
        }
    }, {
        '$unwind': {
            'path': '$events'
        }
    }, {
        '$match': {
            'events.name': 'action_session_start'
        }
    }, {
        '$project': {
            '_id':0,
            'start_date':'$events.timestamp'
        }
    }
]


#pipeline for getting conversation starting date for all users 
def pl_startingDateForUnreviewedConversation():
    return [
    {
        '$match': {
            'events.0.timestamp': {
                '$lte': time.mktime(datetime.strptime(str(date.today()), "%Y-%m-%d").timetuple())+86400
                }, 
            'review_status': {
                '$ne': 'reviewed'
            }
        }
    }, {
        '$unwind': {
            'path': '$events'
        }
    }, {
        '$match': {
            'events.name': 'action_session_start'
        }
    }, {
        '$project': {
            'sender_id': 1, 
            'events.timestamp': 1
        }
    }
]

#returns date and count of messages reviewed on that particular date
def pl_reviewDates():
    return [
    {
        '$match': {
            'review_status': 'reviewed'
        }
    }, {
        '$group': {
            '_id': '$review_date', 
            'review_date': {
                '$first': '$review_date'
            }, 
            'reviewed_conversations': {
                '$sum': 1
            }
        }
    }, {
        '$sort': {
            '_id': -1
        }
    }, {
        '$project': {
            '_id': 0
        }
    }
]

#pipeline for getting list of conversations that were reviewed on a particular date
def pl_review_date_details(a_review_date_timestamp):
    return [
    {
        '$match': {
            '$and' :[{'review_date': a_review_date_timestamp},{'review_status':'reviewed'}]
        }
    }, {
        '$project': {
            'sender_id': 1, 
            'latest_event_time': 1, 
            'review_by': 1, 
            'events': 1
        }
    }, {
        '$unwind': {
            'path': '$events'
        }
    }, {
        '$match': {
            'events.name': 'action_session_start'
        }
    }, {
        '$project': {
            '_id': 0, 
            'sender_id': 1, 
            'latest_event_time': 1, 
            'review_by': 1, 
            'events.timestamp': 1
        }
    }
]

#pipeline for counting new messages that came after the conversation was reviewed and the time
# for which the user again communicated with the chatbot
def pl_message_counter(sender_id,review_date,last_active_date):
    return [
    {
        '$match': {
            'sender_id': sender_id
        }
    }, {
        '$project': {
            '_id': 0, 
            'events': 1
        }
    }, {
        '$unwind': {
            'path': '$events'
        }
    }, {
        '$match': {
            'events.event': 'user'
        }
    }, {
        '$group': {
            '_id': 'events.event', 
            'count': {
                '$sum': {
                    '$cond': [
                        {
                            '$and': [
                                {
                                    '$gte': [
                                        '$events.timestamp', review_date
                                    ]
                                }, {
                                    '$lte': [
                                        '$events.timestamp', last_active_date
                                    ]
                                }
                            ]
                        }, 1, 0
                    ]
                }
            }
        }
    }, {
        '$project': {
            '_id': 0
        }
    }
]