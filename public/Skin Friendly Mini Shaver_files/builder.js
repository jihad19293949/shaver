// Alert Script
if (typeof window.Toast === 'undefined') {
    window.Toast = Swal.mixin({
        toast: true,
        position: 'center-center',
        showConfirmButton: false,
        background: '#E5F3FE',
        timer: 4000
    });
}
if (typeof window.cAlert === 'undefined') {
    window.cAlert = function(type, text) {
        window.Toast.fire({
            icon: type,
            title: text
        });
    };
}

$.scrollIt();

$(document).on('change', '.change_area', function(){
    calculationAmount();
});

$(document).on('change', '.select_product', function(){
    calculationAmount();
});

$(document).on('focusout', '.information_field', function(){
    activityTrack('Information Inserted');
});
$('document').ready(function(){
    calculationAmount();
})
function calculationAmount(){
    deliveryCharge_state()
    let product = $('.select_product:checked').val();
    let pro_type = $('.product_type').val();
    if(!pro_type){
        pro_type = 'single';
    }
    let change_area = $('.change_area:checked').val();
    // let delivery_charge = $('.outside_dhaka_charge_hidden').val();
    let delivery_charge = 0;
    if(change_area == 'Inside Dhaka'){
        delivery_charge = $('.inside_dhaka_charge_hidden').val();
    }else if(change_area == 'Outside Dhaka'){
        delivery_charge = $('.outside_dhaka_charge_hidden').val();
    }else{
        delivery_charge = 0;
    }

    let single_cart_quantity = $('#single_cart_quantity').val();
    if(!single_cart_quantity){
        single_cart_quantity = 1;
    }

    if(pro_type == 'multiple'){
        let product_total = $('.listed_pro_inputs:checked').map(function() {
            return $(this).closest('tr').find('.listed_product_price_total').val();
        }).get();
        product_total = product_total.reduce((a, b) => Number(a) + Number(b), 0);

        let product_variations = $('.listed_pro_inputs:checked').map(function() {
            return $(this).closest('tr').find('.listed_product_data_id').val();
        }).get();
        let product_quantities = $('.listed_pro_inputs:checked').map(function() {
            return $(this).closest('tr').find('.list_qty').val();
        }).get();

        $('.product_price_sub').text(product_total);
        $('.product_price_input').val(product_total);
        $('.grand_total').html(Number(product_total) + Number(delivery_charge));
        $('.multi_product_variations').val(product_variations);
        $('.multi_product_quantities').val(product_quantities);
    }else{
        let product_title = $('.select_product:checked').data('title');
        let sales_price = $('.select_product:checked').data('price');
        let regular_price = $('.select_product:checked').data('oprice');
        let variation = $('.select_product:checked').data('variation');
        let image = $('.select_product:checked').data('image');

        $('.grand_total').html(Number(sales_price * single_cart_quantity) + Number(delivery_charge));

        $('.product_title').text(product_title);
        $('.product_old_price').text(regular_price);
        $('.product_price').text(sales_price * single_cart_quantity);
        $('.sales_price').val(sales_price * single_cart_quantity);
        $('.product_price_sub').text(sales_price * single_cart_quantity);
        $('.product_price_input').val(sales_price * single_cart_quantity);
        $('.product_variation').text(variation);
        $('.product_variation_string').text(variation);
        $('.product_image').attr('src', image);

        if(regular_price){
            $('.product_old_price_wrap').show();
        }else{
            $('.product_old_price_wrap').hide();
        }
    }

    $('.delivery_charge').html(delivery_charge);
    $('.delivery_charge_inpout').val(delivery_charge);
    if(pro_type !== 'multiple'){
        let grand_total = Number($('.product_price_sub').text());
        let data = $('.select_product:checked').data('charge');
        if (data == 'free') {
                $('.delivery_charge_free_or_price').hide(); 
                $('.delivery_charge_free_or_price_text').text('Free').show(); 
                $('.delivery_charge_inpout').val(0);
                $('.grand_total').text(grand_total);
            } else {
                $('.delivery_charge_free_or_price').show(); 
                $('.delivery_charge_free_or_price_text').hide(); 
                $('.delivery_charge_inpout').val(delivery_charge);
                $('.grand_total').text(grand_total + Number(delivery_charge));
            }
    }
    


    activityTrack('Information Inserted');
}

