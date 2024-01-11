(function () {
    "use strict";

    function savePomodoroState() {
        localStorage.setItem("pomodoroState", JSON.stringify(Pomodoro.getState()));
    }
    
    function saveTaskboard(notes, screenwidth) {
        try {
            saveNotes(notes, screenwidth);
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
       
    function getScreenWidth() {
        return localStorage.getItem("screenwidth");
    }

    function getColor() {
        return parseInt(localStorage.getItem("colorIndex")) || 0;
    }

    function setColor(index) {
        return localStorage.setItem("colorIndex", index);
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

        return { notes: notes, pomodoro: pomodoroState };
    }

    window.Config = {
        getAll: getAll,
        getScreenWidth: getScreenWidth,
        getColor: getColor,
        setColor: setColor,
        savePomodoroState: savePomodoroState,
        saveTaskboard: saveTaskboard
    };

})();
