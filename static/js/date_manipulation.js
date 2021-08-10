import {displayModal} from './modal.js'
//requires moment.js CDN link to be inserted on base.html page

export var date_object={
    initial_date:undefined,
    final_date:undefined,
    today_date:moment().format('YYYY-MM-DD'),

    setInitialDate: function(date){
        this.initial_date=date;  
    },

    setFinalDate:function(date){
        this.final_date=date;
    },

    checkDatesConsistency:function(){

    
        if(this.initial_date==undefined){
            return;
        }
        else if(this.final_date==undefined){
            return;
        }
        else if (moment(this.initial_date).isAfter(this.today_date)){
            displayModal('ERROR !','Initial date is the future date');
            return false;
        }
        else if (moment(this.final_date).isAfter(this.today_date)){
            displayModal('ERROR !','Final date is the future date');
            return false;
        }
        else if (moment(this.final_date).isBefore(this.today_date) && 
                moment(this.initial_date).isBefore(this.today_date) &&
                moment(this.initial_date).isAfter(this.final_date)){
                displayModal('ERROR !','Final date is ahead of initial date');
                return false;
        }

    }
}