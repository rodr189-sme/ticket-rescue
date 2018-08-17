$('.btn-custom').on('click',function() {
	$('.btn-custom').prop("disabled",true);
	countDown();
});

function countDown() {
	$('.counter1').show()
	$(".card-img-top").addClass("gray-scale")
	$({countNum: $('.counter1').text()}).animate({
		countNum: 47
	}, {
		duration: 2000,
		easing: 'linear',
		step: function () {
			$('.counter1').text(Math.ceil(this.countNum)+"%");
		},
		complete: function () {
			$('.counter1').text("47"+"%");
		}
	});
}
