import json
from bson.json_util import loads, dumps
from flask_pymongo import PyMongo
from flask import Flask


app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb+srv://shresh:HelloWorld@cluster0.aczk7.mongodb.net/conversation_store?retryWrites=true&w=majority"
mongo = PyMongo(app)

@app.route("/")
def home_page():
    conv_data = mongo.db.conversations.find()
    lists=[]
    for item in conv_data:
        lists.append(item)
    
    lists=dumps(lists)
    print(lists)
    return lists

if __name__=="__main__":
    app.run(debug=True)