(function($) {
    "use strict";

    // Dropdown on mouse hover
    $(document).ready(function() {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseover', function() {
                    $('.dropdown-toggle', this).trigger('click');
                }).on('mouseout', function() {
                    $('.dropdown-toggle', this).trigger('click').blur();
                });
            } else {
                $('.navbar .dropdown').off('mouseover').off('mouseout');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);
    });


    // Back to top button
    $(window).scroll(function() {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function() {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });


    // Service carousel
    $(".service-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        dots: false,
        loop: true,
        nav: true,
        navText: [
            '<i class="fa fa-angle-left" aria-hidden="true"></i>',
            '<i class="fa fa-angle-right" aria-hidden="true"></i>'
        ],
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 2
            }
        }
    });

 
    // Portfolio isotope and filter
    var portfolioIsotope = $('.portfolio-container').isotope({
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
    });

    $('#portfolio-flters li').on('click', function() {
        $("#portfolio-flters li").removeClass('active');
        $(this).addClass('active');

        portfolioIsotope.isotope({ filter: $(this).data('filter') });
    });


    // Team carousel
    $(".team-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1400,
        dots: false,
        loop: true,
        nav: true,
        navText: [
            '<i class="fa fa-angle-left" aria-hidden="true"></i>',
            '<i class="fa fa-angle-right" aria-hidden="true"></i>'
        ],
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        }
    });



    // Testimonies carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: false,
        loop: true,
        nav: true,
        navText: [
            '<i class="fa fa-angle-left" aria-hidden="true"></i>',
            '<i class="fa fa-angle-right" aria-hidden="true"></i>'
        ]
    });

    $('.carousel').carousel({
        interval: 9000
    });
})(jQuery);

var myCarousel = document.querySelector('#carouselExampleCaptions')
var carousel = new bootstrap.Carousel(myCarousel, {
    interval: 2000,

})

function loader(){
    document.querySelector('.loader-container').classList.add('active');
  }
  
  function fadeOut(){
    setTimeout(loader, 4000);
    
  }


// //Validaton form

// var nameError =  document.getElementById('name-error')
// var phoneError =  document.getElementById('phone-error')
// var emailError =  document.getElementById('email-error')
// var messageError =  document.getElementById('message-error')
// var submitError =  document.getElementById('submit-error')
// var countryError = document.getElementById('select_service')


// function validateName(){
//     var name = document.getElementById('contact-name').value;

//     if(name.length == 0){
//         nameError.innerHTML = 'Name is required';
//         return false;
//     }
//     if (!name.match(/^[A-Za-z]*\s{1}[A-Za-z]*$/)){
//     nameError.innerHTML = 'Write full name';
//     return false;
//     }
//     nameError.innerHTML = '<i class="fas fa-check-circle"></i>';
//     return true;
// }

// function validatePhone(){
//     var phone = document.getElementById('contact-phone').value;

//     if(phone.length == 0){
//         phoneError.innerHTML = 'Phone no is required';
//         return false;
//     }
//     if(phone.length !== 10){
//         phoneError.innerHTML = 'Phone no should be 10 digits';
//         return false;
//     }
//     if(!phone.match(/^[0-9]{10}$/)){
//         phoneError.innerHTML = 'only digits plase.';
//         return false;
//     }

//     phoneError.innerHTML = '<i class="fas fa-check-circle"></i>';
//     return true;
// }

// function validateEmail(){
//     var email = document.getElementById('contact-email').value;

//     if(email.length == 0){
//         emailError.innerHTML = 'Email is required';
//         return false;
//     }
//     if(!email.match(/^[A-Za-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/)){
//         emailError.innerHTML = 'Email Invalid'
//         return false;
//     }

//     emailError.innerHTML = '<i class="fas fa-check-circle"></i>';
//     return true;
// }
// function validateMessage(){
//     var message = document.getElementById('contact-message').value;
//     var required = 30;
//     var left = required -message.length;

//     if(left > 0){
//         messageError.innerHTML = left + 'more characters required';
//         return false;
//     }
//     messageError.innerHTML = '<i class="fas fa-check-circle"></i>';
//     return true;
// }

// function ValidatonContry(){
//    var selected_Country = document.getElementById('select_service').selectedIndex
//    if (selected_Country === 0){
//         alert('please select your country');
//         document.selected_Country.focus();
//         return false;
//    }
// }
// function validatForm(){
//     if(!validateName() || !validatePhone() || !validateEmail() || !validateMessage() || !ValidatonContry()){
//         submitError.style.display = 'block';
//         submitError.innerHTML = 'please fix error to submit'
//         setTimeout(function(){submitError.style.display = 'none';},3000);
//         return false;
//     }
// }

