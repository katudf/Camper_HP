$(document).ready(function() {

	$('a[href*="jpg"],a[href*="JPG"],a[href*="gif"],a[href*="png"],a[href*="bmp"],a[href*="webp"]').colorbox({
	    slideshow:true,
		slideshowSpeed:5000,
	      maxWidth:"90%",
	      maxHeight:"80%"
	    });
	var topBtn = $('.gotop');
	topBtn.hide();
	$(window).scroll(function () {
		if ($(this).scrollTop() > 200) {
			topBtn.fadeIn();
		} else {
			topBtn.fadeOut();
		}
	});
	
});
$(window).scroll(function () {
  if($(window).scrollTop() > 200) {
    $('header').addClass('bg_white');
  } else {
    $('header').removeClass('bg_white');
  }
});
jQuery(function ($) {
	var fadeIn = $('main section');
	$(window).on('scroll', function () {
		$(fadeIn).each(function () {
			var offset = $(this).offset().top;
			var scroll = $(window).scrollTop(); 
			var windowHeight = $(window).height();
			if (scroll > offset - windowHeight + 400) {
				$(this).addClass("scroll-in");
			}
		});
	});
});


function fadeAnime(){

  // ふわっ
  $('.bgextend').each(function(){ //fadeUpTriggerというクラス名が
    var elemPos = $(this).offset().top+150;//要素より、50px上の
    var scroll = $(window).scrollTop();
    var windowHeight = $(window).height();
    if (scroll >= elemPos - windowHeight){
    $(this).addClass('bgLRextend');// 画面内に入ったらfadeUpというクラス名を追記
    }else{
    //$(this).removeClass('bgLRextend');// 画面外に出たらfadeUpというクラス名を外す
    }
    });
}

  $(window).scroll(function (){
    fadeAnime();/* アニメーション用の関数を呼ぶ*/
  });// 