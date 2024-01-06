﻿(function () {
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

            // Lugar para tus propias funciones de notificaciones
            // Notifications.scheduleToast(pomodoroEndTime, config.toastText);
            // Notifications.sendBadgeText("playing", config.duration);
            Notifications.requestPermission();
            var icon = 'https://static.vecteezy.com/system/resources/previews/028/882/808/original/tomato-tomato-red-tomato-with-transparent-background-ai-generated-free-png.png';
            var body = "Pomodoro Finished!";
            
            Notifications.scheduleNotification('TaskMeApp', { body, icon }, config.duration * 60000);
        }

        // Lugar para guardar el estado del Pomodoro
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
        // Lugar para eliminar notificaciones y actualizar badge
        // Notifications.removeToast();
        // Notifications.clearBadge();
    }

    function finishPomodoro() {
        window.clearInterval(interval);
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

    function initialize(state) {
        setButtonHandlers();
        setState(state);
    }

    function getTotalPomodoros() {
        return totalPomodoros;
    }

    window.Pomodoro = {
        start: start,
        initialize: initialize,
        getTotalPomodoros: getTotalPomodoros,
        getState: getState,
    };

})();
