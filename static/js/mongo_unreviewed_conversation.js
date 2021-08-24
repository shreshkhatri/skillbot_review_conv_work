import {formatTimeStamp,calculateActiveAgo} from './date_manipulation.js'
import {BASE_URL} from './baseurl.js';


export function load_unreviewed_conversations(initial_date, final_date) {
  $.ajax({
    type: "POST",
    url: BASE_URL+"mongo/load-dated-conversations-items", //the script to call to get data
    data: JSON.stringify({
      initial_date: initial_date,
      final_date: final_date,
    }), //add the data to the form
    dataType: "json",
    contentType: "application/json; charset=utf-8", //data format
    beforeSend: function () {
      $("#conversation_list").empty();
      $("#no_conversation_list").remove();
      $(".conv-list-loader").show();
    },
    success: function (data) {
      if(data!=null || data!=undefined){
        if (data.length!=0){
          $('#div-notice').html(`<b>${data.length}</b> unreviewed conversation(s) found.`);
          render_convesation_list(data);
          $(".conversation-item:first").addClass("active");
        }
        else{
            $('#div-notice').html(`<b>0</b> unreviewed conversation found.`);
            $('.col-conversation-list').append(`<div id="no_conversation_list" style="padding-left:3em;"><p>No conversation found in the provided date range</p></div>`);
        }
      }
    },
    error: function (e) {
      $(".col-conversation-list").text("error has occured: "+e.Message);
    },
    complete: function () {
      $(".conv-list-loader").hide();
    },
  });
}


//function for rendering conversation list
function render_convesation_list(conversation_array) {
  var list_count = 0;
  conversation_array.forEach((item) => {
    var content =
      `<li id="` +
      item.sender_id +
      `" class="list-group-item list-group-item-action conversation-item ">
    <div class="container" style="margin:0; padding: 0;">
        <div class="row">
            <div class="col-md-2 col-sm-2 "><span class="fas fa-user-circle circular-avatar"></span></div>
            <div class="col-md-6 col-sm-6 conv-detail"com>
                <p> Started On: <span class="date-started">` +
      formatTimeStamp(item.start_date) +
      `</span></p>
                <p> Last Active: <span class="active-ago">` +
      calculateActiveAgo(item.latest_event_time) +
      `</span></p>
                <p> <b>` +
      item.count +
      `</b> unidentified message(s)</p>
            </div>
            <div class="col-md-4 col-sm-4 mark-review" style="font-size: .85em;">
                <p class="marker" style="cursor: pointer;">Mark as Reviewed</p>
            </div>
        </div>
    </div>
</li>`;

    $(".list-group").append(content);
    list_count++;
  });
}
