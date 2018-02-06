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

function displayFigure(divid, type, id, figures, url, Rfunctions, demo) {

  document.getElementById(divid).innerHTML='';
  var index = 0;
  if (document.getElementById("select_level") != null) {
    index = levels.indexOf($("#select_level").val());
  };

  if (demo) {
    fig = "/demos/"+id+"/serve?file="+figures[indexes[index]]['url']+"&type=pdf",
    fig_data = "/demos/"+id+"/serve?file="+data[indexes[index]]['url']+"&type=file";
  } else {
    //fig = "/jobs/"+id+"/serve?file="+figures[indexes[index]]['url']+"&type=pdf",
    fig_data = "/jobs/"+id+"/serve?file="+data[indexes[index]]['url']+"&type=file";
  };

  //document.getElementById('pdf-link').setAttribute('href', fig);
  document.getElementById('data-link').setAttribute('href', fig_data);

  var W = 600,
      H = 600,
      font_family = "verdana, arial, helvetica, sans-serif";

  if (type == 'pdf') {
    document.getElementById(divid).setAttribute('data', fig);
  } else if (type == 'clustering') {
    overview(divid, fig_data);
  } else if (type == 'abundance') {
    barchart(divid, fig_data, W, H, font_family, d3.schemeCategory20c);
  } else if (type == 'diversity') {
    diversity(divid, fig_data, Rfunctions.diversity, W, H, font_family, d3.schemeCategory10);
  } else if (type == 'adonis') {
    pieChart(divid, fig_data, W, H, font_family, d3.schemeCategory20c);
  } else if (type == 'pca') {
    pca(divid, fig_data, W, H, font_family, d3.schemeCategory10);
  } else if (type == 'pcoa') {
    pcoa(divid, fig_data, W, H, font_family, d3.schemeCategory10);
  } else if (type == 'change') {
    foldChange(divid, fig_data, W, H, font_family);
  } else if (type == 'heatmap') {
    heatMap(divid, fig_data, 750, 750, font_family);
  } else if (type == 'correlationNetwork') {
    correlationNetwork(divid, fig_data, W, H, font_family, d3.schemeCategory10);
  } else if (type == 'similarityNetwork') {
    similarityNetwork(divid, fig_data, W, H, font_family, d3.schemeCategory10);
  };
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

