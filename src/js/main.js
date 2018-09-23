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


