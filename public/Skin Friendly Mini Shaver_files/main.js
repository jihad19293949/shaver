
$('.owl_carousel_one_column').owlCarousel({
    items: 1,
    loop: true,
    video: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    margin: 10,
    nav: false,
    dots: true,
    responsive: {
        0: {
            items: 1,
            margin: 10,
        },
        600: {
            items: 1,
            margin: 10,
        },
        1000: {
            items: 1,
            margin: 10,
        }
    },
    lazyLoad: false
});
$('.owl_carousel_two_column').owlCarousel({
    items: 2,
    loop: true,
    video: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    margin: 10,
    nav: false,
    dots: true,
    responsive: {
        0: {
            items: 1,
            margin: 10,
        },
        600: {
            items: 2,
            margin: 10,
        },
        1000: {
            items: 2,
            margin: 10,
        }
    },
    lazyLoad: false
});

$('.owl_carousel_three_column').owlCarousel({
    items: 3,
    loop: true,
    video: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    margin: 10,
    nav: false,
    dots: true,
    responsive: {
        0: {
            items: 1,
            margin: 10,
        },
        600: {
            items: 2,
            margin: 10,
        },
        1000: {
            items: 3,
            margin: 10,
        }
    },
    lazyLoad: false
});

$('.owl_carousel_four_column').owlCarousel({
    items: 4,
    loop: true,
    video: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    margin: 10,
    nav: false,
    dots: true,
    responsive: {
        0: {
            items: 1,
            margin: 10,
        },
        600: {
            items: 2,
            margin: 10,
        },
        1000: {
            items: 4,
            margin: 10,
        }
    },
    lazyLoad: false
});

$('.owl_carousel_five_column').owlCarousel({
    items: 5,
    loop: true,
    video: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    margin: 10,
    nav: false,
    dots: true,
    responsive: {
        0: {
            items: 1,
            margin: 10,
        },
        600: {
            items: 3,
            margin: 10,
        },
        1000: {
            items: 5,
            margin: 10,
        }
    },
    lazyLoad: false
});

$(document).ready(function(){
    $('.animated_text').addClass('active');
    setInterval(function () {
        setTimeout(function () {
            $('.animated_text').removeClass('active');
        }, 500);

        setTimeout(function () {
            $('.animated_text').addClass('active');
        }, 2000);
    }, 2500);
});

$(document).ready(function(){
    $('.animated_text_b').addClass('active');
    setInterval(function () {
        setTimeout(function () {
            $('.animated_text_b').removeClass('active');
        }, 500);

        setTimeout(function () {
            $('.animated_text_b').addClass('active');
        }, 2000);
    }, 2500);
});
