'use strict';

$(document).ready(function()
{

    $('.sigh-in').click(function() {
        $(".popup-in").addClass('open');
    });

    $('.sigh-up, .index-sign-up').click(function() {
        $(".popup-up").addClass('open');
    });

    $('.qr-btn').click(function() {
        $(".qr").addClass('open');
    });

    $('.close-popup, .popup-close-block').click(function() {
        $(".popup").removeClass('open');
    });

    $('.profile-item').click(function() {
        $(".profile").toggleClass('profile-open');
    });

    $(document).mouseup(function (e) {
        var containerProfile = $(".profile");
        if (containerProfile.has(e.target).length === 0){
            containerProfile.removeClass('profile-open');
        }
    });

    $('.goToProfile').click(function() {
        $(".profile").show();
        $(".sign").hide();
        $(".popup").removeClass('open');
    });

    $('.exit-profile').click(function() {
        $(".profile").hide();
        $(".sign").show();
    });

    $('ul.tabs li').click(function(){
        var tab_id = $(this).attr('data-tab');

        $('ul.tabs li').removeClass('current');
        $('.tab-content').removeClass('current');

        $(this).addClass('current');
        $("#"+tab_id).addClass('current');

        if(tab_id == 'buy-sell')
        {
            $('.table-b-s').removeClass('show-table-buy-sell');
            let activeSecondTab = $('.tabs__buy-sell li.active').attr('data-name');

            if(activeSecondTab == 'buy')
            {
                $('#table__buy').addClass('show-table-buy-sell');
            }
            else if(activeSecondTab == 'sell')
            {
                $('#table__sell').addClass('show-table-buy-sell');
            }

        } else {
            $('.table-b-s').removeClass('show-table-buy-sell');
        }

    });

    $('.close-specify').click(function() {
        $(".specify").hide('300');
    });

    $('.open-specify').click(function() {
        $(".specify").show('300');
    });

    $('.document-item').click(function() {

        $('.document-item').removeClass('document-choose');
        $(this).toggleClass('document-choose');

    });

    $('.document-reject').click(function() {

        $(".popup-reject").addClass('open');
        $(this).removeClass('document-choose');

    });

});

(function($) {
    $(function() {

        $('ul.tabs__buy-sell').on('click', 'li:not(.active)', function() {
            $(this)
                .addClass('active').siblings().removeClass('active')
                .closest('div.tab-content-buy-sell').find('div.tabs__content-buy-sell').removeClass('active').eq($(this).index()).addClass('active')
                .closest('div.main-tab').find('div.table-b-s').removeClass('show-table-buy-sell').eq($(this).index()).addClass('show-table-buy-sell');
        });

    });
})(jQuery);

(function($) {
    $(function() {

        $('ul.tabs__caption').on('click', 'li:not(.active)', function() {
            $(this)
                .addClass('active').siblings().removeClass('active')
                .closest('div.tabs').find('div.tabs__content').removeClass('active').eq($(this).index()).addClass('active');
        });

    });
})(jQuery);

(function($) {
    $(function() {

        $('ul.tabs-sec').on('click', 'li:not(.active-sec)', function() {
            $(this)
                .addClass('active-sec').siblings().removeClass('active-sec')
                .closest('div.main-tab').find('div.sec-tab').removeClass('active-sec-tab').eq($(this).index()).addClass('active-sec-tab');
        });

    });
})(jQuery);

(function($) {
    $(function() {

        $('ul.tabs-per').on('click', 'li:not(.active-per)', function() {
            $(this)
                .addClass('active-per').siblings().removeClass('active-per')
                .closest('div.main-tab').find('div.per-tab').removeClass('active-per-tab').eq($(this).index()).addClass('active-per-tab');
        });

    });
})(jQuery);

