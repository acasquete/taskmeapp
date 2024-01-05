(function () {
    "use strict";

    function hideappbar() {
        var appbar = document.getElementById("appbar");
        if (appbar.style.display !== 'none') {
            appbar.style.display = 'none';
        }
    }

    window.Controls = {
        hideappbar: hideappbar
    };

})();