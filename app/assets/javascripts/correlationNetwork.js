function correlationNetwork(id, legend_id, json, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif", color_palette = d3.schemeCategory10) {

  // Size
  var margin = {top: 10, right: 10, bottom: 40, left: 10},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom;

  // Restrictions
  drag_size_limit = 80;

  // Colors, symbols and scaling
  var colors = d3.scaleOrdinal(color_palette),
      link_color = [["#999999", "Pos. correlation"],
                    ["#ff3385", "Neg. correlation"]],
      symbols = d3.scaleOrdinal([d3.symbolCircle,
        d3.symbolSquare,
        d3.symbolTriangle,
        d3.symbolStar,
        d3.symbolDiamond,
        d3.symbolCross]),
      legend_svg_symsize = 15,
      rRange = [6, 24],
      size_legend_data = [15, 10, 5],
      wRange = [0.1*rRange[0], 0.9*rRange[0]],
      sizeScale = d3.scaleLinear()
        .range(rRange),
      widthScale = d3.scaleLinear()
        .range(wRange),
      attractionScale = d3.scaleLinear()
        .range([100, 50]),
      repulsionScale = d3.scaleLinear()
        .range([50, 100]),
      chargeScale = d3.scaleLinear()
        .range([-100, -200]),
      sizeOptions = [{"text":"", "value":"", "title":""},
                     {"text":"Degree", "value":"degree", "title":"Node degree"},
                     {"text":"Mean abundance", "value":"mean", "title":"Mean abundance"},
                     {"text":"Max abundance", "value":"max", "title":"Max abundance"},
                     {"text":"Min abundance", "value":"min", "title":"Min abundance"}
                    ];
      oRange = [0.1, 0.3],
      p_value_legend_data = [[0.001, "***"],
                             [0.01, "**"],
                             [0.05, "*"],
                             [1, "ns"],
                             ["NA", "na"]],
      stat_settings = {"range":[0.2, 0.6, 0.8, 1],
                       "domain":[1, 0.05, 0.01, 0.001],
                       "text":["ns", "*", "**", "***"]},
      opacity = d3.scaleLinear()
        .range(stat_settings.range)
        .domain(stat_settings.domain),
      colorBarSize = 10;


  // General functions
  function getSizeExtrema(json, fun, extrema="max", absolute=false) {

    var values = json.map(function(d){
      if (absolute) {
        return Math.abs(d[fun]);
      }
      return d[fun];
    })

    if (extrema == "max") {
      return Math.max.apply(null, values);
    } else if (extrema == "min") {
      return Math.min.apply(null, values);
    };
  };

  function getNodeDegree(links, nodes) {
    var degree = {};
    links.forEach(function (d, i) {
      if (Object.keys(degree).indexOf(d.target.toString()) == -1) {
        degree[d.target.toString()] = 1;
      } else {
        degree[d.target.toString()] = degree[d.target.toString()]+1;
      };
      if (Object.keys(degree).indexOf(d.source.toString()) == -1) {
        degree[d.source.toString()] = 1;
      } else {
        degree[d.source.toString()] = degree[d.source.toString()]+1;
      };
    });
    nodes.forEach(function (d) {
      if (Object.keys(degree).indexOf(d.id) != -1) {
        d["degree"] = degree[d.id];
      } else {
        d["degree"] = 0; // Just to avoid scale domain to start at 0...
      }
    });
  };

  function unique(value, index, self) { 
    return self.indexOf(value) === index;
  }

  // Buttons
  var buttons = d3.select("#d3-buttons")
  buttons.html("");

  //$.getJSON(data, function(json) {

    //////////////// Simulation ////////////////
       var simulation = d3.forceSimulation()
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("y", d3.forceY())
            .force("x", d3.forceX());

        var ticked = function() {

            link
                .attr("x1", function(d) { return Math.max(0, Math.min(d.source.x, width)); })
                .attr("y1", function(d) { return Math.max(0, Math.min(d.source.y, height)); })
                .attr("x2", function(d) { return Math.max(0, Math.min(d.target.x, width)); })
                .attr("y2", function(d) { return Math.max(0, Math.min(d.target.y, height)); });



            node
              .attr("transform", function(d) {
  	            return "translate(" + Math.max(0, Math.min(d.x, width)) + "," + Math.max(0, Math.min(d.y, height)) + ")"; });

            nodeLabel
              .attr("transform", function(d, i) {
  	            return "translate(" + Math.max(0, Math.min(d.x, width)) + "," + Math.max(0, Math.min(d.y, height)) + ")"; });
        };

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.25).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }
        
        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }


    //////////////// Draw links and nodes ////////////////
    var legendContainer = d3.select("#"+legend_id).append("div")
      .attr('class', 'columns-2')

    var svgContainer = d3.select("#"+id)
      .style("height", (height + margin.top + margin.bottom)+"px")

    var svg = svgContainer.append("svg")
      .attr("id", "svg-figure")
      .attr("class", "svg-figure network-well")
      .attr("width", (width + margin.left + margin.right)+"px")
      .attr("height",(height + margin.top + margin.bottom)+"px")
      .style("pointer-events", "all")
      .call(d3.zoom()
        .scaleExtent([1, 4])
        .duration(1000)
        .translateExtent([[margin.left, margin.top], [width + margin.right, height + margin.top + margin.bottom]])
        .on("zoom", zoomed));


    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    function zoomed() {
      g.attr("transform", d3.event.transform);
    };

    // Draw links
    var link = g.append("g")
      .selectAll();

    // Draw Nodes
    var node = g.append("g")
      .selectAll("g");

    var nodeLabel = g.append("g")
      .selectAll("g");

    // Add legend
    var legend = legendContainer.append("div")
      .attr("id", "svg-legend")
      .style("font-family", font_family)

    var colorLegend = legend.append("ul")
      .style("list-style-type", "none")
      .style("padding-top", "25px")
      .selectAll("ul");

    legend.append("div")
      .style("border-top", "solid #ccc 1px")

    var symbolLegend = legend.append("ul")
      .style("list-style-type", "none")
      .selectAll("ul");

    legend.append("div")
      .style("border-top", "solid #ccc 1px")

    var linkLegend = legend.append("ul")
      .style("list-style-type", "none")
      .selectAll("ul");


    //////////////// NODES COLORS ////////////////
    var setSymbolColor = function() {
      var selected_model = $('#modelSelect').val(),
          selected_effect = $('#effectSelect').val(),
          color_domain = json.nodes.map(function (d){return d.stat[selected_model][selected_effect]['highest-mean'];}).filter(unique);
      if (selected_model != '')
        colors.domain(color_domain);

      // Update symbols color
      d3.selectAll(".coloured-symbol")
        .style("fill", function (d){
          if (selected_model != '')
            return colors(d.stat[selected_model][selected_effect]['highest-mean']);
          return colors('');
        })
        .attr("fill-opacity", function (d){
          if (selected_model != '')
            return opacity(d.stat[selected_model][selected_effect]['p-value']);
          return 1;
        });

      // Update color legend
      colorLegend = colorLegend.data([]);
      colorLegend.exit().remove();

      colorLegend = colorLegend
        .data(color_domain)
        .enter().append("li")
        .attr("id", function(d) { return d;})
        .attr("class", "legend  legend-no-interaction")
        .attr("selected", 0)
        .attr("title", function(d) { return d;})

      colorLegendSpan = colorLegend.append("span")

      var legend_svg_width = legend_svg_symsize*p_value_legend_data.length;

      colorLegendSpanSvg = colorLegendSpan.append("svg")
        .attr("width", legend_svg_width+"px")
        .attr("height", legend_svg_symsize+"px")
        .style("margin-right", "5px")
        .style("overflow", "visible")

      for (var i = 0; i < p_value_legend_data.length; i++) {
        // (V)(°,,,°)(V)

        colorLegendSpanSvg.append("g")
          .attr("transform", "translate("+(i*legend_svg_width/p_value_legend_data.length)+", -2)")
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", legend_svg_symsize)
          .text(function(d, j){
            if (j == 0 && color_domain.length > 0)
             return p_value_legend_data[i][1];
          })

        colorLegendSpanSvg.append("rect")
          .attr("transform", "translate("+(i*legend_svg_width/p_value_legend_data.length)+", 0)")
          .attr("width", legend_svg_symsize)
          .attr("height", legend_svg_symsize)
        .attr("stroke", "none")
        .attr("fill", function (d, j){
          if (p_value_legend_data[i][0] == "NA") {
            return "lightgrey";
          };
          return colors(d);
        })
        .attr("fill-opacity", function (d, j){
          if (p_value_legend_data[i][0] == "NA") {
            return 1;
          };
          return opacity(p_value_legend_data[i][0]);
        })

      };


      colorLegendSpan.append("span")
        .html(function(d) { return d;})
    };

    //////////////// NODES SHAPE AND SIZE ////////////////
    var setSymbolSize = function() {
      var selected_size_factor = $("#sizeSelect").val(),
          symbols_domain = json.nodes.map(function (d){return d['data-type'];}).filter(unique),
          size = {};
      symbols.domain(symbols_domain);
      if (selected_size_factor != '') {

        for (var i = 0; i < symbols_domain.length; i++) {
          size[symbols_domain[i]] = {value:json.nodes.filter(function (d){return d['data-type'] == symbols_domain[i];}).map(function(d){return Number(d[selected_size_factor]);})};
          size[symbols_domain[i]]['min'] = Math.min.apply(null, size[symbols_domain[i]]['value']);
          size[symbols_domain[i]]['max'] = Math.max.apply(null, size[symbols_domain[i]]['value']);
        }
      }

      // Set symbols size
      d3.selectAll(".symbol")
        .transition().duration(400)
        .attr("d", d3.symbol()
          .type(function (d){ return symbols(d['data-type']);})
          .size(function (d){
            if (selected_size_factor != '') {
              sizeScale.domain([size[d['data-type']]['min'], size[d['data-type']]['max']]);
              d.r = sizeScale(d[selected_size_factor]);
            } else {
              d.r = 20;
            }
            return d.r*d.r;
          }))
        .attr('radius', function(d){return d.r;});

      // Set size-dependent simulation variables
      var symbol_data = [];
      d3.selectAll(".symbol").each(function(){return symbol_data.push(d3.select(this).attr("radius"));});
      var force_size_factor = (Math.log2(symbol_data.length+1)+1)/2;
      chargeScale.domain([Math.min.apply(null, symbol_data), Math.max.apply(null, symbol_data)]);

      if (force_size_factor == 0) {
        force_size_factor = 1;
      };

      simulation
            .force("collide", d3.forceCollide()
              .radius(function (d){
                return d.r;
              })
              .iterations(2)
              .strength(1/force_size_factor))
            .force("charge", d3.forceManyBody()
              .strength(function (d){
                return chargeScale(d.r)/force_size_factor;
              }));

      // Update symbol legend
      symbolLegend = symbolLegend.data([]);
      symbolLegend.exit().remove();

      symbolLegend = symbolLegend
        .data(symbols_domain)
        .enter().append("li")
        .attr("id", function(d) { return d;})
        .attr("class", "legend  legend-no-interaction")
        .attr("selected", 0)
        .attr("title", function(d) { return d;})

      symbolLegendSpan = symbolLegend.append("span")

      var legend_svg_width = legend_svg_symsize*size_legend_data.length;

      symbolLegendSpanSvg = symbolLegendSpan.append("svg")
        .attr("width", legend_svg_width+"px")
        .attr("height", legend_svg_symsize+"px")
        .style("margin-right", "5px")
        .style("overflow", "visible")

      for (var i = 0; i < size_legend_data.length; i++) {
        // (V)(°,,,°)(V)

        symbolLegendSpanSvg.append("path")
          .attr("transform", "translate("+(i*legend_svg_width/size_legend_data.length)+", "+legend_svg_symsize/2+")")
          .attr("d", d3.symbol()
            .type(function (d){ return symbols(d);})
            .size(size_legend_data[i]*size_legend_data[i]))
          .attr("stroke", "#333")
          .attr("fill-opacity", 0)

      };


      symbolLegendSpan.append("span")
        .html(function(d) { return d;})

    }

    //////////////// RESTART ////////////////
    var restart = function() {

      var weight_thres = [$("#pThresRange").val(), $("#nThresRange").val()],
          weight_p_value_thres = $("#weightPvalThres").val(),
          link_data = JSON.parse(JSON.stringify(json.links.filter(function(d){
            if (d.weight >= 0) {
              return (d.weight >= weight_thres[0] && d['p-value'] <= weight_p_value_thres);
            }
            return (d.weight < -weight_thres[1] && d['p-value'] <= weight_p_value_thres);
          })));
          getNodeDegree(link_data, json.nodes);

      var kept_node = link_data.map(function(d){return d['source'];}).concat(link_data.map(function(d){return d['target'];})).filter(unique),
          node_data = JSON.parse(JSON.stringify(json.nodes.filter(function(d){return kept_node.indexOf(d.id) != -1;}))),
          link_width = {weight:link_data.map(function(d){return d.weight;})};
          link_width['min'] = Math.min.apply(null, link_width.weight.map(Math.abs));
          link_width['max'] = Math.max.apply(null, link_width.weight.map(Math.abs));
          widthScale.domain([link_width['min'], link_width['max']]);
          attractionScale.domain([link_width['min'], link_width['max']]);

      // Update links
      link = link.data([]);
      link.exit().remove();

      link = link
        .data(link_data);

      link = link.enter()
        .append("line")
        .attr("class", "link-line")
        .attr("stroke-linecap", "round")
        .attr("stroke", function (d) {
          if (Number(d.weight) >= 0) {
            return link_color[0][0];
          } else {
            return link_color[1][0];
          };
        })
        .attr("stroke-width", function (d) {
          return widthScale(Math.abs(d.weight));
        });

      // Update nodes
      node = node.data([]);
      node.exit().remove();

      node = node
        .data(node_data);

      node = node.enter()
        .append("g")
        .append("path")
        .attr("class", "coloured-symbol symbol")
        .attr("stroke", "white");

      // Update nodes labels
      nodeLabel = nodeLabel.data([]);
      nodeLabel.exit().remove();

      nodeLabel = nodeLabel
        .data(node_data);

      nodeLabel = nodeLabel.enter()
        .append("g")
        .attr('class', 'node-label');

      nodeLabel.append("path")
        .attr("class", "symbol")
        .attr("stroke", "#333333")
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      nodeLabel.append("text")
        .text(function (d) {
          var label = d.name.split(";");
          if (label.length > 1)
            return label[label.length-2] +";"+ label[label.length-1];
          return label[0];
        })
        .attr("text-anchor", "start")
        .attr("font-family", font_family)
        .attr("display", "none")
        .attr("selected", false);

      // Add interactive option if not too many nodes
     //if (node_data.length < drag_size_limit) {
        node.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

        nodeLabel.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
      //};

      setSymbolSize();
      setSymbolColor();
      displayLabels();
      showLabels();

      // Restart simulation
      simulation = simulation
        .nodes(node_data)
        .on("tick", ticked);

      var data_size_factor = 1+node_data.length*node_data.length;

      simulation
            .force("link", d3.forceLink()
              .id(function(d) { return d.id;})
              .distance(function(d) {
                if (d.weight >= 0) {
                  return attractionScale(Math.abs(d.weight))/data_size_factor;
                } else {
                  return repulsionScale(Math.abs(d.weight))/data_size_factor;
                };
              })
              .strength(function(d) {
                if (d.weight >= 0) {
                  return repulsionScale(Math.abs(d.weight))/100;
                } else {
                  return attractionScale(Math.abs(d.weight))/100;
                };
              }));

      simulation.force("link")
        .links(link_data);

      simulation.alpha(0.5).restart();

      // Update links legend
      linkLegend = linkLegend.data([]);
      linkLegend.exit().remove();

      linkLegend = linkLegend
        .data(link_color)
        .enter().append("li")
        .attr("id", function(d) { return d[1];})
        .attr("class", "legend  legend-no-interaction")
        .attr("selected", 0)
        .attr("title", function(d) { return d[1];})

      linkLegendSpan = linkLegend.append("span")

      linkLegendSpanSvg = linkLegendSpan.append("svg")
        .attr("width", "25px")
        .attr("height", "10px")
        .style("margin-right", "5px")
        .style("overflow", "visible")

      linkLegendSpanSvg.append("rect")
        .attr("width", 25)
        .attr("height", 5)
        .attr("y", 2.5)
        .attr("stroke", "none")
        .attr("fill", function(d){return d[0]})

      linkLegendSpan.append("span")
        .html(function(d, i) { return ['Coeff. > ', 'Coeff. < -'][i]+weight_thres[i];})
    }

    // Nodes labels functions
    function displayLabels () {
      var selected_label = $(".node-label");
      selected_label.on("mouseenter", function() {
        d3.select(this.childNodes[1]).attr("display", "inline");
        d3.select(this.childNodes[0]).attr("stroke-opacity", 1);
      });
      selected_label.on("mouseleave", function() {
        if (this.childNodes[1].getAttribute("selected") == "false") {
            d3.select(this.childNodes[1]).attr("display", "none");
        };
        d3.select(this.childNodes[0]).attr("stroke-opacity", 0);
      });
      selected_label.on("click", function() {
        if (this.childNodes[1].getAttribute("selected") == "false") {    
          d3.select(this.childNodes[1]).attr("display", "inline");
          d3.select(this.childNodes[1]).attr("selected", true);
        } else {
          d3.select(this.childNodes[1]).attr("display", "none");
          d3.select(this.childNodes[1]).attr("selected", false);
        }
      });
    };

    // Model update function
    var updateEffect = function() {
      var keys = Object.keys(json.legend[$('#modelSelect').val()])
          new_data = [...Array(keys.length)];
      for (var i = 0; i < keys.length; i++) {
        new_data[i] = {label:keys[i], value:keys[i]}
      }
      $('#effectSelect').multiselect('dataprovider', new_data)
                        .multiselect("refresh");

      setSymbolColor();
    }

      // Display labels button
      var showLabels = function() {
        var label_text = d3.selectAll(".node-label").select(function(){ return this.childNodes[1];});
        if ($("#labelButton").is(':checked')) {
          label_text.attr("display", "inline");
          label_text.attr("selected", true);
        } else {
          label_text.attr("display", "none");
          label_text.attr("selected", false);
        };
      };

    // Search in labels
    var searchLabels = function() {
      $("#labelButton").attr("checked", false);
      var key = $("#searchInput").val().toUpperCase();
      if (key != '') {
        var selected = d3.selectAll(".node-label").filter(function(){return this.__data__.name.toUpperCase().indexOf(key.toUpperCase()) != -1 });
            non_selected = d3.selectAll(".node-label").filter(function(){return this.__data__.name.toUpperCase().indexOf(key.toUpperCase()) == -1 });
        selected.select(function(){ return this.childNodes[1];}).attr("display", "inline");
        selected.select(function(){ return this.childNodes[1];}).attr("selected", true);
        non_selected.select(function(){ return this.childNodes[1];}).attr("display", "none");
        non_selected.select(function(){ return this.childNodes[1];}).attr("selected", false);
      } else {
        to_free = d3.selectAll(".node-label");
        to_free.select(function(){return this.childNodes[1];}).attr("display", "none");
        to_free.select(function(){return this.childNodes[1];}).attr("selected", false);
      };
    };


    // Label button and search
    appendLabelCheckBox(buttons, "Show labels", "Labels", "labelButton", showLabels)
    appendSearchInput(buttons, "Search", "searchInput", searchLabels);


    // Select model
    var modelSelect = buttons.append("div")
      .attr("title", "Chose model")
      .attr("class", "form-group")

    modelSelect.append("label")
      .html("Color (model)")

    modelSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "modelSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .selectAll("option")
        .data(Object.keys(json.legend))
        .enter().append("option")
          .text(function (d){ return d;});

    $('#modelSelect').on('change', updateEffect);

    // Select effect
    var effectSelect = buttons.append("div")
      .attr("title", "Chose effect")
      .attr("class", "form-group")

    effectSelect.append("label")
      .html("Color (effect)")

    effectSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "effectSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .selectAll("option")
        .data(Object.keys(json.legend[$('#modelSelect').val()]))
        .enter().append("option")
          .text(function (d){ return d;});

    $('#effectSelect').on('change', setSymbolColor);

    // Select size
    var sizeSelect = buttons.append("div")
      .attr("title", "Chose size variable")
      .attr("class", "form-group")

    sizeSelect.append("label")
      .html("Radius")

    sizeSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "sizeSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .selectAll("option")

    $('#sizeSelect').on('change', setSymbolSize);

    // Button for link weight threshold
    var weightPvalThres = buttons.append("div")
      .attr("title", "Set a p-value cutoff for links.")
      .attr("class", "form-group")

    weightPvalThres.append("label")
      .html("Links p-value cutoff")

    weightPvalThres.append("input")
      .attr("id", "weightPvalThres")
      .attr("type", "number")
      .attr("class", "form-control form-number-field")
      .attr("min", 0)
      .attr("max", 1)
      .attr("step", 0.001)
      .attr("value", 1)
      .on("change", restart);

    var pThresRange = buttons.append("span")
      .attr("title", "Cut-off for positive correlations.")

    pThresRange.append("label")
        .append("p")
          .html("Pos. corr. cut-off <span style='white-space: nowrap'>(<i style='color:"+link_color[0][0]+"' class='fa fa-window-minimize icon-sim-link'></i>).</span>")

    pThresRange.append("input")
        .attr("id", "pThresRange")
        .attr("type", "range")
        .attr("class", "full-width")
        .attr("min", 0)
        .attr("max", 1)
        .attr("step", 0.05)
        .on("change", restart);
      $("#pThresRange").val('0.75')

    var nThresRange = buttons.append("span")
        .attr("title", "Cut-off for negative correlations.")

    nThresRange.append("label")
        .append("p")
          .html("Neg. corr. cut-off <span style='white-space: nowrap'>(<i style='color:"+link_color[1][0]+"' class='fa fa-window-minimize icon-sim-link'></i>).</span>")

      nThresRange.append("input")
        .attr("id", "nThresRange")
        .attr("type", "range")
        .attr("class", "full-width")
        .attr("min", 0)
        .attr("max", 1)
        .attr("step", 0.05)
        .on("change", restart);
      $("#nThresRange").val('0.75')

    setMultiselect('.figtool-multiselect');
    //resizeMultiselect('#d3-buttons', 1, '#d3-buttons', false);

    $('#sizeSelect').multiselect('dataprovider', sizeOptions)
                    .multiselect("refresh");

    restart();

  //});

};
