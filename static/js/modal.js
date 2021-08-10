export function displayModal(error_name,error_message){
    $('.modal-title').text(error_name);
    $('.modal-body p').html(error_message);
    $('#mainmodal').modal();
}

export function displayReviewConversaitonModal(){
    $('.modal-title').text('Confirm Review Action');
    $('.modal-body p').html(`Once message is reviewed it can not be undone. You will still be able to make future reviewes on the same messages.
    <br><br>Are you sure you want to submit this review?
    `);
    $('.modal-footer button').show();
    $('.modal-footer button:eq(0)').hide();
    $('#mainmodal').modal();
    
    //this event call is necessary to hide those two buttons and show the default close button 
    $('#mainmodal').on('hidden.bs.modal', function (e) {
        $('.modal-footer button').hide();
    $('.modal-footer button:eq(0)').show();
      })
}