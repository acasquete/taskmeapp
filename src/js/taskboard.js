const Taskboard = (function () {
    "use strict";
    let currentDashboardId;
    let observers = []; 

    async function init() {
        Sketch.init();
        document.addEventListener('keydown', onKeyPress);
        loadCurrentDashboard();
    }

    async function loadCurrentDashboard() {
        currentDashboardId = Config.getActiveDashboard();
        await initDashboard(currentDashboardId, true);
    }

    async function initDashboard(id, initial) {

        if (!initial) { 
            $("#dashboard-number").stop(); 
            $("#dashboard-number").text(id); 
            $("#dashboard-number").fadeIn(100).delay(700).fadeOut(100);
        }

        if (currentDashboardId==id && !initial) return;

        currentDashboardId = id;

        Sketch.loadCanvas(currentDashboardId);
        Config.saveActiveDashboard(currentDashboardId);
        notifyAllObservers();
    }

    function onKeyPress (e) {
        if ((e.ctrlKey || e.metaKey) && !isNaN(e.key)) {
            let num = parseInt(e.key);
            if (num >= 1 && num <= 5) {
                initDashboard(num);
                e.preventDefault();
            }
        }
    };

    function toggleFullscreen ()
    {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    function showHelpNote() {
        
        const content = `
        You're the best! Thanks for trying <b>TaskMe</b>, <em>The Sim Kanban Board!</em>
        <ul>
        <li><u>Create</u> a note by selecting a color on the left of the screen.</li>
        <li><u>Edit</u> a note by clicking on it.</li>
        <li><u>Remove</u> a note by dragging it to the top of the screen.</li></ul>
            (c)hange color (e)raser clear (a)ll (h)ide notes (f)ull screen<br/><br/>
            If you have any questions, ideas or suggestions, please feel free to contact me at <a target='_blank' href='http://www.x.com/acasquetenotes'>X@acasquetenotes</a>
            or open an issue on GitHub at <a target='_blank' href='http://www.github.com/acasquete/taskmeapp/issues'>www.github.com/acasquete/taskmeapp</a>
        `;

        $(".note-help").remove();
        $(".note").fadeIn();
        
        createNote("20%", "25%", 500, "note tomato note-help", content, 0, false);
        starthandlers(".note-help");
    }  

    function addObserver (observer) {
        observers.push(observer);
    }

    function notifyAllObservers (observer) {
        observers.forEach(function(observer) {
            observer.update(currentDashboardId);
        });
    }

    return {
        init: init,
        toggleFullscreen: toggleFullscreen,
        showHelpNote: showHelpNote,
        switch: initDashboard,
        addObserver: addObserver,
        notifyAllObservers: notifyAllObservers,
        loadCurrentDashboard: loadCurrentDashboard
    };

})();


window.Taskboard = Taskboard; 