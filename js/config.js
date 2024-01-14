(function () {
    "use strict";

    function getActiveDashboard() {
        return localStorage.getItem("activeDashboard") ?? 1;
    }

    function saveActiveDashboard(id) {
        localStorage.setItem("activeDashboard", id);
    }

    function saveDashboard(id, dashboard) {
        localStorage.setItem("dashboard" + id, JSON.stringify(dashboard));
    }

    function getDashboard(id) {
        let dashboard = { notes: [], dots: [], screenWidth: null };
        let dashboardString = localStorage.getItem("dashboard"+id);

        if (dashboardString) {
            dashboard = JSON.parse(dashboardString);
        } 

        return dashboard;
    }

    function saveCanvas(id, canvas) {
        localStorage.setItem("canvas" + id, JSON.stringify(canvas));
    }

    function getCanvas(id) {
        let canvas = { paths: [], colorIndex: 0 };
        let canvasString = localStorage.getItem("canvas"+id);

        if (canvasString) {
            canvas = JSON.parse(canvasString);
        } 

        return canvas;
    }

    function getPomodoroState() {
        let pomodoroString = localStorage.getItem("pomodoro");
        let pomodoro = {};

        if (pomodoroString) {
            pomodoro = JSON.parse(pomodoroString);
        } 

        return pomodoro;
    }

    function savePomodoroState(state) {
        return localStorage.setItem("pomodoro", JSON.stringify(state));
    }

    window.Config = {
        saveActiveDashboard: saveActiveDashboard,
        getActiveDashboard: getActiveDashboard,
        saveDashboard: saveDashboard,
        getDashboard: getDashboard,
        getCanvas: getCanvas,
        saveCanvas: saveCanvas,
        savePomodoroState: savePomodoroState,
        getPomodoroState, getPomodoroState
    };
})();