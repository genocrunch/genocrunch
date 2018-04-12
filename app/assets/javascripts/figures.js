function exportFigure(id, format, filename) {

  var svgData = d3.select(id).node().outerHTML,
      type = 'txt';
  if (format == "svg") {
    type = 'image/svg+xml';
  } else if (format == "html") {
    type = 'html';
  };

  var svgBlob= new Blob([svgData], {type: type}),
      link = document.createElement('a'),
      event = new MouseEvent('click');

  link.href = window.URL.createObjectURL(svgBlob);
  link.download = filename+'.'+format;
  link.dataset.downloadurl =  [type, link.download, link.href].join(':');
  link.dispatchEvent(event);

};

// FIGURE BUTTONS/CONTROLS
function appendRange(appendTo, title, label, id, min, max, value, onchange) {

  var range = appendTo.append("div")
    .attr("title", title)
    .attr("class", "form-group")

  range.append("label")
    .html(label)

  range.append("input")
    .attr('class', 'full-width')
    .attr("id", id)
    .attr("type", "range")
    .attr("min", min)
    .attr("max", max)
    .attr("value", value)
    .on("change", onchange);
}

function appendLabelCheckBox(appendTo, title, label, id, onclick) {

  var labelCheckBox = appendTo.append("div")
      .attr("title", title)
      .attr("class", "form-bool")
      .append("label")

    labelCheckBox.append("input")
      .attr("id", id)
      .attr('class', 'form-check-input')
      .attr("type", "checkbox")
      .on("click", onclick);

    labelCheckBox.append("p")
      .html(label);
}

function appendSearchInput(appendTo, title, id, onclick) {

    var searchInput = appendTo.append("div")
      .attr("title", title)
      .attr("class", "form-group has-feedback")

    searchInput.append("label")
      .attr("class", "control-label sr-only")

    searchInput.append("input")
      .attr("id", id)
      .attr("type", "text")
      .attr("class", "form-control")
      .attr("placeholder", "Search")
      .on("keyup", onclick);

    //searchInput.append("i")
    //  .attr("class", "form-control-feedback fa fa-search")
}

  function searchLabels1(button, input, labels) {
      $(button).attr("checked", false);
      var key = $(input).val().toUpperCase().split(' AND ');
      if (key != '') {
        var selected = d3.selectAll(labels).filter(function(d){
              var matches=false;
              for (var i=0;i<key.length;i++) {
                if (d.toUpperCase().indexOf(key[i]) != -1) {
                  matches=true;
                  break;
                }
              }
              return matches;
            }).filter(function(d){return this.getAttribute('filtered') == 'false' }),
            non_selected = d3.selectAll(labels).filter(function(d){
              var matches=true;
              for (var i=0;i<key.length;i++) {
                if (d.toUpperCase().indexOf(key[i]) != -1) {
                  matches=false;
                  break;
                }
              }
              return matches;
            });
        selected.attr("display", "inline");
        selected.attr("selected", 'true');
        non_selected.attr("display", "none");
        non_selected.attr("selected", 'false');
      } else {
        to_free = d3.selectAll(labels);
        to_free.attr("display", "none");
        to_free.attr("selected", 'false');
      };
    };

function searchLabels2(button, input, labels) {
      $(button).attr("checked", false);
      var key = $(input).val().toUpperCase().split(' AND ');
      if (key != '') {
        var selected = d3.selectAll(labels).filter(function(){
              var matches=false;
              for (var i=0;i<key.length;i++) {
                if (this.__data__.name.toUpperCase().indexOf(key[i]) != -1) {
                  matches=true;
                  break;
                }
              }
              return matches;
            }).select(function(){return this.childNodes[1];}),
            non_selected = d3.selectAll(labels).filter(function(){
              var matches=true;
              for (var i=0;i<key.length;i++) {
                if (this.__data__.name.toUpperCase().indexOf(key[i]) != -1) {
                  matches=false;
                  break;
                }
              }
              return matches;
            }).select(function(){return this.childNodes[1];});
        selected.attr("display", "inline");
        selected.attr("selected", 'true');
        non_selected.attr("display", "none");
        non_selected.attr("selected", 'false');
      } else {
        to_free = d3.selectAll(labels).select(function(){return this.childNodes[1];});
        to_free.attr("display", "none");
        to_free.attr("selected", 'false');
      };
    };
    
