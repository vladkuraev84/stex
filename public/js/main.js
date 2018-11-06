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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKVxue1xuXG4gICAgJCgnLnNpZ2gtaW4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5wb3B1cC1pblwiKS5hZGRDbGFzcygnb3BlbicpO1xuICAgIH0pO1xuXG4gICAgJCgnLnNpZ2gtdXAsIC5pbmRleC1zaWduLXVwJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIucG9wdXAtdXBcIikuYWRkQ2xhc3MoJ29wZW4nKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgJCgnLnFyLWJ0bicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnFyXCIpLmFkZENsYXNzKCdvcGVuJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuY2xvc2UtcG9wdXAsIC5wb3B1cC1jbG9zZS1ibG9jaycpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnBvcHVwXCIpLnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgfSk7XG5cbiAgICAkKCcucHJvZmlsZS1pdGVtJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIucHJvZmlsZVwiKS50b2dnbGVDbGFzcygncHJvZmlsZS1vcGVuJyk7XG4gICAgfSk7XG5cbiAgICAkKGRvY3VtZW50KS5tb3VzZXVwKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBjb250YWluZXJQcm9maWxlID0gJChcIi5wcm9maWxlXCIpO1xuICAgICAgICBpZiAoY29udGFpbmVyUHJvZmlsZS5oYXMoZS50YXJnZXQpLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICBjb250YWluZXJQcm9maWxlLnJlbW92ZUNsYXNzKCdwcm9maWxlLW9wZW4nKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJCgnLmdvVG9Qcm9maWxlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIucHJvZmlsZVwiKS5zaG93KCk7XG4gICAgICAgICQoXCIuc2lnblwiKS5oaWRlKCk7XG4gICAgICAgICQoXCIucG9wdXBcIikucmVtb3ZlQ2xhc3MoJ29wZW4nKTtcbiAgICB9KTtcblxuICAgICQoJy5leGl0LXByb2ZpbGUnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5wcm9maWxlXCIpLmhpZGUoKTtcbiAgICAgICAgJChcIi5zaWduXCIpLnNob3coKTtcbiAgICB9KTtcblxuICAgICQoJ3VsLnRhYnMgbGknKS5jbGljayhmdW5jdGlvbigpe1xuICAgICAgICB2YXIgdGFiX2lkID0gJCh0aGlzKS5hdHRyKCdkYXRhLXRhYicpO1xuXG4gICAgICAgICQoJ3VsLnRhYnMgbGknKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAkKCcudGFiLWNvbnRlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuXG4gICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgJChcIiNcIit0YWJfaWQpLmFkZENsYXNzKCdjdXJyZW50Jyk7XG5cbiAgICAgICAgaWYodGFiX2lkID09ICdidXktc2VsbCcpXG4gICAgICAgIHtcbiAgICAgICAgICAgICQoJy50YWJsZS1iLXMnKS5yZW1vdmVDbGFzcygnc2hvdy10YWJsZS1idXktc2VsbCcpO1xuICAgICAgICAgICAgbGV0IGFjdGl2ZVNlY29uZFRhYiA9ICQoJy50YWJzX19idXktc2VsbCBsaS5hY3RpdmUnKS5hdHRyKCdkYXRhLW5hbWUnKTtcblxuICAgICAgICAgICAgaWYoYWN0aXZlU2Vjb25kVGFiID09ICdidXknKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICQoJyN0YWJsZV9fYnV5JykuYWRkQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoYWN0aXZlU2Vjb25kVGFiID09ICdzZWxsJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkKCcjdGFibGVfX3NlbGwnKS5hZGRDbGFzcygnc2hvdy10YWJsZS1idXktc2VsbCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcudGFibGUtYi1zJykucmVtb3ZlQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtaW5fd2lkdGggPSA3Njg7XG4gICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbmV3X3dpZHRoID0gJCh3aW5kb3cpLndpZHRoKCk7XG5cbiAgICAgICAgICAgIGlmIChuZXdfd2lkdGggPD0gbWluX3dpZHRoKSB7XG5cbiAgICAgICAgICAgICAgICAkKCcuc2lkZWJhcicpLnJlbW92ZUNsYXNzKCdzaWRlYmFyLW1vYmlsZScpO1xuICAgICAgICAgICAgICAgICQoJy5tZW51LWljb24nKS5yZW1vdmVDbGFzcygnY2xpY2tlZCcpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSkudHJpZ2dlcigncmVzaXplJyk7XG5cbiAgICB9KTtcblxuICAgICQoJy5jbG9zZS1zcGVjaWZ5JykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIuc3BlY2lmeVwiKS5oaWRlKCczMDAnKTtcbiAgICB9KTtcblxuICAgICQoJy5vcGVuLXNwZWNpZnknKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5zcGVjaWZ5XCIpLnNob3coJzMwMCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLmNsb3NlLXNwZWNpZnktLXVzcy1yZXNpZGVudCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnNwZWNpZnktLXVzcy1yZXNpZGVudFwiKS5oaWRlKCczMDAnKTtcbiAgICB9KTtcblxuICAgICQoJy5vcGVuLXNwZWNpZnktLXVzcy1yZXNpZGVudCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnNwZWNpZnktLXVzcy1yZXNpZGVudFwiKS5zaG93KCczMDAnKTtcbiAgICB9KTtcblxuICAgICQoJy5jbG9zZS1zcGVjaWZ5LS1wb2xpdGljJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIuc3BlY2lmeS0tcG9saXRpY1wiKS5oaWRlKCczMDAnKTtcbiAgICB9KTtcblxuICAgICQoJy5vcGVuLXNwZWNpZnktLXBvbGl0aWMnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5zcGVjaWZ5LS1wb2xpdGljXCIpLnNob3coJzMwMCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLmNsb3NlLXNwZWNpZnktLXBhcnRuZXInKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5zcGVjaWZ5LS1wYXJ0bmVyXCIpLmhpZGUoJzMwMCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLm9wZW4tc3BlY2lmeS0tcGFydG5lcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLnNwZWNpZnktLXBhcnRuZXJcIikuc2hvdygnMzAwJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuZG9jdW1lbnQtaXRlbScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoJy5kb2N1bWVudC1pdGVtJykucmVtb3ZlQ2xhc3MoJ2RvY3VtZW50LWNob29zZScpO1xuICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdkb2N1bWVudC1jaG9vc2UnKTtcblxuICAgIH0pO1xuXG4gICAgJCgnLmRvY3VtZW50LXJlamVjdCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoXCIucG9wdXAtcmVqZWN0XCIpLmFkZENsYXNzKCdvcGVuJyk7XG4gICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2RvY3VtZW50LWNob29zZScpO1xuXG4gICAgfSk7XG5cbiAgICAkKCcuYnRuLWJ1eS1zZWxsX19idXknKS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgICAkKFwiLnRhYnNfX2NvbnRlbnQtYnV5LXNlbGxcIikucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAkKFwiLnRhYnNfX2J1eS1zZWxsLS13clwiKS5oaWRlKCk7XG4gICAgICAgICQoJy50YWJzX19jb250ZW50LWJ1eS1zZWxsX19zdWItLWJ1eScpLmFkZENsYXNzKCdhY3RpdmUnKTtcblxuICAgIH0pO1xuXG4gICAgJCgnLmJ0bi1idXktc2VsbF9fc2VsbCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoXCIudGFic19fY29udGVudC1idXktc2VsbFwiKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICQoXCIudGFic19fYnV5LXNlbGwtLXdyXCIpLmhpZGUoKTtcbiAgICAgICAgJCgnLnRhYnNfX2NvbnRlbnQtYnV5LXNlbGxfX3N1Yi0tc2VsbCcpLmFkZENsYXNzKCdhY3RpdmUnKTtcblxuICAgIH0pO1xuXG59KTtcblxuKGZ1bmN0aW9uKCQpIHtcbiAgICAkKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoJ3VsLnRhYnNfX2J1eS1zZWxsJykub24oJ2NsaWNrJywgJ2xpOm5vdCguYWN0aXZlKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAgICAgICAuY2xvc2VzdCgnZGl2LnRhYi1jb250ZW50LWJ1eS1zZWxsJykuZmluZCgnZGl2LnRhYnNfX2NvbnRlbnQtYnV5LXNlbGwnKS5yZW1vdmVDbGFzcygnYWN0aXZlJykuZXEoJCh0aGlzKS5pbmRleCgpKS5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAgICAgICAuY2xvc2VzdCgnZGl2Lm1haW4tdGFiJykuZmluZCgnZGl2LnRhYmxlLWItcycpLnJlbW92ZUNsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJykuZXEoJCh0aGlzKS5pbmRleCgpKS5hZGRDbGFzcygnc2hvdy10YWJsZS1idXktc2VsbCcpO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xufSkoalF1ZXJ5KTtcblxuKGZ1bmN0aW9uKCQpIHtcbiAgICAkKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoJ3VsLnRhYnNfX2NhcHRpb24nKS5vbignY2xpY2snLCAnbGk6bm90KC5hY3RpdmUpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKHRoaXMpXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAgIC5jbG9zZXN0KCdkaXYudGFicycpLmZpbmQoJ2Rpdi50YWJzX19jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpLmVxKCQodGhpcykuaW5kZXgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xufSkoalF1ZXJ5KTtcblxuKGZ1bmN0aW9uKCQpIHtcbiAgICAkKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoJ3VsLnRhYnNfX2NvbnRlbnQtYnV5LXNlbGxfX3N1Yi0tbGlzdCcpLm9uKCdjbGljaycsICdsaTpub3QoLmFjdGl2ZSknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQodGhpcylcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgICAgLmNsb3Nlc3QoJ2Rpdi50YWJzJykuZmluZCgnZGl2LnRhYnNfX2NvbnRlbnQnKS5yZW1vdmVDbGFzcygnYWN0aXZlJykuZXEoJCh0aGlzKS5pbmRleCgpKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59KShqUXVlcnkpO1xuXG4oZnVuY3Rpb24oJCkge1xuICAgICQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgndWwudGFicy1zZWMnKS5vbignY2xpY2snLCAnbGk6bm90KC5hY3RpdmUtc2VjKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlLXNlYycpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZS1zZWMnKVxuICAgICAgICAgICAgICAgIC5jbG9zZXN0KCdkaXYubWFpbi10YWInKS5maW5kKCdkaXYuc2VjLXRhYicpLnJlbW92ZUNsYXNzKCdhY3RpdmUtc2VjLXRhYicpLmVxKCQodGhpcykuaW5kZXgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZS1zZWMtdGFiJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59KShqUXVlcnkpO1xuXG4oZnVuY3Rpb24oJCkge1xuICAgICQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgndWwudGFicy1wZXInKS5vbignY2xpY2snLCAnbGk6bm90KC5hY3RpdmUtcGVyKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlLXBlcicpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZS1wZXInKVxuICAgICAgICAgICAgICAgIC5jbG9zZXN0KCdkaXYubWFpbi10YWInKS5maW5kKCdkaXYucGVyLXRhYicpLnJlbW92ZUNsYXNzKCdhY3RpdmUtcGVyLXRhYicpLmVxKCQodGhpcykuaW5kZXgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZS1wZXItdGFiJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59KShqUXVlcnkpO1xuXG4oZnVuY3Rpb24oJCkge1xuICAgICQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgnLmJ0bi1zZWN1cml0eScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCgnLnRhYi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgICQoJy50YWJsZScpLnJlbW92ZUNsYXNzKCdzaG93LXRhYmxlLWJ1eS1zZWxsJyk7XG4gICAgICAgICAgICAkKCcudGFiLWxpbmsnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnI3NlY3VyaXR5LWJsb2NrJykuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgICQoJy5wcm9maWxlJykucmVtb3ZlQ2xhc3MoJ3Byb2ZpbGUtb3BlbicpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICAkKCcuYnRuLW1lcmNoYW50Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcudGFiLWNvbnRlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnLnRhYmxlJykucmVtb3ZlQ2xhc3MoJ3Nob3ctdGFibGUtYnV5LXNlbGwnKTtcbiAgICAgICAgICAgICQoJy50YWItbGluaycpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICAgICAkKCcjbWVyY2hhbnQtYmxvY2snKS5hZGRDbGFzcygnY3VycmVudCcpO1xuICAgICAgICAgICAgJCgnLnByb2ZpbGUnKS5yZW1vdmVDbGFzcygncHJvZmlsZS1vcGVuJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoJy5idG4tcGVyc29uYWwnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQoJy50YWItY29udGVudCcpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICAgICAkKCcudGFibGUnKS5yZW1vdmVDbGFzcygnc2hvdy10YWJsZS1idXktc2VsbCcpO1xuICAgICAgICAgICAgJCgnLnRhYi1saW5rJykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcbiAgICAgICAgICAgICQoJyNwZXJzb25hbC1ibG9jaycpLmFkZENsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICAgICAkKCcucHJvZmlsZScpLnJlbW92ZUNsYXNzKCdwcm9maWxlLW9wZW4nKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcbn0pKGpRdWVyeSk7XG5cblxuXG5cblxuXG5cblxuXG4iXSwiZmlsZSI6Im1haW4uanMifQ==
