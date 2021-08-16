import {navigation_items_array, nav_item_click_handler} from './navitem.js';
import { unreviewed_message_counter,pushConvItem,popConvItem,returnConvItem, mark_as_reviewed} from './mark_conversation_reviewed.js';
import {date_object} from './date_manipulation.js';
import {load_unreviewed_conversations} from './mongo_unreviewed_conversation.js';
import {mark_conversation_as_unreviewed} from './mongo_reviewed_conversation.js';
import {format_all_datetime} from './atpageload.js';
import {displayModal,displayReviewConversaitonModal} from './modal.js';

$(function(){

  var confidence_value=$('#confidence-level').val();
  var conversation_id;
  var a_training_example={};
  var is_message_saved=true;
  var intent_name_availability=undefined;
  
  var predicted_intent;
  var corrected_intent=undefined; //variable for intent choosen by selectpicker
  var new_intent=undefined; //variable for holding newly selected intent

  var content_buffer=''; //this variable needs to be loooked after
  var selected_entity; //holds selected text for entity annotation
  
  var selected_entity_list=[]; //array of user annotated entities
  var queried_entity_list=[];  //array of exisiting entites in training data files in database

  var allow_save_review=false;

  var incorrect_intent,confidence;
  const regexp=/[^a-zA-Z_]+/; //regex for testing name of the intent and entity
  const max_len=25;
  //object for holding message
  var message_object={
    latest_message:'',
    update_observers:function(){
      displayModal('Information !','observers notified');
    }
  };
  
  /****************setting unreviewed message counter and its observers *****************************/
  unreviewed_message_counter.set(parseInt($('#unreviewed span').text()));
  unreviewed_message_counter.add_observer('#unreviewed span');
  /**************************************** end of setting *****************************************/

  $(document).on('change','input[type="date"]',function(e){

    if($(this).attr('id')=='initial-date'){
      date_object.setInitialDate(moment().format($(this).val()));
      if(date_object.checkDatesConsistency()){
        load_unreviewed_conversations(date_object.initial_date,date_object.final_date);
      }
    }
    else if ($(this).attr('id')=='final-date'){
      date_object.setFinalDate(moment().format($(this).val()));
      if(date_object.checkDatesConsistency()){
        load_unreviewed_conversations(date_object.initial_date,date_object.final_date);
      }
    }
  
  });

  //click event for navigation item icons
  $(document).on('click','.nav-link',function(e){
    nav_item_click_handler($(this).attr('id'),navigation_items_array);
    e.preventDefault();
  });

  function reset_before_rendering_review_section(){
    new_intent=undefined;
    corrected_intent=undefined;
    predicted_intent=undefined;
    selected_entity_list=[];
  }

  //action for undoing the action of marking the conversation as marked
  $(document).on('click','#btn-move-undo',function(e){
    try{
      var c_id=$(this).parents('li').attr('id');
      var conv_item=returnConvItem(c_id);
      $(this).parents('li').hide().html(conv_item.html_content).fadeIn('slow');
      popConvItem(c_id);
    }
    catch(error){
      displayModal('ERROR !',error.message);
    }
    e.stopPropagation();
  });
  
  //action for confirming the action of marking conversation as 'reviewed'
  $(document).on('click','#btn-move-confirm',function(e){
    try{
      var c_id=$(this).parents('li').attr('id');
      var resp=mark_as_reviewed(c_id);
      if(typeof resp=='string'){
        displayModal('ERROR !',resp);
        return;
      }
      unreviewed_message_counter.reduce_one();

      $(this).parents('li').fadeOut('slow',function(){
        $(this).parents('li').remove();
      });
      popConvItem(c_id);
    }
    catch(error){
      displayModal('ERROR !',error.message);
    }
    e.stopPropagation();
  });

  $(document).on('click','.marker',function(e){
    try{
      var conv_item=new Object();
    conv_item.element=$(this).parents('li');
    conv_item.id=conv_item.element.attr('id');
    conv_item.html_content=$(this).parents('li').html();
    var height=conv_item.element.css('height');
    var width=conv_item.element.css('width');
    conv_item.element.hide().load( "http://127.0.0.1:5000/templates/mark-conv-review",function(responseTxt,responseStatus){
     if(responseStatus=='error'){
       displayModal('ERROR !','Something went wrong, Please try this option later.');
       return;
     }
     
     pushConvItem(conv_item);
    }).fadeIn('slow');
    conv_item.element.css({'height':height,'width':width});
    }
    catch(error){
      
    }
    
    e.stopPropagation();
  });

//defining handler for 'Review Message' button
  $(document).on('click','.btn-unmark-conversation',function(){
    mark_conversation_as_unreviewed($(this));
  });
  
  $(document).on('change','#confidence-level',function(){
    confidence_value=$(this).val();
    $('#confidence-value').val(confidence_value);
    load_aConversation(conversation_id);
    empty_review_section();
  });


  //function for detecting change falue of select picker
  $(document).on('change','select',function(){
    predicted_intent=$('#predicted-intent').val();
    if($('.selectpicker').selectpicker('val')==predicted_intent){
      corrected_intent=undefined;
    }
    else{
      corrected_intent=$('.selectpicker').selectpicker('val');
    }
    render_review_summary();

  });

  //function for rendering review summary
  function render_review_summary(){
    
    // like refreshing of the div
    $('.review-summary').empty();

    //if nothing is done then this section will be displayed
    if(new_intent==undefined && corrected_intent==undefined &&  selected_entity_list.length==0){
      $('.review-summary').prepend('<div class="a-review" style="display:none;"><p classs="a-review-message" style="color: black;">No Review Made yet</p></div>');
      $('.a-review').slideDown('slow');
      allow_save_review=false;
      update_review_button();
      return;
    }

    //this means the intent has been reassigned
    if(corrected_intent!=undefined){
      $('.review-summary').prepend('<div class="a-review" style="display:none;"><span class="fas fa-check"></span><p classs="a-review-message">Intent changed to : '+corrected_intent+'</p></div>');
      $('.a-review').slideDown('slow');
      allow_save_review=true;
      update_review_button();
    }

    //this means new intent has been assigned
    if(new_intent!=undefined){
      $('.review-summary').prepend('<div class="a-review" style="display:none;"><span class="fas fa-check"></span><p classs="a-review-message">New intent assigned</p></div>');
      $('.a-review').slideDown('slow');
      allow_save_review=true;
      update_review_button();
    }

    //this means entities have been annotated
    if(selected_entity_list.length!=0){
      if(selected_entity_list.length==1){
        $('.review-summary').prepend('<div class="a-review" style="display:none;"><span class="fas fa-check"></span><p classs="a-review-message">'+selected_entity_list.length+' entity annotated</p></div>');
        $('.a-review').slideDown('slow');
      }
      else{
        $('.review-summary').prepend('<div class="a-review" style="display:none;"><span class="fas fa-check"></span><p classs="a-review-message">'+selected_entity_list.length+' entities annotated</p></div>');
        $('.a-review').slideDown('slow');
      }
      allow_save_review=true; 
      update_review_button();     
    }
  }

  //function for updating status for 'review update'button
  function update_review_button(){
    if(allow_save_review){
      $('#btn-review-msg').attr('disabled',false);
    }else{
      $('#btn-review-msg').attr('disabled',true);
    }
  }

  //function for verifying entity name is available to be chosen 
  function check_entity_name(thisobj){
      
    queried_entity_list=[];
    var input=$.trim($(thisobj).val()).toLowerCase();
    $('#entity-name-available').hide();

    if(input.length==0){
      return;
    }

    $.ajax({
      type:'GET',
      url:'http://127.0.0.1:5000/getEntityList',
      dataType:`json`,
      contentType:'application/json; charset=utf-8',
      beforeSend:function(){
        $('#entity-search-loader').fadeIn('slow');
      },
      success: function(data){
        data=JSON.parse(data);
        for( var item of data){
          if(item.hasOwnProperty('entity')){
            if (item['entity'].startsWith(input)||item['entity'].endsWith(input)||(item['entity'].search(input)!=-1)){
              queried_entity_list.push(item['entity']);
            } 
          }
        }

        if(queried_entity_list.length!=0){
          queried_entity_list.forEach(function(item){
            $('#entity-name-available').append('<p>'+item+'</p>');
          })
          $('#entity-name-available').fadeIn('slow');
        }
      },
      error:function(){},
      complete:function(){
        $('#entity-search-loader').hide();
      }
    });
  }

  $(document).on('click','#entity-name-available p',function(){
    displayModal('ERROR !',$(this).text());
  });

  $(document).on('change','#entity-name',function(){
    if (regexp.test($(this).val())){
      displayModal('ERROR !','Only alphabets and underscore characters are accepted.');
      return ;
    }
    if($(this).val().length>max_len){
      displayModal('ERROR !',`Only Maximum ${max_len}  characters allowed in the name.`);
      return ;
    }
    check_entity_name($(this));
  });

  
  //function for clearing review section
  function empty_review_section(){
    $('.message-under-review').empty();
    $('#review-details-error').empty();
  }

  //function for rendering review section after user message is clicked
  function render_review_section(this_object){

    //first empty the review section 
    empty_review_section();
    $.ajax({
      type: 'GET',
      url: 'http://127.0.0.1:5000/getIntentList',       //the script to call to get data
      dataType: 'json',          
      contentType: 'application/json; charset=utf-8',         //data format
      beforeSend:function(){
        $('.review-details-loader').css({'margin-top': '40%','margin-left': '40%'});
        $('.review-details-loader span').removeClass();
        $('.review-details-loader span').addClass('fas fa-spinner fa-pulse');
        $('.review-details-loader p').text('Loading...');
        $('.review-details-loader').show();
      },
      success: function(data){             //on recieve of reply
      //  $.each($(data), function(key, value) {
          //$('#itemContainer').append(value.user_id);
       // });
       var intent_response=JSON.parse(data);
       if (intent_response.hasOwnProperty('error')){
        $('#review-details-error').show();
        $('#review-details-error').text(intent_response.error);
       }
       else{
         $('.message-under-review').show();
        var data_tokens='';
        message_object.latest_message=this_object.attr('data-message');
        
        //preparing data-tokens for selectpicker
        $.each(intent_response,function(index,intent_data){
            if(intent_data.hasOwnProperty('intent')){
              data_tokens+='<option class="custom-selectpicker-option" data-tokens="'+intent_data.intent+'">'+intent_data.intent+'</option>';
            }
        });

        //constructing content for loading on review_section
            var content=`<b>Selected Message</b><input type="text" id="selected_message" class="form-control form-control-sm input-font-style"
            aria-label="message under review" aria-describedby="basic-addon2" autocomplete="off"
            value="`+this_object.attr('data-message')+`" data-msg-id="`+this_object.attr('data-message_id')+`"
            data-conv-id="`+this_object.attr('data-conversation_id')+`">
            <button id="btn-save-edit-message" class="btn btn-primary btn-sm btn-custom-style" style="margin-top:.5em;" type="button" disabled>Message
            Saved</button>
            <br /><br />
            <b>Predicted Intent</b>
            <input type="text" class="form-control form-control-sm input-font-style" id="predicted-intent"
            value="`+this_object.attr('data-intent-name')+`" readonly>
            <br />
            <div class="accordion" id="accordionExample">
            <div class="card border rounded">
              <div class="card-header custom-card-header" id="headingOne">
                <p class="mb-0">
                  <button class="btn btn-link btn-custom-style" type="button" data-toggle="collapse" data-target="#collapseOne"
                    aria-expanded="true" aria-controls="collapseOne">
                    Entity Annotation
                  </button>
                </p>
              </div>
            
              <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordionExample">
                <div class="card-body">
                  <div id="div-entity-section"><b>Entity Details</b>
                    <input type="text" class="form-control form-control-sm input-font-style" id="entity-value"
                      value="Nothing selected" readonly>
                    <input type="text" class="form-control form-control-sm input-font-style" id="entity-name"
                      placeholder="Entity Name" autocomplete="off">
            
                    <div class="div-new-entity-result">
                      <div id="entity-search-loader" style="display: none;">
                        <span class="fas fa-spinner fa-pulse"></span>
                        <p style="margin-left: .5em;"> Checking Entity name availability</p>
                      </div>
                      <div id="entity-name-available" style="display: none;"> 
                        <div style="color: black; text-decoration: none;">Existing similar Entities</div>
                      </div>
                      <div id="entity-name-not-available" style="display: none;">
                        <span class="fas fa-times"></span>
                        <p style="margin-left: .5em; ">Entity already exists.</p>
                      </div>
                    </div>
                    <br/><br/>
                    <button id="btn-create-entity" type="button" class="btn btn-sm btn-primary btn-custom-style">Select
                      Entity</button>
                    <div id="div-entity-list"><br />
                      <b>Entity List</b>
                      <ul class="list-group">
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card border rounded">
              <div class="card-header custom-card-header" id="headingTwo">
                <p class="mb-0">
                  <button class="btn btn-link collapsed  btn-custom-style" type="button" data-toggle="collapse"
                    data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                    Intent Correction
                  </button>
                </p>
              </div>
              <div id="collapseTwo" class="collapse" aria-labelledby="headingTwo" data-parent="#accordionExample">
                <div class="card-body">
                  <b>Change Intent</b><br />
                  <form>
                    <div class="form-group row">
                      <div class="col-sm-12">
                        <select class="form-control form-control-sm selectpicker" data-size="5" data-show-subtext="true"
                          id="select-intent" data-live-search="true">
                          `+data_tokens+`
                        </select>
                      </div>
                    </div>
                  </form>
                  <p style="text-align: center;">or</p>
                  <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="checkbox-create-intent">
                    <label class="form-check-label" for="exampleCheck1">Select New Intent</label>
                  </div>
                  <div class="div-new-intent border rounded">
                    <input type="text" id="txt_new_intent" class="form-control form-control-sm input-font-style"
                      aria-label="new intent" aria-describedby="basic-addon2" placeholder="New intent" autocomplete="off"
                      disabled>
                    <div class="div-new-intent-result">
                      <div id="intent-search-loader" style="display: none;">
                        <span class="fas fa-spinner fa-pulse"></span>
                        <p>Checking name availability</p>
                      </div>
                      <div id="intent-name-available" style="display: none;">
                        <span class="fas fa-check"></span>
                        <p>Intent name available</p>
                      </div>
                      <div id="intent-name-not-available" style="display: none;">
                        <span class="fas fa-times"></span>
                        <p>Intent already exists.</p>
                      </div>
                      <div id="selected-intent-name" style="display: none;">
                      </div>
                    </div>
                    <button id="btn-create-intent" type="button" class="btn btn-sm btn-primary btn-custom-style" disabled>Select
                      Intent</button>
                  </div>
                </div>
              </div>
            </div>
            </div>
            
            <br />
            <b>Review Summary</b><br />
            <div class="review-summary">
            <div class="a-review">
              <p classs="a-review-message" style="color: black;">No Review Made yet</p>
            </div>
            </div>
            <button id="btn-review-msg" type="button" class="btn btn-sm btn-primary" style="font-size: .9em; height:2.5em;" disabled>Save
            Review</button>`;
            $('.message-under-review').append(content);
            $('.selectpicker').selectpicker('refresh');
       }
       
      },
      error: function(){
       // $('#itemContainer').html('<i class="icon-heart-broken"> <?= $lang["NO_DATA"] ?>');
       $('#review-details-error').show();
       $('#review-details-error').text('Loading Intent list failed.');
      },
      complete:function(){
        $('.review-details-loader').hide();
      }
    });
  }

 

  //function for loading bot and user messages in conversation layout 
  function load_messages(event_array,conversation_id){
    var message_counter=0;
    var message_bubble_div='';
    var extra_div='';
    var message_div='';
    var custom_data_payload='';
    $('#message_container').empty();
    event_array.forEach(element => {
      if(element.event=='user'|| element.event=='bot'){

        if(element.event=='user'){

          custom_data_payload='data-message_id="'+element.message_id+'" ';
          custom_data_payload+='data-conversation_id="'+conversation_id+'"';
          custom_data_payload+='data-message="'+element.text+'" ';
          custom_data_payload+='data-intent-name="'+element.parse_data.intent.name+'" ';

          if (element.parse_data.intent.name=='nlu_fallback'){ //we do need to highlight the messages identified as fallback intent
            incorrect_intent=element.parse_data.intent_ranking[1].name;
            confidence=element.parse_data.intent_ranking[1].confidence;
            confidence=parseFloat(confidence).toFixed(2);
            extra_div='<div class="message_details " style="float:right;"><p>Intent : '+incorrect_intent+'</p><p>Confidence : '+confidence+'</p><p> Message Reviewed :'+(element.review_status ? ' Yes ' : ' No ');+'</p></div>';
            message_bubble_div='<div class="message_bubble_user fallback bg-warning"'+custom_data_payload+' >'+element.text+'</div>';
          }
          else if(element.parse_data.intent.confidence<=confidence_value){ //aditionally we want to highlight messages that have confidence lower than selected threshold value
            incorrect_intent=element.parse_data.intent.name;
            confidence=element.parse_data.intent.confidence;
            confidence=parseFloat(confidence).toFixed(2);
            extra_div='<div class="message_details " style="float:right;"><p>Intent : '+incorrect_intent+'</p><p>Confidence : '+confidence+'</p><p> Message Reviewed :'+(element.review_status ? ' Yes ' : ' No ');+'</p></div>';
            message_bubble_div='<div class="message_bubble_user fallback bg-warning" '+custom_data_payload+' >'+element.text+'</div>';
          }
          else{
            extra_div='<div class="message_details" style="float:right;"><p>Intent : '+element.parse_data.intent.name+'</p><p>Confidence : '+parseFloat(element.parse_data.intent.confidence).toFixed(2)+'</p><p> Message Reviewed :'+(element.review_status ? ' Yes ' : ' No ');+'</p></div>';
            message_bubble_div='<div class="message_bubble_user non-fallback" '+custom_data_payload+' >'+element.text+'</div>';
          }
          
        }
        else{
          message_bubble_div='<div class="message_bubble_bot">'+element.text+'</div>';
          extra_div='<div class="message_details" style="float:left;">Action : '+element.metadata.template_name+'</div>';
        }
        
        message_div='<div class="message">'+message_bubble_div+extra_div+' </div>';
        $('#message_container').append(message_div);
        message_counter++;
      }
    });
    if(message_counter==0){
      $('#no_single_conv').show();
      
    }
  }

    //function for rendering selected user message inside review section
  function render_selected_message_details(this_object){
    $('#selected_message').val(this_object.attr('data-message'));
    message_object.latest_message=$('#selected_message').val();
    $('#predicted-intent').val(this_object.attr('data-intent-name'));
  }
    
  // function for loading messages for first conversation item
  function load_aConversation(conversation_id){
       
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:5000/mongo/getAConversation',       //the script to call to get data
      data: JSON.stringify({
        'sender_id':conversation_id
      }), //add the data to the form
      dataType: 'json',          
      contentType: 'application/json; charset=utf-8',         //data format
      beforeSend:function(){
        $('#message_container').hide();
        $('#no_single_conv').hide();
        $('.message_loader').show();
      },
      success: function(data){             //on recieve of reply
      //  $.each($(data), function(key, value) {
          //$('#itemContainer').append(value.user_id);
       // });
       if (data.hasOwnProperty('error')){
        $('#message_container').text(data.error);
       }
       else{
        load_messages(data.events,conversation_id);
       }
       
      },
      error: function(){
       // $('#itemContainer').html('<i class="icon-heart-broken"> <?= $lang["NO_DATA"] ?>');
       $('#loading').text('error has occured');
      },
      complete:function(){
        $('.message_loader').hide();
        $('#message_container').show();
      }
    });
  }
  
  //function for loading messages upon conversation list item 
  //being clicked
  $(document).on( "click",'.conversation-item', function() {
    
    conversation_id=$(this).attr('id');
    empty_review_section();
    $('.conversation-item').removeClass('active');
    $(this).addClass('active');
    $('#message_container').empty();
    
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:5000/mongo/getAConversation',       //the script to call to get data
      data: JSON.stringify({
        'sender_id':conversation_id
      }), //add the data to the form
      dataType: 'json',          
      contentType: 'application/json; charset=utf-8',         //data format
      beforeSend:function(){
        $('.message_loader').show();
      },
      success: function(data){             //on recieve of reply
      //  $.each($(data), function(key, value) {
          //$('#itemContainer').append(value.user_id);
       // });
    
       if (data.hasOwnProperty('error')){
        $('#message_container').text(data.error);
       }
       else{ 
        load_messages(data.events,conversation_id);
       }
      },
      error: function(){
       // $('#itemContainer').html('<i class="icon-heart-broken"> <?= $lang["NO_DATA"] ?>');
       $('#message_content').text('error has occured');
      },
      complete:function(){
        $('.message_loader').hide();
      }
    });
  });

 
  
  //click event for user sent messages for displaying intent data
  $(document).on("click",'.message_bubble_user', function() {
    
    reset_before_rendering_review_section();
    
    if($(this).hasClass('fallback')){
      render_review_section($(this));
      return;
    }
    $('.non-fallback').css({"background-color": "#e1e5e6"});
    $(this).css({"background-color": "#b9bdbe"});
    render_review_section($(this));
  });

  //function for removing readonly property to seleted message box 
  $(document).on("click",'#selected_message', function() {
    $(this).attr('readonly',false);
  });

