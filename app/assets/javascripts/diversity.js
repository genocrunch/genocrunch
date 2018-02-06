function diversity(id, legend_id, json, RfunctionsDiversity, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif", color_palette = d3.schemeCategory10) {



  // Size
  var margin = {top: 20, right: 75, bottom: 65, left: 65},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom,
      left_label_space = 40,
      bottom_label_space = 40,
      stat_font_size = 10;

  // Colors and line width
  var colors = d3.scaleOrdinal(color_palette),
      stroke_width_thick = "5px",
      stroke_width_thin = "3px";

  // Buttons
  var buttons = d3.select("#d3-buttons");
  buttons.html("");

  // General functions
  function json2coord(json) {
    var arr = [],
        keys = Object.keys(json);
    for (var i = 0; i < keys.length; i++) {
      arr.push({x:Number(keys[i]), y:Number(json[keys[i]])});
    };
    return arr;
  };

  function json2jsonMeans(json, factor) {

    var json_means = [],
        unique_factors = [];
    json.forEach(function (d){
      if (unique_factors.indexOf(d[factor]) == -1) {
        unique_factors.push(d[factor]);
      };
    });
    for (var i = 0; i < unique_factors.length; i++) {
      var arr = [],
          data = [];
      for (var j = 0; j < json.length; j++) {
        if (json[j][factor] == unique_factors[i]) {
          arr.push(json2coord(json[j].data));
        };
      };
      for (var j = 0; j < arr[0].length; j++) {
        data.push({x:arr[0][j].x,
                   y:d3.mean(arr, function(d){ return d[j].y;}),
                   stdev:d3.deviation(arr, function(d){ return d[j].y;})});
      };
      json_means.push({name:unique_factors[i], data:data});
    };

    return json_means;
  };

  function getPvalFromStat(stat, n) {
    var sign_table = [[0.05, "*"],
                      [0.01, "**"],
                      [0.001, "***"]];

    for (var i = 0; i < stat.length; i++) {
      if (stat[i].name == n) {
        var p = Number(stat[i]["p-value"]).toFixed(3),
            sign = "ns";

        for (var j = 0; j < sign_table.length; j++) {
          if (p <= sign_table[j][0]) {
            sign = sign_table[j][1];
          };
        };

        return "p="+ p +" ("+ sign +")";
      };
    };
    return "na";
  };

  //$.getJSON(data, function(json) {

    // Set variables depending only on the primary data
    var color_select_options = [],
        metric_select_options = {},
        metrics = Object.keys(json),
        json_keys = Object.keys(json[metrics[0]].data[0]);

    for ( var i = 0; i < json_keys.length; i++) {
      if (["name", "data", "id"].indexOf(json_keys[i]) == -1) {
        color_select_options.push(json_keys[i]);
      };
    };

    RfunctionsDiversity.forEach(function (d) {
      if (metrics.indexOf(d["value"]) != -1)
        metric_select_options[d["value"]] = d["label"];
    });

    //////////////// Draw graph ////////////////
    var legendContainer = d3.select("#"+legend_id).append("div")

    var svgContainer = d3.select("#"+id)
      .style("height", (height + margin.top + margin.bottom)+"px")

    var svg = svgContainer.append("svg")
      .attr("id", "svg-figure")
      .attr("class", "svg-figure")
      .attr("width", (width + margin.left + margin.right)+"px")
      .attr("height",(height + margin.top + margin.bottom)+"px")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Draw lines
    var graph = svg.selectAll();

    // Put stats
    var pValue = svg.append("g");

    // Draw axis
    xAxis = svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")");

    xAxisLegend = svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width/2)
      .attr("y", height+bottom_label_space)
      .style("text-anchor", "middle")
      .attr("font-family", font_family)
      .text("Rarefaction depth");

    yAxis = svg.append("g")
      .attr("class", "axis");

    yAxisLegend = svg.append("g")
      .attr("transform", "translate("+ -left_label_space +", "+ height/2 +")")
      .attr("class", "axis-label");

    // Add legend
    var legend = legendContainer.append("ul")
      .attr("id", "svg-legend")
      .style("font-family", font_family)
      .style("list-style-type", "none")
      .selectAll("ul");

    //////////////// Restart function ////////////////
    var restart = function() {

      // Set coordinates settings
      var selected_metric = d3.select("#metricSelect").property("value"),
          xMins = [],
          yMins = [],
          xMaxs = [],
          yMaxs = [];

      json[selected_metric].data.forEach(function (d) {
        var x = Object.keys(d.data),
            y = Object.keys(d.data).map(function (n) { return d.data[n];});
        xMins.push(Math.min.apply(null, x));
        yMins.push(Math.min.apply(null, y));
        xMaxs.push(Math.max.apply(null, x));
        yMaxs.push(Math.max.apply(null, y));
      });

      var xMin = Math.min.apply(null, xMins),
          xMax = Math.max.apply(null, xMaxs),
          xScale = d3.scaleLinear()
            .range([0, width])
            .domain([xMin, xMax]).nice(),
          yMin = Math.min.apply(null, yMins),
          yMax = Math.max.apply(null, yMaxs),
          yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([yMin, yMax]).nice();

      var line = d3.line()
        .x(function(d) { return xScale(d.x); })
        .y(function(d) { return yScale(d.y); });

      // Set color settings
      var selected_color_factor = d3.select("#colorSelect").property("value"),
          color_factors = [];

      json[selected_metric].data.forEach(function (d) {
        if (color_factors.indexOf(d[selected_color_factor]) == -1) {
          color_factors.push(d[selected_color_factor]);
        };
      });

      colors.domain(color_factors);

      // Draw graph
      graph = graph.data([]);
      graph.exit().remove();

      var draw_means = $("#meansButton").is(':checked');
      if (draw_means) {
        var data = json2jsonMeans(json[selected_metric].data, selected_color_factor),
            yMeans = [];
        data.forEach(function (d) {
          yMeans.push(d.data[d.data.length-1].y);
        });
        var yMeansMin = Math.min.apply(null, yMeans),
            yMeansMax = Math.max.apply(null, yMeans);
      } else {
        var data = json[selected_metric].data;
      }

      graph = graph
        .data(data, function (d) { return d;});

      graph = graph.enter()
        .append("g")
        .attr("class", "graph")
        .attr("display", "inline");

      graph.append("path")
        .attr("d", function(d) {
          if (draw_means) {
            return line(d.data);
          } else {
            return line(json2coord(d.data));
          };
        })
        .attr("fill", "none")
        .attr("stroke-width", stroke_width_thin)
        .attr("stroke", function (d){
          if (draw_means) {
            return colors(d.name);
          } else {
            return colors(d[selected_color_factor]);
          };
        });

      graph.append("text")
        .attr("x", function () {
          if (draw_means) {
            return xScale(xMax)+5+stat_font_size;
          } else {
            return xScale(xMax)+2;
          };
        })
        .attr("y", function (d) {
          if (draw_means) {
            return yScale(d.data[d.data.length-1].y);
          } else {
            return yScale(d.data[xMax]);
          };
        })
        .text(function (d) { return d.name;})
        .attr("class", "plot-label")
        .attr("font-family", font_family)
        .attr("selected", false)
        .attr("mass-selected", false)
        .attr("display", "none");

      // Add stats
      pValue.selectAll("*").remove();
      if (draw_means) {

        if (Object.keys(json[selected_metric]).indexOf('stat') != -1) {

        pValue
          .attr("transform", "translate("+xScale(xMax) +", 0)")

        pValue.append("line")
          .attr("x1", 2)
          .attr("y1", yScale(yMeansMin))
          .attr("x2", 2)
          .attr("y2", yScale(yMeansMax))
          .attr("stroke", "black")

        pValue.append("text")
          .attr("transform", "rotate(-90)")
          .attr("text-anchor", "middle")
          .attr("font-family", font_family)
          .attr("font-size", stat_font_size+2)
          .attr("x", -yScale((yMeansMin+yMeansMax)/2))
          .attr("y", stat_font_size+2)
          .attr("font-size", stat_font_size)
          .text(getPvalFromStat(json[selected_metric].stat, selected_color_factor));
        }

          graph.append("g")
            .selectAll("line")
            .data(function(d) {return d.data;})
            .enter().append("line")
              .attr("class", "error-bars")
              .attr("display", "none")
              .attr("x1", function(d) { return xScale(d.x);})
              .attr("x2", function(d) { return xScale(d.x);})
              .attr("y1", function(d) { return yScale(d.y+d.stdev);})
              .attr("y2", function(d) { return yScale(d.y-d.stdev);})
              .attr("stroke-width", "1px")
              .attr("stroke", function(d) { return colors(this.parentNode.__data__.name);});

      };

      showErrorBars();
      displayLabels("graph");
      showLabels();

      xAxis.call(d3.axisBottom(xScale).ticks(5))
        .selectAll("text")
          .attr("class", "axis-label")
          .style("text-anchor", "end")
          .attr("font-family", font_family)
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-25)");

      yAxis.call(d3.axisLeft(yScale).ticks(10))

      yAxisLegend.selectAll("*").remove();
      yAxisLegend.append("text")
        .text(function () {
          return metric_select_options[selected_metric];
        })
        .style("text-anchor", "middle")
        .attr("font-family", font_family)
        .attr("transform", "rotate(-90)");

      // Update legend

      legend = legend.data([]);
      legend.exit().remove();

      legend = legend
        .data(color_factors)
        .enter().append("li")
        .attr("id", function(d) { return d;})
        .attr("class", "legend legend-no-interaction")
        .attr("selected", 0)
        .attr("title", function(d) { return d;})

      legendSpan = legend.append("span")

      legendSpan.append("svg")
        .attr("width", "10px")
        .attr("height", "10px")
        .style("margin-right", "5px")
        .append("rect")
        .attr("width", "10px")
        .attr("height", "10px")
        .attr("fill", function(d) { return colors(d); })

      legendSpan.append("span")
        .html(function(d) { return d;})

    };


    //////////////// Control buttons ////////////////

    appendLabelCheckBox(buttons, "Show labels", "Labels", "labelButton", showLabels)

    // Search in labels
    var searchLabels = function() {
      $("#labelButton").attr("checked", false);
      var key = $("#searchInput").val().toUpperCase();
      if (key != '') {
        var selected = d3.selectAll(".graph").filter(function(){return this.childNodes[0].__data__.name.toUpperCase().indexOf(key.toUpperCase()) != -1 }),
            non_selected = d3.selectAll(".graph").filter(function(){return this.childNodes[0].__data__.name.toUpperCase().indexOf(key.toUpperCase()) == -1 }),
            selected_line = selected.select(function(){return this.childNodes[0];}),
            selected_text = selected.select(function(){return this.childNodes[1];}),
            non_selected_line = non_selected.select(function(){return this.childNodes[0];}),
            non_selected_text = non_selected.select(function(){return this.childNodes[1];});
        selected_line.attr("stroke-width", stroke_width_thick);
        selected_text.attr("display", "inline");
        selected_text.attr("selected", true);
        non_selected_line.attr("stroke-width", stroke_width_thin);
        non_selected_text.attr("display", "none");
        non_selected_text.attr("selected", false);
      } else {
        to_free = d3.selectAll(".graph"),
        to_free_line = to_free.select(function(){return this.childNodes[0];}),
        to_free_text = to_free.select(function(){return this.childNodes[1];});
        to_free_line.attr("stroke-width", stroke_width_thin);
        to_free_text.attr("display", "none");
        to_free_text.attr("selected", false);
      };
    };

    appendSearchInput(buttons, "Search", "searchInput", searchLabels);

    // Select metric
    var metricSelect = buttons.append("div")
      .attr("title", "Diversity metric.")
      .attr("class", "form-group")

    metricSelect.append("label")
      .html("Metric")

    metricSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "metricSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .on("change", restart)
        .selectAll("option")
        .data(metrics)
        .enter().append("option")
          .attr("value", function (d) { return d;})
          .text(function (d) {
            return metric_select_options[d];
          });


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

    // Display labels button
    var showLabels = function() {
      var label = d3.selectAll(".plot-label");
      if ($("#labelButton").is(':checked')) {
        label.attr("display", "inline")
        label.attr("mass-selected", "true")
      } else {
        label.attr("display", "none")
        label.attr("mass-selected", "false")
      };
    };

    // Draw means button
    var meansButton = buttons.append("div")
      .attr("title", "Draw mean curves.")
      .attr("class", "form-bool")
      .append("label")

    meansButton.append("input")
      .attr("id", "meansButton")
      .attr('class', 'form-check-input')
      .attr("type", "checkbox")
      .on("click", restart);

    meansButton.append("p")
      .html("Means curves");


    // Draw error bars button
    var showErrorBars = function() {

      if ($("#errorBarsButton").is(':checked')) {
        d3.selectAll(".error-bars").attr("display", "inline")
      } else {
        d3.selectAll(".error-bars").attr("display", "none")
      };
    };

    var errorBarsButton = buttons.append("div")
      .attr("title", "Show error bars (standard deviation).")
      .attr("class", "form-bool")
      .append("label")

    errorBarsButton.append("input")
      .attr("id", "errorBarsButton")
      .attr('class', 'form-check-input')
      .attr("type", "checkbox")
      .on("click", showErrorBars);

    errorBarsButton.append("p")
      .html("Error bars");


    setMultiselect('.figtool-multiselect');
    //resizeMultiselect('.col-md-12', 1, '#d3-buttons', false);
    $("#metricSelect").on("change", restart)
    $("#colorSelect").on("change", restart)

    restart();

    // Labels functions
        function displayLabels (id) {
          $("."+id).on("mouseenter", function(d) {
            d3.select(this.childNodes[1]).attr("display", "inline");
            d3.select(this.childNodes[0]).attr("stroke-width", stroke_width_thick);
        });
        $("."+id).on("mouseleave", function(d) {
          if (this.childNodes[1].getAttribute("selected") == "false") {
            if (this.childNodes[1].getAttribute("mass-selected") == "false") {
              d3.select(this.childNodes[1]).attr("display", "none");
            };
            d3.select(this.childNodes[0]).attr("stroke-width", stroke_width_thin);
          };
        });
        $("."+id).on("click", function(d) {
          if (this.childNodes[1].getAttribute("selected") == "false") {    
            d3.select(this.childNodes[1]).attr("display", "inline");
            d3.select(this.childNodes[0]).attr("stroke-width", stroke_width_thick);
            d3.select(this.childNodes[1]).attr("selected", true);
          } else {
            if (this.childNodes[1].getAttribute("mass-selected") == "false") {
              d3.select(this.childNodes[1]).attr("display", "none");
            };
            d3.select(this.childNodes[0]).attr("stroke-width", stroke_width_thin);
            d3.select(this.childNodes[1]).attr("selected", false);
          }
        });
      };

//});

};
