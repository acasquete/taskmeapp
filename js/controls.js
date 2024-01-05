(function () {
    "use strict";

    function hideappbar() {
        var appbar = document.getElementById("appbar").winControl;
        appbar.hide();
    }

    WinJS.Namespace.define("Controls", {
        hideappbar: hideappbar
    });



})();
