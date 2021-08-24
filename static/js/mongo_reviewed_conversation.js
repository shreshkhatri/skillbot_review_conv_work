import {formatTimeStamp,calculateActiveAgo, formatTimeStamp_LL} from './date_manipulation.js'
import { displayModal } from './modal.js';
import {BASE_URL} from './baseurl.js';


export function load_reviewed_conversations() {

  //cleareing result row if there is already some message being displayed
  $('#query-result').text('');
  $('#query-result').hide();
  $('#reviewed-conversation-column').empty();
  $('#reviewed-conversation-column').hide();

  $.ajax({
    type: "GET",
    url: BASE_URL+"mongo/get-reviewd-conversations", //the script to call to get data
    dataType: "json",
    beforeSend: function () {
     $('#reviewed-message-loader').show();
    },
    success: function (data) {

      if(data.hasOwnProperty('error')){
        displayModal('Error !',data['error']);
      }
      else if(data!=null || data!=undefined){

        if(data.length==0){
          $('#query-result p').text('Sorry, no reviewed conversation exists.');
          $('#query-result').show();
        }else{
          render_reviewed_conversation_details(data);
        }
      }
    },
    error: function (error) {
      if(error.status==0)
      {
        displayModal('Error !','Please Check your Internet Connectivity');
      }
      else{
        displayModal('Error !','Sorry!,something went wrong');
      }
    },
    complete: function () {
      $('#reviewed-message-loader').hide();
    },
  });
}


//function for rendering conversation list
function render_reviewed_conversation_details(review_details) {
  var list_count = 0;
  review_details.forEach((a_review_summary) => {
     
    var content=`<div class="row single-review-row" >
                  <div class="col">
                    <div class="row  border-bottom border-dark"><h6>`+a_review_summary['reviewed_conversations']+` Reviewed conversations on, `+formatTimeStamp_LL(a_review_summary['review_date'])+`</h6></div>
                    <div class="row">
                      <div class="table-responsive">
                        <table class="table table-sm table-hover ">
                          <thead>
                            <tr>
                              <th scope="col">Conversation ID</th>
                              <th scope="col">Conversation Start Date</th>
                              
                              <th scope="col">Reviewed By</th>
                              <th scope="col">New messages</th>
                              <th scope="col">Last Active</th>
                              <th scope="col">Option</th>
                            </tr>
                          </thead>
                          <tbody>`
        
              a_review_summary['conversations'].forEach((a_conversation)=>{
        
                            var subcontent=`<tr>
                                  <td scope="row">`+a_conversation['sender_id']+`</td>
                                  <td>`+formatTimeStamp(a_conversation['start_date'])+`</td>
                                  <td>`+a_conversation['review_by']+`</td>
                                  <td>`+a_conversation['message_count_since_last_review']+`</td>
                                  <td>`+calculateActiveAgo(a_conversation['latest_event_time'])+`</td>
                                  <td><button type="button" class="btn btn-link btn-sm btn-unmark-conversation" data-sender_id='`+a_conversation['sender_id']+`'>Review Again</button></td>
                                </tr>`;
                            content+=subcontent;
                          });
    content+=`</tbody></table></div></div></div></div>`;
    $('#reviewed-conversation-column').append(content);
  });
  $('#reviewed-conversation-column').show();
}

export function mark_conversation_as_unreviewed(jQuery_object){
  $.ajax({
    type: "POST",
    url: BASE_URL+"/mongo/unmarkConversation", //the script to call to get data
    dataType: "json",
    contentType: 'application/json; charset=utf-8', 
    data:JSON.stringify({
      'sender_id':jQuery_object.attr('data-sender_id')
    }),
    beforeSend: function () {
    },
    success: function (data) {

      if(data.hasOwnProperty('error')){
        displayModal('Error !',data['error']);
      }
      else{
        jQuery_object.parents('tr').remove();
      }
    },
    error: function (error) {
      if(error.status==0)
      {
        displayModal('Error !','Please Check your Internet Connectivity');
      }
      else{
        displayModal('Error !','Sorry!,something went wrong');
      }
    },
    complete: function () {
    },
  });  
}

