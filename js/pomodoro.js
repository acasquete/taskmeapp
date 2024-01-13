const Pomodoro = (function () {
    "use strict";
    
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
        return !dateFirstPomodoro || (new Date().getTime() - dateFirstPomodoro.getTime()) > 86400 * 1000;
    }
    
    function resetPomodoroCount() {
        totalPomodoros = 0;
    }
    
    function setDateForFirstPomodoro() {
        dateFirstPomodoro = new Date();
        dateFirstPomodoro.setHours(0, 0, 0, 0);
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

        start({ duration: pomodoroDuration, type: "pomodoro" });
    }

    function startShort() {
        start({ duration: shortBreakDuration, type: "short" });
    }

    function startLong() {
        start({ duration: longBreakDuration, type: "long" });
    }

    function start(config) {
        show();

        if (!pomodoroStartTime) {
            pomodoroStartTime = new Date();
            pomodoroEndTime = new Date(pomodoroStartTime.getTime() + config.duration * 60000);
            pomodoroType = config.type;

            initInterval();

            Notifications.requestPermission();
            var icon = '/images/apple-touch-icon.png';
            var body = 'Pomodoro Finished!';
            var dir = 'ltr';
            
            Notifications.scheduleNotification('TaskMe', { icon, dir, body }, config.duration * 60000);
        }

        Config.savePomodoroState();
    }
    
    function initInterval() {
        setTitleStatus();
        drawTime();
        interval = window.setInterval(updateTimer, 1000);
    }

    function setTitleStatus() {
        var title = pomodoroType == "pomodoro" ? 'Pomodoro Time' : 'Resting time';
        $("#status").text(title);
    }

    function drawTime() {
        var timeDifference = Utils.timeDifference(pomodoroEndTime, new Date());
        $("#time").text(timeDifference);
    }

    function updateTimer() {
        if (new Date().getTime() > pomodoroEndTime.getTime()) {
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
        // Lugar para guardar el estado del Pomodoro
        Config.savePomodoroState();
        $("#overlay").fadeOut(300);
        return $(".layer").animate({ opacity: 0, top: 20 }, 200, function() {
            $("#pomodoro").hide();
        }).promise();
    }

    function cancel() {
        finishPomodoro();
    }

    function finishPomodoro() {
        window.clearInterval(interval);
        Notifications.cancelNotification();

        hide().then(function () {
            $("#time").text("00:00");
            pomodoroStartTime = null;
            pomodoroEndTime = null;
            Config.savePomodoroState();
        });
    }

    function getState() {
        return {
            dateFirstPomodoro: dateFirstPomodoro,
            totalPomodoros: totalPomodoros,
            pomodoroStartTime: pomodoroStartTime,
            pomodoroEndTime: pomodoroEndTime,
            pomodoroType: pomodoroType,
            isVisible: isVisible
        };
    }

    function setState(data) {
        if (!data) return;

        dateFirstPomodoro = data.dateFirstPomodoro ? new Date(data.dateFirstPomodoro) : null;
        totalPomodoros = data.totalPomodoros;
        pomodoroStartTime = data.pomodoroStartTime ? new Date(data.pomodoroStartTime) : null;
        pomodoroEndTime = data.pomodoroEndTime ? new Date(data.pomodoroEndTime) : null;
        pomodoroType = data.pomodoroType;

        if (resetPomodoroCountIfNeeded()) return;

        if (pomodoroStartTime) {
            initInterval();
            if (data.isVisible) {
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

    function init() {
        const state = Config.getPomodoroState();
        setButtonHandlers();
        setState(state);
    }

    return {
        start: start,
        init: init,
        getState: getState,
    };

})();
