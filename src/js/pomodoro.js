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

    function start(configuration) {
        show();

        if (!pomodoroStartTime) {
            pomodoroStartTime = new Date();
            pomodoroEndTime = new Date(pomodoroStartTime.getTime() + configuration.duration * 60000);
            pomodoroType = configuration.type;

            initInterval();

            Notifications.requestPermission();
            var icon = '/images/apple-touch-icon.png';
            var body = 'Pomodoro Finished!';
            var dir = 'ltr';
            
            Notifications.scheduleNotification('TaskMe', { icon, dir, body }, configuration.duration * 60000);
        }

        saveState();
    }
    
    function initInterval() {
        setTitleStatus();
        drawTime();
        interval = window.setInterval(updateTimer, 1000);
    }

    function setTitleStatus() {
        var title = pomodoroType == "pomodoro" ? 'Pomodoro Time' : 'Resting time';
        document.getElementById("status").textContent = title;
    }

    function drawTime() {
        var timeDifference = Helper.timeDifference(pomodoroEndTime, new Date());
        document.getElementById("time").textContent = timeDifference;
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
        saveState();
        document.getElementById("pomodoro").style.display = 'block';
        document.getElementById("overlay").style.display = 'block';
        return;
    }

    function hide() {
        isVisible = false;
        saveState();
        document.getElementById("overlay").style.display = 'none';
        document.getElementById("pomodoro").style.display = 'none';
    }

    function cancel() {
        finishPomodoro();
    }

    function finishPomodoro() {
        window.clearInterval(interval);
        Notifications.cancelNotification();
        hide();
        document.getElementById("time").textContent = "00:00";
        pomodoroStartTime = null;
        pomodoroEndTime = null;
        saveState();
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

    function saveState()
    {
        let state = getState();
        Config.savePomodoroState(state);
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
        document.getElementById("butHide").addEventListener('click', hide);
        document.getElementById("butCancel").addEventListener('click', cancel);
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
        startPomodoro: startPomodoro,
        startShort: startShort,
        startLong: startLong

    };

})();

window.Pomodoro = Pomodoro;