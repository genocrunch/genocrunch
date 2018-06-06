function pcoa(id, legend_id, json, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif", color_palette = d3.schemeCategory10) {

  // Size
  var margin = {top: 10, right: 10, bottom: 75, left: 75},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom,
      left_label_space = 35,
      bottom_label_space = 30;

  // Colors and symbols
  var colors = d3.scaleOrdinal(color_palette),
      symbols = d3.scaleOrdinal([d3.symbolCircle,
        d3.symbolSquare,
        d3.symbolTriangle,
        d3.symbolStar,
        d3.symbolDiamond,
        d3.symbolCross]);

  // Buttons
  var buttons = d3.select("#d3-buttons");
  buttons.html("");

//  $.getJSON(data, function(json) {

    // Set variables depending only on the primary data
    var color_select_options = [],
        data_keys = Object.keys(json.data[0]),
        axisValues = Object.keys(json.data[0].data);

    for ( var i = 0; i < data_keys.length; i++) {
      if (["data", "id"].indexOf(data_keys[i]) == -1) {
        color_select_options.push(data_keys[i]);
      };
    };

    //////////////// Draw the figure ////////////////
    var legendContainer = d3.select("#"+legend_id)
      .classed('columns-1', true)

    var svg = d3.select("#"+id).append("svg")
      .attr("id", "svg-figure")
      .attr("class", "svg-figure")
      .attr("width", (width + margin.left + margin.right)+"px")
      .attr("height",(height + margin.top + margin.bottom)+"px")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Draw plot
    var plot = svg.selectAll();

    // Add plot labels
    var plotLabel = svg.selectAll();

    // Draw axis
    var xAxis = svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")");

    var xAxisLegend = svg.append("g")
      .attr("transform", "translate("+ width/2 +", "+ (height+bottom_label_space) +")")
      .attr("class", "axis-label");

    var yAxis = svg.append("g")
      .attr("class", "axis");

    var yAxisLegend = svg.append("g")
      .attr("transform", "translate("+ -left_label_space +", "+ height/2 +")")
      .attr("class", "axis-label");

    // Add legend
    var legend = legendContainer.append("ul")
      .attr("id", "svg-legend")
      .style("list-style-type", "none")
      .style("padding", 0)
      .style("font-family", font_family)

    var colorLegend = legend.append("li")
        .style("padding-bottom", "1rem")
        .attr("title", "Color key")

    colorLegend.append("p").append("b")
        .html("Color key")

    var colorLegendList = colorLegend.append("div")

    colorLegendList.append("span").attr("id", "colorlegend-subtitle")

    colorLegendList = colorLegendList.append("ul")
        .style("list-style-type", "none")
        .style("padding", 0)
        .selectAll("ul")

    var symLegend = legend.append("li")
        .style("border-top", "1px solid #ccc")
        .style("padding-top", "1rem")
        .style("padding-bottom", "1rem")
        .attr("title", "Symbol key")

    symLegend.append("p").append("b")
        .html("Symbol key")

    var symLegendList = symLegend.append("div")

    symLegendList.append("span").attr("id", "symlegend-subtitle")

    symLegendList = symLegendList.append("ul")
        .style("list-style-type", "none")
        .style("padding", 0)
        .selectAll("ul")

    //////////////// Restart function ////////////////
    var restart = function() {

      // Set coordinates settings
      var X = $("#xSelect").val(),
          xValue = function(d) { return d.data[X];},
          x = json.data.map(function(d){return xValue(d);}),
          xMin = Math.min.apply(null, x),
          xMax = Math.max.apply(null, x),
          xPadding = [0.05, 0.03],
          xRange = xMax-xMin,
          xScale = d3.scaleLinear()
            .range([0, width])
            .domain([xMin-xPadding[0]*xRange, xMax+xPadding[1]*xRange]).nice(),
          xMap = function(d) { return xScale(xValue(d));},
          Y = $("#ySelect").val(),
          yValue = function(d) { return d.data[Y];},
          y = json.data.map(function(d){return yValue(d);});
          yMin = Math.min.apply(null, y),
          yMax = Math.max.apply(null, y),
          yPadding = [0.05, 0.03],
          yRange = yMax-yMin,
          yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([yMin-yPadding[0]*yRange, yMax+yPadding[1]*yRange]).nice()
          yMap = function(d) { return yScale(yValue(d));};


      // Set color settings
      var selected_color_factor = $("#colorSelect").val(),
          selected_symbol_factor = $("#symbolSelect").val(),
          color_factors = [],
          symbol_factors = [];

      json.data.forEach(function (d) {
        if (color_factors.indexOf(d[selected_color_factor]) == -1) {
          color_factors.push(d[selected_color_factor]);
        };
        if (symbol_factors.indexOf(d[selected_symbol_factor]) == -1) {
          symbol_factors.push(d[selected_symbol_factor]);
        };
      });

      colors.domain(color_factors);
      symbols.domain(symbol_factors);

      // Draw plot
      plot = plot.data([]);
      plot.exit().remove();

      plot = plot
        .data(json.data);

      // Draw dots
      plot = plot.enter()
        .append("g")
        .attr("class", "plot")
        .attr("transform", function (d) { return "translate(" + xMap(d) + ", " + yMap(d) + ")"; });

      plot.append("path")
        .attr("class", "symbol")
        .attr("d", d3.symbol()
          .type(function(d) { return symbols(d[selected_symbol_factor]);})
          .size(200))
        .style("fill", function(d) { return colors(d[selected_color_factor]);})
        .style("stroke-opacity", 0)
        .style("fill-opacity", 0.8);

      // Add labels
      plotLabel = plotLabel.data([]);
      plotLabel.exit().remove();

      plotLabel = plotLabel
        .data(json.data)
        .enter()
        .append("g")
        .attr("class", "plot-label")
        .attr("transform", function (d) { return "translate(" + xMap(d) + ", " + yMap(d) + ")"; });

      plotLabel.append("path")
        .attr("class", "symbol")
        .attr("d", d3.symbol()
          .type(function(d) { return symbols(d[selected_symbol_factor]);})
          .size(200))
        .style("opacity", 0)

      plotLabel.append("text")
        .attr("class", "plot-label")
        .attr("dy", -10)
        .style("text-anchor", function (d) {
          if (xMap(d) <= width/2) {
            return "start";
          } else {
            return "end";
          };
        })
        .attr("font-family", font_family)
        .attr("display", "none")
        .attr("selected", false)
        .text(function (d) {
          var label = d.name.split(";");
          if (label.length > 1) {
            return label[label.length-2] +";"+ label[label.length-1];
          } else {
            return label[0];
          };
        });

      displayLabels("plot-label");
      showLabels();

      // Add axis
      xAxis.selectAll("*").remove();
      xAxis.call(d3.axisBottom(xScale).ticks(10));

      xAxisLegend.selectAll("*").remove();
      xAxisLegend.append("text")
        .text(X+" ("+Math.round(json.eig[X])+"%)")
        .attr("font-family", font_family)
        .style("text-anchor", "middle");

      yAxis.selectAll("*").remove();
      yAxis.call(d3.axisLeft(yScale).ticks(10))

      yAxisLegend.selectAll("*").remove();
      yAxisLegend.append("text")
        .text(Y+" ("+Math.round(json.eig[Y])+"%)")
        .attr("font-family", font_family)
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90)");

      // Close the plot
      svg.selectAll(".frame").remove();
      svg.append("g")
        .attr("class", "frame")
        .attr("transform", "translate(0, 0)")
        .call(d3.axisTop(xScale).ticks(0)
        .tickSize(0, 0));

      svg.append("g")
        .attr("class", "frame")
        .attr("transform", "translate("+width+", 0)")
        .call(d3.axisRight(yScale).ticks(0)
        .tickSize(0, 0));

      svg.append("g")
        .attr("class", "frame")
        .attr("transform", "translate(0," + yScale(0) + ")")
        .call(d3.axisBottom(xScale).ticks(0)
        .tickSize(0, 0));

      svg.append("g")
        .attr("class", "frame")
        .attr("transform", "translate(" + xScale(0) + ", 0)")
        .call(d3.axisLeft(yScale).ticks(0)
        .tickSize(0, 0));


      // Update legend

      colorLegendList = colorLegendList.data([]);
      colorLegendList.exit().remove();

      colorLegendList = colorLegendList
        .data(color_factors)
        .enter().append("li")
        .style("word-wrap", "break-word")
        .attr("id", function(d) { return d;})
        .attr("title", function(d) { return d;})
        .attr("selected", 0)

      colorLegendList.append("svg")
        .style("margin-right", "1rem")
        .attr("width", "10px")
        .attr("height", "10px")
        .append("rect")
        .attr("width", "10px")
        .attr("height", "10px")
        .attr("fill", function(d) { return colors(d); })

      colorLegendList.append("span")
        .html(function(d) {return d;});

      $("#colorlegend-subtitle").html(selected_color_factor)

      symLegendList = symLegendList.data([]);
      symLegendList.exit().remove();

      symLegendList = symLegendList
        .data(symbol_factors)
        .enter().append("li")
        .style("word-wrap", "break-word")
        .attr("id", function(d) { return d;})
        .attr("title", function(d) { return d;})
        .attr("selected", 0)


      symLegendList.append("svg")
        .style("margin-right", "1rem")
        .attr("width", "10px")
        .attr("height", "10px")
        .style("overflow", "visible")
        .append("path")
        .attr("transform", "translate(5, 5)")
        .attr("d", d3.symbol()
          .type(function (d, i){
            return symbols(d);
          })
          .size(75))
        .attr("stroke", function (d, i){
          return "#333";
        })
        .attr("fill", function (d, i){
          return "#333";
        })
        .attr("fill-opacity", function (d, i){
          return 0;
        })

      symLegendList.append("span")
        .html(function(d) { return d;})

      $("#symlegend-subtitle").html(selected_symbol_factor)

    };

    //////////////// Control buttons ////////////////

    // Display labels button
    var showLabels = function() {
      var labels = d3.selectAll(".plot-label").select(function(){ return this.childNodes[1];});
      if ($("#labelButton").is(':checked')) {
        labels.attr("display", "inline");
        labels.attr("selected", true);
      } else {
        labels.attr("display", "none");
        labels.attr("selected", false);
      };
    };

    appendLabelCheckBox(buttons, "Show labels", "Labels", "labelButton", showLabels)

    // Search in labels
    var searchLabels = function() {
      searchLabels2("#labelButton", "#searchInput", ".plot-label")
    }
    appendSearchInput(buttons, "Search (multiple terms can be searched using the AND separator)", "searchInput", searchLabels);


    // Select axis
    var xSelect = buttons.append("div")
      .attr("title", "Chose X axis.")
      .attr("class", "form-group")

    xSelect.append("label")
      .html("X axis")

    xSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "xSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .on("change", restart)
        .selectAll("option")
        .data(axisValues)
        .enter().append("option")
          .text(function (d){ return d;});

    document.getElementById("xSelect").value = axisValues[0];

    var ySelect = buttons.append("div")
      .attr("title", "Chose Y axis.")
      .attr("class", "form-group")

    ySelect.append("label")
      .html("Y axis")

    ySelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "ySelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .on("change", restart)
        .selectAll("option")
        .data(axisValues)
        .enter().append("option")
          .text(function (d){ return d;});

    document.getElementById("ySelect").value = axisValues[1];

    // Select color variables
    var colorSelect = buttons.append("div")
      .attr("title", "Chose variable to use for colors.")
      .attr("class", "form-group")

    colorSelect.append("label")
      .html("Color")

    colorSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "colorSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .on("change", restart)
        .selectAll("option")
        .data(color_select_options)
        .enter().append("option")
          .text(function (d){ return d;});

    document.getElementById("colorSelect").value = color_select_options[color_select_options.length-1];

    // Select symbol variables
    var symbolSelect = buttons.append("div")
      .attr("title", "Chose variable to use for symbols.")
      .attr("class", "form-group")

    symbolSelect.append("label")
      .html("Symbol")

    symbolSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "symbolSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .on("change", restart)
        .selectAll("option")
        .data(color_select_options)
        .enter().append("option")
          .text(function (d){ return d;});

    document.getElementById("symbolSelect").value = color_select_options[color_select_options.length-1];


    setMultiselect('.figtool-multiselect');
    //resizeMultiselect('#d3-buttons', 1, '#d3-buttons', false);
    $("#xSelect").on("change", restart)
    $("#ySelect").on("change", restart)
    $("#colorSelect").on("change", restart)
    $("#symbolSelect").on("change", restart)

  restart();

    // Labels functions
        function displayLabels (id) {
          $("."+id).on("mouseenter", function(d) {
            d3.select(this.childNodes[1]).attr("display", "inline");
        });
        $("."+id).on("mouseleave", function(d) {
          if (this.childNodes[1].getAttribute("selected") == "false") {
            d3.select(this.childNodes[1]).attr("display", "none");
          };
        });
        $("."+id).on("click", function(d) {
          if (this.childNodes[1].getAttribute("selected") == "false") {    
            d3.select(this.childNodes[1]).attr("display", "inline");
            d3.select(this.childNodes[1]).attr("selected", true);
          } else {
            d3.select(this.childNodes[1]).attr("display", "none");
            d3.select(this.childNodes[1]).attr("selected", false);
          }
        });
      };
//  });

};
