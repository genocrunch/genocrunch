function update_bin_levels(col_name, val, url){
    val = (val) ? val : [1]
//    alert("toto: " + $("#p_primary_dataset").val() + "url:" + url);
    var ori_filename = $("#p2_primary_dataset").val();
    getColumn("bin_levels", $("#p_primary_dataset")[0].files[0], col_name, val, url);
}

function populate_multiselect(id, new_data, value, url){
   // alert("set " + id + " : " + value + " all : " + new_data.length)
    $('#p_'+id).multiselect('enable')
        .multiselect('dataprovider', new_data)
        .multiselect('select', value)
        .multiselect("refresh");
    
    $('#field-'+id).removeClass("hidden");

    if (id == 'category_column'){
      var val = $("#default_bin_levels").val()
      	
//      alert("value url: " + url);
      var new_url = (url) ? ($("#url_read_file_column").val() + "?file_key=primary_dataset") : null;
      update_bin_levels($("#p_category_column").val(), JSON.parse(val), new_url); 
	//"http://genocrunch.epfl.ch/jobs/read_file_column")
    } 

}

function getColumn(id, file, col_name, value, url) {
    
    var new_data = [];

    if (!url){

	var reader = new FileReader;
	reader.onload = function (event) {
            var lines = event.target.result.split(/\r\n|\r|\n/g);
            
	    var i=0;
            for (var i = 0; i < (lines.length-1); i++) {
		if (lines[i].charAt(0) != '#')
                    break;
            }
            i = (i > 1) ? i-1 : 0;
	    
	    var header_els = lines[i].trim().split("\t")
	    
	    var pos_col = 0
	    for (var k = 0; k<header_els.length; k++){
		if (header_els[k] == col_name){
		    pos_col = k;
		    break;
		}
	    }
	    max_val=0
	    for (var j = i; j < (lines.length-1); j++){
		t = lines[j].split("\t")
		n = t[pos_col].split(";").length
		if  (n > max_val){
		    max_val = n
		}
	    }
	    
	    if (max_val > 0){
		
		var new_data=[];
		for (var j=1 ; j < max_val+1; j++) {
		    new_data.push({label: j, value: j});
		}
		
		populate_multiselect(id, new_data, value, url)
		
	    }
	};
	//    console.log(file);
	reader.readAsText(file);

    }else{
	  $.ajax({
            url: url + "&col_name=" + col_name,
            type: "get",
            dataType: "html",
            beforeSend: function(){
            },
            success: function(new_data){		
                populate_multiselect(id, JSON.parse(new_data), value, url)
            },
            error: function(e){
            }
        });
    }
};

function setSelectFromFileRow(id, file, value = 0, add_blank = null, url = null) {
    
    var new_data = [];

    if (!url){

	var reader = new FileReader;
	reader.onload = function (event) {
	    var lines = event.target.result.split(/\r\n|\r|\n/g);
	
	    var i=0
	    for (i = 0; i < (lines.length-1); i++) {
		if (lines[i].charAt(0) != '#')
		    break;
	    }
	    i = (i > 1) ? i-1 : 0;
	    
	    var content = lines[i].split("\t")
	    
	    if (add_blank)
		new_data.push({label:"", value:""});
	    
	    if (content.length > 0){
		for (var i in content) {
		    new_data.push({label:content[i], value:content[i]});
		};
	    }
	    populate_multiselect(id, new_data, value, url)
	};
	reader.readAsText(file);
    }else{
	$.ajax({
	    url: url + "&add_blank=" + ((add_blank == null) ? '' : '1'),
	    type: "get",
	    dataType: "html",
	    beforeSend: function(){
	    },
	    success: function(new_data){
		populate_multiselect(id, JSON.parse(new_data), value, url)
	    },
	    error: function(e){
	    }
	});
	
    }
};


// Transform a select input into a nice multiselect field
function setMultiselect(id, nonSelectedText = 'Select', where){
  $(id).multiselect({
      includeSelectAllOption: false, // Would append a value currently not supported by genocrunch_console
      nonSelectedText: nonSelectedText,
      numberDisplayed: 1,
      maxHeight: 150,
      buttonClass: 'btn btn-secondary',
      templates: {
      li: '<li><a tabindex="0" class="dropdown-item"><label></label></a></li>',
    }
  });
    $(id + ".form-control").addClass('hidden');
}


function fold_section(fold_bar_class) {    
    $(fold_bar_class).click(function(){
	var e = $(this).parent().parent().parent().parent().parent().children().filter(".card-block").first(); //(".field_group_content").first();
	var angle =  (e.hasClass('hidden')) ? 180 : 0;
	$(this).filter("i.fa-chevron-down").css({transform:'rotate(' + angle + 'deg)'});
	e.toggleClass('hidden');
    });
};
