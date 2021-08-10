export var confidence_value;
export var conversation_id;
export var a_training_example={};
export var is_message_saved=true;
export var intent_name_availability=undefined;

export var predicted_intent;
export var corrected_intent=undefined; //variable for intent choosen by selectpicker
export var new_intent=undefined; //variable for holding newly selected intent

export var content_buffer=''; //this variable needs to be loooked after
export var selected_entity; //holds selected text for entity annotation

export var selected_entity_list=[]; //array of user annotated entities
export var queried_entity_list=[];  //array of exisiting entites in training data files in database

export var allow_save_review=false;

export var incorrect_intent,confidence;
export const regexp=/[^a-zA-Z_]+/; //regex for testing name of the intent and entity
export const max_len=25;
//object for holding message
export var message_object={
  latest_message:'',
  update_observers:function(){
    alert('observers notified');
  }}
