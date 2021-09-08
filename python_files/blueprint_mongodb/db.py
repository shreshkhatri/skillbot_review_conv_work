import sys,time
from datetime import datetime
from pymongo import MongoClient
from python_files.blueprint_mongodb.pipelines import pl_datedUnreviewedConversation , pl_normalUnreviewedConversation, pl_startingDateForAConversation,pl_startingDateForUnreviewedConversation, pl_reviewDates,pl_review_date_details,pl_message_counter

#For username and passwords reserved characters like ‘:’, ‘/’, ‘+’ and ‘@’ 
from urllib.parse import quote_plus

mongoclient=None
fullURI=None


def connectMongoDB(complete_uri=None):
    try:
        global mongoclient
        #Keeping the above line inside the try code will not work since the constructor for creating
        #MongoClient is non-blocking in nature and it will return to caller as soon as it gets called
        # The ping command is cheap and does not require auth.
        if complete_uri==None:
            complete_uri=fullURI
        mongoclient=MongoClient(complete_uri)
        mongoclient.admin.command('ping')
        
        
        return mongoclient
    except Exception as instance:
        print('Error '+str(instance))


def constructFullDbURI(uri,username,password,database):
    try:
        global fullURI
        index = uri.find("//")
        index+=2 #to include both slashes
        fullURI=uri[:index]+quote_plus(username)+':'+quote_plus(password)+'@'+uri[index:]+'/'+database
        
        return fullURI
    except Exception as instance:
        print('Error '+str(instance))


def getMongoClient():
    global mongoclient
    return mongoclient if mongoclient!=None else sys.exit('Please connect to MongoDB first')

def getfullURI():
    global mongoclient
    return fullURI if fullURI!=None else sys.exit('Full URI not configured yet.')

def getDatedUnreviewedConversation(initial_date,final_date):
    global mongoclient
    pipe=pl_datedUnreviewedConversation(initial_date,final_date)
    collection=mongoclient.newdatabase.conversations
    return list(collection.aggregate(pipe))
    

def getUnDatedUnreviewedConversation():
    global mongoclient
    
    pipe=pl_normalUnreviewedConversation()
    collection=mongoclient.newdatabase.conversations
    conversation_details=list(collection.aggregate(pipe))
    
    if(len(conversation_details)!=0):
        for anItem in conversation_details:
            datalist=getConversationStartedDateForAConversation(anItem['sender_id'])
            anItem['start_date']=datalist[0]['events']['timestamp']
    return sorted(conversation_details, key=lambda conversation: conversation['start_date'],reverse=True) #soring conversation using start date in reverse order

def getConversationStartedDates():
    global mongoclient
    pipe=pl_startingDateForUnreviewedConversation()
    collection=mongoclient.newdatabase.conversations
    return list(collection.aggregate(pipe))

def getConversationStartedDateForAConversation(sender_id):
    global mongoclient
    pipe=pl_startingDateForAConversation(sender_id)
    collection=mongoclient.newdatabase.conversations
    return list(collection.aggregate(pipe))
    
def markConversationAsReviewed(sender_id):
    global mongoclient
    queryFilter={'sender_id':sender_id}
    today=datetime.now().date() 

    #timestamp for todays date not including mins,secs and hours, converted to int for grouping later
    timestamp=int(time.mktime(datetime.strptime(str(datetime.now().date()), "%Y-%m-%d").timetuple()))
    
    update={"$set":{'review_status':'reviewed','review_date':timestamp,'review_by':'user1'}}
    collection=mongoclient.newdatabase.conversations
    updateResult=collection.update_one(queryFilter,update)
    return True if updateResult.modified_count==1 else False

def get_review_dates():
    global mongoclient
    pipe=pl_reviewDates()
    collection=mongoclient.newdatabase.conversations
    return list(collection.aggregate(pipe))

def get_number_of_messages(sender_id,from_reviewedDate,to_lastActiveDate):
    global mongoclient
    pipe=pl_message_counter(sender_id,from_reviewedDate,to_lastActiveDate)
    collection=mongoclient.newdatabase.conversations
    return list(collection.aggregate(pipe))

def get_reviewed_conversations_summary():
    global mongoclient
    review_details=get_review_dates()
    if len(review_details)!=0:
        for an_item in review_details:
            pipe=pl_review_date_details(an_item['review_date'])
            collection=mongoclient.newdatabase.conversations
            an_item['conversations']=list(collection.aggregate(pipe))
        
        for an_item in review_details:
            for a_conversation in an_item['conversations']:
                sender_id=a_conversation['sender_id']
                review_date=an_item['review_date']
                end_date=a_conversation['latest_event_time']
                message_count=get_number_of_messages(sender_id,review_date,end_date)
                a_conversation['message_count_since_last_review']=message_count[0]['count']
                
    
    return review_details

def unmarkConversationAsUnReviewed(sender_id):
    global mongoclient
    queryFilter={'sender_id':sender_id}
    today=datetime.now().date() 

    #timestamp for todays date not including mins,secs and hours, converted to int for grouping later
    timestamp=int(time.mktime(datetime.strptime(str(datetime.now().date()), "%Y-%m-%d").timetuple()))
    
    update={"$set":{'review_status':'unreviewed','review_date':timestamp,'review_by':'user1'}}
    collection=mongoclient.newdatabase.conversations
    updateResult=collection.update_one(queryFilter,update)
    return True if updateResult.modified_count==1 else False

def getAConversation(sender_id):
    global mongoclient
    queryFilter=queryFilter={'sender_id':sender_id}
    projection={'events':1,'_id':0}
    collection=mongoclient.newdatabase.conversations
    return collection.find_one(queryFilter,projection)

def markMessageAsReviewed(sender_id,message_id):
    global mongoclient
    queryFilter={'sender_id':sender_id}
    today=datetime.now().date() 

    #timestamp for todays date not including mins,secs and hours, converted to int for grouping later
    timestamp=int(time.mktime(datetime.strptime(str(datetime.now().date()), "%Y-%m-%d").timetuple()))
    
    update={"$set":{"events.$[index].review_status":True,"events.$[index].reviewed_by":"user1"}}
    arrayFilter=[{"index.message_id":message_id}]
    collection=mongoclient.newdatabase.conversations
    updateResult=collection.update_one(queryFilter,update,array_filters=arrayFilter,upsert=False)
    #return True if updateResult.modified_count==1 else False


############################################################
#   this is the text inside comment                FOR TESTING                            #
############################################################