(function($) {
    $(function() {

        $('.btn-security').on('click', function() {
            $('.tab-content').removeClass('current');
            $('.table').removeClass('show-table-buy-sell');
            $('.tab-link').removeClass('current');
            $('#security-block').addClass('current');
            return false;
        });

        $('.btn-merchant').on('click', function() {
            $('.tab-content').removeClass('current');
            $('.table').removeClass('show-table-buy-sell');
            $('.tab-link').removeClass('current');
            $('#merchant-block').addClass('current');
            return false;
        });

        $('.btn-personal').on('click', function() {
            $('.tab-content').removeClass('current');
            $('.table').removeClass('show-table-buy-sell');
            $('.tab-link').removeClass('current');
            $('#personal-block').addClass('current');
            return false;
        });

    });
})(jQuery);

function random1(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}

function random2(min, max) {
    var rand2 = min + Math.random() * (max + 1 - min);
    rand2 = Math.floor(rand2);
    return rand2;
}

function random3(min, max) {
    var rand3 = min + Math.random() * (max + 1 - min);
    rand3 = Math.floor(rand3);
    return rand3;
}

setTimeout(function() {
    document.getElementById('progress_1').value = random1(10, 100);
}, 0);

setTimeout(function() {
    document.getElementById('progress_2').value = random2(10, 100);
}, 0);

setTimeout(function() {
    document.getElementById('progress_3').value = random3(10, 100);
}, 0);


$( function() {
    $( "#datepicker" ).datepicker({
        changeMonth: true,
        changeYear: true,
        yearRange: '1950:2018'
    });
} );

$( function() {
    $( "#datepicker1" ).datepicker({
        changeMonth: true,
        changeYear: true,
        yearRange: '1970:2018'
    });
} );

