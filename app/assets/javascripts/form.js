function update_bin_levels(col_name, val, url){
    var ori_filename = $("#p2_primary_dataset").val();
    getColumn("bin_levels", $("#p_primary_dataset")[0].files[0], col_name, val, url);
}

function populate_multiselect(id, new_data, value, url){
    $('#p_'+id).multiselect('enable')
        .multiselect('dataprovider', new_data);
    if(value) {
      $('#p_'+id).multiselect('select', value);
    }
    $('#p_'+id).multiselect("refresh");
    
    $('#p_'+id+'-container').removeClass("hidden");
    $('#p_'+id+'-placeholder').addClass("hidden");

    if (id == 'category_column'){
      var val = $("#default_bin_levels").val()
      	
      var new_url = (url) ? ($("#url_read_file_column").val() + "?file_key=primary_dataset") : null;
      update_bin_levels($("#p_category_column").val(), JSON.parse(val), new_url); 
    } 

}

function getColumn(id, file, col_name, value, url) {
    
    if (!url){

	var reader = new FileReader;
	reader.onload = function (event) {
            var lines = event.target.result.split(/\r\n|\r|\n/g);
            
	    var i = 0;
            for (var i = 0; i < (lines.length-1); i++) {
		if (lines[i].charAt(0) != '#')
                    break;
            }
            i = (i > 1) ? i-1 : 0;
	    
	    var header = lines[i].split("\t")
	    var col_index = header.indexOf(col_name);
                col_index = (col_index != -1) ? col_index : 0;
	    var max_val = Math.max.apply(null, lines.slice(i+1, lines.length-1).map(e => {return e.split("\t")[col_index].split(";").length;}));
	    if (max_val > 0){
		var new_data=[...Array(max_val)];
		for (var j=0 ; j < new_data.length; j++) {
		  new_data[j] = {label: j+1, value: j+1};
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
              new_data = JSON.parse(new_data)
              populate_multiselect(id, new_data.slice(0, new_data.length-1), value, url)
            },
            error: function(e){
            }
        });
    }
};

function setCategoryColumn(id, file, value = 0, add_blank = null, url = null) {
    
    var new_data = [];

    if (!url){

	var reader = new FileReader;
	reader.onload = function (event) {
	    var lines = event.target.result.split(/\r\n|\r|\n/g);
	
	    var i = 0;
	    for (i = 0; i < (lines.length-1); i++) {
		if (lines[i].charAt(0) != '#')
		    break;
	    }
	    i = (i > 0) ? i-1 : 0;
	    
	    var content = lines[i].split("\t")
	    
            new_data = [{label:([' ', ''].indexOf(content[0]) == -1) ? 'first column ('+content[0]+')': 'first column', value:content[0]},
                        {label:([' ', ''].indexOf(content[content.length-1]) == -1) ? 'last column ('+content[content.length-1]+')': 'last column', value:content[content.length-1]}];
	    populate_multiselect(id, new_data, value, url)
	};
	reader.readAsText(file);
    }else{
	$.ajax({
	    url: url + ((add_blank == null) ? '' : '&add_blank=1'),
	    type: "get",
	    dataType: "html",
	    beforeSend: function(){
	    },
	    success: function(content){
            content = JSON.parse(content)
            new_data = [{label:([' ', ''].indexOf(content[0]["label"]) == -1) ? 'first column ('+content[0]["label"]+')': 'first column', value:content[0]["value"]},
                        {label:([' ', ''].indexOf(content[content.length-1]["label"]) == -1) ? 'last column ('+content[content.length-1]["label"]+')': 'last column', value:content[content.length-1]["value"]}];

		populate_multiselect(id, new_data, value, url)
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
	
	    var i = 0;
	    for (i = 0; i < (lines.length-1); i++) {
		if (lines[i].charAt(0) != '#')
		    break;
	    }
	    i = (i > 0) ? i-1 : 0;
	    
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
	    url: url + ((add_blank == null) ? '' : '&add_blank=1'),
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
