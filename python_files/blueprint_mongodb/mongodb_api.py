from flask import Flask,Blueprint,request,jsonify,current_app
from python_files.blueprint_mongodb import db 


bp_mongodb_api = Blueprint('bp_mongodb_api',__name__)

@bp_mongodb_api.route('/mongo',methods=['GET'])
def load_conversations():
    uri=db.constructFullDbURI(current_app.config['DB_SRV'],current_app.config['DB_USERNAME'],current_app.config['DB_PASSWORD'],current_app.config['DB_NAME'])
    client=db.connectMongoDB(uri)
    data=client.newdatabase.conversations.find_one()
    data=data['events']
    return jsonify(data)
