from datetime import datetime

def timestamp_to_datetime(timestamp):
    return datetime.fromtimestamp(timestamp).strftime('%Y %m %d %H: %M')
    

def format_datetime(itemList):
    for anItem in itemList:
        if 'latest_event_time' in anItem:
            anItem['latest_event_time']=timestamp_to_datetime(anItem['latest_event_time'])
        elif 'events' in anItem:
            anItem.events.timestamp=timestamp_to_datetime(anItem.events.timestamp)

