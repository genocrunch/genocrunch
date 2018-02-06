function adonisPieChart(id, legend_id, json, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif") {
  // Size
  var margin = {top: 10, right: 100, bottom: 10, left: 100},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom,
      radius = Math.min(width, height)/2,
      thickness = 0.4*radius,
      label_padding = 10;

  // Colors
  var colors = {pos:"#FF0039",
                neutral:"#666666"},
      signThres = [{value:0.001, opacity:0.9, text:'***'},
                   {value:0.01, opacity:0.7, text:'**'},
                   {value:0.05, opacity:0.5, text:'*'},
                   {value:1, opacity:0.1, text:'ns'},
                   {value:'NA', opacity:0.3, text:'na'}];

  // General functions
	  function getMidAngle(d){
		  return d.startAngle + (d.endAngle - d.startAngle)/2;
	  };

	  function defineLabelTextAnchor(d, t){
      if (getMidAngle(d) < Math.PI) {
        if (t == "out") {
          return "start";
        } else {
          return "end";
        };
      } else {
        if (t == "out") {
          return "end";
        } else {
          return "start";
        };
      };
	  };

  // Buttons
  var buttons = d3.select("#d3-buttons")
  buttons.html("");

  //$.getJSON(data, function(json) {


    //////////////// Draw the figure ////////////////
    var legendContainer = d3.select("#"+legend_id).append("div")
      .attr('class', 'columns-1')

    var svgContainer = d3.select("#"+id)
      .style("height", (height + margin.top + margin.bottom)+"px")

    var svg = svgContainer.append("svg")
      .attr("id", "svg-figure")
      .attr("class", "svg-figure")
      .attr("width", (width + margin.left + margin.right)+"px")
      .attr("height",(height + margin.top + margin.bottom)+"px")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Figure title
	  svg.append("text")
		  .attr("x", width/2)
		  .attr("y", 20)
      .style("text-anchor", "middle")
      .attr("font-family", font_family)
		  .text("Explained variance by factor");

    // Draw pie chart
    var pie = svg.selectAll(),
        pieSlice = pie.selectAll(".arc");

    // Add info at center
    var centralInfo = svg.append("text")
      .attr("id", "central-info")
		  .attr("x", width/2)
		  .attr("y", height/2)
      .style("text-anchor", "middle")
      .attr("font-family", font_family)
		  .text(""); 

    // Add legend
    var legend = legendContainer.append("div")
      .attr("id", "svg-legend")
      .style("font-family", font_family)


    var legend_svg_symsize = 18,
        legend_svg_height = legend_svg_symsize*signThres.length;

    legend.append('p')
      .html('Color key')

    var colorLegend = legend.append("svg")
      .attr("width", '100%')
      .attr("height", legend_svg_height+'px')
      .style("overflow", "visible")
      .selectAll()
      .data(signThres)
        .enter().append('g')
        .attr("transform", function(d, i){return "translate(0,"+(i*legend_svg_height/signThres.length)+")";})

      colorLegend.append("text")
          .attr("x", legend_svg_symsize+2)
          .attr("y", legend_svg_symsize)
          .text(function(d, i){
            if(isNaN(d.value)) {
              return signThres[i]["text"];
            }
            if (d.value == 1) {
              return 'p>0.05'+'('+signThres[i]["text"]+')';
            }
            return 'p<'+d.value+'('+signThres[i]["text"]+')';
          })

        colorLegend.append("rect")
          .attr("width", legend_svg_symsize)
          .attr("height", legend_svg_symsize)
          .attr("stroke", "none")
          .attr("fill", function (d, i){
            if (isNaN(signThres[i]["value"])) {
              return colors.neutral;
            };
            return colors.pos;
          })
          .attr("fill-opacity", function(d, i){return signThres[i]["opacity"];})

    legend.append("span")
      .attr('class', 'btn-sep')

    legend.append('p')
      .html('Factors')

    var dataLegend = legend.append("ul")
      .style("list-style-type", "none")
      .selectAll("ul");




    //////////////// Restart function ////////////////
    var restart = function() {

      var selected_model = d3.select("#modelSelect").property("value");

      pie = pie.data([]);
      pie.exit().remove();

      pie = pie
        .data([json[selected_model]])
        .enter().append("g")
        .attr("transform", "translate("+[width/2, height/2]+")")

      pieSlice = pieSlice.data([]);
      pieSlice.exit().remove();

      pieSlice = pie.selectAll(".arc")
        .data(d3.pie(json[selected_model])
          .sort(null)
          .value(function(d) {return d.explained;}))
        .enter().append("g")
          .classed("arc", true)
          .attr("selected", 0)

      // Draw slices
      pieSlice.append("path")
        .attr("d", d3.arc()
          .outerRadius(radius)
          .innerRadius(radius-thickness)
          .cornerRadius(3)
          .padAngle(0.02))
        .attr("id", function(d, i){ return "piece-"+i;})
        .attr("fill", function(d){
          if (isNaN(d.data['p-value'])) {
            return colors['neutral'];
          }
          return colors['pos'];
        })
        .attr("fill-opacity", function(d){
          return signThres.filter(function(e){
            if (isNaN(d.data['p-value'])) {
              return e.value == 'NA';
            }
            return d.data['p-value'] <= e.value;
          })[0].opacity;
        })
        .attr("stroke-width", "2px")
        .attr("stroke", "gray");

      // Add labels
	    pieSlice.append("text")
		    .attr("x", function(d) { return Math.sin(getMidAngle(d))*(radius+label_padding);})
		    .attr("y", function(d) { return -Math.cos(getMidAngle(d))*(radius+label_padding);})
        .style("text-anchor", function (d) {return defineLabelTextAnchor(d, "out");})
        .style("font-size", "10px")
        .attr("font-family", font_family)
		    .text(function(d) { return d.data.name;})
        .attr("display", "none")

      showLabels();
      displayLabels("arc");

      // Update legend

      dataLegend = dataLegend.data([]);
      dataLegend.exit().remove();

      dataLegend = dataLegend
        .data(json[selected_model])
        .enter().append("li")
        .attr("id", function(d) { return d.name;})
        .attr("class", "legend")
        .attr("selected", 0)
        .attr("title", function(d) { return d.name;})
        .html(function(d) {
          var sig = signThres.filter(function(e){
            if (isNaN(d['p-value'])) {
              return e.value == 'NA';
            }
            return d['p-value'] <= e.value;
          })[0].text;

          return d.name+" ("+Number(d.explained*100).toFixed(1)+"%"+")"+sig;
        })


      legendAction("legend");

    };


    //////////////// Control buttons ////////////////

    // Display labels button
    var showLabels = function() {
      var labels = d3.selectAll(".arc").select(function(){return this.childNodes[1];});
      if ($("#labelButton").is(':checked')) {
        labels.attr("display", "inline");
        labels.attr("selected", 1);
      } else {
        labels.attr("display", "none");
        labels.attr("selected", 0);
      };
    };

    appendLabelCheckBox(buttons, "Show labels", "Labels", "labelButton", showLabels)
    $("#labelButton").attr("checked", true)

    // Select model
    var modelSelect = buttons.append("div")
      .attr("title", "Select a model.")
      .attr("class", "form-group")

    modelSelect.append("label")
      .html("Model")

    modelSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "modelSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .on("change", restart)
        .selectAll("option")
        .data(Object.keys(json))
        .enter().append("option")
          .text(function (d){ return d;});

    document.getElementById("modelSelect").value = Object.keys(json)[0];



    setMultiselect('.figtool-multiselect');
    //resizeMultiselect('#d3-buttons', 1, '#d3-buttons', false);
    $("#modelSelect").on("change", restart)

    restart();

    // Labels functions
    function displayLabels (id) {
        $("."+id).on("mouseenter", function(d) {
          var data = this.__data__.data;
          d3.select(this.childNodes[1]).attr("display", "inline");
          d3.select(this.childNodes[0]).attr("stroke-width", 4);
          $("#central-info").text(Number(data.explained*100).toFixed(1)+"%");
          d3.selectAll(".legend").filter(function(){ return this.getAttribute("id") == data.name;}).style("background-color", "#ffcce0");
        });
        $("."+id).on("mouseleave", function(d) {
          var data = this.__data__.data;
          d3.select(this.childNodes[1]).filter(function(){return this.getAttribute("selected") == 0}).attr("display", "none");
          d3.select(this.childNodes[0]).attr("stroke-width", 2);
          d3.selectAll(".legend").filter(function(){ return (this.getAttribute("selected") == 0) && (this.getAttribute("id") == data.name);}).style("background-color", "rgba(0, 0, 0, 0)");
          $("#central-info").text("");
        });
        $("."+id).on("click", function(d) {
          var data = this.__data__.data;
          if (this.childNodes[1].getAttribute("selected") == 0) {    
            d3.select(this.childNodes[1]).attr("display", "inline");
            d3.select(this.childNodes[1]).attr("selected", 1);
            d3.selectAll(".legend").filter(function(){ return this.getAttribute("id") == data.name;}).attr("selected", 1)
          } else {
            d3.select(this.childNodes[1]).attr("display", "none");
            d3.select(this.childNodes[1]).attr("selected", 0);
            d3.selectAll(".legend").filter(function(){return this.getAttribute("id") == data.name;}).attr("selected", 0)
          }
        });
      };

    function legendAction (id) {
        $("."+id).on("mouseenter", function(d) {
          var name = this.getAttribute("id"),
              label = d3.selectAll(".arc").filter(function(){return this.__data__.data.name == name;});
          d3.select(this).style("background-color", "#ffcce0");
          label.select(function(){ return this.childNodes[1];}).attr("display", "inline");
          label.select(function(){
            $("#central-info").text(Number(this.__data__.data.explained*100).toFixed(1)+"%")
          });
        });
        $("."+id).on("mouseleave", function(d) {
          var name = this.getAttribute("id"),
              label = d3.selectAll(".arc").filter(function(){return this.__data__.data.name == name;}).select(function(){ return this.childNodes[1];}).filter(function(){return this.getAttribute("selected") == 0});
          d3.select(this).filter(function(){return this.getAttribute("selected") == 0}).style("background-color", "rgba(0, 0, 0, 0)");
          label.attr("display", "none");
          $("#central-info").text("");
        });
        $("."+id).on("click", function(d) {
          var name = this.getAttribute("id"),
              label = d3.selectAll(".arc").filter(function(){return this.__data__.data.name == name;}).select(function(){ return this.childNodes[1];});
          if (this.getAttribute("selected") == 0) {
            d3.select(this).attr("selected", 1);
            label.attr("selected", 1);
          } else {
            d3.select(this).attr("selected", 0);
            label.attr("selected", 0);
          }
        });
      };

  //});
};