function updateProQuantity(type){
    let calculated_quantity = 0;
    let quantity = $('#single_cart_quantity').val();
    if(type == 'plus'){
        calculated_quantity = Number(quantity) + 1;
    }else{
        calculated_quantity = Number(quantity) - 1;
    }
    product_price = $('.product_price_input').val();
    // // console.log(document.getElementById('single_cart_quantity').val);

    if(calculated_quantity > 0){
        $('#single_cart_quantity').val(calculated_quantity);
        $('.product_price').text(product_price * calculated_quantity);
        calculationAmount();
        // document.getElementById('single_cart_quantity').val = calculated_quantity;
        // this.cart_quantity = calculated_quantity;
    }
}

function activityTrack(event){
    let pro_type = $('.product_type').val();
    let product_variation;
    let price;

    let shipping_name = $('.shipping_name').val();
    let shipping_mobile_number = $('.shipping_mobile_number').val();

    let product_datas = [];

    if(shipping_mobile_number.length >= 10){
        let shipping_address = $('.shipping_address').val();
        if(pro_type == 'multiple'){
            // product_variation = $('.multi_pro_list').first().find('.listed_product_data_id').val();
            // price = $('.multi_pro_list').first().find('.listed_product_price').val();

            let prices = $('.listed_pro_inputs:checked').map(function() {
                return $(this).closest('tr').find('.listed_product_price').val();
            }).get();

            let product_variations = $('.listed_pro_inputs:checked').map(function() {
                return $(this).closest('tr').find('.listed_product_data_id').val();
            }).get();

            let product_quantities = $('.listed_pro_inputs:checked').map(function() {
                return $(this).closest('tr').find('.list_qty').val();
            }).get();

            $.each(product_variations, function(index) {
                product_datas[index] = {
                    selling_price: prices[index] || 0,
                    product_data_id: product_variations[index] || null,
                    quantity: product_quantities[index] || 1
                };
            });



        }else{
            product_variation = $('.product_variation:checked').val();
            price = $('.product_variation:checked').data('price');
            product_datas = [
                {
                    product_data_id: product_variation,
                    quantity: $('#single_cart_quantity').val() || 1,
                    selling_price: price,
                }
            ];
        }
        // if(product_variation){
            let shipping_charge = $('.shipping_charge').val();
            let uu_id = $('.uu_id').val();
            $.ajax({
                url: orderFailedTrackSaas,
                method: "POST",
                data: {
                    _token,
                    uid: uu_id,
                    url: window.location.href,
                    shipping_name,
                    event,
                    inventory_id,
                    shipping_mobile_number,
                    shipping_address,
                    product_variation,
                    shipping_charge,
                    product_datas
                },
                success: function(){},
                error: function(){}
            });
        // }
    }
}

$(document).on('submit', '#builder_order_form form', function(){
    let phone_number = $('.shipping_mobile_number').val();
    var regex = /^01[3-9]\d{8}$/;

    if($('.listed_pro_inputs').length && !$('.listed_pro_inputs:checked').length){
        cAlert('error', 'কমপক্ষে একটি পণ্য নির্বাচন করুন!');
        return false;
    }

    if(phone_number.length != 11){
        cAlert('error', 'মোবাইল নম্বর অবসসই ১১ সংখ্যার  হতে হবে!');

        activityTrack('Invalid mobile number!');
        return false;
    }else{
        if (!regex.test(phone_number)) {
            cAlert('error', 'Invalid mobile number!');

            activityTrack('Invalid mobile number format!');
            return false;
        }else{
            return true;
        }
    }
});

$(document).on('change', '.listed_product_variation', function(){
    let variation_value = $(this).val();
    variation_value = variation_value.split('::');

    $(this).closest('tr').find('.listed_product_data_id').val(variation_value[0]);
    $(this).closest('tr').find('.listed_product_price').val(variation_value[1]);
    let quantity = $(this).closest('tr').find('.list_qty').val();
    let total_price = variation_value[1] * quantity;
    $(this).closest('tr').find('.listed_product_price_text').text(total_price);
    $(this).closest('tr').find('.listed_product_price_total').val(total_price);
   
    calculationAmount();
});

