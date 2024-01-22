(function () {
    "use strict";

    function getActiveDashboard() {
        return localStorage.getItem("ad") ?? 1;
    }

    function saveActiveDashboard(id) {
        localStorage.setItem("ad", id);
    }

    function saveDashboard(id, dashboard) {
        localStorage.setItem("d" + id, JSON.stringify(dashboard));
        Data.saveDashboard(id, dashboard);
    }

    async function getDashboard(id) {
        const dashboardRemote = await Data.getDashboard(id);
        if (dashboardRemote!=null) {
            return dashboardRemote;
        }
    
        const dashboardString = localStorage.getItem("d" + id);
        return dashboardString ? JSON.parse(dashboardString) : { notes: [], dots: [], screenWidth: null };
    }

    function saveCanvas(id, canvas) {
        localStorage.setItem("c" + id, JSON.stringify(canvas));
        Data.saveCanvas(id, canvas);
    }

    async function getCanvas(id) {
        const canvasRemote = await Data.getCanvas(id);
        if (canvasRemote!=null) {
            return canvasRemote;
        }
    
        const canvasString = localStorage.getItem("c" + id);
        return canvasString ? JSON.parse(canvasString) : { paths: [], colorIndex: 0 };
    }

    function getPomodoroState() {
        let pomodoroString = localStorage.getItem("p");
        let pomodoro = {};

        if (pomodoroString) {
            pomodoro = JSON.parse(pomodoroString);
        } 

        return pomodoro;
    }

    function savePomodoroState(state) {
        return localStorage.setItem("p", JSON.stringify(state));
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