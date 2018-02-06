function avoidSorting(evt) {
  if (evt.avoidSorting !== undefined) {
    evt.avoidSorting();
  } else {
    evt.cancelBubble = true;
  }
}

function searchTable(tableId, inputId, colnb) {

  var filter = $("#"+inputId).val().toUpperCase(),
      table = document.getElementById(tableId),
      tr = table.getElementsByTagName("tr"),
      td;

  for (var i = 0; i < tr.length; i++) {
    if (isNaN(colnb) == true) {
      td = tr[i].getElementsByTagName("td");
      for (var j = 0; j < td.length; j++) {
        if (td[j]) {
          if (td[j].innerHTML.toUpperCase().indexOf(filter) != -1) {
            tr[i].style.display = "";
            break;
          } else {
            tr[i].style.display = "none";
          }
        }
      }
    } else {
      td = tr[i].getElementsByTagName("td")[colnb];
      if (td) {
        if (td.innerHTML.toUpperCase().indexOf(filter) != -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  }
}

function colorTable(selector, data) {

  // Color the table
  var colors = d3.scaleOrdinal(d3.schemeCategory10);

  for (var i = 0; i < data.length; i++) {
    data[i] = data[i].split("\t");
  }

  for (var c = 0; c < data[0].length; c++) {
    var factors = [];
    for (var r = 0; r < data.length; r++) {
      if (factors.indexOf(data[r][c]) == -1) {
        factors.push(data[r][c]);
      }
    }

    if (factors.length < (data.length-1)) {
      colors.domain(factors);
      var elements = document.querySelectorAll(selector+c);
      for (var i = 0; i < elements.length; i++) {
        elements[i].style.backgroundColor=colors(elements[i].innerHTML);
      }
    }
  }

};