$(document).on('change', '.listed_product_variation_attr', function(){
    let type = $(this).data('type');
    let quantity = $(this).closest('tr').find('.list_qty').val();
    if(!quantity){
        quantity = 1;
    }
    let attribute_values=null;
     var parent = $(this).closest('tr');
    if(type == 'radio'){
        attribute_values = parent.find(".listed_product_variation_attr:checked").map(function () {
            return $(this).val();
        });
    }else{
        attribute_values = parent.find(".listed_product_variation_attr").map(function () {
            return $(this).val();
        });
    }
    let product = $(this).closest('tr').find('.listed_pro_inputs').val();

    let values = attribute_values.get();
    values = values.sort();
    // var values = [attribute_values];

    // Ajax Action
    $.ajax({
        url: product_variationPrice,
        method: "POST",
        data: {values, product, _token},
        dataType: "JSON",
        context: this,
        success: function (result) {
            $(this).closest('tr').find('.listed_product_data_id').val(result.product_data_id);
            $(this).closest('tr').find('.listed_product_price').val(result.sale_price);
            $(this).closest('tr').find('.listed_product_price_total').val(result.sale_price * quantity);
            $(this).closest('tr').find('.listed_product_price_text').text(result.sale_price * quantity);
            calculationAmount();
        },
        error: function (){
            console.log('Variation price ajax error!');
        }
    });
});

$(document).on('change', '.listed_pro_inputs', function(){
    let checkedCount = $('.listed_pro_inputs:checked').length;

    if (checkedCount === 0) {
        $(this).prop('checked', true);
    }

    calculationAmount();
});

$(document).on('click', '.updateProQuantity', function(){
    let type = $(this).data('type');
    let quantity = $(this).closest('tr').find('.list_qty').val();
    if(!quantity){
        quantity = 1;
    }

    let calculated_quantity = 1;
    if(type == 'plus'){
        calculated_quantity = Number(quantity) + 1;
        $(this).closest('tr').find('.list_qty').val(calculated_quantity);
    }else{
        if(quantity > 1){
            calculated_quantity = Number(quantity) - 1;
        }else{
            calculated_quantity = 1;
        }
        $(this).closest('tr').find('.list_qty').val(calculated_quantity);
    }

    let product_price = $(this).closest('tr').find('.listed_product_price').val();
    let total_price = product_price * calculated_quantity;
    $(this).closest('tr').find('.listed_product_price_text').text(total_price);
    $(this).closest('tr').find('.listed_product_price_total').val(total_price);

    calculationAmount();
});

// Remove this if not needed
function fbTrackCheckout(price, content_ids, contents){
    if(content_ids.length){
        $.ajax({
            type: "POST",
            url: fb_tracking_route,
            data: {
                _token,
                track_type: 'InitiateCheckout',
                data: {
                    value: price,
                    currency: 'BDT',
                    content_ids: content_ids,
                    content_type: 'product',
                    external_id: external_id,
                    contents: contents,
                }
            },
            success: function (response) {
                if(response == 'true'){
                    console.log('FB Tracked Checkout!');
                }else{
                    console.log('FB Tracked Failed');
                }
            },
            error: function(){
                console.log('FB Tracked Error Page View!');
            }
        });

        $.ajax({
            type: "POST",
            url: fb_tracking_route,
            data: {
                _token,
                track_type: 'AddToCart',
                data: {
                    value: price,
                    currency: 'BDT',
                    content_ids: content_ids,
                    external_id: external_id,
                    content_type: 'product',
                    contents: contents
                }
            },
            success: function(response) {
                if (response === 'true') {
                    console.log('FB AddToCart Tracked!');
                } else {
                    console.log('FB AddToCart Failed');
                }
            },
            error: function() {
                console.log('FB AddToCart Error!');
            }
        });

        return true;
    }

    return false;
}

// let scrolled_50 = false;
// let scrolled_90 = false;

if(fte){
    $(window).on('load', function() {
        tCI('PageView', (fb_event_id ? ('pv-' +fb_event_id) : null));
    });
}

