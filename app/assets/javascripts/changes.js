function foldChange(id, legend_id, json, W = 600, H = 600, font_family = "verdana, arial, helvetica, sans-serif") {

  // Size
  var margin = {top: 10, right: 10, bottom: 75, left: 75},
      width = W - margin.left - margin.right,
      height = H - margin.top - margin.bottom,
      xPadding = [0.07, 0.07],
      yPadding = [0.07, 0.07],
      axis_margin = 50;

  // Colors and stuff
  var colors = {pos:"#FF0039",
                neg:"#0031FF",
                neutral:"#666666"},
      baseline_opacity = 0.5,
      signThres = [{value:-Math.log2(0.001), opacity:0.9, text:'***'},
                   {value:-Math.log2(0.01), opacity:0.7, text:'**'},
                   {value:-Math.log2(0.05), opacity:0.5, text:'*'},
                   {value:0, opacity:0.1, text:'ns'},
                   {value:'NA', opacity:0.3, text:'na'}];

  // General functions
  function getValuesExtrema(values, selected, which='max') {
    var val = [];
    for (var i = 0; i < values.length; i++) {
      if (['-Inf', 'Inf', 'NA', 'NaN', ''].indexOf(values[i][selected]) == -1) {
        val.push(values[i][selected]);
      }
    }

    if (which == 'min') {
      return Math.min.apply(null, val);
    } else if (which == 'max') {
      return Math.max.apply(null, val);
    }
  };

  // Buttons
  var buttons = d3.select("#d3-buttons");
  buttons.html("");


  //$.getJSON(data, function(json) {

    var model_choice = Object.keys(json.data),
        effect_choice0 = Object.keys(json.data[model_choice[0]]),
        comp_choice0 = Object.keys(json.data[model_choice[0]][effect_choice0[0]]),
        axis_choice_x = Object.keys(json.data[model_choice[0]][effect_choice0[0]][comp_choice0[0]][0]),
        axis_choice_y = axis_choice_x.slice();
        axis_choice_y.push('');

    //////////////// Draw plot ////////////////
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

    // Draw points
    var plot = svg.selectAll(),
        plotLabel = svg.selectAll();

    // Draw axis
    var xAxis = svg.append("g")
      .attr("transform", "translate(0," + height + ")");

    var xAxisLegend = svg.append("g")
      .attr("transform", "translate("+ width/2 +", "+ (height+axis_margin) +")")

    var yAxis = svg.append("g")

    var yAxisLegend = svg.append("g")
      .attr("transform", "translate("+ -axis_margin +", "+ height/2 +")")

    // Add legend
    var legend = legendContainer.append("div")
      .attr("id", "svg-legend")
      .style("font-family", font_family)

    legend.append("p")
      .html("Color key")

    var colorLegend = legend.append("ul")
      .style("list-style-type", "none")
      .style("padding-top", "25px")
      .selectAll("ul")
      .data(["pos", "neg"])
        .enter().append("li")
        .attr("id", function(d) { return d;})
        .attr("class", "legend  legend-no-interaction")
        .attr("selected", 0)
        .attr("title", function(d) { return d;})

      colorLegendSpan = colorLegend.append("span")

      var legend_svg_symsize = 15,
          legend_svg_width = legend_svg_symsize*signThres.length;

      colorLegendSpanSvg = colorLegendSpan.append("svg")
        .attr("width", legend_svg_width+"px")
        .attr("height", legend_svg_symsize+"px")
        .style("margin-right", "5px")
        .style("overflow", "visible")

      for (var i = 0; i < signThres.length; i++) {
        // (V)(°,,,°)(V)

        colorLegendSpanSvg.append("g")
          .attr("transform", "translate("+(i*legend_svg_width/signThres.length)+", -2)")
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", legend_svg_symsize)
          .text(function(d, j){
            if (j == 0)
             return signThres[i]["text"];
          })

        colorLegendSpanSvg.append("rect")
          .attr("transform", "translate("+(i*legend_svg_width/signThres.length)+", 0)")
          .attr("width", legend_svg_symsize)
          .attr("height", legend_svg_symsize)
          .attr("stroke", "none")
          .attr("fill", function (d){
            if (isNaN(signThres[i]["value"])) {
              return colors.neutral;
            };
            return colors[d];
          })
          .attr("fill-opacity", signThres[i]["opacity"])

      };
 
      colorLegendSpan.append("span")
        .attr("id", function(d) { return "color-legend-text-"+d;})
        .html(function(d) { return d;})

    //////////////// Restart function ////////////////
    var data;
    var restart = function() {

      // Define data
      var selected_model = $("#modelSelect").val(),
          selected_effect = $('#effectSelect').val(),
          selected_comp = $("#compSelect").val();
      data = JSON.parse(JSON.stringify(json.data[selected_model][selected_effect][selected_comp]));

      data.forEach(function(d, i){
        d['name'] = json.names[i];
      })

      function filterPval(d) {
        return d['-log2(p-value)'] >= -Math.log2($("#pThreshold").val())
      }

      function filterFc(d) {
        return Math.abs(d['log2(fold-change)']) >= Math.log2($("#fcThreshold").val())
      }

      data = data.filter(filterPval);
      data = data.filter(filterFc);

      // Define axis
      var selected_x = $("#xSelect").val(),
          selected_y = $("#ySelect").val();

      // Define axis settings
      var xMin = getValuesExtrema(data, selected_x, 'min'),
          xMax = getValuesExtrema(data, selected_x, 'max'),
          xValue = function(d) {
            if (d[selected_x] == 'Inf') {
              return xMax;
            } else if (d[selected_x] == '-Inf') {
              return xMin;
            } else if (isNaN(d[selected_x])) {
              return 0;
            } else {
              return d[selected_x];
            };
          },
          xRange = xMax-xMin,
          xScale = d3.scaleLinear()
            .range([0, width])
            .domain([xMin-xPadding[0]*xRange, xMax+xPadding[1]*xRange]).nice(),
          xMap = function(d) { return xScale(xValue(d));};

      if (selected_y == '') {

        var sort_factor = JSON.parse(JSON.stringify(selected_x));
        if (sort_factor == '-log2(p-value)') {
          sort_factor = 'log2(fold-change)';
        };

        var sMin = getValuesExtrema(data, sort_factor, 'min'),
            sMax = getValuesExtrema(data, sort_factor, 'max');

        function sortByValue(e1, e2) {
          var v1 = e1[sort_factor],
              v2 = e2[sort_factor];
          if (v1 == 'Inf') {
            v1 = sMax+1;
          };
          if (v2 == 'Inf') {
            v2 = sMax+1;
          };
          if (v1 == '-Inf') {
            v1 = sMin-1;
          };
          if (v2 == '-Inf') {
            v2 = sMin-1;
          };
          if (isNaN(v1)) {
            v1 = 0;
          };
          if (isNaN(v2)) {
            v2 = 0;
          };
          return v1-v2;
        };

        function sortByIndex(e1, e2) {
          e1['index']-e2['index'];
        };

        data.forEach(function(d, i){
          d.index = i;
        });

        data.sort(sortByValue);
        data.forEach(function(d, i){
          d.sorting_index = i;
        });

        data.sort(sortByIndex);

        selected_y = 'sorting_index';
      }

      var yMin = getValuesExtrema(data, selected_y, 'min'),
          yMax = getValuesExtrema(data, selected_y, 'max'),
          yValue = function(d) {
            if (d[selected_y] == 'Inf') {
              return yMax;
            } else if (d[selected_y] == '-Inf') {
              return yMin;
            } else if (isNaN(d[selected_y])) {
              return 0;
            } else {
              return d[selected_y];
            };
          },
          yRange = yMax-yMin,
          yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([yMin-yPadding[0]*yRange, yMax+yPadding[1]*yRange]).nice(),
          yMap = function(d) { return yScale(yValue(d));};

      // Update plot
      plot = plot.data([]);
      plot.exit().remove();

      plot = plot
        .data(data)
        .enter().append("g")
        .attr("class", "plot");

      // Update labels
      plotLabel = plotLabel.data([]);
      plotLabel.exit().remove();

      plotLabel = plotLabel
        .data(data)
        .enter().append("g")
        .attr("class", "plot-label")

      if (selected_y == 'sorting_index') {

        yScale.domain([yMin, yMax]);

        var flagHeight = (yScale(yMin)-yScale(yMax))/data.length;

        yScale.range([height-flagHeight/2, flagHeight/2]);

        plot.attr("transform", function (d) {
            if (xMin < 0) {
              if (xValue(d) >= 0) {
                return "translate(" + xScale(0) + ", " + yMap(d) + ")";
              } else {
                return "translate(" + xMap(d) + ", " + yMap(d) + ")";
              }
            } else {
              return "translate("+ (xScale(xMin)-5) +", " + yMap(d) + ")";
            }
          })
          .append("rect")
            .attr("width", function (d){
              if (xMin < 0) {
                if (xValue(d) >= 0) {
                  return xMap(d)-xScale(0);
                } else {
                  return xScale(0)-xMap(d);
                }
              } else {
                return xMap(d)-xScale(xMin)+5;
              }
            })
            .attr("height", flagHeight)
            .attr("y", -flagHeight/2)
            .style("fill", function(d) {
            if (isNaN(d['-log2(p-value)']) || d['log2(fold-change)'] == 0 || isNaN(d['log2(fold-change)'])) {
              return colors.neutral;
            } else if (d['log2(fold-change)'] == 'Inf') {
              return colors.pos;
            } else if (d['log2(fold-change)'] == '-Inf') {
              return colors.neg;
            } else if (d['log2(fold-change)'] < 0) {
              return colors.neg;
            }
            return colors.pos;
            })
          .style("stroke-opacity", 0)
          .style("fill-opacity", function(d) {
            for (var i = 0; i < signThres.length; i++) {
              if (isNaN(d['-log2(p-value)']) && d['-log2(p-value)'] == signThres[i].value) {
                return signThres[i].opacity;
              }
              if (!isNaN(d['-log2(p-value)']) && d['-log2(p-value)'] >= signThres[i].value) {
                return signThres[i].opacity;
              };
            };
          })

        plotLabel.attr("transform", function (d) {
          if (xMin < 0) {
            if (xValue(d) >= 0) {
              return "translate(" + xScale(0) + ", " + yMap(d) + ")";
            } else {
              return "translate(" + xMap(d) + ", " + yMap(d) + ")";
            }
          } else {
            return "translate("+ (xScale(xMin)-5) +", " + yMap(d) + ")";
          }
        })
        .append("rect")
            .attr("width", function (d){
              if (xMin < 0) {
                if (xValue(d) >= 0) {
                  return xMap(d)-xScale(0);
                } else {
                  return xScale(0)-xMap(d);
                }
              } else {
                return xMap(d)-xScale(xMin)+5;
              }
            })
            .attr("height", flagHeight)
            .attr("y", -flagHeight/2)
          .attr("opacity", 0);

       plotLabel.append("text")
        .attr("dx", function (d){
          if (xValue(d) < 0) {
            return xScale(0)-xMap(d);
          }
          return 0;
        })
        .style("text-anchor", function (d) {
          if (xValue(d) < 0 || xMin >= 0) {
            return "start";
          } else {
            return "end";
          }
        })
        .attr("display", "none")
        .attr("selected", false)
        .attr("font-family", font_family)
        .text(function (d, i) {
          var label = d.name.split(";");
          if (label.length > 1) {
            return label[label.length-2] +";"+ label[label.length-1];
          } else {
            return label[0];
          };
        });

      } else {

        plot.attr("transform", function (d) { return "translate(" + xMap(d) + ", " + yMap(d) + ")"; })
          .append("path")
          .attr("class", "symbol")
          .attr("d", d3.symbol()
            .type(function(d) {
              if ([d[selected_x], d[selected_y]].indexOf('Inf') != -1 || [d[selected_x], d[selected_y]].indexOf('-Inf') != -1) {
                return d3.symbolTriangle;
              };
              return d3.symbolCircle;
            })
            .size(function(d) {
              if ([d[selected_x], d[selected_y]].indexOf('Inf') != -1 || [d[selected_x], d[selected_y]].indexOf('-Inf') != -1) {
                return 100;
              };
              return 200;
          }))
          .style("fill", function(d) {
            if (isNaN(d['-log2(p-value)']) || d['log2(fold-change)'] == 0 || isNaN(d['log2(fold-change)'])) {
              return colors.neutral;
            } else if (d['log2(fold-change)'] == 'Inf') {
              return colors.pos;
            } else if (d['log2(fold-change)'] == '-Inf') {
              return colors.neg;
            } else if (d['log2(fold-change)'] < 0) {
              return colors.neg;
            }
            return colors.pos;
          })
          .style("stroke-opacity", 0)
          .style("fill-opacity", function(d) {
            for (var i = 0; i < signThres.length; i++) {
              if (isNaN(d['-log2(p-value)']) && d['-log2(p-value)'] == signThres[i].value) {
                return signThres[i].opacity;
              }
              if (!isNaN(d['-log2(p-value)']) && d['-log2(p-value)'] >= signThres[i].value) {
                return signThres[i].opacity;
              };
            };
          })
          .attr("transform", function (d){
            if (d[selected_y] == "-Inf") {
              return "rotate(180)";
            };
            if (d[selected_x] == "-Inf") {
              return "rotate(-90)";
            };
            if (d[selected_x] == "Inf") {
              return "rotate(90)";
            };
          });

      // Update labels
      plotLabel.attr("transform", function (d) { return "translate(" + xMap(d) + ", " + yMap(d) + ")"; })
        .append("path")
          .attr("class", "symbol")
          .attr("d", d3.symbol()
            .type(function(d) {
              if ([d[selected_x], d[selected_y]].indexOf('Inf') != -1 || [d[selected_x], d[selected_y]].indexOf('-Inf') != -1) {
                return d3.symbolTriangle;
              };
              return d3.symbolCircle;
            })
            .size(function(d) {
              if ([d[selected_x], d[selected_y]].indexOf('Inf') != -1 || [d[selected_x], d[selected_y]].indexOf('-Inf') != -1) {
                return 100;
              };
              return 200;
          }))
          .attr("opacity", 0)
          .attr("transform", function (d){
            if (d[selected_y] == "-Inf") {
              return "rotate(180)";
            };
            if (d[selected_x] == "-Inf") {
              return "rotate(-90)";
            };
            if (d[selected_x] == "Inf") {
              return "rotate(90)";
            };
          });

      plotLabel.append("text")
        .attr("dy", function (d){
          return -10;
        })
        .style("text-anchor", function (d) {
          if (xMap(d) <= width/2) {
            return "start";
          } else {
            return "end";
          }
        })
        .attr("display", "none")
        .attr("selected", false)
        .attr("font-family", font_family)
        .text(function (d, i) {
          var label = d.name.split(";");
          if (label.length > 1) {
            return label[label.length-2] +";"+ label[label.length-1];
          } else {
            return label[0];
          };
        });

      }

      showLabels();
      displayLabels("plot-label");

      // Update axis
      xAxis.selectAll("*").remove();
      xAxisLegend.selectAll("*").remove();
      yAxis.selectAll("*").remove();
      yAxisLegend.selectAll("*").remove();
      svg.selectAll(".frame").remove();
      svg.selectAll(".info-line").remove();

      // Add axis
      xAxis.call(d3.axisBottom(xScale).ticks(10));

      xAxisLegend.append("text")
        .text(selected_x)
        .attr("font-family", font_family)
        .style("text-anchor", "middle");

      if (selected_y != 'sorting_index') {

      yAxis.call(d3.axisLeft(yScale).ticks(10))

      yAxisLegend.append("text")
        .text(selected_y)
        .style("text-anchor", "middle")
        .attr("font-family", font_family)
        .attr("transform", "rotate(-90)");

      // Close the plot
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

      }

      // Additional lines
      if (selected_x == 'log2(fold-change)') {
        svg.append("g")
          .attr("class", "info-line")
          .attr("transform", "translate(" + xScale(0) + ", 0)")
          .call(d3.axisLeft(yScale).ticks(0)
          .tickSize(0, 0));
      };
      if (selected_y == 'log2(fold-change)') {
        svg.append("g")
          .attr("class", "info-line")
          .attr("transform", "translate(0," + yScale(0) + ")")
          .call(d3.axisBottom(xScale).ticks(0)
          .tickSize(0, 0));
      };

      if (selected_x == '-log2(p-value)') {
        for (var i = 0; i < signThres.length; i++) {
          if (!isNaN(signThres[i].value) && signThres[i].value != 0 && xScale(signThres[i].value) > 0) {
            svg.append("g")
              .attr("class", "info-line")
              .style("stroke-dasharray", ("5, 5"))
              .attr("transform", "translate(" + xScale(signThres[i].value) + ", 0)")
              .call(d3.axisLeft(yScale).ticks(0)
              .tickSize(0, 0));
          };
        };
      };
      if (selected_y == '-log2(p-value)') {
        for (var i = 0; i < signThres.length; i++) {
          if (!isNaN(signThres[i].value) && signThres[i].value != 0 && yScale(signThres[i].value) < height) {
            svg.append("g")
              .attr("class", "info-line")
              .attr("transform", "translate(0," + yScale(signThres[i].value) + ")")
              .call(d3.axisBottom(xScale).ticks(0)
              .tickSize(0, 0));
          };
        };
      };

      // Update legend text
      var color_legend_text = selected_comp.split("-");

      $("#color-legend-text-pos").html("more abundant in "+color_legend_text[1]);
      $("#color-legend-text-neg").html("more abundant in "+color_legend_text[0]);

    }

    var exportData = function() {

      var dataBlob= new Blob([['name\tmean abundance\tlog2(fold-change)\t-log2(p-value)', data.map(function(d){return d.name+'\t'+d['mean abundance']+'\t'+d['log2(fold-change)']+'\t'+d['-log2(p-value)'];}).join('\n')].join('\n')], {type: 'txt'}),
        link = document.createElement('a'),
        event = new MouseEvent('click');

      link.href = window.URL.createObjectURL(dataBlob);
      link.download = 'fold_change.txt';
      link.dataset.downloadurl =  ['txt', link.download, link.href].join(':');
      link.dispatchEvent(event);
   }

    // Add download button for data
    $("#export-data-btn").remove();

    d3.select("#export-btn")
      .append("li")
      .attr("id", "export-data-btn")
      .append("a")
      .html("Data TXT")
      .on("click", exportData)

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

    // Model update function
    var updateEffect = function() {
      var keys = Object.keys(json.data[$('#modelSelect').val()])
          new_data = [...Array(keys.length)];
      for (var i = 0; i < keys.length; i++) {
        new_data[i] = {label:keys[i], value:keys[i]}
      }
      $('#effectSelect').multiselect('dataprovider', new_data)
                        .multiselect("refresh");

      updateComp();

      restart();
    }

    // Effect update function
    var updateComp = function() {
      var keys = Object.keys(json.data[$('#modelSelect').val()][$('#effectSelect').val()])
          new_data = [...Array(keys.length)];
      for (var i = 0; i < keys.length; i++) {
        new_data[i] = {label:keys[i], value:keys[i]}
      }
      $('#compSelect').multiselect('dataprovider', new_data)
                      .multiselect("refresh");

      restart();
    }


    // Display labels button
    var showLabels = function() {
      var label = d3.selectAll(".plot-label").select(function(){ return this.childNodes[1];});
      if ($("#labelButton").is(':checked')) {
        label.attr("display", "inline");
        label.attr("selected", true);
      } else {
        label.attr("display", "none");
        label.attr("selected", false);
      };
    };

    appendLabelCheckBox(buttons, "Show labels", "Labels", "labelButton", showLabels)

    // Search in labels
    var searchLabels = function() {
      $("#labelButton").attr("checked", false);
      var key = $("#searchInput").val().toUpperCase();
      if (key != '') {
        var selected = d3.selectAll(".plot-label").filter(function(){return this.__data__.name.toUpperCase().indexOf(key.toUpperCase()) != -1 }).select(function(){ return this.childNodes[1];});
            non_selected = d3.selectAll(".plot-label").filter(function(){return this.__data__.name.toUpperCase().indexOf(key.toUpperCase()) == -1 }).select(function(){ return this.childNodes[1];});
        selected.attr("display", "inline");
        selected.attr("selected", true);
        non_selected.attr("display", "none");
        non_selected.attr("selected", false);
      } else {
        to_free = d3.selectAll(".plot-label").select(function(){return this.childNodes[1];});
        to_free.attr("display", "none");
        to_free.attr("selected", false);
      };
    };

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
        .selectAll("option")
        .data(axis_choice_x)
        .enter().append("option")
          .text(function (d){ return d;});

    $('#xSelect').val(axis_choice_x[0])
      .on('change', restart);

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
        .selectAll("option")
        .data(axis_choice_y)
        .enter().append("option")
          .text(function (d){ return d;});

    $('#ySelect').val(axis_choice_y[1])
      .on('change', restart);

    // Select model
    var modelSelect = buttons.append("div")
      .attr("title", "Chose model")
      .attr("class", "form-group")

    modelSelect.append("label")
      .html("Model")

    modelSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "modelSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .selectAll("option")
        .data(Object.keys(json.data))
        .enter().append("option")
          .text(function (d){ return d;});

    $('#modelSelect').on('change', updateEffect);

    // Select effect
    var effectSelect = buttons.append("div")
      .attr("title", "Chose effect")
      .attr("class", "form-group")

    effectSelect.append("label")
      .html("Effect")

    effectSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "effectSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .selectAll("option")
        .data(Object.keys(json.data[$('#modelSelect').val()]))
        .enter().append("option")
          .text(function (d){ return d;});

  $('#effectSelect').on('change', updateComp);

    // Select comparison
    var compSelect = buttons.append("div")
      .attr("title", "Chose comparison")
      .attr("class", "form-group")

    compSelect.append("label")
      .html("Comparison")

    compSelect.append("div")
      .attr("class", "multiselect-btn-container figtool-multiselect-btn-container")
      .append("select")
        .attr("id", "compSelect")
        .attr("class", "form-control multiselect figtool-multiselect")
        .selectAll("option")
        .data(Object.keys(json.data[$('#modelSelect').val()][$('#effectSelect').val()]))
        .enter().append("option")
          .text(function (d){ return d;});

  $('#compSelect').on('change', restart);

    // Select p-value cutoff
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

    // Select fold-change cutoff
    var fcThreshold = buttons.append("div")
      .attr("title", "Set a fold-change cutoff.")
      .attr("class", "form-group")

    fcThreshold.append("label")
      .html("Fold-change cutoff")

    fcThreshold.append("input")
      .attr("id", "fcThreshold")
      .attr("type", "number")
      .attr("class", "form-control form-number-field")
      .attr("value", 0)
      .on("change", restart);

    setMultiselect('.figtool-multiselect');
    //resizeMultiselect('#d3-buttons', 1, '#d3-buttons', false);

    restart();

  //});



};

