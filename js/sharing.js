(function () {
    "use strict";

    function init() {
        var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
        dataTransferManager.addEventListener("datarequested", dataRequested);
    }

    function dataRequested(e) {
      
      //  var id = $(".note:focus")[0];

        var request = e.request;
        request.data.properties.title = "Share Text Example";
        request.data.properties.description = "Demonstrates how to share.";
        request.data.setText("Hello World!");
    }



    WinJS.Namespace.define("Share", {
        init: init
    });



})();