function tCI(track_type, event_id = null){
    $.ajax({
        type: "POST",
        url: fb_tracking,
        data: {
            _token,
            external_id: external_id,
            event_id,
            track_type
        },
        success: function (response) {
            if(response == 'true'){
                console.log('F T!');
            }else{
                console.log('F T Failed!');
            }
        },
        error: function(){
            console.log('F T Error!');
        }
    });
}


$(document).ready(function () {
    $('.selectpicker_setting').select2();
})
$(document).on('change', '.delivery_area', function () {
    deliveryCharge_state()
});

function deliveryCharge_state() {
    const stateId = $('.delivery_area').val();
    if(!stateId){
        return false;
    }
    let pro_type = $('.product_type').val();
    if(!pro_type){
        pro_type = 'single';
    }
    let product_ids = [];
    let quantities = [];
    let product_total = 0;
    if(pro_type == 'multiple'){
        product_ids = $('.listed_pro_inputs:checked').map(function() {
            return $(this).closest('tr').find('.listed_product_data_id').val();
        }).get();
        quantities = $('.listed_pro_inputs:checked').map(function() {
            return $(this).closest('tr').find('.list_qty').val();
        }).get();
         product_total = $('.listed_pro_inputs:checked').map(function() {
                    return $(this).closest('tr').find('.listed_product_price_total').val();
                }).get();
                product_total = product_total.reduce((a, b) => Number(a) + Number(b), 0);
    }else{
         product_ids = [$('.select_product:checked').val()];
         quantities =[ $('#single_cart_quantity').val() || 1];
        let sales_price = $('.select_product:checked').data('price');
        let single_cart_quantity = $('#single_cart_quantity').val();
        if(!single_cart_quantity){
            single_cart_quantity = 1;
        }
         product_total = Number(sales_price * single_cart_quantity)
    }

    $.ajax({
        url: "/lp-shipping-charges/by-state/" + stateId,
        method: 'POST',
        data: {
            _token,
            product_ids: product_ids,
            quantities: quantities
        },
        success: function (res) {
            if (res.success) {
                if (res.data && res.data.charge !== null && res.data.charge !== undefined) {
                    $('.delivery_charge').html(Number(res.data.charge));
                    $('.delivery_charge_inpout').val(Number(res.data.charge));
                     $('.grand_total').html(Number(product_total) + Number(res.data.charge));
                } else {
                    $('.delivery_charge').html(Number(res.data.charge));
                    $('.delivery_charge_inpout').val(Number(res.data.charge));
                    $('.grand_total').html(Number(product_total) + Number(res.data.charge));
                }
            }
        },
        error: function (xhr) {
            cAlert('error', 'Failed to load data. Please try again.');
        }
    });
}

function variation_style_exist(){
    let variation_style = $('.variation_style').val();
    if(variation_style =='Style 6'){
        return true;
    }
    return false;
}

// new form 2 
// listed_product_item trigger when documen load 
let products = [];
$(document).ready(function () {
    if (!variation_style_exist()) return;
    $('.listed_product_item.active').trigger('click');
});

$(document).on('click', '.qty-plus', function (e) {
    e.stopPropagation();
    if (!variation_style_exist()) return;
    let input = $(this).closest('.qty-box').find('.qty-input');
    let value = parseInt(input.val());

    input.val(value + 1);
    // find this parent is acive class exist  .listed_product_item.active
    if ($(this).closest('.listed_product_item.active').length > 0) {
         $('.multi_product_quantities2').val(input.val());
         calculation_amount()
    }

   
});

$(document).on('click', '.qty-minus', function (e) {
    e.stopPropagation();
    if (!variation_style_exist()) return;
    let input = $(this).closest('.qty-box').find('.qty-input');
    let value = parseInt(input.val());

    if (value > 1) {
        input.val(value - 1);
    }
    if ($(this).closest('.listed_product_item.active').length > 0) {
         $('.multi_product_quantities2').val(input.val());
         calculation_amount()
    }
});


