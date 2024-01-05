(function () {
    "use strict";
    var currentApp = Windows.ApplicationModel.Store.CurrentApp;

    function loadTrialModeProxyFile() {
        Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync("data").done(
            function (folder) {
                folder.getFileAsync("trial-mode.xml").done(
                    function (file) {
                        currentApp.licenseInformation.addEventListener("licensechanged", trialModeRefreshScenario);
                        Windows.ApplicationModel.Store.CurrentAppSimulator.reloadSimulatorAsync(file).done();
                    });
            });
    }

    function doTrialConversion() {
        var licenseInformation = currentApp.licenseInformation;
        if (!licenseInformation.isActive || licenseInformation.isTrial) {
            currentApp.requestAppPurchaseAsync(false).done(
            function () {
                if (licenseInformation.isActive && !licenseInformation.isTrial) {
                    showMessage("You successfully upgraded your app to the fully-licensed version.");
                } else {
                    showMessage("You still have a trial license for this app.");
                }
            },
            function () {
                showMessage("The upgrade transaction failed. You still have a trial license for this app.");
            });
        } else {
            showMessage("You already bought this app and have a fully-licensed version.");
        }
    }

    function showMessage(msg) {
        if (msg) {
            new Windows.UI.Popups.MessageDialog(msg, "Trial conversion").showAsync();
        }
    }

    function trialModeRefreshScenario() {
        // setup application upsell message
        currentApp.loadListingInformationAsync().done(
        function (listing) {
          //  document.getElementById("purchasePrice").innerText = "You can buy the full app for: " + listing.formattedPrice + ".";
        });
        //displayCurrentLicenseMode();
    }

    function isTrial() {
        var licenseInformation = currentApp.licenseInformation;
        if (licenseInformation.isActive) {
            if (licenseInformation.isTrial) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    }

    function showLimitTrial(msg) {
        var msg = new Windows.UI.Popups.MessageDialog(msg + " Would you like to buy the full version?", "Buy full version");

        // Add commands and set their command handlers
        msg.commands.append(new Windows.UI.Popups.UICommand("Buy app", function (command) {
            doTrialConversion();
        }));

        msg.commands.append(new Windows.UI.Popups.UICommand("Don't buy", function (command) {

        }));

        // Set the command that will be invoked by default
        msg.defaultCommandIndex = 1;

        // Show the message dialog
        msg.showAsync();
    }
    
    WinJS.Namespace.define("License", {
        isTrial: isTrial,
        showLimitTrial: showLimitTrial
    });

    //loadTrialModeProxyFile();

})();
