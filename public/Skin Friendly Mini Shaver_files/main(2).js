
// ── Countdown timer ──
// Set target: 1 day 4 hours 38 mins 4 secs from now
const target = new Date().getTime() + (1*86400 + 4*3600 + 38*60 + 4) * 1000;
function pad(n) { return String(n).padStart(2, '0'); }
function tick() {
  const now  = new Date().getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000)  / 60000);
  const secs = Math.floor((diff % 60000)    / 1000);
  document.getElementById('cd-days').textContent  = pad(days);
  document.getElementById('cd-hours').textContent = pad(hrs);
  document.getElementById('cd-mins').textContent  = pad(mins);
  document.getElementById('cd-secs').textContent  = pad(secs);
}
document.addEventListener('DOMContentLoaded', () => {
  tick();
  setInterval(tick, 1000);
});


$(document).ready(function(){
     setTimeout(function() {
        var owl = $('.owl-carousel').owlCarousel({
            loop: true,
            margin: 20,
            nav: false,
            dots: false,
            autoplay: false,
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 2
                },
                1024: {
                    items: 3
                }
            }
        });

        $('.custom-next').click(function() {
            owl.trigger('next.owl.carousel');
        });

        $('.custom-prev').click(function() {
            owl.trigger('prev.owl.carousel');
        });
     }, 0);
});

$(document).on('click', '.orderNowBtn', function () {
    var btn = $(this);
    var wrapper = $('.special_offer_pd_wrapper');
    var checkbox = wrapper.find('.special_checkbox');
    if (btn.hasClass('active')) {
        // remove mode
        btn.removeClass('active').text('Order Now');
        wrapper.hide();
        checkbox.prop('checked', false);
    } else {
        // order mode
        btn.addClass('active').text('Remove');
        wrapper.show();
        checkbox.prop('checked', true);
    }
    wrapper.find('.listed_pro_inputs').trigger('change');
});

$(document).on('click', '.orderNowBtn1', function () {
    var btn = $(this);
    var wrapperClass = $(this).data('product_id');
    var wrapper = $('.' + wrapperClass); 
    var checkbox = wrapper.find('.special_checkbox');
    if (btn.hasClass('active')) {
        // remove mode
        btn.removeClass('active').text('Order Now');
        wrapper.hide();
        checkbox.prop('checked', false);
    } else {
        // order mode
        btn.addClass('active').text('Remove');
        wrapper.show();
        checkbox.prop('checked', true);
    }
    wrapper.find('.listed_pro_inputs').trigger('change');
});


document.querySelectorAll('.sp_variation_all li').forEach(function (li) {
    li.addEventListener('click', function () {
        document.querySelectorAll('.sp_variation_all li').forEach(el => {
            el.classList.remove('active');
        });
        li.classList.add('active');
        const radio = li.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        }
    });
});