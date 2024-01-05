(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            args.setPromise(WinJS.UI.processAll().then(function () {
                WinJS.Resources.processAll();
                Sketch.initialize();
             
                var config = Config.getAll();
                Taskboard.init(config.notes);
                Pomodoro.initialize(config.pomodoro);

            }));
        }
    };

    app.start();

})();

