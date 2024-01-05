(function () {
    "use strict";

    var applicationData = Windows.Storage.ApplicationData.current;
    var roamingSettings = applicationData.roamingSettings;
    var roamingFolder = applicationData.roamingFolder;
    
    function savePomodoroState() {
        roamingSettings.values["pomodoroState"] = JSON.stringify(Pomodoro.getState());
    }
    
    function saveTaskboard(notes, screenwidth) {
        
        try {
            saveNotes(notes, screenwidth);
            saveCanvas();
        }
        catch (ex) {
            new Windows.UI.Popups.MessageDialog("Error saving settings.").showAsync();
        }
    }
    
    function saveNotes(notes, screenwidth) {
        roamingSettings.values["total"] = notes.length;
        roamingSettings.values["screenwidth"] = screenwidth;
        for (var i = 0; i < notes.length; i++) {
            roamingSettings.values["notes" + i] = JSON.stringify(notes[i]);
        }
    }
    
    function saveCanvas() {
        var filename = "canvas.png";
        var blob = document.getElementById("canvas").msToBlob();
    
        roamingFolder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
        
            file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (output) {

                var input = blob.msDetachStream();

                Windows.Storage.Streams.RandomAccessStream.copyAsync(input, output).then(function () {
                    output.flushAsync().done(function () {
                        input.close();
                        output.close();
                    });
                });
            });
        });
    }
    
    function getScreenWidth() {
        return roamingSettings.values["screenwidth"];
    }
    
    function loadCanvas() {
        var img = new Image();
        img.onload = function () {
            var ctx = Sketch.getContext();
            ctx.globalAlpha = 1;
            var scaleFactor = Math.max(window.innerHeight / img.naturalHeight, window.innerWidth / img.naturalWidth);
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, img.naturalWidth * scaleFactor, img.naturalHeight * scaleFactor);
        };

        roamingFolder.getFileAsync("canvas.png").then(function(file) {
            var blobUrl = URL.createObjectURL(file);
            img.src = blobUrl;
        });
    }

    function getAll() {
        var total = roamingSettings.values["total"];
        var notes = [];

        if (total) {
            for (var i = 0; i < total; i++) {
                var not = roamingSettings.values["notes" + i];
                notes.push(JSON.parse(not));
            }
        }

        var pomodoroState;
        var pomodoroStateValue = roamingSettings.values["pomodoroState"];
        if (pomodoroStateValue) {
            pomodoroState = JSON.parse(pomodoroStateValue);
        }

        loadCanvas();

        return { notes: notes, pomodoro: pomodoroState };
    }
    
    WinJS.Namespace.define("Config", {
        getAll: getAll,
        getScreenWidth: getScreenWidth,
        savePomodoroState: savePomodoroState,
        saveTaskboard: saveTaskboard,
        saveCanvas: saveCanvas
    });

})();
