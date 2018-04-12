function pca(id, legend_id, json, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif", color_palette = d3.schemeCategory10) {

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

 // $.getJSON(data, function(json) {

    // Set variables depending only on the primary data
    var color_select_options = [],
        json_keys = Object.keys(json[Object.keys(json)[0]][0]),
        axisValues = Object.keys(json[Object.keys(json)[0]][0].data),
        nArrowMax = json[Object.keys(json)[0]].length;
        //space_options = Object.keys(json);
        //space_options.splice(space_options.indexOf("eig"), 1);

    for ( var i = 0; i < json_keys.length; i++) {
      if (["data", "id"].indexOf(json_keys[i]) == -1) {
        color_select_options.push(json_keys[i]);
      };
    };

    //////////////// Draw plot ////////////////
    var legendContainer = d3.select("#"+legend_id).append("div")
      .attr('class', 'columns-2')

    var svgContainer = d3.select("#"+id)
      .style("height", (height + margin.top + margin.bottom)+"px")

    var svg = svgContainer.append("svg")
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

    // Draw bi-plot (arrows)
    var biPlot = svg.selectAll();

    // Add bi-plot labels
    var biPlotLabel = svg.selectAll();

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
    var legend = legendContainer.append("div")
      .attr("id", "svg-legend")
      .style("font-family", font_family)

    legend.append('p')
      .html('Color key')
    var colorLegend = legend.append("ul")
      .style("list-style-type", "none")
      .selectAll("ul");

    legend.append('p')
      .html('Symbol key')
    var symLegend = legend.append("ul")
      .style("list-style-type", "none")
      .selectAll("ul");

    //////////////// Restart function ////////////////
    var restart = function() {

      // Set coordinates settings
      var space = "ind",
          X = d3.select("#xSelect").property("value"),
          Y = d3.select("#ySelect").property("value"),
          x = [],
          y = [];

      json[space].forEach(function (d) {
        x.push(d.data[X]);
        y.push(d.data[Y]);
      });

      var xMin = Math.min.apply(null, x),
          xMax = Math.max.apply(null, x),
          xPadding = [0.05, 0.03],
          xRange = xMax-xMin,
          xScale = d3.scaleLinear()
            .range([0, width])
            .domain([xMin-xPadding[0]*xRange, xMax+xPadding[1]*xRange]).nice(),
          xValue = function(d) { return d.data[X];},
          xMap = function(d) { return xScale(xValue(d));},
          yMin = Math.min.apply(null, y),
          yMax = Math.max.apply(null, y),
          yPadding = [0.05, 0.03],
          yRange = yMax-yMin,
          yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([yMin-yPadding[0]*yRange, yMax+yPadding[1]*yRange]).nice()
          yValue = function(d) { return d.data[Y];},
          yMap = function(d) { return yScale(yValue(d));};

      // Set color settings
      var selected_color_factor = d3.select("#colorSelect").property("value"),
          selected_symbol_factor = d3.select("#symbolSelect").property("value"),
          color_factors = [],
          symbol_factors = [];

      json[space].forEach(function (d) {
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
        .data(json[space]);

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

      // Add dots labels
      plotLabel = plotLabel.data([]);
      plotLabel.exit().remove();

      plotLabel = plotLabel
        .data(json[space])
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

      // Draw arrows (bi-plot)
      var arrow_space = "var", //space_options,
          nArrows = d3.select("#nArrow").property("value"),
          minDx = Math.min(xScale(0), width-xScale(0)),
          minDy = Math.min(yScale(0), height-yScale(0)),
          minD = Math.min(minDx, minDy),
          xRadius = Math.abs(xScale.invert(xScale(0)+minD)/1.5),
          yRadius = Math.abs(yScale.invert(yScale(0)+minD)/1.5),
          norm = function (d) {return Math.sqrt(Math.pow(xValue(d), 2)+Math.pow(yValue(d), 2));},
          angle = function (d) {
            var a = Math.atan(xValue(d)/yValue(d))*180/Math.PI;
            if (yValue(d) < 0) {
              a = a-180;  // apply some majik...
            }
            return a;
          },
          xMapArrow = function (d) {return xScale(xRadius*xValue(d)/norm(d));},
          yMapArrow = function (d) {return yScale(yRadius*yValue(d)/norm(d));};

          //arrow_space.splice(arrow_space.indexOf(space), 1);

      var arrow_data = JSON.parse(JSON.stringify(json[arrow_space]));
          nArrowMax = arrow_data.length;

         function sortByNorm(e1, e2) {
           var v1 = norm(e1),
               v2 = norm(e2);
           return v2-v1;
         };

      arrow_data.sort(sortByNorm);
      arrow_data = arrow_data.splice(0, nArrows);

      biPlot = biPlot.data([]);
      biPlot.exit().remove();

      biPlot = biPlot
        .data(arrow_data)
        .enter()
        .append("g");

      biPlot.append("line")
        .attr("class", "arrow-line")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", function (d) {return xMapArrow(d);})
        .attr("y2", function (d) {return yMapArrow(d);})
        .attr("stroke", "#333");

      var arrowHead = biPlot.append("g")
        .attr("transform", function (d) { return "translate(" + xMapArrow(d) + ", " + yMapArrow(d) + ") rotate("+angle(d)+")"; });

      arrowHead.append("path")
        .attr("class", "arrow-head")
        .attr("d", d3.symbol()
          .type(d3.symbolTriangle)
          .size(50));

      // Add bi-plot (arrows) labels
      biPlotLabel = biPlotLabel.data([]);
      biPlotLabel.exit().remove();

      biPlotLabel = biPlotLabel
        .data(arrow_data)
        .enter()
        .append("g")
        .attr("class", "plot-label")
        .attr("transform", function (d) { return "translate(" + xMapArrow(d) + ", " + yMapArrow(d) + ")"; });

      biPlotLabel.append("path")
        .attr("class", "arrow-head")
        .attr("transform", function (d) { return "rotate("+angle(d)+")"; })
        .attr("d", d3.symbol()
          .type(d3.symbolTriangle)
          .size(50))
        .style("opacity", 1);

      biPlotLabel.append("text")
        .attr("dy", -10)
        .style("text-anchor", function (d) {
          if (xMap(d) <= width/2) {
            return "start";
          } else {
            return "end";
          };
        })
        .attr("font-family", font_family)
        .attr("display", "inline")
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

      // Add 0-lines
      svg.selectAll(".zero-line").remove();
      svg.append("g")
        .attr("class", "zero-line")
        .attr("transform", "translate(0," + yScale(0) + ")")
        .call(d3.axisBottom(xScale).ticks(0)
        .tickSize(0, 0));

      svg.append("g")
        .attr("class", "zero-line")
        .attr("transform", "translate(" + xScale(0) + ", 0)")
        .call(d3.axisLeft(yScale).ticks(0)
        .tickSize(0, 0));

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


      // Update legend

      colorLegend = colorLegend.data([]);
      colorLegend.exit().remove();

      colorLegend = colorLegend
        .data(color_factors.reverse())
        .enter().append("li")
        .attr("id", function(d) { return d;})
        .attr("class", "legend  legend-no-interaction")
        .attr("selected", 0)
        .attr("title", function(d) { return d;})

      colorLegendSpan = colorLegend.append("span")

      colorLegendSpan.append("svg")
        .attr("width", "10px")
        .attr("height", "10px")
        .style("margin-right", "5px")
        .style("overflow", "visible")
        .append("path")
        .attr("transform", "translate(5, 5)")
        .attr("d", d3.symbol()
          .type(function (d, i){
            return d3.symbolSquare;
          })
          .size(75))
        .attr("stroke", "none")
        .attr("fill", function (d, i){
          return colors(d);
        })
        .attr("fill-opacity", 1)

      colorLegendSpan.append("span")
        .html(function(d) { return d;})

      symLegend = symLegend.data([]);
      symLegend.exit().remove();

      symLegend = symLegend
        .data(symbol_factors.reverse())
        .enter().append("li")
        .attr("id", function(d) { return d;})
        .attr("class", "legend  legend-no-interaction")
        .attr("selected", 0)
        .attr("title", function(d) { return d;})


      symLegendSpan = symLegend.append("span")

      symLegendSpan.append("svg")
        .attr("width", "10px")
        .attr("height", "10px")
        .style("margin-right", "5px")
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

      symLegendSpan.append("span")
        .html(function(d) { return d;})

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
    appendSearchInput(buttons, "Search", "searchInput", searchLabels);

    
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
      .html("Symbols")

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

    // Select number of arrows
    var nArrow = buttons.append("div")
      .attr("title", "Set the number of variables (arrows) to display on the bi-plot.")
      .attr("class", "form-group")

    nArrow.append("label")
      .html("Arrows nb")

    nArrow.append("input")
      .attr("id", "nArrow")
      .attr("type", "number")
      .attr("class", "form-control form-number-field")
      .attr("min", 0)
      .attr("max", nArrowMax)
      .attr("value", Math.min(5, nArrowMax))
      .on("change", restart);


    setMultiselect('.figtool-multiselect');
 //   resizeMultiselect('#d3-buttons', 1, '#d3-buttons', false);
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

//});

};
