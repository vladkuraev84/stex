'use strict';

$(document).ready(function()
{

    $('.sigh-in').click(function() {
        $(".popup-in").addClass('open');
    });

    $('.sigh-up, .index-sign-up').click(function() {
        $(".popup-up").addClass('open');
        return false;
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

        var min_width = 768;
        $(window).on('resize', function() {
            var new_width = $(window).width();

            if (new_width <= min_width) {

                $('.sidebar').removeClass('sidebar-mobile');
                $('.menu-icon').removeClass('clicked');

            }

        }).trigger('resize');

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

    $('.btn-buy-sell__buy').click(function() {

        $(".tabs__content-buy-sell").removeClass('active');
        $(".tabs__buy-sell--wr").hide();
        $('.tabs__content-buy-sell__sub--buy').addClass('active');

    });

    $('.btn-buy-sell__sell').click(function() {

        $(".tabs__content-buy-sell").removeClass('active');
        $(".tabs__buy-sell--wr").hide();
        $('.tabs__content-buy-sell__sub--sell').addClass('active');

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

        $('ul.tabs__content-buy-sell__sub--list').on('click', 'li:not(.active)', function() {
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
            $('.profile').removeClass('profile-open');
            return false;
        });

        $('.btn-merchant').on('click', function() {
            $('.tab-content').removeClass('current');
            $('.table').removeClass('show-table-buy-sell');
            $('.tab-link').removeClass('current');
            $('#merchant-block').addClass('current');
            $('.profile').removeClass('profile-open');
            return false;
        });

        $('.btn-personal').on('click', function() {
            $('.tab-content').removeClass('current');
            $('.table').removeClass('show-table-buy-sell');
            $('.tab-link').removeClass('current');
            $('#personal-block').addClass('current');
            $('.profile').removeClass('profile-open');
            return false;
        });

    });
})(jQuery);









