import{formatTimeStamp,calculateActiveAgo} from './date_manipulation.js';
export function format_all_datetime(){
    $('#conversation_list li').each(function(){
        if(
          $(this).find('.date-started').text()!=null || 
          $(this).find('.date-started').text()!='' || 
          parseFloat($(this).find('.date-started').text())!=NaN){
         $(this).find('.date-started').text(formatTimeStamp(parseFloat($(this).find('.date-started').text())));
        }
        if(
         $(this).find('.active-ago').text()!=null || 
         $(this).find('.active-ago').text()!='' || 
         parseFloat($(this).find('.active-ago').text())!=NaN){
        $(this).find('.active-ago').text(calculateActiveAgo(parseFloat($(this).find('.active-ago').text())));
       }
      });
}