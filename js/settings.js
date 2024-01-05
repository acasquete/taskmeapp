(function () {
    "use strict";

    function init() {
        var settingsPane = Windows.UI.ApplicationSettings.SettingsPane.getForCurrentView();
        settingsPane.addEventListener("commandsrequested", onCommandsRequested);
    }
    
    function onSettingsCommand(settingsCommand) {
        var uriToLaunch = WinJS.Resources.getString('privacyURL').value;
        var uri = new Windows.Foundation.Uri(uriToLaunch);

        Windows.System.Launcher.launchUriAsync(uri);
    }

    function onCommandsRequested(eventArgs) {
        var settingsCommand = new Windows.UI.ApplicationSettings.SettingsCommand("Privacy", WinJS.Resources.getString('privacy').value, onSettingsCommand);
        eventArgs.request.applicationCommands.append(settingsCommand);
    }

    init();

})();
