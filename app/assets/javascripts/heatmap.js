function heatMap(id, legend_id, json, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif") {

  // Size
  var margin = {top: 10, right: 200, bottom: 200, left: 10},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom,
      dendrogram_space = 30,
      dendrogram_margin = 3,
      color_bar_size = 12,
      color_bar_margin = 3,
      max_sidebars = 10;

  // Colors and symbols
  var heatmapColorRange = ["#3366ff", "#f2ffe6", "#ff0066"],
      topbarColors = d3.scaleOrdinal(d3.schemeCategory20),
      sidebarColors = {"p-values":d3.scaleLinear()
                            .range(["#e6ffff", "#ffe6e6", "#ff8080", "#ff0000"])
                            .domain([1, 0.05, 0.01, 0.001]),
                       "correlations":d3.scaleLinear()
                            .range(["#990000", "#ffffe6", "#009900"])
                            .domain([-1, 0, 1]),
                       "levels":d3.scaleOrdinal(d3.schemeCategory20)
                       },
      selector_opacity = 0.5;

  // Legend
  var color_scale_labels = ["min", "mean", "max"],
      color_scale_width = 100,
      color_scale_font_size = 11;

  // General functions
  function getHeatmapRowsExtrema(heatmap, which) {
    var nrow = heatmap[0].value.length,
        extrema = [...Array(nrow)];
    for (var i = 0; i < nrow; i++) {
      var ncol = heatmap.length,
          row = [...Array(ncol)];
      for (var j = 0; j < ncol; j++) {
        row[j] = heatmap[j].value[i];
      };
      row = row.filter(function(d){return !isNaN(d)})
      
      if (which == "min") {
        extrema[i] = Math.min.apply(null, row);
      } else if (which == "max") {
        extrema[i] = Math.max.apply(null, row);
      } else if (which == "median") {
        row.sort();
        if (row.length % 2 == 0) {
          extrema[i] = (Number(row[row.length/2])+Number(row[1+row.length/2]))/2;
        } else {
          extrema[i] = row[1+(row.length-1)/2];
        }
      } else if (which == "mean") {
         var sum = 0;
         row.forEach(function(d){sum = sum+Number(d);});
         extrema[i] = Number(sum)/row.length;
      }
    };
    return extrema;
  };

  function normalizeHeatmapColors(colorRange, Min, Max, Middle) {
    var nrow = Min.length,
        normalized_color = [...Array(nrow)];
    for (var i = 0; i < nrow; i++) {
      var color = d3.scaleLinear()
                    .range(colorRange)
                    .domain([Min[i], Middle[i], Max[i]]);
      normalized_color[i] = color;
    };
    return normalized_color;
  };

  function generatePvalFilter(data, thres) {

    var bool = [...Array(data[0]['value'].length)].fill(0),
        index = [...Array(data[0]['value'].length)].fill(0),
        count = 0;
    data.forEach(function(d){
      d.value.forEach(function(d, i) {
        if (d <= thres) {
          bool[i] = 1;
        }
      })
    })
    bool.forEach(function(d, i){
      if (d == 1) {
        index[i] = count;
        count += 1;
      }
    })

    return {bool:bool, index:index};
  }

  function countReplicates(arr, x) {
    var count = 0;
    arr.forEach(function (d){
      if (d == x) {
        count += 1;
      };
    });
    return count;
  };

  function unique(arr) {
    var u = [];
    arr.forEach(function(d){
      if (u.indexOf(d) == -1) {
        u.push(d);
      }
    })
    return u;
  }

  function getLevels(names) {
    var arr = [];
    arr.push({"name":"level1", "value":[]});
    for (var i = 0; i < names.length; i++) {
      var nlevels = names[i].split(";").length;
      for (var j = 0; j < nlevels; j++) {
        if (j > arr.length) {
          arr.push({"name":"level"+j, "value":[]});
        };
      };
    };
    for (var i = 0; i < names.length; i++) {
      var names_a = names[i].split(";");
      for (var j = 0; j < arr.length; j++) {
        if (names_a.length > j) {
          arr[j].value.push(names_a[j]);
        } else {
          arr[j].value.push("Unknown");
        };
      };
    };
    return arr;
  };

  // Buttons
  var buttons = d3.select("#d3-buttons");
  buttons.html("");

  //$.getJSON(data, function(json) {


    // Set variables depending only on the json
    var rowMin = getHeatmapRowsExtrema(json.heatmap, "min"),
        rowMax = getHeatmapRowsExtrema(json.heatmap, "max"),
        rowMean = getHeatmapRowsExtrema(json.heatmap, "mean"),
        heatmapColors = normalizeHeatmapColors(heatmapColorRange, rowMin, rowMax, rowMean),
        nrow = json.heatmap[0].value.length,
        topbar_data = json.topbar.category,
        ntopbar = topbar_data.length,
        top_space = dendrogram_space+dendrogram_margin+color_bar_size*ntopbar+color_bar_margin;
    // Add levels as an optional sidebar
    json.sidebar["levels"] = getLevels(json.rownames);


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

    // Draw heatmap
    var heatmap = svg.selectAll()
      .data(json.heatmap)
      .enter().append("g")

      heatmap.selectAll("rect")
        .data(function(d, i) {
          d.index = i;
          return d.value;
        }).enter()
        .append("rect")
          .attr("x", width/2)
          .attr("y", height/2)
          .style("fill", function(d, i) { return heatmapColors[i](d);});

    // Draw dendrograms
    var colDendrogram = svg.selectAll(),
        rowDendrogram = svg.selectAll(),
        dendrogram = d3.cluster()
          .separation(function(a, b) {
            return 1;
          });

    // Draw topbar
    var topbar = svg.selectAll()
      .data(topbar_data)
      .enter().append("g")

    var topbarSquares = topbar.selectAll("g")
      .data(function(d, i) {
        d.index = i;
        return d.value;
      })
      .enter()
      .append("g")
      .attr("transform", function (d, i) { return "translate(" + (width/2) + "," + (height/2) + ")";});

      topbarSquares.append("rect")
        .attr("height", color_bar_size)
        .style("fill", function (d) {
          if (d == "NA") {
            return "lightgrey";
          };
          return topbarColors(d);
        });

    topbar.append("text")
      .attr("x", width)
      .attr("y", function(d, i){
        return (dendrogram_space+dendrogram_margin+color_bar_size*i+color_bar_size);
      })
      .attr("font-size", color_bar_size)
      .text(function(d){return d.name;})

    // Draw sidebar
    var sidebar = svg.selectAll(),
        sidebarSquares = null;

    // Add heatmap labels
    var colLabel = svg.selectAll()
        .data(json.colnames)
        .enter().append("g")
        .attr("transform", "translate("+ (width/2) +", "+ height +")");

    colLabel.append("text")
      .attr("class", "col-label")
      .attr("text-anchor", "end")
      .attr("font-family", font_family)
      .attr("transform", "rotate(-90)")
      .attr("display", "none")
      .text(function (d) { return d;});

    var rowLabel = svg.selectAll()
      .data(json.rownames)
      .enter().append("g")
      .attr("class", "rowLabel")
      .attr("transform", "translate("+ width +", "+ (height/2) +")")

    var rowLabelBox = rowLabel.append("rect")
        .attr("class", "row-label-box")
        .attr("fill", "yellow")
        .attr("fill-opacity", 0)
        .attr("y", 0)

    var rowLabelText = rowLabel.append("text")
        .attr("class", "row-label heatmap-label")
        .attr("text-anchor", "end")
        .attr("filtered", 'false')
        .attr("selected", 'false')
        .attr("mass-selected", 'false')
        .attr("display", "none")
        .attr("x", margin.right)
        .attr("font-family", font_family)
        .text(function (d) {
          var label = d.split(';');
          if (label.length > 1) {
            return label[label.length - 2]+"; "+label[label.length - 1];
          };
          return d;
        })

    // Add legend
    var legend = legendContainer.append("ul")
      .attr("id", "svg-legend")
      .style("list-style-type", "none")
      .style("padding", 0)
      .style("font-family", font_family)

    // Add color scale to legend
    var colorScale = legend.append("li")
        .style("padding-bottom", "1rem")
        .attr("title", "Color scale")
        .attr("class", "legend  legend-no-interaction")
        .style("margin-bottom", (color_scale_font_size+15)+"px")

    colorScale.append("p").append("b")
      .html("Color scale")

    var colorScaleSvg = colorScale.append("svg")
      .attr("width", color_scale_width)
      .attr("height", "20px")
      .style("margin-right", "15px")
      .style("overflow", "visible")
      .style("margin-left", "15px")


    var colorScaleSvgDefs = colorScaleSvg.append("defs")

    var linearGradient = colorScaleSvgDefs.append("linearGradient")
      .attr("id", "linear-gradient");

    linearGradient.append("stop") 
      .attr("offset", "0%")   
      .attr("stop-color", heatmapColorRange[0]);

    linearGradient.append("stop") 
      .attr("offset", "50%")   
      .attr("stop-color", heatmapColorRange[1]);

    linearGradient.append("stop") 
      .attr("offset", "100%")   
      .attr("stop-color", heatmapColorRange[2]);

    colorScaleSvg.append("rect")
	    .attr("width", color_scale_width)
	    .attr("height", 20)
	    .style("fill", "url(#linear-gradient)")
      .style("stroke", "#ccc")

    colorScaleSvgLabel = colorScaleSvg.append("g")
      .selectAll()
      .data(color_scale_labels)
      .enter()

    colorScaleSvgLabel.append("rect")
      .attr("y", 20)
      .attr("x", function(d, i) {
        if (i == 0) {
          return i*color_scale_width/(color_scale_labels.length-1);
        }
        return i*color_scale_width/(color_scale_labels.length-1)-1;
       })
	    .attr("width", 1)
	    .attr("height", 4)
	    .style("fill", "#333");

    colorScaleSvgLabel.append("text")
      .attr("y", 26+color_scale_font_size)
      .attr("x", function(d, i){return i*color_scale_width/(color_scale_labels.length-1);})
      .attr("font-size", color_scale_font_size)
      .attr("text-anchor", "middle")
	    .text(function(d){return d;})

    colorScale.append("text")
      .attr("font-family", font_family)
	    .text("z-score");

    // Add topbar legend
    var topbarLegend = legend.append("li")
        .style("border-top", "1px solid #ccc")
        .style("padding-top", "1rem")
        .style("padding-bottom", "1rem")
        .attr("title", "Topbar color key")

    topbarLegend.append("p").append("b")
      .html("Topbar color key")

    for (var i = 0; i < json.topbar.category.length; i++) {

      var topbarData = unique(json.topbar.category[i].value);

      var topbarLegendList = topbarLegend.append("div")
        .html(json.topbar.category[i].name)
        .append("ul")
        .style("list-style-type", "none")
        .style("padding", 0)
        .selectAll("ul")
        .data(topbarData)
        .enter().append("li")
        .style("word-wrap", "break-word")
        .attr("id", function(d) { return d;})
        .attr("title", function(d) { return d;})

      topbarLegendList.append("svg")
        .style("margin-right", "1rem")
        .attr("width", "10px")
        .attr("height", "10px")
        .append("rect")
        .attr("width", "10px")
        .attr("height", "10px")
        .attr("fill", function(d) { return topbarColors(d); })

      topbarLegendList.append("span")
        .html(function(d) {return d;});
    }

    // Add sidebar legend
    var sidebarLegend = legend.append("li")
        .style("border-top", "1px solid #ccc")
        .style("padding-top", "1rem")
        .style("padding-bottom", "1rem")
        .attr("title", "Sidebar colors")



    //////////////// Restart function ////////////////
    var restart = function() {

      var selected_sidebar = $("#sidebarSelect").val(),
          selected_model = $("#modelSelect").val();

      // Filter data
      var p_thres = 1 //$("#pThreshold").val(),
          sign_filter = generatePvalFilter(json.sidebar["p-values"][selected_model], p_thres),
          nsign = countReplicates(sign_filter.bool, 1);
      var nsidebar = 0;

      if (selected_sidebar != '') {
        if (Object.keys(json.sidebar[selected_sidebar]).indexOf(selected_model) != -1) {
          nsidebar = json.sidebar[selected_sidebar][selected_model].length;
        } else {
          nsidebar = json.sidebar[selected_sidebar].length;
        }
      };

      if (nsidebar > max_sidebars) {
        alert("Sorry, the sidebar is too big to be displayed:\nThere are "+nsidebar+" bars but max "+max_sidebars+" can be displayed.")
        selected_sidebar = '';
        nsidebar = 0;
      }
      var left_space = dendrogram_space+dendrogram_margin+color_bar_size*nsidebar+color_bar_margin;

      // Update the heatmap
      var squareWidth = (width-left_space)/json.heatmap.length,
          squareHeight = 0;
      if (nsign != 0) {
        squareHeight = (height-top_space)/nsign;
      };

      heatmap.selectAll("rect")
        .transition().duration(150)
        .attr("x", function(d) {
          return left_space+squareWidth*(this.parentNode.__data__.index);
        })
        .attr("y", function(d, i) {
          if (sign_filter.bool[i] == 1) {
            return top_space+squareHeight*sign_filter.index[i];
          }
          return height/2;
        })
        .attr("width", squareWidth)
        .attr("height", function(d, i) {
          return sign_filter.bool[i]*squareHeight;
        })

      // Update dendrogram for columns
      dendrogram.size([width-left_space, dendrogram_space]);

      colDendrogram = colDendrogram.data([]);
      colDendrogram.exit().remove();

      colDendrogram = colDendrogram
        .data(dendrogram(d3.hierarchy(json.colDendrogram)).descendants().slice(1))
        .enter().append("path")
          .attr("d", function(d) {
            return "M" + (d.x+left_space) + "," + d.y
            + "V" + d.parent.y  + "H" + (d.parent.x+left_space);
          })
          .attr("fill", "none")
          .attr("stroke", "#999999");

      // Update dendrogram for rows
      rowDendrogram = rowDendrogram.data([]);
      rowDendrogram.exit().remove();

      if (nsign == nrow) {

        dendrogram.size([height-top_space, dendrogram_space]);

        rowDendrogram = rowDendrogram
          .data(dendrogram(d3.hierarchy(json.rowDendrogram)).descendants().slice(1))
          .enter().append("path")
            .attr("d", function(d) {
              return "M" + d.y + "," + (d.x+top_space)
              + "H" + d.parent.y  + "V" + (d.parent.x+top_space);
            })
            .attr("fill", "none")
            .attr("stroke", "#999999");

      }

      // Update topbar
      topbarSquares
        .transition().duration(150)
        .attr("transform", function (d, i) { return "translate(" + (left_space+i*squareWidth) + "," + (dendrogram_space+dendrogram_margin+color_bar_size*(this.parentNode.__data__.index)) + ")";});

      topbarSquares.selectAll("rect")
        .attr("width", squareWidth)

      // Update sidebar
      sidebar = sidebar.data([]);
      sidebar.exit().remove();

      if (selected_sidebar != '') {
        sidebar = sidebar
         .data(function(){
           if (Object.keys(json.sidebar[selected_sidebar]).indexOf(selected_model) != -1) {
             return json.sidebar[selected_sidebar][selected_model];
           } else {
             return json.sidebar[selected_sidebar];
           }
         })
         .enter().append("g")

        sidebarSquares = sidebar.selectAll("g")
          .data(function(d, i) {
             d.index = i;
             if (selected_sidebar == 'levels') {
               sidebarColors[selected_sidebar].domain(unique(d.value));
             }
             return d.value;
          })
          .enter()
          .append("g")
          .attr("transform", function (d, i) {
            if (sign_filter.bool[i] == 1) {
              return "translate(" + (dendrogram_space+dendrogram_margin+color_bar_size*(this.parentNode.__data__.index)) + "," + (top_space+squareHeight*sign_filter.index[i]) + ")";
            }
            return "translate(" + (dendrogram_space+dendrogram_margin+color_bar_size*(this.parentNode.__data__.index)) + "," + (height/2) + ")";
          })

        sidebarSquares.append("rect")
          .attr("width", color_bar_size)
          .attr("height", function(d, i) {
            return sign_filter.bool[i]*squareHeight;
          })
          .attr("fill", function(d) {
            return sidebarColors[selected_sidebar](d);
          })

        // Add sidebar labels
        sidebar.append("g")
          .attr("transform", function(d, i){
            return "translate("+(dendrogram_space+dendrogram_margin+color_bar_size+color_bar_size*i)+","+(height+5)+")";
          })
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("text-anchor", "end")
          .attr("font-size", color_bar_size)
          .text(function(d){return d.name;})

      }

      // Update column labels
      colLabel
        .transition().duration(150)
        .attr("transform", function (d, i) { return "translate(" + (left_space+i*squareWidth+squareWidth) + "," + height + ")";})

      // Update row labels
      rowLabel
        .transition().duration(150)
        .attr("transform", function (d, i) {
          if (sign_filter.bool[i] == 1) {
            return "translate("+ width +", "+ (top_space+squareHeight*sign_filter.index[i]) +")";
          };
          return "translate("+ width +", "+ (height/2) +")";
        })

      rowLabelBox
        .attr("fill-opacity", function(d, i){
          if (sign_filter.bool[i] == 0) {
            return 0;
          }
          return this.getAttribute("fill-opacity");
        })
        .attr("x", left_space-width)
        .attr("width", width-left_space)
        .attr("height", function (d, i) {
          if (sign_filter.bool[i] == 0) {
            return 0;
          };
          return squareHeight;
        })

      rowLabelText
        .attr("display", function(d, i){
          if (sign_filter.bool[i] == 0) {
            return "none";
          }
          return this.getAttribute("display");
        })
        .attr("selected", function(d, i){
          if (sign_filter.bool[i] == 0) {
            return 'false';
          }
          return this.getAttribute("selected");
        })
        .attr("mass-selected", function(d, i){
          if (sign_filter.bool[i] == 0) {
            return 'false';
          }
          return this.getAttribute("mass-selected");
        })
        .attr("filtered", function (d, i) {
          if (sign_filter.bool[i] == 0) {
            return 'true';
          };
          return 'false';
        })
        .attr("y", squareHeight/2)

    }

    // Sidebar update function
    var updateSidebar = function(){

      sidebarLegend.html('')

      var selected_sidebar = $("#sidebarSelect").val();

      if (selected_sidebar == '') {
        restart();
        return 0;
      }

      // For linear scales
      if (sidebarColors[selected_sidebar].domain().length > 0) {

        var selected_sidebar_domain = sidebarColors[selected_sidebar].domain(),
            selected_sidebar_range = sidebarColors[selected_sidebar].range();

        sidebarLegend
          .append("p").append("b")
            .html("Sidebar color scale")

        var sideBarColorScaleSvg = sidebarLegend.append("svg")
          .attr("width", color_scale_width)
          .attr("height", "20px")
          .style("margin-left", "15px")
          .style("margin-right", "15px")
          .style("overflow", "visible")

        var sideBarColorScaleSvgDefs = sideBarColorScaleSvg.append("defs")

        var linearGradient = sideBarColorScaleSvgDefs.append("linearGradient")
          .attr("id", "sidebar-linear-gradient");

        for (var i = 0; i < selected_sidebar_domain.length; i++) {
          linearGradient.append("stop")
            .attr("offset", (i*100/(selected_sidebar_domain.length-1))+"%")   
            .attr("stop-color", selected_sidebar_range[i]);
        }

        sideBarColorScaleSvg.append("rect")
	        .attr("width", color_scale_width)
	        .attr("height", 20)
	        .style("fill", "url(#sidebar-linear-gradient)")
          .style("stroke", "#ccc")

        sideBarColorScaleSvgLabel = sideBarColorScaleSvg.append("g")
          .selectAll()
          .data(selected_sidebar_domain)
          .enter()

        sideBarColorScaleSvgLabel.append("rect")
          .attr("y", 20)
          .attr("x", function(d, i) {
            if (i == 0) {
              return i*color_scale_width/(selected_sidebar_domain.length-1);
            }
            return i*color_scale_width/(selected_sidebar_domain.length-1)-1;
          })
	        .attr("width", 1)
	        .attr("height", 4)
	        .style("fill", "#333");

        sideBarColorScaleSvgLabel.append("text")
          .attr("y", 26+color_scale_font_size)
          .attr("x", function(d, i){return i*color_scale_width/(selected_sidebar_domain.length-1);})
          .attr("font-size", color_scale_font_size)
          .attr("text-anchor", "middle")
	        .text(function(d){return d;})

        sidebarLegend.append("text")
          .attr("font-family", font_family)
	        .text(selected_sidebar);

      } else {
      // For ordinal scales

        sidebarLegend.style("margin-left", "0px")
        .style("margin-top", "0px")
        .append("p").append("b")
          .html("Sidebar color key")

        for (var i = 0; i < json.sidebar[selected_sidebar].length; i++) {

          var sideBarData = unique(json.sidebar[selected_sidebar][i].value);
          sidebarColors[selected_sidebar].domain(sideBarData);

          var sidebarLegendList = sidebarLegend.append("div")
            .html(json.sidebar[selected_sidebar][i].name)
            .append("ul")
            .style("list-style-type", "none")
            .style("padding", 0)
            .selectAll("ul")
            .data(sideBarData)
            .enter().append("li")
            .style("word-wrap", "break-word")
            .attr("id", function(d) {return d;})
            .attr("title", function(d) {return d;})


            sidebarLegendList.append("svg")
              .style("margin-right", "1rem")
              .attr("width", "10px")
              .attr("height", "10px")
              .append("rect")
              .attr("width", "10px")
              .attr("height", "10px")
              .attr("fill", function(d) { return sidebarColors[selected_sidebar](d); })

            sidebarLegendList.append("span")
             .html(function(d) {return d;});
     }


      }

      restart();
    }


    // Label selection function
    function selectLabel (id) {
      $("."+id).on("mouseenter", function(d) {
        d3.select(this.childNodes[1]).attr("display", "inline");
        d3.select(this.childNodes[0]).attr("fill-opacity", selector_opacity);
      });
      $("."+id).on("mouseleave", function(d) {
        d3.select(this.childNodes[0]).attr("fill-opacity", 0);
        if (this.childNodes[1].getAttribute("selected") == 'false') {
          d3.select(this.childNodes[1]).attr("display", "none");
        }
      });
      $("."+id).on("click", function(d) {
        if (this.childNodes[1].getAttribute("selected") == 'false') {    
          d3.select(this.childNodes[1]).attr("display", "inline");
          d3.select(this.childNodes[1]).attr("selected", 'true');
        } else {
          d3.select(this.childNodes[1]).attr("display", "none");
          d3.select(this.childNodes[1]).attr("selected", 'false');
        }
      });
    };

    // Display labels button
    var showColLabel = function() {
      var label = d3.selectAll(".col-label");
      if ($("#colLabelButton").is(':checked')) {
        label.attr("display", "inline");
      } else {
        label.attr("display", "none");
      };
    };

    appendLabelCheckBox(buttons, "Show columns labels", "Col. labels", "colLabelButton", showColLabel)

    var showRowLabel = function() {
      var label = d3.selectAll(".row-label").filter(function(){return this.getAttribute("filtered") == 'false'});
      if ($("#rowLabelButton").is(':checked')) {
        label.attr("display", "inline");
        label.attr("selected", 'true');
        label.attr("mass-selected", 'true');
      } else {
        label.attr("display", "none");
        label.attr("selected", 'false');
        label.attr("mass-selected", 'false');
      };
    };

    appendLabelCheckBox(buttons, "Show rows labels", "Rows labels", "rowLabelButton", showRowLabel)

    // Search in labels
    var searchLabels = function() {
      searchLabels1("#rowLabelButton", "#searchInput", ".row-label")
    }
    appendSearchInput(buttons, "Search", "searchInput", searchLabels);

    // Select model
    var modelSelect = buttons.append("div")
      .attr("title", "Chose a model.")
      .attr("class", "form-group")

    modelSelect.append("label")
      .html("Model")

    modelSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "modelSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .selectAll("option")
        .data(Object.keys(json.sidebar['p-values']))
        .enter().append("option")
          .text(function (d){ return d;});
    $("#modelSelect").on("change", restart)

    // Select sidebar
    var sidebarSelect = buttons.append("div")
      .attr("title", "Chose a sidebar.")
      .attr("class", "form-group")

    sidebarSelect.append("label")
      .html("Sidebar")

    sidebarSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "sidebarSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .selectAll("option")
        .data(Object.keys(json.sidebar).concat(''))
        .enter().append("option")
          .text(function (d){ return d;});
    $("#sidebarSelect").on("change", updateSidebar)

    // Select p-value cutoff
/*
    var pThreshold = buttons.append("div")
      .attr("title", "Set a p-value cutoff.")
      .attr("class", "form-group")

    pThreshold.append("label")
      .html("P-value cutoff")

    pThreshold.append("input")
      .attr("id", "pThreshold")
      .attr("type", "number")
      .attr("class", "form-control form-number-field")
      .attr("min", 0)
      .attr("max", 1)
      .attr("step", 0.001)
      .attr("value", 1)
      .on("change", restart);
*/



    setMultiselect('.figtool-multiselect');
    //resizeMultiselect('#d3-buttons', 1, '#d3-buttons', false);

    restart();
    selectLabel("rowLabel");
    updateSidebar();
  //});

};
