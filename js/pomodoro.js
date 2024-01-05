(function () {
    "use strict";
    
    WinJS.Namespace.define("Pomodoro", {
        start: start,
        initialize: initialize,
        getTotalPomodoros: getTotalPomodoros,
        getState: getState,
    });

    var pomodoroDuration = 25;
    var shortBreakDuration = 5;
    var longBreakDuration = 15;
    var dateFirstPomodoro;
    var totalPomodoros = 0;
    var pomodoroStartTime;
    var pomodoroEndTime;
    var pomodoroType;
    var isVisible;
    var interval;

    function moreThanADaySinceTheFirstPomodoro() {
        return !dateFirstPomodoro || (dateFirstPomodoro && (new Date().getTime() - dateFirstPomodoro.getTime()) > 86400 * 1000);
    }
    
    function resetPomodoroCount() {
        totalPomodoros = 0;
    }
    
    function setDateForFirstPomodoro() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth();
        var yyyy = today.getFullYear();

        dateFirstPomodoro = new Date(yyyy, mm, dd);
    }
    
    function resetPomodoroCountIfNeeded() {
        if (!pomodoroStartTime) {
            if (moreThanADaySinceTheFirstPomodoro()) {
                resetPomodoroCount();
                return true;
            }
        }
        return false;
    }

    function startPomodoro() {

        if (resetPomodoroCountIfNeeded()) {
            setDateForFirstPomodoro();
        }

        var msg;
        var nextpomodoro = (totalPomodoros + 1);
        var textpomodoro = nextpomodoro == 1 ? "pomodoro" : "pomodoros";

        if (nextpomodoro % 4 == 0) {
            msg = WinJS.Resources.getString('nextBreakLong').value;
        } else {
            msg = WinJS.Resources.getString('nextBreakShort').value;
        }

        msg = msg.replace("{0}", nextpomodoro);
        msg = msg.replace("{1}", textpomodoro);

        start({ duration: pomodoroDuration, type: "pomodoro", toastText: WinJS.Resources.getString('pomodoroDone').value + msg });
    }

    function startShort() {
        start({ duration: shortBreakDuration, type: "short", toastText:  WinJS.Resources.getString('restingDone').value });
    }

    function startLong() {
        start({ duration: longBreakDuration, type: "long", toastText: WinJS.Resources.getString('restingDone').value });
    }

    function start(config) {

        show();
        Controls.hideappbar();

        if (!pomodoroStartTime) {
            
            pomodoroStartTime = new Date();
            pomodoroEndTime = new Date(pomodoroStartTime.getTime() + config.duration * 60000);
            pomodoroType = config.type;

            initInterval();

            Notifications.scheduleToast(pomodoroEndTime, config.toastText);
            Notifications.sendBadgeText("playing", config.duration);
        }

        Config.savePomodoroState();
    }
    
    function initInterval() {
        setTitleStatus();
        drawTime();
        interval = window.setInterval(updateTimer, 1000);
    }

    function setTitleStatus() {
        var title = pomodoroType == "pomodoro" ? WinJS.Resources.getString('pomodoroTime').value : WinJS.Resources.getString('restingTime').value;
        $("#status").text(title);
    }

    function drawTime() {
        var timeDifference = Utils.timeDifference(pomodoroEndTime, new Date());
        $("#time").text(timeDifference);
    }

    function updateTimer() {
        if (new Date().getTime() > pomodoroEndTime) {
            totalPomodoros++;
            finishPomodoro();
            
        } else {
            drawTime();
        }
    }

    function show() {
        isVisible = true;
        Config.savePomodoroState();
        $("#pomodoro").show();
        $("#overlay").fadeIn(300);
        return $(".layer").animate({ opacity: 1, top: -20 }, 200).promise();
    }

    function hide() {
        isVisible = false;
        Config.savePomodoroState();
        $("#overlay").fadeOut(300);
        return $(".layer").animate({ opacity: 0, top: 20 }, 200, function() {
            $("#pomodoro").hide();
        }
        ).promise();
    }

    function cancel() {
        finishPomodoro();
        Notifications.removeToast();
        Notifications.clearBadge();
    }

    function finishPomodoro() {
        window.clearInterval(interval);
        hide().then(function () {;
            $("#time").text("00:00");
            pomodoroStartTime = null;
            pomodoroEndTime = null;
            Config.savePomodoroState();
        });
    }

    function getState() {
        return {
            dateFirstPomodoro: dateFirstPomodoro,
            totalpomodoros: totalPomodoros,
            pomodoroStartTime: pomodoroStartTime,
            pomodoroEndTime: pomodoroEndTime,
            pomodoroType: pomodoroType,
            layerVisible: isVisible
        };
    }

    function setState(data) {

        if (!data) return;

        if (data.dateFirstPomodoro) dateFirstPomodoro = new Date(data.dateFirstPomodoro);
        totalPomodoros = data.totalpomodoros;
        if (data.pomodoroStartTime) pomodoroStartTime = new Date(data.pomodoroStartTime);
        if (data.pomodoroEndTime) pomodoroEndTime = new Date(data.pomodoroEndTime);
        pomodoroType = data.pomodoroType;

        if (resetPomodoroCountIfNeeded()) return;

        if (pomodoroStartTime) {
            initInterval();
            if (data.layerVisible) {
                show();
            }
        }
    }

    function setButtonHandlers() {
        $("#cmdStartPomodoro").click(startPomodoro);
        $("#cmdStartShortBreak").click(startShort);
        $("#cmdStartLongBreak").click(startLong);
        $("#butHide").click(hide);
        $("#butCancel").click(cancel);
    }

    function initialize(state) {
        setButtonHandlers();
        setState(state);
    }

    function getTotalPomodoros() {
        return totalPomodoros;
    }

})();
