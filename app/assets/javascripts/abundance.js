function barchart(id, legend_id, json, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif", color_palette = d3.schemeCategory20c) {

  // Size
  var margin = {top: 20, right: 20, bottom:150, left: 50},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom,
      left_label_space = 30,
      bottom_text_angle = 55;

  // Colors and scale
  var colors = d3.scaleOrdinal(color_palette),
      xScale = d3.scaleBand()
        .rangeRound([0, width])
        .align(0),
      yScale = d3.scaleLinear()
        .rangeRound([height, 0]);

  // General functions
  function filter_abundance(json, thres, other_key) {
    var filtered = JSON.parse(JSON.stringify(json)),
        keys = Object.keys(json[0].data);
    if (keys.indexOf(other_key) != -1) {
      keys.splice(keys.indexOf(other_key), 1)
    }
    var filter = [...Array(keys.length)];
    filter.fill(false)
    json.map(function(d) {
      for (var i = 0; i < keys.length; i++) {
        if ((filter[i] == false) && (Number(d.data[keys[i]]) >= Number(thres))) {
          filter[i] = true;
        };
      };
    });

    for (var i = 0; i < filtered.length; i++) {
      filtered[i].data[other_key] = 0;
      for (var j = 0; j < keys.length; j++) {
        if (filter[j] == false) {
          filtered[i].data[other_key] = Number(filtered[i].data[other_key])+Number(filtered[i].data[keys[j]]);
          delete filtered[i].data[keys[j]];
        }
      };
    };

    return filtered;
  };

    // Set variables depending only on the primary data
    var keys0 = Object.keys(json[0].data),
        other_key = 'Filtered';
    while (keys0.indexOf(other_key) != -1) {
      other_key = 'Filtered_'+randomKey(3)
    }
    json.map(function(d) { d.data[other_key] = 0; })
    keys0.unshift(other_key)

    xScale.domain(json.map(function(d) { return d['name']; }));
    yScale.domain([0, 100]).nice();
    colors.domain(keys0);

    var stack = d3.stack()
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    //////////////// Draw figure ////////////////
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

    // Draw plot
    var plot = svg.selectAll();

    // Add plot labels
    var plotLabel = svg.selectAll();


    // Add axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")	
          .attr("font-family", font_family)
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-" + bottom_text_angle + ")");

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(10))

    svg.append("g")
      .attr("transform", "translate("+ (-left_label_space) +", "+ (height/2) +")")
      .attr("class", "axis-label")
      .append("text")
        .text("%")
        .attr("font-family", font_family)
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90)");

    // Add legend
    var legend = legendContainer.append("ul")
      .attr("id", "svg-legend")
      .style("font-family", font_family)
      .style("list-style-type", "none")
      .selectAll("ul");

    var filtered_json = [],
        names = [],
        k = [],
        keys = [],
        data = [];

    //////////////// Restart function ////////////////
    var restart = function() {

      // Filter data on abundance threshold
      filtered_json = filter_abundance(json, d3.select("#thresRange").property("value"), other_key);
      names = filtered_json.map(function(d){return d.name});
      data = filtered_json.map(function(d){return d.data});
      keys = Object.keys(data[0]);
      keys.splice(k.indexOf(other_key), 1);
      keys.unshift(other_key);

      stack = stack
        .keys(keys)

      // Update barplot
      plot = plot
        .data(stack(data))

      d3.selectAll(".barplot-rect")
        .transition()
        .duration(700)
        .style("opacity", 0)
        .remove();

      plot
        .enter()
        .append("g")
          .attr("class", "barplot")
          .selectAll("rect")
          .data(function(d) {return d;})
            .enter().append("rect")
            .attr("class", "barplot-rect")
            .attr("x", function(d, i) {return xScale(names[i]);})
            .attr("y", function(d) {return yScale(d[1]);})
            .attr("height", function(d) {
              return yScale(d[0]) - yScale(d[1]);
            })
            .attr("width", xScale.bandwidth());

      d3.selectAll(".barplot")
        .transition()
        .duration(700)
        .attr("fill", function(d) { return colors(d.key); })
        .attr("fill-opacity", 1)

      // Update labels
      plotLabel = plotLabel
        .data(stack(data));

      var plotLabel_main = plotLabel
        .enter()
        .append("g")

      plotLabel_main.append("title")
        .html(function(d, i) { return keys[i];})

      plotLabel_main
          .selectAll("rect")
          .data(function(d) { return d; })
            .enter()
            .append("rect")
            .attr("class", "barplot-rect square")
            .attr("selected", 0)
            .attr("stroke", "#ff0066")
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0)
            .attr("fill-opacity", 0)
            .attr("x", function(d, i) { return xScale(names[i]);})
            .attr("y", function(d) { return yScale(d[1]);})
            .attr("height", function(d) {
              return yScale(d[0]) - yScale(d[1]);
            })
            .attr("width", xScale.bandwidth());

      highlightLegend("square");

      // Update legend

      legend = legend.data([]);
      legend.exit().remove();

      legend = legend
        .data(keys)
        .enter().append("li")
        .attr("id", function(d) { return d;})
        .attr("class", "legend")
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
        .html(function(d) {
          if (d == other_key)
            return "Others (below "+ d3.select("#thresRange").property("value") +"%)";
          var name = d.split(';');
          if (name.length > 1) {
            return name[name.length - 2]+"; "+name[name.length - 1];
          };
          return name[0];
        });

      highlightBars("legend");
      //showLegendLabels();

    };

    //////////////// Control buttons ////////////////

    // Buttons
    var buttons = d3.select("#d3-buttons");
    buttons.html("");

    // Search in legend
    var searchLegend = function() {

      var key = $("#searchInput").val().toUpperCase();
      if (key != '') {
        d3.selectAll(".square").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.parentNode.__data__.key.toUpperCase().indexOf(key.toUpperCase()) != -1);}).attr("stroke-opacity", 1);
        d3.selectAll(".square").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.parentNode.__data__.key.toUpperCase().indexOf(key.toUpperCase()) == -1);}).attr("stroke-opacity", 0);
        d3.selectAll(".legend").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.getAttribute("id").toUpperCase().indexOf(key.toUpperCase()) != -1);}).style("background-color", "#ffcce0");
        d3.selectAll(".legend").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.getAttribute("id").toUpperCase().indexOf(key.toUpperCase()) == -1);}).style("background-color", "rgba(0, 0, 0, 0)");
      } else {
        selected = d3.selectAll(".square").filter(function(d){ return this.getAttribute("selected") == 0;}).attr("stroke-opacity", 0);
        selected_legend = d3.selectAll(".legend").filter(function(d){ return this.getAttribute("selected") == 0;}).style("background-color", "rgba(0, 0, 0, 0)");
      };
    };

    appendSearchInput(buttons, "Search", "searchInput", searchLegend);

    // Abundance Cutoff
    appendRange(buttons, "Abundance filter", "% cutoff", "thresRange", 0, 20, 0, restart)


    // Highlight functions
    function highlightBars (id) {
      $("."+id).on("mouseenter", function(d) {
        var key = this.getAttribute("id");
        d3.selectAll(".square").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.parentNode.__data__.key == key);}).attr("stroke-opacity", 1);
        d3.select(this).style("background-color", "#ffcce0");
      });
      $("."+id).on("mouseleave", function(d) {
        var key = this.getAttribute("id");
        d3.selectAll(".square").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.parentNode.__data__.key == key);}).attr("stroke-opacity", 0);
        if (this.getAttribute("selected") == 0) {
          d3.select(this).style("background-color", "rgba(0, 0, 0, 0)");
        }
      });
      $("."+id).on("click", function(d) {
        var key = this.getAttribute("id"),
            selection = d3.selectAll(".square").filter(function(d){ return this.parentNode.__data__.key == key;});
        if (selection.attr("selected") == 1) {
          selection.attr("selected", 0);
          d3.select(this).attr("selected", 0);
        } else {
          selection.attr("selected", 1);
          d3.select(this).attr("selected", 1);
        };
      });
    };

    function highlightLegend (id) {
      $("."+id).on("mouseenter", function(d) {
        var key = this.parentNode.__data__.key;
        d3.selectAll(".legend").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.getAttribute("id") == key);}).style("background-color", "#ffcce0");
        d3.selectAll(".square").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.parentNode.__data__.key == key);}).attr("stroke-opacity", 1);
      });
      $("."+id).on("mouseleave", function(d) {
        var key = this.parentNode.__data__.key;
        d3.selectAll(".legend").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.getAttribute("id") == key);}).style("background-color", "rgba(0, 0, 0, 0)");
        d3.selectAll(".square").filter(function(d){ return (this.getAttribute("selected") == 0) && (this.parentNode.__data__.key == key);}).attr("stroke-opacity", 0);
      });
      $("."+id).on("click", function(d) {
        var key = this.parentNode.__data__.key,
            selected_legend = d3.selectAll(".legend").filter(function(d){ return this.getAttribute("id") == key;}),
            selection = d3.selectAll(".square").filter(function(d){ return this.parentNode.__data__.key == key;});
        if (this.getAttribute("selected") == 0) {
          selection.attr("selected", 1);
          selected_legend.attr("selected", 1);
        } else {
          selection.attr("selected", 0);
          selected_legend.attr("selected", 0);
        };
      });
    };

    restart();

};
