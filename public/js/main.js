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

    $('.close-specify--uss-resident').click(function() {
        $(".specify--uss-resident").hide('300');
    });

    $('.open-specify--uss-resident').click(function() {
        $(".specify--uss-resident").show('300');
    });

    $('.close-specify--politic').click(function() {
        $(".specify--politic").hide('300');
    });

    $('.open-specify--politic').click(function() {
        $(".specify--politic").show('300');
    });

    $('.close-specify--partner').click(function() {
        $(".specify--partner").hide('300');
    });

    $('.open-specify--partner').click(function() {
        $(".specify--partner").show('300');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKVxue1xuXG4gICAgJCgnLnNpZ2gtaW4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5wb3B1cC1pblwiKS5hZGRDbGFzcygnb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJCgnLnNpZ2gtdXAsIC5pbmRleC1zaWduLXVwJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIucG9wdXAtdXBcIikuYWRkQ2xhc3MoJ29wZW4nKTtcbiAgICB9KTtcblxuICAgICQoJy5xci1idG4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5xclwiKS5hZGRDbGFzcygnb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJCgnLmNsb3NlLXBvcHVwLCAucG9wdXAtY2xvc2UtYmxvY2snKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5wb3B1cFwiKS5yZW1vdmVDbGFzcygnb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJCgnLnByb2ZpbGUtaXRlbScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnByb2ZpbGVcIikudG9nZ2xlQ2xhc3MoJ3Byb2ZpbGUtb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJChkb2N1bWVudCkubW91c2V1cChmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgY29udGFpbmVyUHJvZmlsZSA9ICQoXCIucHJvZmlsZVwiKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lclByb2ZpbGUuaGFzKGUudGFyZ2V0KS5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgY29udGFpbmVyUHJvZmlsZS5yZW1vdmVDbGFzcygncHJvZmlsZS1vcGVuJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoJy5nb1RvUHJvZmlsZScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnByb2ZpbGVcIikuc2hvdygpO1xuICAgICAgICAkKFwiLnNpZ25cIikuaGlkZSgpO1xuICAgICAgICAkKFwiLnBvcHVwXCIpLnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuZXhpdC1wcm9maWxlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIucHJvZmlsZVwiKS5oaWRlKCk7XG4gICAgICAgICQoXCIuc2lnblwiKS5zaG93KCk7XG4gICAgfSk7XG5cbiAgICAkKCd1bC50YWJzIGxpJykuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHRhYl9pZCA9ICQodGhpcykuYXR0cignZGF0YS10YWInKTtcblxuICAgICAgICAkKCd1bC50YWJzIGxpJykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgJCgnLnRhYi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcblxuICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICQoXCIjXCIrdGFiX2lkKS5hZGRDbGFzcygnY3VycmVudCcpO1xuXG4gICAgICAgIGlmKHRhYl9pZCA9PSAnYnV5LXNlbGwnKVxuICAgICAgICB7XG4gICAgICAgICAgICAkKCcudGFibGUtYi1zJykucmVtb3ZlQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgIGxldCBhY3RpdmVTZWNvbmRUYWIgPSAkKCcudGFic19fYnV5LXNlbGwgbGkuYWN0aXZlJykuYXR0cignZGF0YS1uYW1lJyk7XG5cbiAgICAgICAgICAgIGlmKGFjdGl2ZVNlY29uZFRhYiA9PSAnYnV5JylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkKCcjdGFibGVfX2J1eScpLmFkZENsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKGFjdGl2ZVNlY29uZFRhYiA9PSAnc2VsbCcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJCgnI3RhYmxlX19zZWxsJykuYWRkQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnLnRhYmxlLWItcycpLnJlbW92ZUNsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgJCgnLmNsb3NlLXNwZWNpZnknKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5zcGVjaWZ5XCIpLmhpZGUoJzMwMCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLm9wZW4tc3BlY2lmeScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnNwZWNpZnlcIikuc2hvdygnMzAwJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuY2xvc2Utc3BlY2lmeS0tdXNzLXJlc2lkZW50JykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIuc3BlY2lmeS0tdXNzLXJlc2lkZW50XCIpLmhpZGUoJzMwMCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLm9wZW4tc3BlY2lmeS0tdXNzLXJlc2lkZW50JykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIuc3BlY2lmeS0tdXNzLXJlc2lkZW50XCIpLnNob3coJzMwMCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLmNsb3NlLXNwZWNpZnktLXBvbGl0aWMnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5zcGVjaWZ5LS1wb2xpdGljXCIpLmhpZGUoJzMwMCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLm9wZW4tc3BlY2lmeS0tcG9saXRpYycpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnNwZWNpZnktLXBvbGl0aWNcIikuc2hvdygnMzAwJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuY2xvc2Utc3BlY2lmeS0tcGFydG5lcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnNwZWNpZnktLXBhcnRuZXJcIikuaGlkZSgnMzAwJyk7XG4gICAgfSk7XG5cbiAgICAkKCcub3Blbi1zcGVjaWZ5LS1wYXJ0bmVyJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIuc3BlY2lmeS0tcGFydG5lclwiKS5zaG93KCczMDAnKTtcbiAgICB9KTtcblxuICAgICQoJy5kb2N1bWVudC1pdGVtJykuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgnLmRvY3VtZW50LWl0ZW0nKS5yZW1vdmVDbGFzcygnZG9jdW1lbnQtY2hvb3NlJyk7XG4gICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ2RvY3VtZW50LWNob29zZScpO1xuXG4gICAgfSk7XG5cbiAgICAkKCcuZG9jdW1lbnQtcmVqZWN0JykuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJChcIi5wb3B1cC1yZWplY3RcIikuYWRkQ2xhc3MoJ29wZW4nKTtcbiAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnZG9jdW1lbnQtY2hvb3NlJyk7XG5cbiAgICB9KTtcblxufSk7XG5cbihmdW5jdGlvbigkKSB7XG4gICAgJChmdW5jdGlvbigpIHtcblxuICAgICAgICAkKCd1bC50YWJzX19idXktc2VsbCcpLm9uKCdjbGljaycsICdsaTpub3QoLmFjdGl2ZSknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQodGhpcylcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgICAgLmNsb3Nlc3QoJ2Rpdi50YWItY29udGVudC1idXktc2VsbCcpLmZpbmQoJ2Rpdi50YWJzX19jb250ZW50LWJ1eS1zZWxsJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpLmVxKCQodGhpcykuaW5kZXgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgICAgLmNsb3Nlc3QoJ2Rpdi5tYWluLXRhYicpLmZpbmQoJ2Rpdi50YWJsZS1iLXMnKS5yZW1vdmVDbGFzcygnc2hvdy10YWJsZS1idXktc2VsbCcpLmVxKCQodGhpcykuaW5kZXgoKSkuYWRkQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcbn0pKGpRdWVyeSk7XG5cbihmdW5jdGlvbigkKSB7XG4gICAgJChmdW5jdGlvbigpIHtcblxuICAgICAgICAkKCd1bC50YWJzX19jYXB0aW9uJykub24oJ2NsaWNrJywgJ2xpOm5vdCguYWN0aXZlKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAgICAgICAuY2xvc2VzdCgnZGl2LnRhYnMnKS5maW5kKCdkaXYudGFic19fY29udGVudCcpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKS5lcSgkKHRoaXMpLmluZGV4KCkpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcbn0pKGpRdWVyeSk7XG5cbihmdW5jdGlvbigkKSB7XG4gICAgJChmdW5jdGlvbigpIHtcblxuICAgICAgICAkKCd1bC50YWJzLXNlYycpLm9uKCdjbGljaycsICdsaTpub3QoLmFjdGl2ZS1zZWMpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKHRoaXMpXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUtc2VjJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlLXNlYycpXG4gICAgICAgICAgICAgICAgLmNsb3Nlc3QoJ2Rpdi5tYWluLXRhYicpLmZpbmQoJ2Rpdi5zZWMtdGFiJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZS1zZWMtdGFiJykuZXEoJCh0aGlzKS5pbmRleCgpKS5hZGRDbGFzcygnYWN0aXZlLXNlYy10YWInKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcbn0pKGpRdWVyeSk7XG5cbihmdW5jdGlvbigkKSB7XG4gICAgJChmdW5jdGlvbigpIHtcblxuICAgICAgICAkKCd1bC50YWJzLXBlcicpLm9uKCdjbGljaycsICdsaTpub3QoLmFjdGl2ZS1wZXIpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKHRoaXMpXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUtcGVyJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlLXBlcicpXG4gICAgICAgICAgICAgICAgLmNsb3Nlc3QoJ2Rpdi5tYWluLXRhYicpLmZpbmQoJ2Rpdi5wZXItdGFiJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZS1wZXItdGFiJykuZXEoJCh0aGlzKS5pbmRleCgpKS5hZGRDbGFzcygnYWN0aXZlLXBlci10YWInKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcbn0pKGpRdWVyeSk7XG5cbihmdW5jdGlvbigkKSB7XG4gICAgJChmdW5jdGlvbigpIHtcblxuICAgICAgICAkKCcuYnRuLXNlY3VyaXR5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcudGFiLWNvbnRlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnLnRhYmxlJykucmVtb3ZlQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgICQoJy50YWItbGluaycpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICAgICAkKCcjc2VjdXJpdHktYmxvY2snKS5hZGRDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICAkKCcuYnRuLW1lcmNoYW50Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcudGFiLWNvbnRlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnLnRhYmxlJykucmVtb3ZlQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgICQoJy50YWItbGluaycpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICAgICAkKCcjbWVyY2hhbnQtYmxvY2snKS5hZGRDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICAkKCcuYnRuLXBlcnNvbmFsJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcudGFiLWNvbnRlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnLnRhYmxlJykucmVtb3ZlQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgICQoJy50YWItbGluaycpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICAgICAkKCcjcGVyc29uYWwtYmxvY2snKS5hZGRDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xufSkoalF1ZXJ5KTtcblxuZnVuY3Rpb24gcmFuZG9tMShtaW4sIG1heCkge1xuICAgIHZhciByYW5kID0gbWluICsgTWF0aC5yYW5kb20oKSAqIChtYXggKyAxIC0gbWluKTtcbiAgICByYW5kID0gTWF0aC5mbG9vcihyYW5kKTtcbiAgICByZXR1cm4gcmFuZDtcbn1cblxuZnVuY3Rpb24gcmFuZG9tMihtaW4sIG1heCkge1xuICAgIHZhciByYW5kMiA9IG1pbiArIE1hdGgucmFuZG9tKCkgKiAobWF4ICsgMSAtIG1pbik7XG4gICAgcmFuZDIgPSBNYXRoLmZsb29yKHJhbmQyKTtcbiAgICByZXR1cm4gcmFuZDI7XG59XG5cbmZ1bmN0aW9uIHJhbmRvbTMobWluLCBtYXgpIHtcbiAgICB2YXIgcmFuZDMgPSBtaW4gKyBNYXRoLnJhbmRvbSgpICogKG1heCArIDEgLSBtaW4pO1xuICAgIHJhbmQzID0gTWF0aC5mbG9vcihyYW5kMyk7XG4gICAgcmV0dXJuIHJhbmQzO1xufVxuXG5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9ncmVzc18xJykudmFsdWUgPSByYW5kb20xKDEwLCAxMDApO1xufSwgMCk7XG5cbnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2dyZXNzXzInKS52YWx1ZSA9IHJhbmRvbTIoMTAsIDEwMCk7XG59LCAwKTtcblxuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvZ3Jlc3NfMycpLnZhbHVlID0gcmFuZG9tMygxMCwgMTAwKTtcbn0sIDApO1xuXG5cbiQoIGZ1bmN0aW9uKCkge1xuICAgICQoIFwiI2RhdGVwaWNrZXJcIiApLmRhdGVwaWNrZXIoe1xuICAgICAgICBjaGFuZ2VNb250aDogdHJ1ZSxcbiAgICAgICAgY2hhbmdlWWVhcjogdHJ1ZSxcbiAgICAgICAgeWVhclJhbmdlOiAnMTk1MDoyMDE4J1xuICAgIH0pO1xufSApO1xuXG4kKCBmdW5jdGlvbigpIHtcbiAgICAkKCBcIiNkYXRlcGlja2VyMVwiICkuZGF0ZXBpY2tlcih7XG4gICAgICAgIGNoYW5nZU1vbnRoOiB0cnVlLFxuICAgICAgICBjaGFuZ2VZZWFyOiB0cnVlLFxuICAgICAgICB5ZWFyUmFuZ2U6ICcxOTcwOjIwMTgnXG4gICAgfSk7XG59ICk7XG5cbiQoIGZ1bmN0aW9uKCkge1xuICAgICQoIFwiI2RhdGVwaWNrZXIyXCIgKS5kYXRlcGlja2VyKHtcbiAgICAgICAgY2hhbmdlTW9udGg6IHRydWUsXG4gICAgICAgIGNoYW5nZVllYXI6IHRydWUsXG4gICAgICAgIHllYXJSYW5nZTogJzIwMDA6MjAxOCdcbiAgICB9KTtcbn0gKTtcblxudmFyIHRlbElucHV0ID0gJChcIiNwaG9uZVwiKSxcbiAgICBlcnJvck1zZyA9ICQoXCIjZXJyb3ItbXNnXCIpLFxuICAgIHZhbGlkTXNnID0gJChcIiN2YWxpZC1tc2dcIik7XG5cbi8vIGluaXRpYWxpc2UgcGx1Z2luXG50ZWxJbnB1dC5pbnRsVGVsSW5wdXQoe1xuICAgIC8vIGFsbG93RHJvcGRvd246IGZhbHNlLFxuICAgIC8vIGF1dG9IaWRlRGlhbENvZGU6IGZhbHNlLFxuICAgIC8vIGF1dG9QbGFjZWhvbGRlcjogXCJvZmZcIixcbiAgICAvLyBkcm9wZG93bkNvbnRhaW5lcjogXCJib2R5XCIsXG4gICAgLy8gZXhjbHVkZUNvdW50cmllczogW1widXNcIl0sXG4gICAgLy8gZm9ybWF0T25EaXNwbGF5OiBmYWxzZSxcbiAgICAvLyBnZW9JcExvb2t1cDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAvLyAgICQuZ2V0KFwiaHR0cDovL2lwaW5mby5pb1wiLCBmdW5jdGlvbigpIHt9LCBcImpzb25wXCIpLmFsd2F5cyhmdW5jdGlvbihyZXNwKSB7XG4gICAgLy8gICAgIHZhciBjb3VudHJ5Q29kZSA9IChyZXNwICYmIHJlc3AuY291bnRyeSkgPyByZXNwLmNvdW50cnkgOiBcIlwiO1xuICAgIC8vICAgICBjYWxsYmFjayhjb3VudHJ5Q29kZSk7XG4gICAgLy8gICB9KTtcbiAgICAvLyB9LFxuICAgIC8vIGhpZGRlbklucHV0OiBcImZ1bGxfbnVtYmVyXCIsXG4gICAgLy8gaW5pdGlhbENvdW50cnk6IFwiYXV0b1wiLFxuICAgIC8vIGxvY2FsaXplZENvdW50cmllczogeyAnZGUnOiAnRGV1dHNjaGxhbmQnIH0sXG4gICAgLy8gbmF0aW9uYWxNb2RlOiBmYWxzZSxcbiAgICAvLyBvbmx5Q291bnRyaWVzOiBbJ3VzJywgJ2diJywgJ2NoJywgJ2NhJywgJ2RvJ10sXG4gICAgLy8gcGxhY2Vob2xkZXJOdW1iZXJUeXBlOiBcIk1PQklMRVwiLFxuICAgIC8vIHByZWZlcnJlZENvdW50cmllczogWydjbicsICdqcCddLFxuICAgIHNlcGFyYXRlRGlhbENvZGU6IHRydWUsXG4gICAgdXRpbHNTY3JpcHQ6XCJ1dGlscy5qc1wiXG59KTtcblxudmFyIHJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGVsSW5wdXQucmVtb3ZlQ2xhc3MoXCJlcnJvclwiKTtcbiAgICBlcnJvck1zZy5hZGRDbGFzcyhcImhpZGVcIik7XG4gICAgdmFsaWRNc2cuYWRkQ2xhc3MoXCJoaWRlXCIpO1xufTtcblxuLy8gb24gYmx1cjogdmFsaWRhdGVcbnRlbElucHV0LmJsdXIoZnVuY3Rpb24oKSB7XG4gICAgcmVzZXQoKTtcbiAgICBpZiAoJC50cmltKHRlbElucHV0LnZhbCgpKSkge1xuICAgICAgICBpZiAodGVsSW5wdXQuaW50bFRlbElucHV0KFwiaXNWYWxpZE51bWJlclwiKSkge1xuICAgICAgICAgICAgdmFsaWRNc2cucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgdmFyIGdldENvZGUgPSB0ZWxJbnB1dC5pbnRsVGVsSW5wdXQoJ2dldFNlbGVjdGVkQ291bnRyeURhdGEnKS5kaWFsQ29kZTtcbiAgICAgICAgICAgIGFsZXJ0KGdldENvZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGVsSW5wdXQuYWRkQ2xhc3MoXCJlcnJvclwiKTtcbiAgICAgICAgICAgIGVycm9yTXNnLnJlbW92ZUNsYXNzKFwiaGlkZVwiKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vLyBvbiBrZXl1cCAvIGNoYW5nZSBmbGFnOiByZXNldFxudGVsSW5wdXQub24oXCJrZXl1cCBjaGFuZ2VcIiwgcmVzZXQpO1xuXG4kKFwiI3Bob25lXCIpLm9uKFwia2V5cHJlc3Mga2V5dXAgYmx1clwiLGZ1bmN0aW9uIChldmVudCkge1xuICAgICQodGhpcykudmFsKCQodGhpcykudmFsKCkucmVwbGFjZSgvW15cXGRdLisvLCBcIlwiKSk7XG4gICAgaWYgKChldmVudC53aGljaCA8IDQ4IHx8IGV2ZW50LndoaWNoID4gNTcpKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxufSk7XG5cblxuIl0sImZpbGUiOiJtYWluLmpzIn0=