$( function() {
    $( "#datepicker2" ).datepicker({
        changeMonth: true,
        changeYear: true,
        yearRange: '2000:2018'
    });
} );

    var telInput = $("#phone"),
        errorMsg = $("#error-msg"),
        validMsg = $("#valid-msg");

    // initialise plugin
    telInput.intlTelInput({
        // allowDropdown: false,
        // autoHideDialCode: false,
        // autoPlaceholder: "off",
        // dropdownContainer: "body",
        // excludeCountries: ["us"],
        // formatOnDisplay: false,
        // geoIpLookup: function(callback) {
        //   $.get("http://ipinfo.io", function() {}, "jsonp").always(function(resp) {
        //     var countryCode = (resp && resp.country) ? resp.country : "";
        //     callback(countryCode);
        //   });
        // },
        // hiddenInput: "full_number",
        // initialCountry: "auto",
        // localizedCountries: { 'de': 'Deutschland' },
        // nationalMode: false,
        // onlyCountries: ['us', 'gb', 'ch', 'ca', 'do'],
        // placeholderNumberType: "MOBILE",
        // preferredCountries: ['cn', 'jp'],
        separateDialCode: true,
        utilsScript:"utils.js"
    });

    var reset = function() {
        telInput.removeClass("error");
        errorMsg.addClass("hide");
        validMsg.addClass("hide");
    };

    // on blur: validate
    telInput.blur(function() {
        reset();
        if ($.trim(telInput.val())) {
            if (telInput.intlTelInput("isValidNumber")) {
                validMsg.removeClass("hide");
                var getCode = telInput.intlTelInput('getSelectedCountryData').dialCode;
                alert(getCode);
            } else {
                telInput.addClass("error");
                errorMsg.removeClass("hide");
            }
        }
    });

    // on keyup / change flag: reset
    telInput.on("keyup change", reset);

    $("#phone").on("keypress keyup blur",function (event) {
        $(this).val($(this).val().replace(/[^\d].+/, ""));
        if ((event.which < 48 || event.which > 57)) {
            event.preventDefault();
        }
    });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKVxue1xuXG4gICAgJCgnLnNpZ2gtaW4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5wb3B1cC1pblwiKS5hZGRDbGFzcygnb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJCgnLnNpZ2gtdXAsIC5pbmRleC1zaWduLXVwJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIucG9wdXAtdXBcIikuYWRkQ2xhc3MoJ29wZW4nKTtcbiAgICB9KTtcblxuICAgICQoJy5xci1idG4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5xclwiKS5hZGRDbGFzcygnb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJCgnLmNsb3NlLXBvcHVwLCAucG9wdXAtY2xvc2UtYmxvY2snKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5wb3B1cFwiKS5yZW1vdmVDbGFzcygnb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJCgnLnByb2ZpbGUtaXRlbScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnByb2ZpbGVcIikudG9nZ2xlQ2xhc3MoJ3Byb2ZpbGUtb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJChkb2N1bWVudCkubW91c2V1cChmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgY29udGFpbmVyUHJvZmlsZSA9ICQoXCIucHJvZmlsZVwiKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lclByb2ZpbGUuaGFzKGUudGFyZ2V0KS5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgY29udGFpbmVyUHJvZmlsZS5yZW1vdmVDbGFzcygncHJvZmlsZS1vcGVuJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoJy5nb1RvUHJvZmlsZScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnByb2ZpbGVcIikuc2hvdygpO1xuICAgICAgICAkKFwiLnNpZ25cIikuaGlkZSgpO1xuICAgICAgICAkKFwiLnBvcHVwXCIpLnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuZXhpdC1wcm9maWxlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIucHJvZmlsZVwiKS5oaWRlKCk7XG4gICAgICAgICQoXCIuc2lnblwiKS5zaG93KCk7XG4gICAgfSk7XG5cbiAgICAkKCd1bC50YWJzIGxpJykuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHRhYl9pZCA9ICQodGhpcykuYXR0cignZGF0YS10YWInKTtcblxuICAgICAgICAkKCd1bC50YWJzIGxpJykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgJCgnLnRhYi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcblxuICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICQoXCIjXCIrdGFiX2lkKS5hZGRDbGFzcygnY3VycmVudCcpO1xuXG4gICAgICAgIGlmKHRhYl9pZCA9PSAnYnV5LXNlbGwnKVxuICAgICAgICB7XG4gICAgICAgICAgICAkKCcudGFibGUtYi1zJykucmVtb3ZlQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgIGxldCBhY3RpdmVTZWNvbmRUYWIgPSAkKCcudGFic19fYnV5LXNlbGwgbGkuYWN0aXZlJykuYXR0cignZGF0YS1uYW1lJyk7XG5cbiAgICAgICAgICAgIGlmKGFjdGl2ZVNlY29uZFRhYiA9PSAnYnV5JylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkKCcjdGFibGVfX2J1eScpLmFkZENsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKGFjdGl2ZVNlY29uZFRhYiA9PSAnc2VsbCcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJCgnI3RhYmxlX19zZWxsJykuYWRkQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnLnRhYmxlLWItcycpLnJlbW92ZUNsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgJCgnLmNsb3NlLXNwZWNpZnknKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5zcGVjaWZ5XCIpLmhpZGUoJzMwMCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLm9wZW4tc3BlY2lmeScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnNwZWNpZnlcIikuc2hvdygnMzAwJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuZG9jdW1lbnQtaXRlbScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoJy5kb2N1bWVudC1pdGVtJykucmVtb3ZlQ2xhc3MoJ2RvY3VtZW50LWNob29zZScpO1xuICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdkb2N1bWVudC1jaG9vc2UnKTtcblxuICAgIH0pO1xuXG4gICAgJCgnLmRvY3VtZW50LXJlamVjdCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoXCIucG9wdXAtcmVqZWN0XCIpLmFkZENsYXNzKCdvcGVuJyk7XG4gICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2RvY3VtZW50LWNob29zZScpO1xuXG4gICAgfSk7XG5cbn0pO1xuXG4oZnVuY3Rpb24oJCkge1xuICAgICQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgndWwudGFic19fYnV5LXNlbGwnKS5vbignY2xpY2snLCAnbGk6bm90KC5hY3RpdmUpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKHRoaXMpXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAgIC5jbG9zZXN0KCdkaXYudGFiLWNvbnRlbnQtYnV5LXNlbGwnKS5maW5kKCdkaXYudGFic19fY29udGVudC1idXktc2VsbCcpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKS5lcSgkKHRoaXMpLmluZGV4KCkpLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAgIC5jbG9zZXN0KCdkaXYubWFpbi10YWInKS5maW5kKCdkaXYudGFibGUtYi1zJykucmVtb3ZlQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKS5lcSgkKHRoaXMpLmluZGV4KCkpLmFkZENsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59KShqUXVlcnkpO1xuXG4oZnVuY3Rpb24oJCkge1xuICAgICQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgndWwudGFic19fY2FwdGlvbicpLm9uKCdjbGljaycsICdsaTpub3QoLmFjdGl2ZSknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQodGhpcylcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgICAgLmNsb3Nlc3QoJ2Rpdi50YWJzJykuZmluZCgnZGl2LnRhYnNfX2NvbnRlbnQnKS5yZW1vdmVDbGFzcygnYWN0aXZlJykuZXEoJCh0aGlzKS5pbmRleCgpKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59KShqUXVlcnkpO1xuXG4oZnVuY3Rpb24oJCkge1xuICAgICQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgndWwudGFicy1zZWMnKS5vbignY2xpY2snLCAnbGk6bm90KC5hY3RpdmUtc2VjKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlLXNlYycpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZS1zZWMnKVxuICAgICAgICAgICAgICAgIC5jbG9zZXN0KCdkaXYubWFpbi10YWInKS5maW5kKCdkaXYuc2VjLXRhYicpLnJlbW92ZUNsYXNzKCdhY3RpdmUtc2VjLXRhYicpLmVxKCQodGhpcykuaW5kZXgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZS1zZWMtdGFiJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59KShqUXVlcnkpO1xuXG4oZnVuY3Rpb24oJCkge1xuICAgICQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgndWwudGFicy1wZXInKS5vbignY2xpY2snLCAnbGk6bm90KC5hY3RpdmUtcGVyKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlLXBlcicpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZS1wZXInKVxuICAgICAgICAgICAgICAgIC5jbG9zZXN0KCdkaXYubWFpbi10YWInKS5maW5kKCdkaXYucGVyLXRhYicpLnJlbW92ZUNsYXNzKCdhY3RpdmUtcGVyLXRhYicpLmVxKCQodGhpcykuaW5kZXgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZS1wZXItdGFiJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59KShqUXVlcnkpO1xuXG4oZnVuY3Rpb24oJCkge1xuICAgICQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgnLmJ0bi1zZWN1cml0eScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCgnLnRhYi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgICQoJy50YWJsZScpLnJlbW92ZUNsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgICAgICAkKCcudGFiLWxpbmsnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnI3NlY3VyaXR5LWJsb2NrJykuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnLmJ0bi1tZXJjaGFudCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCgnLnRhYi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgICQoJy50YWJsZScpLnJlbW92ZUNsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgICAgICAkKCcudGFiLWxpbmsnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnI21lcmNoYW50LWJsb2NrJykuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnLmJ0bi1wZXJzb25hbCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCgnLnRhYi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgICQoJy50YWJsZScpLnJlbW92ZUNsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgICAgICAkKCcudGFiLWxpbmsnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnI3BlcnNvbmFsLWJsb2NrJykuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcbn0pKGpRdWVyeSk7XG5cbmZ1bmN0aW9uIHJhbmRvbTEobWluLCBtYXgpIHtcbiAgICB2YXIgcmFuZCA9IG1pbiArIE1hdGgucmFuZG9tKCkgKiAobWF4ICsgMSAtIG1pbik7XG4gICAgcmFuZCA9IE1hdGguZmxvb3IocmFuZCk7XG4gICAgcmV0dXJuIHJhbmQ7XG59XG5cbmZ1bmN0aW9uIHJhbmRvbTIobWluLCBtYXgpIHtcbiAgICB2YXIgcmFuZDIgPSBtaW4gKyBNYXRoLnJhbmRvbSgpICogKG1heCArIDEgLSBtaW4pO1xuICAgIHJhbmQyID0gTWF0aC5mbG9vcihyYW5kMik7XG4gICAgcmV0dXJuIHJhbmQyO1xufVxuXG5mdW5jdGlvbiByYW5kb20zKG1pbiwgbWF4KSB7XG4gICAgdmFyIHJhbmQzID0gbWluICsgTWF0aC5yYW5kb20oKSAqIChtYXggKyAxIC0gbWluKTtcbiAgICByYW5kMyA9IE1hdGguZmxvb3IocmFuZDMpO1xuICAgIHJldHVybiByYW5kMztcbn1cblxuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvZ3Jlc3NfMScpLnZhbHVlID0gcmFuZG9tMSgxMCwgMTAwKTtcbn0sIDApO1xuXG5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9ncmVzc18yJykudmFsdWUgPSByYW5kb20yKDEwLCAxMDApO1xufSwgMCk7XG5cbnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2dyZXNzXzMnKS52YWx1ZSA9IHJhbmRvbTMoMTAsIDEwMCk7XG59LCAwKTtcblxuXG4kKCBmdW5jdGlvbigpIHtcbiAgICAkKCBcIiNkYXRlcGlja2VyXCIgKS5kYXRlcGlja2VyKHtcbiAgICAgICAgY2hhbmdlTW9udGg6IHRydWUsXG4gICAgICAgIGNoYW5nZVllYXI6IHRydWUsXG4gICAgICAgIHllYXJSYW5nZTogJzE5NTA6MjAxOCdcbiAgICB9KTtcbn0gKTtcblxuJCggZnVuY3Rpb24oKSB7XG4gICAgJCggXCIjZGF0ZXBpY2tlcjFcIiApLmRhdGVwaWNrZXIoe1xuICAgICAgICBjaGFuZ2VNb250aDogdHJ1ZSxcbiAgICAgICAgY2hhbmdlWWVhcjogdHJ1ZSxcbiAgICAgICAgeWVhclJhbmdlOiAnMTk3MDoyMDE4J1xuICAgIH0pO1xufSApO1xuXG4kKCBmdW5jdGlvbigpIHtcbiAgICAkKCBcIiNkYXRlcGlja2VyMlwiICkuZGF0ZXBpY2tlcih7XG4gICAgICAgIGNoYW5nZU1vbnRoOiB0cnVlLFxuICAgICAgICBjaGFuZ2VZZWFyOiB0cnVlLFxuICAgICAgICB5ZWFyUmFuZ2U6ICcyMDAwOjIwMTgnXG4gICAgfSk7XG59ICk7XG5cbiAgICB2YXIgdGVsSW5wdXQgPSAkKFwiI3Bob25lXCIpLFxuICAgICAgICBlcnJvck1zZyA9ICQoXCIjZXJyb3ItbXNnXCIpLFxuICAgICAgICB2YWxpZE1zZyA9ICQoXCIjdmFsaWQtbXNnXCIpO1xuXG4gICAgLy8gaW5pdGlhbGlzZSBwbHVnaW5cbiAgICB0ZWxJbnB1dC5pbnRsVGVsSW5wdXQoe1xuICAgICAgICAvLyBhbGxvd0Ryb3Bkb3duOiBmYWxzZSxcbiAgICAgICAgLy8gYXV0b0hpZGVEaWFsQ29kZTogZmFsc2UsXG4gICAgICAgIC8vIGF1dG9QbGFjZWhvbGRlcjogXCJvZmZcIixcbiAgICAgICAgLy8gZHJvcGRvd25Db250YWluZXI6IFwiYm9keVwiLFxuICAgICAgICAvLyBleGNsdWRlQ291bnRyaWVzOiBbXCJ1c1wiXSxcbiAgICAgICAgLy8gZm9ybWF0T25EaXNwbGF5OiBmYWxzZSxcbiAgICAgICAgLy8gZ2VvSXBMb29rdXA6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIC8vICAgJC5nZXQoXCJodHRwOi8vaXBpbmZvLmlvXCIsIGZ1bmN0aW9uKCkge30sIFwianNvbnBcIikuYWx3YXlzKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgLy8gICAgIHZhciBjb3VudHJ5Q29kZSA9IChyZXNwICYmIHJlc3AuY291bnRyeSkgPyByZXNwLmNvdW50cnkgOiBcIlwiO1xuICAgICAgICAvLyAgICAgY2FsbGJhY2soY291bnRyeUNvZGUpO1xuICAgICAgICAvLyAgIH0pO1xuICAgICAgICAvLyB9LFxuICAgICAgICAvLyBoaWRkZW5JbnB1dDogXCJmdWxsX251bWJlclwiLFxuICAgICAgICAvLyBpbml0aWFsQ291bnRyeTogXCJhdXRvXCIsXG4gICAgICAgIC8vIGxvY2FsaXplZENvdW50cmllczogeyAnZGUnOiAnRGV1dHNjaGxhbmQnIH0sXG4gICAgICAgIC8vIG5hdGlvbmFsTW9kZTogZmFsc2UsXG4gICAgICAgIC8vIG9ubHlDb3VudHJpZXM6IFsndXMnLCAnZ2InLCAnY2gnLCAnY2EnLCAnZG8nXSxcbiAgICAgICAgLy8gcGxhY2Vob2xkZXJOdW1iZXJUeXBlOiBcIk1PQklMRVwiLFxuICAgICAgICAvLyBwcmVmZXJyZWRDb3VudHJpZXM6IFsnY24nLCAnanAnXSxcbiAgICAgICAgc2VwYXJhdGVEaWFsQ29kZTogdHJ1ZSxcbiAgICAgICAgdXRpbHNTY3JpcHQ6XCJ1dGlscy5qc1wiXG4gICAgfSk7XG5cbiAgICB2YXIgcmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGVsSW5wdXQucmVtb3ZlQ2xhc3MoXCJlcnJvclwiKTtcbiAgICAgICAgZXJyb3JNc2cuYWRkQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICB2YWxpZE1zZy5hZGRDbGFzcyhcImhpZGVcIik7XG4gICAgfTtcblxuICAgIC8vIG9uIGJsdXI6IHZhbGlkYXRlXG4gICAgdGVsSW5wdXQuYmx1cihmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzZXQoKTtcbiAgICAgICAgaWYgKCQudHJpbSh0ZWxJbnB1dC52YWwoKSkpIHtcbiAgICAgICAgICAgIGlmICh0ZWxJbnB1dC5pbnRsVGVsSW5wdXQoXCJpc1ZhbGlkTnVtYmVyXCIpKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRNc2cucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgICAgIHZhciBnZXRDb2RlID0gdGVsSW5wdXQuaW50bFRlbElucHV0KCdnZXRTZWxlY3RlZENvdW50cnlEYXRhJykuZGlhbENvZGU7XG4gICAgICAgICAgICAgICAgYWxlcnQoZ2V0Q29kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRlbElucHV0LmFkZENsYXNzKFwiZXJyb3JcIik7XG4gICAgICAgICAgICAgICAgZXJyb3JNc2cucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBvbiBrZXl1cCAvIGNoYW5nZSBmbGFnOiByZXNldFxuICAgIHRlbElucHV0Lm9uKFwia2V5dXAgY2hhbmdlXCIsIHJlc2V0KTtcblxuICAgICQoXCIjcGhvbmVcIikub24oXCJrZXlwcmVzcyBrZXl1cCBibHVyXCIsZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykudmFsKCQodGhpcykudmFsKCkucmVwbGFjZSgvW15cXGRdLisvLCBcIlwiKSk7XG4gICAgICAgIGlmICgoZXZlbnQud2hpY2ggPCA0OCB8fCBldmVudC53aGljaCA+IDU3KSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiJdLCJmaWxlIjoibWFpbi5qcyJ9
