import {displayModal} from './modal.js'
//requires moment.js CDN link to be inserted on base.html page


export var date_object={
    initial_date:undefined,
    final_date:undefined,
    today_date:moment().format('YYYY-MM-DD'),

    setInitialDate: function(date){
        this.initial_date=date;  
    },
    setFinalDate: function(date){
        this.final_date=date;  
    },

    clearBothDates:function(){
        this.initial_date=undefined;
        this.final_date=undefined;
    },

    checkDatesConsistency:function(){
    
        if(this.initial_date==undefined || this.final_date==undefined){
            if(this.initial_date!=undefined){
                if(moment(this.initial_date).isAfter(this.today_date)){
                    displayModal('ERROR !','Initial date is a Future Date ');
                }
            }else if(this.final_date!=undefined){
                if(moment(this.final_date).isAfter(this.today_date)){
                    displayModal('ERROR !','Final date is a Future Date ');
                }
            }
            return false;
        }
        else if (moment(this.initial_date).isAfter(this.today_date)){
            displayModal('ERROR !','Initial date is the future date');
            claerDisplayDiv();
            return false;
        }
        else if (moment(this.final_date).isAfter(this.today_date)){
            displayModal('ERROR !','Final date is the future date');
            claerDisplayDiv();
            return false;
        }
        else if (moment(this.initial_date).isAfter(this.final_date)){
                displayModal('ERROR !','The initial Date is after the final date');
                claerDisplayDiv();
                return false;
        }
        else if (moment(this.final_date).isBefore(this.initial_date)){
            displayModal('ERROR !','The final date is ahead of the initial date');
            claerDisplayDiv();
            return false;
        }
        else {
            showDisplayDiv(this.initial_date,this.final_date);
            return true;
    }
}
}


function claerDisplayDiv(){
    $('#div-notice').empty();
}

function showDisplayDiv(initial_date,final_date){
    var displayMessage=`Showing conversations between <b>${initial_date}</b> and <b>${final_date}</b>`; 
    $('#div-notice').html(displayMessage);
}

export function formatTimeStamp(timestamp){
    return moment.unix(timestamp).format('Y-MM-D');
}

export function calculateActiveAgo(timestamp){
    return moment.unix(timestamp).fromNow();
}

export function formatTimeStamp_LL(timestamp){
    return moment.unix(timestamp).format('LL');
}