$(document).on('click', '.listed_product_item', function(){
    if (!variation_style_exist()) return;
    let product_id = $(this).data('product_id');
    // class add  
    $('.listed_product_item').removeClass('active bg-gray-100');
    $(this).addClass('active bg-gray-100');
    let product_title = $(this).data('product_title');
    let product_type = $(this).data('product_type');
    let product_price = $(this).data('product_price');
    let product_image = $(this).data('product_image');
    $('.product_title').val(product_title);
    let qty_input = $(this).find('.qty-input').val();
   
    let product_data_id = $(this).data('product_data_id');
    $('.multi_product_variations2').val(product_data_id);
    $('.multi_product_quantities2').val(qty_input);
    $('.product_title').val(product_title);
    $('.single_product_price').val(product_price);
    $('.attribute_names').val('');
    const img = $('#main-image')
    if (img) {
        img.attr('src', product_image);
    }
    calculation_amount()
    

    if(!product_id){
        cAlert('error', 'Select a product first!');
        return false;
    }
    // get variant html 
    $.ajax({
        url: "/lp/product/" + product_id,
        method: 'GET',
        success: function (res) {
            if (res.success) {
                $('.variant_append').html(res.html);
                co_radio_trigger();
            }else{
                $('.variant_append').html('');
            }
        },
        error: function (xhr) {
            cAlert('error', 'Failed to load data. Please try again.');
        }
    });
})

 $(document).on('change', '.co_radio', function() {
    if (!variation_style_exist()) return;
    let product = $(this).data('product');
    let attribute_values = $("input.co_radio:checked").map(function() {
        return $(this).val();
    });
    let attribute_names = $("input.co_radio:checked").map(function() {
        return $(this).data('attr_name');
    });

    var groupName = $(this).attr('name');
    let parent  = $(this).closest('.varient_items');
    parent.find('.selected_varient').text($(this).data('selected_name'));
   
    if ($(this).is(':checked')) {
        $(this).closest('.cartOptions').siblings().removeClass('active');
        $(this).closest('.cartOptions').addClass('active');
    }
    let values = attribute_values.get();
    values = values.sort();
    $.ajax({
        url: "/lp/single-product/get-variation-price",
        method: "POST",
        data: {
            values,
            product,
            _token: _token
        },
        dataType: "JSON",
        success: function(result) {
            if (result.status == true) {
                $('.multi_product_variations2').val(result.product_data_id);
                $('.single_product_price').val(result.sale_price);
                $('.attribute_names').val(attribute_names.get().join('/'));
                $('#product_'+product).find('.product_price').html(result.sale_price);
                
                // const img = $('#main-image')
                // if (img) {
                //     img.attr('src', result.img);
                // }
                calculation_amount()
            } 
        },
        error: function() {
            cAlert('error', 'Failed to load data. Please try again.');
        }
    });
});
$(document).on('change', '.product_data_special_offer', function() {
    if (!variation_style_exist()) return;
    let product_id = $(this).data('product_id');
     let product_data_id = $(this).val();
     let product_price = $(this).data('product_price');
     let product_regular_price = $(this).data('product_regular_price');
     let product_discount_percentage = $(this).data('product_discount_percentage');
     let product_image = $(this).data('product_image');
     let product_title = $(this).data('product_title');
     let parent = $(this).closest('.offer-box');
     let isselected = parent.attr('data-isSelected');

     $(this).closest('.option').siblings().removeClass('active');
     $(this).closest('.option').addClass('active');
      let product_type = $(this).data('product_type');

     parent.find('.product_price_special').text(product_price);
     parent.find('.regular_price_special').text(product_regular_price);
     parent.find('.product_discount_percentage').text(product_discount_percentage);
     parent.find('.sale_price_special').text(product_price);


    if(isselected){
        let exist_product = products.find(item => item.product_id == product_id);
        if(exist_product){
            exist_product.product_data_id = product_data_id;
            exist_product.product_price = product_price;
            exist_product.product_regular_price = product_regular_price;
            exist_product.product_discount_percentage = product_discount_percentage;
            exist_product.product_image = product_image;
            exist_product.product_title = product_title;
            exist_product.qty = 1;
        }
    }else{
        products = products.filter(item => item.product_id != product_id);
    }

    special_offer_html();
});


function co_radio_trigger() {
    if (!variation_style_exist()) return;
    $('.co_radio:checked').trigger('change');
};
$(document).on('change', '.change_area_select', function(){
    calculation_amount();
});

