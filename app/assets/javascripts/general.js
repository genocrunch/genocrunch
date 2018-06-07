function backToTop() {
    $('body, html').animate({scrollTop: $('body').position().top},
                            {duration: 400,
                             easing: 'swing'});
/*
  document.body.scrollIntoView({ behavior: 'smooth' });
  document.documentElement.scrollIntoView({ behavior: 'smooth' });
*/
}

function randomKey(n) {
  var choice = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      k = [...Array(n)];
  for (var i = 0; i < n; i++) {
    k[i] = choice.charAt(Math.floor(Math.random() * choice.length));
  }
  return k;
}

function scrollTo(source, target) {
  $('#'+source).on('click', function(){
    $('body, html').animate({scrollTop: $('#'+target).position().top},
                            {duration: 400,
                             easing: 'swing'});
  });
}

function stopRefresh(refresh_timer) {
  clearInterval(localStorage.getItem(refresh_timer));
}

function selectBtn(id1, id2) {
  $(id2).addClass("selected");
  $(id1).not(id2).removeClass("selected");
}
