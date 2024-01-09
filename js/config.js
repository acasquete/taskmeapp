(function () {
    "use strict";

    function savePomodoroState() {
        localStorage.setItem("pomodoroState", JSON.stringify(Pomodoro.getState()));
    }
    
    function saveTaskboard(notes, screenwidth) {
        try {
            saveNotes(notes, screenwidth);
            saveCanvas();
        } catch (ex) {
            console.error("Error saving settings: ", ex);
        }
    }
    
    function saveNotes(notes, screenwidth) {
        localStorage.setItem("total", notes.length);
        localStorage.setItem("screenwidth", screenwidth);
        for (var i = 0; i < notes.length; i++) {
            localStorage.setItem("notes" + i, JSON.stringify(notes[i]));
        }
    }
    
    function saveCanvas() {
        var currentColor = Sketch.getColor();
        localStorage.setItem("color", currentColor);

        var canvas = document.getElementById("canvas");
        canvas.toBlob(function(blob) {
            var reader = new FileReader();
            reader.onload = function() { 
                localStorage.setItem("canvas.png", reader.result);
            };
            reader.readAsDataURL(blob);
        });
    }
    
    function getScreenWidth() {
        return localStorage.getItem("screenwidth");
    }

    function getColor() {
        return localStorage.getItem("color");
    }
    
    function loadCanvas() {
        var img = new Image();
        img.onload = function () {
            var ctx = Sketch.getContext();
            ctx.globalAlpha = 1;
            var scaleFactor = Math.max(window.innerHeight / img.naturalHeight, window.innerWidth / img.naturalWidth);
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, img.naturalWidth * scaleFactor, img.naturalHeight * scaleFactor);
        };

        var canvasData = localStorage.getItem("canvas.png");
        if (canvasData) {
            img.src = canvasData;
        }
    }

    function getAll() {
        var total = localStorage.getItem("total");
        var notes = [];

        for (var i = 0; i < total; i++) {
            var note = localStorage.getItem("notes" + i);
            if (note) {
                notes.push(JSON.parse(note));
            }
        }

        var pomodoroStateValue = localStorage.getItem("pomodoroState");
        var pomodoroState = pomodoroStateValue ? JSON.parse(pomodoroStateValue) : null;

        loadCanvas();

        return { notes: notes, pomodoro: pomodoroState };
    }

    window.Config = {
        getAll: getAll,
        getScreenWidth: getScreenWidth,
        getColor: getColor,
        savePomodoroState: savePomodoroState,
        saveTaskboard: saveTaskboard,
        saveCanvas: saveCanvas
    };

})();
