//this array holds the objects that contain navitem ID and row ID represented by
//those those nav item
export const navigation_items_array=[
    { nav_id:'unreviewed', row_id: 'unreviewed-conversations'},
    { nav_id: 'reviewed', row_id: 'reviewed-conversations'},
    { nav_id: 'history', row_id: 'review-history'}
];


export function nav_item_click_handler(id,navigation_items_array){

    $('.nav-link').removeClass('active');
    $('#'+id).addClass('active');

    //this loop is for hiding the rows with ids defined in navigation_items_array
    navigation_items_array.forEach(element => {
            $('#'+element.row_id).hide();
    });

    //this while loop is for showing only the row id for the nav item being clicked
    var flag=true,counter=0;
    while(flag){
        if(navigation_items_array[counter].nav_id==id){
            $('#'+navigation_items_array[counter].row_id).fadeIn('slow');
            flag=false;
        }
        counter++;
    }
}