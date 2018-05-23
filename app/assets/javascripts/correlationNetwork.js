function correlationNetwork(id, legend_id, json, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif", color_palette = d3.schemeCategory10) {

  // Size
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom;

  // Restrictions
  drag_size_limit = 80;
  display_size_limit = 150;

  // Colors, symbols and scaling
  var colors = d3.scaleOrdinal(color_palette),
      link_color = [["#999999", "Pos. correlation"],
                    ["#ff3385", "Neg. correlation"]],
      neutral_color = "#666666",
      signThres = [{value:0.001, opacity:0.9, text:'***'},
                   {value:0.01, opacity:0.7, text:'**'},
                   {value:0.05, opacity:0.5, text:'*'},
                   {value:0, opacity:0.1, text:'ns'},
                   {value:'NA', opacity:0.3, text:'na'}];
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
      sizeOptions = [{label:"", value:"", "title":""},
                     {label:"Node degree", value:"degree", title:"Node degree"},
                     {label:"Mean abundance", value:"mean", title:"Mean abundance"},
                     {label:"Max abundance", value:"max", title:"Max abundance"},
                     {label:"Min abundance", value:"min", title:"Min abundance"}
                    ];

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


    //////////////// Draw the figure ////////////////
    var legendContainer = d3.select("#"+legend_id)
      .classed('columns-1', true)

    var svg = d3.select("#"+id).append("svg")
      .attr("id", "svg-figure")
      .attr("class", "svg-figure")
      .style("border", "1px solid #ccc")
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
    var legend = legendContainer.append("ul")
      .attr("id", "svg-legend")
      .style("list-style-type", "none")
      .style("padding", 0)
      .style("font-family", font_family)

    var colorLegend = legend.append("li")
        .style("padding-bottom", "1rem")
        .attr("title", "Node color key")

    colorLegend.append("p").append("b")
        .html("Node color key")

    var colorLegendList = colorLegend.append("div")
        .append("ul")
        .style("list-style-type", "none")
        .style("padding", 0)
        .selectAll("ul")

    var symLegend = legend.append("li")
        .style("border-top", "1px solid #ccc")
        .style("padding-top", "1rem")
        .style("padding-bottom", "1rem")
        .attr("title", "Node symbol key")

    symLegend.append("p").append("b")
        .html("Node symbol key")

    var symLegendList = symLegend.append("div")

    symLegendList.append("span").attr("id", "symlegend-subtitle")

    symLegendList = symLegendList.append("ul")
        .style("list-style-type", "none")
        .style("padding", 0)
        .selectAll("ul")

    var linkLegend = legend.append("li")
        .style("border-top", "1px solid #ccc")
        .style("padding-top", "1rem")
        .style("padding-bottom", "1rem")
        .attr("title", "Link color key")

    linkLegend.append("p").append("b")
        .html("Link color key")

    var linkLegendList = linkLegend.append("div")

    linkLegendList.append("span").attr("id", "linklegend-subtitle")

    linkLegendList = linkLegendList.append("ul")
        .style("list-style-type", "none")
        .style("padding", 0)
        .selectAll("ul")

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
        .style("fill-opacity", function(d) {
            var p_value = d.stat[selected_model][selected_effect]['p-value'];
            for (var i = 0; i < signThres.length; i++) {
              if (isNaN(p_value) && p_value == signThres[i].value) {
                return signThres[i].opacity;
              }
              if (!isNaN(p_value) && p_value <= signThres[i].value) {
                return signThres[i].opacity;
              };
            };
          })

      // Update color legend
      colorLegendList = colorLegendList.data([]);
      colorLegendList.exit().remove();

      colorLegendList = colorLegendList
        .data(color_domain)
        .enter().append("li")
        .style("word-wrap", "break-word")
        .attr("id", function(d) { return d;})
        .attr("title", function(d) { return d;})
        .attr("selected", 0)

      var legend_svg_width = legend_svg_symsize*signThres.length;

      var colorLegendSvg = colorLegendList.append("svg")
        .style("margin-top", function(d, i) {
          if (i == 0)
            return "1rem";
          return 0;
        })
        .attr("width", legend_svg_width+"px")
        .attr("height", legend_svg_symsize+"px")
        .style("margin-right", "0.5rem")
        .style("overflow", "visible")

      for (var i = 0; i < signThres.length; i++) {
        // (V)(°,,,°)(V)

        colorLegendSvg.append("g")
          .attr("transform", "translate("+(i*legend_svg_width/signThres.length)+", -2)")
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("font-size", legend_svg_symsize+"px")
          .attr("y", legend_svg_symsize)
          .text(function(d, j){
            if (j == 0)
             return signThres[i]["text"];
          })

        colorLegendSvg.append("rect")
          .attr("transform", "translate("+(i*legend_svg_width/signThres.length)+", 0)")
          .attr("width", legend_svg_symsize)
          .attr("height", legend_svg_symsize)
          .attr("stroke", "none")
          .attr("fill", function (d){
            if (isNaN(signThres[i]["value"])) {
              return neutral_color;
            };
            return colors(d);
          })
          .attr("fill-opacity", signThres[i]["opacity"])

      };

      colorLegendList.append("span")
        .attr("id", function(d) { return "color-legend-text-"+d;})
        .html(function(d) { return "mean abundance higher in "+ d;})

    };

    //////////////// NODES SHAPE AND SIZE ////////////////
    var setSymbolSize = function() {
      var selected_size_factor = {value:$("#sizeSelect").val(), label:$("#sizeSelect option:selected").text()},
          symbols_domain = json.nodes.map(function (d){return d['data-type'];}).filter(unique),
          size = {};
      symbols.domain(symbols_domain);
      if (selected_size_factor.value != '') {

        for (var i = 0; i < symbols_domain.length; i++) {
          size[symbols_domain[i]] = {value:json.nodes.filter(function (d){return d['data-type'] == symbols_domain[i];}).map(function(d){return Number(d[selected_size_factor.value]);})};
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
            if (selected_size_factor.value != '') {
              sizeScale.domain([size[d['data-type']]['min'], size[d['data-type']]['max']]);
              d.r = sizeScale(d[selected_size_factor.value]);
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
      symLegendList = symLegendList.data([]);
      symLegendList.exit().remove();

      symLegendList = symLegendList
        .data(symbols_domain)
        .enter().append("li")
        .style("word-wrap", "break-word")
        .attr("id", function(d) { return d;})
        .attr("title", function(d) { return d;})
        .attr("selected", 0)

      var n_size = 1,
          legend_svg_width = legend_svg_symsize;
      if (selected_size_factor.value != '') {
        n_size = size_legend_data.length;
        legend_svg_width = legend_svg_symsize*size_legend_data.length;
      }

      symLegendSvg = symLegendList.append("svg")
        .attr("width", legend_svg_width+"px")
        .attr("height", legend_svg_symsize+"px")
        .style("margin-right", "0.5rem")
        .style("overflow", "visible")

      for (var i = 0; i < n_size; i++) {
        // (V)(°,,,°)(V)

        symLegendSvg.append("path")
          .attr("transform", "translate("+((2*legend_svg_symsize-size_legend_data[i])/2+i*legend_svg_width/n_size)+", "+legend_svg_symsize/2+")")
          .attr("d", d3.symbol()
            .type(function (d){ return symbols(d);})
            .size(size_legend_data[i]*size_legend_data[i]))
          .attr("stroke", "#333")
          .attr("fill-opacity", 0)

      };

      $("#symlegend-subtitle").html(selected_size_factor.label)

      symLegendList.append("span")
        .html(function(d) { return d;})

    }

    //////////////// RESTART ////////////////
    var restart = function() {

      var weight_thres = [Number($("#pThresRange").val()), Number($("#nThresRange").val())],
          weight_p_value_thres = $("#weightPvalThres").val(),
          link_data = JSON.parse(JSON.stringify(json.links.filter(function(d){
            if (d.weight >= 0) {
              return (d.weight >= weight_thres[0] && d['p-value'] <= weight_p_value_thres);
            }
            return (d.weight <= weight_thres[1] && d['p-value'] <= weight_p_value_thres);
          })));
          getNodeDegree(link_data, json.nodes);

      var kept_node = link_data.map(function(d){return d['source'];}).concat(link_data.map(function(d){return d['target'];})).filter(unique);
      if (kept_node.length > display_size_limit) {
        alert("This network is too large to be displayed:\n\
The max size is "+display_size_limit+" nodes.")
        return 0;
      }

      var node_data = JSON.parse(JSON.stringify(json.nodes.filter(function(d){return kept_node.indexOf(d.id) != -1;}))),
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
     if (node_data.length < drag_size_limit) {
        node.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

        nodeLabel.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
      } else {
        alert("The node dragging option has been disabled on this network as it has more than "+drag_size_limit+" nodes.")
      }

      setSymbolSize();
      setSymbolColor();
      displayLabels(".node-label");
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
      linkLegendList = linkLegendList.data([]);
      linkLegendList.exit().remove();

      linkLegendList = linkLegendList
        .data(link_color)
        .enter().append("li")
        .style("word-wrap", "break-word")
        .attr("id", function(d) { return d[1];})
        .attr("title", function(d) { return d[1];})
        .attr("selected", 0)
        .append("span")
        .html(function(d, i) { return "<i style='color:"+d[0]+"' class='fa fa-window-minimize icon-sim-link'></i> "+['Corr. coeff. > ', 'Corr. coeff. < '][i]+weight_thres[i];})

       $("#linklegend-subtitle").html("Corr. p-value <= "+weight_p_value_thres)

    }

    // Nodes labels functions
    function displayLabels (labels) {
      $(labels).on("mouseenter", function() {
        d3.select(this.childNodes[1]).attr("display", "inline");
        d3.select(this.childNodes[0]).attr("stroke-opacity", 1);
      });
      $(labels).on("mouseleave", function() {
        if (this.childNodes[1].getAttribute("selected") == "false") {
            d3.select(this.childNodes[1]).attr("display", "none");
        };
        d3.select(this.childNodes[0]).attr("stroke-opacity", 0);
      });
      $(labels).on("click", function() {
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

    buttons.append("p")
      .attr("title", "Node settings")
      .append("b")
      .html("Node settings")

    appendLabelCheckBox(buttons, "Show labels", "Labels", "labelButton", showLabels)
    
    // Search in labels
    var searchLabels = function() {
      searchLabels2("#labelButton", "#searchInput", ".node-label")
    }
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

    buttons.append("p")
      .classed("pt-2", true)
      .attr("title", "Link settings")
      .style("border-top", "1px solid #ccc")
      .append("b")
      .html("Link settings")

    // Button for link weight threshold
    var weightPvalThres = buttons.append("div")
      .attr("title", "Set a p-value cutoff for links.")
      .attr("class", "form-group")

    weightPvalThres.append("label")
      .html("P-value cutoff")

    weightPvalThres.append("input")
      .attr("id", "weightPvalThres")
      .attr("type", "number")
      .attr("class", "form-control form-number-field")
      .attr("min", 0)
      .attr("max", 1)
      .attr("step", 0.001)
      .attr("value", 1)
      .on("change", restart);

    appendRange(buttons, "Cutoff for positive correlations.", "Pos. corr. cutoff <span style='white-space: nowrap'>(<i style='color:"+link_color[0][0]+"' class='fa fa-window-minimize icon-sim-link'></i>).</span>", "pThresRange", 0, 1, 0.01, 0.95, restart)

    appendRange(buttons, "Cutoff for negative correlations.", "Neg. corr. cutoff <span style='white-space: nowrap'>(<i style='color:"+link_color[1][0]+"' class='fa fa-window-minimize icon-sim-link'></i>).</span>", "nThresRange", -1, 0, 0.01, -0.95, restart)

    setMultiselect('.figtool-multiselect');
    //resizeMultiselect('#d3-buttons', 1, '#d3-buttons', false);

    $('#sizeSelect').multiselect('dataprovider', sizeOptions)
                    .multiselect("refresh");

    restart();

  //});

};
