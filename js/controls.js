(function () {
    "use strict";

    var isAppbarVisible = false;

    function showappbar() {
        if (!isAppbarVisible) {
            $("#appbar").css('bottom', '-130px')
                .show()
                .animate({bottom: '0px'}, 300); 
            isAppbarVisible = true;
        }
    }

    function hideappbar() {
        if (isAppbarVisible) {
            $("#appbar").animate({bottom: '-130px'}, 500, function() {
                $(this).hide();
            });
            isAppbarVisible = false;
        }
    }

    function init () {

        $(document).on('contextmenu', function(e) {
            Taskboard.deselectAllNotes();

            event.preventDefault();
            if (isAppbarVisible) {
                Controls.hideappbar();
            } else {
                Controls.showappbar();
            }
        });
        
        $(document).on("click", function(event) {
            if (isAppbarVisible && !$(event.target).is("#appbar, #appbar *")) {
                Controls.hideappbar();
            }
        });
    }

    window.Controls = {
        init: init,
        hideappbar: hideappbar,
        showappbar: showappbar
    };

})();