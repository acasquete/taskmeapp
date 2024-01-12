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
        let dashboard = { notes: [], pomodoro: {}, screenWidth: null };
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

    window.Config = {
        saveActiveDashboard: saveActiveDashboard,
        getActiveDashboard: getActiveDashboard,
        saveDashboard: saveDashboard,
        getDashboard: getDashboard,
        getCanvas: getCanvas,
        saveCanvas: saveCanvas,
    };
})();