function calculation_amount(){
    let qty = $('.multi_product_quantities2').val();
    let price = $('.single_product_price').val();
    let total = qty * price;
    let name = $('.product_title').val();
    let attribute_names = $('.attribute_names').val();
    let title = attribute_names ? name + ' (' + attribute_names + ')' : name;

    let products_total_price = 0;

    if (products.length > 0) {
       products_total_price = (products || []).reduce(
            (total, product) => total + ((Number(product.product_price) || 0) * (Number(product.qty) || 0)),
            0
        );
        
    }
    let products_ids = products.map(item => item.product_data_id).join(',');
    let id = $('.multi_product_variations2').val();
    let ids = id+','+ products_ids;
    $('.multi_product_variations').val(ids);
    let qty_input = $('.multi_product_quantities2').val();
    let qtys = products.map(item => item.qty).join(',');
    let total_qty =  qty_input + ',' + qtys;
    $('.multi_product_quantities').val(total_qty);
    $('.product_title_html').html(title);
    $('.product_price_html').html(` ${qty} x ৳${price}=৳`+ total);
    $('.product_price_sub').html(Number(total) + Number(products_total_price));
    let delivery_charge = 0;
    let change_area = $('.change_area_select:checked').val();
    if(change_area == 'Inside Dhaka'){
        delivery_charge = $('.inside_dhaka_charge_hidden').val();
    }else if(change_area == 'Outside Dhaka'){
        delivery_charge = $('.outside_dhaka_charge_hidden').val();
    }else{
        delivery_charge = 0;
    }
    $('.delivery_charge_inpout').val(delivery_charge);
    $('.delivery_price').html(delivery_charge);

    $('.grand_total').html(Number(total)+Number(delivery_charge) + Number(products_total_price));
}

$(document).on('click', '.special_offer_order', function(){
    if (!variation_style_exist()) return;
    let product_id = $(this).data('product_id');
    let product_title = $(this).data('product_title');
    let product_data_id = $(this).data('product_data_id');
    let product_price = $(this).data('product_price');
    let product_regular_price = $(this).data('product_regular_price');
    let product_discount_percentage = $(this).data('product_discount_percentage');
    let product_type = $(this).data('product_type');
    let qty = 1;
    let product_image = $(this).data('product_image');

    let exist_product = products.find(item => item.product_id == product_id);
    let parent = $(this).closest('.offer-box');
    
    if(product_type == 'Variable'){
        // find checked value 
        parent.find('.product_data_special_offer').map(function () {
            if ($(this).is(':checked')) {
                product_title = $(this).data('product_title');
                product_data_id = $(this).data('product_data_id');
                product_price = $(this).data('product_price');
                product_regular_price = $(this).data('product_regular_price');
                product_discount_percentage = $(this).data('product_discount_percentage');
            }
        })
    }else{
        parent.find('.regular_price_special').text(product_regular_price);
        parent.find('.product_discount_percentage').text(product_discount_percentage);
        parent.find('.sale_price_special').text(product_price);
    }
    if(exist_product){
        // remove 
        // data-isSelected = false
        parent.attr('data-isSelected', false);
        products = products.filter(item => item.product_id != product_id);
        $(this).text('Buy now');
        $(this).css('background-color', '#f59e0b');
    }else{
        parent.attr('data-isSelected', true);
        $(this).text('Remove');
        $(this).css('background-color', 'red');
        products.push({
            product_id,
            product_title,
            product_data_id,
            product_price,
            product_regular_price,
            product_discount_percentage,
            qty,
            product_image,
        });
    }
    special_offer_html();
});
function special_offer_html(){
    if (!variation_style_exist()) return;
    let html = '';
    console.log("products",products)
    products.forEach((item, index) => {
        html += `
        <div style="display:flex;justify-content:space-between ;align-items:center">
        <div class="cart-item">
            <img  src="${item.product_image}" alt="">
            <div class="product_title_s">
                ${item.product_title} 
            </div>
        </div>
            <div class="">
                ${item.qty} x ৳${item.product_price} = ৳${item.qty * item.product_price}
            </div>
        </div>
        `;
    });
    $('.special_offer_box').html(html);
    calculation_amount();
}


// document.addEventListener('DOMContentLoaded', function () {
//     document.getElementById('current_url').value = window.location.href;
// });
$(document).ready(function () {
    let current_url = window.location.href;
    $('.current_url').val(current_url);
})

