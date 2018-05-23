function similarityNetwork(id, legend_id, json0, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif", color_palette = d3.schemeCategory10) {

  // Size
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom;

  // Network selector
  var networkSelector = ["Primary dataset", "Secondary dataset", "Fusion (SNF)"];

  // Colors, symbols and scaling
  var colors = d3.scaleOrdinal(color_palette),
      sim_color = ["#999999", "Similarity"],
      symbols = d3.scaleOrdinal([d3.symbolCircle,
        d3.symbolSquare,
        d3.symbolTriangle,
        d3.symbolStar,
        d3.symbolDiamond,
        d3.symbolCross]),
      radius = 20,
      wRange = [0.1*radius, 0.9*radius];

  // General functions
  function getWeightExtrema(json, index=0, t="max", Abs=false) {
    var arr = [];
    for (var i = 0; i < json.length; i++) {
      if (Abs) {
        arr.push(Math.abs(json[i].weight[index]));
      } else {
        arr.push(json[i].weight[index]);
      };
    };

    if (t == "max") {
      return Math.max.apply(null, arr);
    } else if (t == "min") {
      return Math.min.apply(null, arr);
    };
  };

  function scale(fRange, value, iRange) {
    if (iRange[0] != iRange[1]) {
      return fRange[0] + (fRange[1] - fRange[0]) * (value - iRange[0]) / (iRange[1] - iRange[0]);
    } else {
      return (fRange[0] + fRange[1]) / 2;
    };
  };

      function organizeLegend(factor, SymSize, legendXSpace, legendYSpace) {
        var legend_ncol = Math.ceil(SymSize*factor.length/legendYSpace),
            legend_nrow = Math.ceil(factor.length/legend_ncol),
            legend_pos = [];
        for (var i = 0; i < legend_ncol; i++) {
          for (var j = 0; j < legend_nrow; j++) {
            if (legend_pos.length < factor.length) {
              legend_pos.push({x:i*legendXSpace/legend_ncol, y:j*SymSize});
            };
          };
        };
        return legend_pos.reverse();
      };

  // Buttons
  var buttons = d3.select("#d3-buttons")
  buttons.html("");

    buttons.append("p")
      .attr("title", "Node settings")
      .append("b")
      .html("Node settings")

  //$.getJSON(data, function(json0) {

    // Set variables depending only on the primary data

    // Make a working copy of the data
    var json = JSON.parse(JSON.stringify(json0));

    //////////////// Simulation ////////////////
       var simulation = d3.forceSimulation()
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("y", d3.forceY())
            .force("x", d3.forceX())
            .force("collide", d3.forceCollide()
              .radius(radius)
              .iterations(2)
              .strength(0.5))
            .force("charge", d3.forceManyBody()
              .strength(-100));

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

    colorLegendList.append("span").attr("id", "colorlegend-subtitle")

    colorLegendList = colorLegendList.append("ul")
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
        .attr("title", "Links")

    linkLegend.append("p").append("b")
        .html("Links")

    var linkLegendList = linkLegend.append("div")

    linkLegendList.append("span").attr("id", "linklegend-subtitle")

    linkLegendList = linkLegendList.append("ul")
        .style("list-style-type", "none")
        .style("padding", 0)
        .selectAll("ul")


    //////////////// Nodes color settings ////////////////
    var colorFactors = Object.keys(json.nodes[0]);
    colorFactors.splice(colorFactors.indexOf("id"), 1);
    colorFactors.splice(colorFactors.indexOf("name"), 1);
    colorFactors.push(null);

    var setSymbolColor = function() {
      var color_factor = $("#colorSelect").val(),
          color_labels = [];

      if (color_factor != "") {
        for (var i = 0; i < json0.nodes.length; i++) {
          if(color_labels.indexOf(json0.nodes[i][color_factor]) == -1) {
            color_labels.push(json0.nodes[i][color_factor]);
          };
        };
      };

      colors.domain(color_labels);

      // Set symbols color
      d3.selectAll(".coloured-symbol")
        .style("fill", function (d){
          if (color_factor != "")
            return colors(d[color_factor]);
          return colors("");
        });


      // Update legend

      colorLegendList = colorLegendList.data([]);
      colorLegendList.exit().remove();

      colorLegendList = colorLegendList
        .data(color_labels)
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

      $("#colorlegend-subtitle").html(color_factor)

    };

    //////////////// Nodes shape settings ////////////////
    var setSymbolShape = function() {
      var shape_factor = $("#symbolSelect").val(),
          shape_labels = [];

      if (shape_factor != "") {
        for (var i = 0; i < json0.nodes.length; i++) {
          if(shape_labels.indexOf(json0.nodes[i][shape_factor]) == -1) {
            shape_labels.push(json0.nodes[i][shape_factor]);
          };
        };
      };

      symbols.domain(shape_labels);

      // Set symbols shape
      d3.selectAll(".symbol")
        .attr("d", d3.symbol()
          .type(function (d){
            if (shape_factor != "")
              return symbols(d[shape_factor]);
            return symbols("");
          })
          .size(radius*radius));


      symLegendList = symLegendList.data([]);
      symLegendList.exit().remove();

      if (shape_labels.length > 0) {

      symLegendList = symLegendList
        .data(shape_labels)
        .enter().append("li")
        .style("word-wrap", "break-word")
        .attr("id", function(d) { return d;})
        .attr("title", function(d) { return d;})
        .attr("selected", 0)

      symLegendSvg = symLegendList.append("svg")
        .attr("width", "10px")
        .attr("height", "10px")
        .style("margin-right", "0.5rem")
        .style("overflow", "visible")
        .append("path")
          .attr("transform", "translate(5, 5)")
          .attr("d", d3.symbol()
            .type(function (d){ return symbols(d);})
            .size(75))
          .attr("stroke", "#333")
          .attr("fill-opacity", 0)

      symLegendList.append("span")
        .html(function(d) { return d;})

      $("#symlegend-subtitle").html(shape_factor)

      }

    };

    //////////////// Control buttons ////////////////



    //////////////// Link width settings ////////////////
    var setLinkWidth = function() {
      var wIndex = $("#networkSelect").val();

      var newMin = getWeightExtrema(json.links, wIndex, "min", Abs=true),
          newMax = getWeightExtrema(json.links, wIndex, "max", Abs=true);

      link
        .attr("stroke-width", function (d) {
          return scale(wRange, Math.abs(d.weight[wIndex]), [newMin, newMax]);
        });

      var force_factor = 1+json.nodes.length*json.nodes.length;

      simulation
            .force("link", d3.forceLink()
              .id(function(d) {return d.id;})
              .distance(function(d) {
                  return scale([100, 50], d.weight[wIndex], [newMin, newMax])/force_factor;
              })
              .strength(function(d) {
                  return scale([0.3, 1], d.weight[wIndex], [newMin, newMax]);
              }));
    };

    //////////////// Threshold settings ////////////////
    var filterThres = function() {
      var network = {index:$("#networkSelect").val(), label:$("#networkSelect option:selected").text()};

      var wMin = getWeightExtrema(json0.links, network.index, "min"),
          wMax = getWeightExtrema(json0.links, network.index, "max");


      // Filter links based on weight
      if (wMin > 0 || wMax > 0) {

        var similarity_thres = Number($("#sThresRange").val()),
            sThres = scale([0, wMax], similarity_thres, [0, 100]),
            sTxt = Math.round(sThres*wMax*100)/100;
      } else {
        var sThres = 0;
      };
      
      json.links = [];

      json0.links.forEach(function (d) {
        if (Number(d.weight[network.index]) > Number(sThres)) {
          json.links.push(JSON.parse(JSON.stringify(d))); 
        };
      });


      // Update links legend

      linkLegendList = linkLegendList.data([]);
      linkLegendList.exit().remove();

      linkLegendList = linkLegendList
        .data([sim_color])
        .enter().append("li")
        .style("word-wrap", "break-word")
        .attr("id", function(d) { return d[1];})
        .attr("title", function(d) { return d[1];})
        .attr("selected", 0)
        .append("span")
        .html(function(d, i) { return "<i style='color:"+d[0]+"' class='fa fa-window-minimize icon-sim-link'></i> "+'Similarity > '+sTxt;})

       $("#linklegend-subtitle").html("Network based on "+network.label)

    };


    //////////////// Restart function ////////////////
    var restart = function() {

    filterThres();
    
    // Update links
    link = link.data([]);
    link.exit().remove();

    link = link
      .data(json.links);

    link = link.enter()
      .append("line")
      .attr("class", "link-line")
      .attr("stroke-linecap", "round")
      .attr("stroke", sim_color[0]);

    // Update nodes
    node = node.data([]);
    node.exit().remove();

    node = node
      .data(json.nodes);

    node = node.enter()
      .append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .append("path")
      .attr("class", "coloured-symbol symbol")
      .attr("stroke", "white");


    // Update labels
    nodeLabel = nodeLabel.data([]);
    nodeLabel.exit().remove();

    nodeLabel = nodeLabel
      .data(json.nodes);

    nodeLabel = nodeLabel.enter()
      .append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .append("g")
      .attr("class", "node-label");

    nodeLabel.append("path")
      .attr("class", "symbol")
      .attr("stroke", "#333333")
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    nodeLabel.append("text")
      .text(function (d) {
        var label = d.name.split(";");
        if (label.length > 1) {
          return label[label.length-2] +";"+ label[label.length-1];
        } else {
          return label[0];
        };
      })
      .attr("text-anchor", "start")
      .attr("font-family", font_family)
      .attr("display", "none")
      .attr("selected", false);

    displayLabels(".node-label");
    showLabels();
    
    // Apply display settings
    setSymbolColor();
    setSymbolShape();
    setLinkWidth();

    simulation = simulation
      .nodes(json.nodes)
      .on("tick", ticked);
 
    simulation.force("link")
      .links(json.links);

    simulation.alpha(0.5).restart(); 

  };


    //////////////// Control buttons ////////////////

    // Display labels button
    var showLabels = function() {
      var label_sym = d3.selectAll(".node-label").select(function(){ return this.childNodes[0];}),
          label_text = d3.selectAll(".node-label").select(function(){ return this.childNodes[1];});
      if ($("#labelButton").is(':checked')) {
        label_text.attr("display", "inline");
        label_text.attr("selected", true);
      } else {
        label_text.attr("display", "none");
        label_text.attr("selected", false);
      };
    };

    appendLabelCheckBox(buttons, "Show labels", "Labels", "labelButton", showLabels)
    
    // Search in labels
    var searchLabels = function() {
      searchLabels2("#labelButton", "#searchInput", ".node-label")
    }
    appendSearchInput(buttons, "Search", "searchInput", searchLabels);


    // Select colors
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
        .on("change", setSymbolColor)
        .selectAll("option")
        .data(colorFactors)
        .enter().append("option")
          .text(function (d){ return d;});

    document.getElementById("colorSelect").value = colorFactors[0];

    // Button for node size
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
        .on("change", setSymbolShape)
        .selectAll("option")
        .data(colorFactors)
        .enter().append("option")
          .text(function (d){ return d;});

    document.getElementById("symbolSelect").value = colorFactors[colorFactors.length-1];



    buttons.append("p")
      .classed("pt-2", true)
      .attr("title", "Link settings")
      .style("border-top", "1px solid #ccc")
      .append("b")
      .html("Link settings")

    // Select network
    var networkSelect = buttons.append("div")
      .attr("title", "Chose network to show.")
      .attr("class", "form-group")

    networkSelect.append("label")
      .html("Similarity network based on:")

    networkSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "networkSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .on("change", restart)
        .selectAll("option")
        .data(networkSelector)
        .enter().append("option")
        .attr("value", function (d, i){ return i;})
          .text(function (d){ return d;});

    document.getElementById("networkSelect").value = 0;

    // Button for link weight threshold
    appendRange(buttons, "Cutoff for similarity links.", "Similarity link cutoff (% of max) <span style='white-space: nowrap'>(<i style='color:"+sim_color[0]+"' class='fa fa-window-minimize icon-sim-link'></i>).</span>", "sThresRange", 0, 100, 1, 75, restart)

    setMultiselect('.figtool-multiselect');
    //resizeMultiselect('#d3-buttons', 1, '#d3-buttons', false);
    $("#networkSelect").on("change", restart)
    $("#colorSelect").on("change", setSymbolColor)
    $("#symbolSelect").on("change", setSymbolShape)
 
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
    
  restart();

};
