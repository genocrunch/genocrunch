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

// FIGURE DESCRIPTION
function showDescription() {
  document.getElementById("sidebar").style.cssText="width:40vw;overflow:auto;padding-left:10px;padding-right:10px;";
  document.getElementById("description").style.cssText="visibility:visible;opacity:1;";
  $("#sidebar")[0].style["height"]=$("#figure-container").height()+'px';
  document.getElementById("sidebar-icon").style.cssText="transform:rotate(180deg)";
};

function hideDescription() {
  document.getElementById("sidebar").style.cssText="width:20px;overflow:hidden;padding-left:2px;padding-right:2px;";
  document.getElementById("description").style.cssText="opacity:0;visibility:hidden;";
  $("#sidebar")[0].style["height"]=$("#figure-container").height()+'px';
  document.getElementById("sidebar-icon").style.cssText="transform:rotate(0deg)";
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

