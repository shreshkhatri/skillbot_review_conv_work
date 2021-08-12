from pymongo import MongoClient

#For username and passwords reserved characters like ‘:’, ‘/’, ‘+’ and ‘@’ 
from urllib.parse import quote_plus

client=None
    

def connectMongoDB(complete_uri):
    
    try:
        #Keeping the above line inside the try code will not work since the constructor for creating
        #MongoClient is non-blocking in nature and it will return to caller as soon as it gets called
        # The ping command is cheap and does not require auth.
        client=MongoClient(complete_uri)
        client.admin.command('ping')
        return client if isinstance(client,MongoClient) else None
    except Exception as instance:
        print('Error '+str(instance))


def constructFullDbURI(uri,username,password,database):
    index = uri.find("//")
    index+=2 #to include both slashes
    return uri[:index]+quote_plus(username)+':'+quote_plus(password)+'@'+uri[index:]+'/'+database