//function for adding readonly property to seleted message box 
  $(document).on("focusout",'#selected_message', function() {
    if(window.getSelection().toString()==0){
      $(this).attr('readonly',true);
      $(this).popover('dispose');
    }
  });

  //function for checking if the selected message has been changed
  $(document).on("input",'#selected_message', function() {

    if(message_object.latest_message==$.trim($('#selected_message').val())){
      $('#btn-save-edit-message').attr('disabled',true);
      $('#btn-save-edit-message').text('Message Saved');
      is_message_saved=true;   
    }
    else{
      $('#btn-save-edit-message').attr('disabled',false);
      $('#btn-save-edit-message').text('Save');
      is_message_saved=false;
    }
  });
  
  $(document).on("click",'#btn-save-edit-message', function() {
    message_object.latest_message=$.trim($('#selected_message').val());
    message_object.update_observers();
    $(this).attr('disabled',true);
    is_message_saved=true;
    $(this).text('Message Saved');
  });

  //checkbox-create-intent
  $(document).on( "change",'#checkbox-create-intent', function() {
    if (this.checked) {
      $('.selectpicker').attr('disabled',true);
      $('.selectpicker').selectpicker('refresh');
      $('#txt_new_intent').attr('disabled',false);
      $('#btn-create-intent').attr('disabled',false);
      $('#selected-intent-name').css({'pointer-events': 'auto'});
      
  } else {
    $('#txt_new_intent').attr('disabled',true);
    $('#btn-create-intent').attr('disabled',true);
    $('.selectpicker').attr('disabled',false);
    $('.selectpicker').selectpicker('refresh');
    $('#selected-intent-name').css({'pointer-events': 'none'});
  }
  });

   //defining function for creating new intent
  $(document).on("click","#btn-create-intent",function(){

    if(new_intent!=undefined){
      displayModal('ERROR !','New intent name already saved. If you want to select new intent, please remove currently selected intent.');
      return;
    }
    
    if($.trim($('#txt_new_intent').val()).length==0){
      intent_name_availability==undefined;
      displayModal('ERROR !','No Intent name specified');
      return;
    }
    else if(intent_name_availability==undefined){
      displayModal('ERROR !','Please check intent name availability first');
      return;
    }
    else if(intent_name_availability==false){
      displayModal('ERROR !','Sorry Intent name already exists');
      return;
    }
    else if (regexp.test($.trim($('#txt_new_intent').val()))){
      displayModal('ERROR !','Only alphabets and underscore characters are accepted.');
      return ;
    }
    else if ($('#txt_new_intent').val().length>max_len){
      displayModal('ERROR !',`Only Maximum ${max_len}  characters allowed in the name.`);
      return ;
    }
    else{
      new_intent=$.trim($('#txt_new_intent').val());
      render_review_summary();
      $('.div-new-intent-result').children().hide();
      $('#selected-intent-name').append('<p>Selected Intent : <b>'+new_intent +'</b> <i class="fas fa-times"></i></p>');
      $('#selected-intent-name').fadeIn('slow');
    }

  });

    //removing selected intent name
    $(document).on("click","#selected-intent-name p i",function(){
      new_intent=undefined;
      intent_name_availability=undefined;
      render_review_summary();
      $(this).parent().hide();
    });


  //function for verifying intent name
  $(document).on( "change",'#txt_new_intent', function() {

    if (regexp.test($(this).val())){
      displayModal('ERROR !','Only alphabets and underscore characters are accepted.');
      return ;
    }
    else if($(this).val().length>max_len){
      displayModal('ERROR !',`Only Maximum ${max_len}  characters allowed in the name.`);
      return;
    }

    if($(this).val().length==0){
      $('#intent-name-available').hide();
      $('#intent-name-not-available').hide();
      return; 
    }

    
    $.ajax({
      type: 'GET',
      url: 'http://127.0.0.1:5000/getIntentList',       //the script to call to get data
      dataType: 'json',          
      contentType: 'application/json; charset=utf-8',         //data format
      beforeSend:function(){
        $('#intent-name-available').hide();
        $('#intent-name-not-available').hide();
        $('#intent-search-loader').show();
      },
      success: function(data){             //on recieve of reply
      //  $.each($(data), function(key, value) {
          //$('#itemContainer').append(value.user_id);
       // });
       var response=JSON.parse(data);
       if (response.hasOwnProperty('error')){
        $('#intent-name-not-available').show();
        $('#intent-name-not-available').text(response.error);
       }
       else{
         var intent_name=$('#txt_new_intent').val();
        //$('#intent-name-available').show();
        
        $.each(response,function(index,intent_data){
          if (intent_data.intent==intent_name){
            intent_name_availability=false;
            return false;
          }
          else{
            intent_name_availability=true;
          }
        });
        
        //#intent-search-loader,#intent-name-available,#intent-name-not-available
        if(intent_name_availability){
          $('#intent-name-available').fadeIn('slow',()=>{
            $('#intent-name-available').fadeOut('slow');
          });
        }
        else{
          $('#intent-name-not-available').fadeIn('slow',()=>{
            $('#intent-name-not-available').fadeOut('slow');
          });
        }
       }
       
      },
      error: function(){
       // $('#itemContainer').html('<i class="icon-heart-broken"> <?= $lang["NO_DATA"] ?>');
       $('#intent-name-not-available').show();
        $('#intent-name-not-available').text('Some error occured !!');
      },
      complete:function(){
        $('#intent-search-loader').hide();
      }
    });
  });

  
  $(document).on( "click",'#btn-review-msg', function() {
    if(corrected_intent!=undefined && new_intent!=undefined){
      displayModal('ERROR !','Intent can be either created or corrected. Please check your review.');
      return;
    }

    delete a_training_example.intent_mapped_to;
    //constructing training example for posting to the API
    a_training_example.text=message_object.latest_message;
    
    //predicted intent will be used as the same intent
    //this means only annotation is being performed
    if(corrected_intent==undefined && new_intent==undefined){
      a_training_example.intent=$('#predicted-intent').val();
    }
    else if (corrected_intent!=undefined){
      a_training_example.intent=corrected_intent;
      if($('#predicted-intent').val()!='nlu_fallback'){
        //this means that predicted intent is mapped to intents other than fallback 
        //and it is being changed to something else in existing training dataset
        a_training_example.intent_mapped_to=$('#predicted-intent').val();
      }
    }
    else if (new_intent!=undefined){
      a_training_example.intent=new_intent;
    }

    a_training_example.entities=selected_entity_list;
    
    //asking for confirmation while reviewing message
    displayReviewConversaitonModal();

  });

  //confirming and submitting the review for currently selected message
  $(document).on( "click",".review-msg-yes", function(e){
    upload_training_data();
  });

  function upload_training_data(){
    
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:5000/mongo/markMessageAsReviewed',       //the script to call to get data
      data: JSON.stringify({
        'text':a_training_example.text,
        'intent': a_training_example.intent,
        'entities':a_training_example.entities,
        'intent_mapped_to':a_training_example.intent_mapped_to==undefined?'':a_training_example.intent_mapped_to,
        'sender_id':$('#selected_message').attr('data-conv-id'),
        'message_id':$('#selected_message').attr('data-msg-id')
      }), //add the data to the form          
      contentType: 'application/json; charset=utf-8',         //data format
      success:function(data){
        alert(JSON.stringify(data));
      },
      beforeSend:function(){
        $('.message-under-review').hide();
        $('.review-details-loader').css({'margin-top': '40%','margin-left': '20%'});
        $('.review-details-loader span').removeClass();
        $('.review-details-loader span').addClass('fas fa-spinner fa-pulse');
        $('.review-details-loader p').text('Uploading Training data...');
        $('.review-details-loader').show();
      },
      error: function(){
       // $('#itemContainer').html('<i class="icon-heart-broken"> <?= $lang["NO_DATA"] ?>');
       $('#review-details-error p').text('error has occured');
       $('#review-details-error p').show();
      },
      complete:function(){
        $('.review-details-loader span').removeClass();
        $('.review-details-loader span').addClass('fas fa-check');
        $('.review-details-loader p').text('Training data uploaded successfully.');
        $('.review-details-loader').fadeOut(2000,function(){
          $('.message-under-review').show();
          $('.review-details-loader span').addClass('fas fa-spinner fa-pulse');
        });
        
      }
    });
  }
 

  $(document).on( "select","#selected_message", function(e){
    // this is important for creating new object
    selected_entity=undefined;
    
    selected_entity=new Object();
    selected_entity.value=$.trim(window.getSelection().toString());
    selected_entity.start=$('#selected_message').prop('selectionStart'); //picks up starting position of selected text
    selected_entity.end=$('#selected_message').prop('selectionEnd');

    if(selected_entity.value.length!=0){
      $(this).popover('dispose');
      $(this).attr({"data-entity-value":selected_entity.value,"data-toggle":"popover","data-placement":"bottom","data-html":"true" ,"data-content":"Create Entity for :  <b>'"+selected_entity.value+"'</b>"});
      $(this).popover('show');
      
    }
  });
  
  $(document).on("click",".popover",function(){
    if(is_message_saved){
    $(this).hide();
    $('#entity-value').val(selected_entity.value);
    }
    else{
      displayModal('ERROR !',`You have not saved the message change. Please save it first.`);
    }
  });

  //function for saving entity information
  $(document).on("click","#btn-create-entity",function(){
    
    if(!is_message_saved){
      displayModal('ERROR !','Please save message first');
      return;
    }

    if($('#entity-value').val()=='Nothing selected'){
      displayModal('ERROR !','Please, select a text to annotate first');
      return;
    }

    selected_entity.entity=$.trim($('#entity-name').val());

    //empty entity name
    if(selected_entity.entity.length==0){
      displayModal('ERROR !','No Entity name specified');
      return ;
    }    

    if (regexp.test(selected_entity.entity)){
      displayModal('ERROR !','Only alphabets and underscore characters are accepted.');
      return ;
    }

    //for of for iterating over array
    for(var entity of selected_entity_list){
      if (entity.value==selected_entity.value){
        displayModal('ERROR !','The Entity has been already annotated.');
        return;
      }
      if (entity.entity==selected_entity.entity){
        displayModal('ERROR !','Entity Name already selected.');
        return;
      }
    }
    
    selected_entity_list.push(selected_entity);

    render_review_summary();
    
    var list_item=`<li class="list-group-item d-flex justify-content-between align-items-center" data-entity-name="`+selected_entity.entity+`">
                  '`+$('#entity-value').val()+`' As <b>'`+selected_entity.entity+`'</b>
                    <span class="fas fa-spinner fa-times"></span>
                  </li>`;
      $('#div-entity-list ul').prepend(list_item);

    
  });

  //function for removing the entity name from the entity list 
  $(document).on("click","#div-entity-list span",function(){
    var to_remove=$(this).parent().attr('data-entity-name');
    selected_entity_list=selected_entity_list.filter(entity=>{
      if(entity.entity!=to_remove){
        return true;
      }
      else{
        return false;
      }
    });

    render_review_summary();
    $(this).parent().remove();
  });

 //calling conversation loader method with the conversation id of first conversation item
 conversation_id=$('#conversation_list li').first().attr('id');
 $('.conversation-item:first').addClass('active');
 load_aConversation(conversation_id);

 format_all_datetime();

});