import {displayModal} from './modal.js';
import {BASE_URL} from './baseurl.js';

//this object holds conversation item information after 'mark as read' item is clicked
//in order to support redo and confirm operation 

export var unreviewed_message_counter={
    count:0,
    observers:[],
    set:function(count){
        this.count=count;
    },
    reduce_one: function(){
        this.count--;
        if (this.observers.length!=0){
            this.update_observers();
        }
    },
    increase_one:function(){
        this.count++;
        if (this.observers.length!=0){
            this.update_observers();
        }
    },
    update_observers:function(){
        if (this.observers.length!=0){
            this.observers.forEach((observer)=>{
                $(observer).text(this.count);
            });
        }
        
    },
    add_observer:function(observer){
        this.observers.push(observer);
    },
    remove_observer:function(observer){
        if (this.observers.length!=0){
            this.observers=this.observers.map(elem=>elem!=observer)
        }
    }
};


export var conversation_item={
    id:undefined,
    element:undefined,
    html_content:undefined
};

export var selected_conv_items=[];

const STATUS=['reviewed','unread','saved_for_later'];

export function pushConvItem(item){
    selected_conv_items.push(item);
}

export function popConvItem(convID){
    selected_conv_items=selected_conv_items.map(elem=>elem.id!=convID)
}

export function returnConvItem(convID){
    return selected_conv_items.find(item=>item.id==convID)
}
/******************************************************************************* */

//function for marking the conversation as 'reviewed', 'unread' or 'saved_for_later'
export function mark_as_reviewed(convID){

    var outcome;
    $.ajax({
        type: 'POST',
        url: BASE_URL+'mongo/markReviewed',       //the script to call to get data
        data: JSON.stringify({
          'sender_id':convID
        }), //add the data to the form
        dataType: 'json',          
        contentType: 'application/json; charset=utf-8',         //data format
        success: function(data){  
            if(data!==true){
                outcome=data.status;
            }else outcome=true;
        },
        error: function(error){
            //for general errors
            outcome='Some error occured, Please try this option later.';
            
            //for no active internet connection error
            if(error.status===0){
                outcome='Please check your Internet Connectivity'
            }
        },
        async:false
      });

      return outcome;
}