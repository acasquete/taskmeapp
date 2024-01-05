(function () {
    "use strict";

    var notifications = Windows.UI.Notifications;
    var toastNotifier;
    
    function createSummary(notes) {

        var templateResumen = notifications.TileTemplateType.tileWideBlockAndText01;
        var tileResumenXml = notifications.TileUpdateManager.getTemplateContent(templateResumen);
        var tileResumenTextAttributes = tileResumenXml.getElementsByTagName("text");

        var todo = 0, inprogress = 0, done = 0;

        for (var i = 0; i < notes.length; i++) {
            var status = notes[i].status;

            if (clearText(notes[i].text)=="") continue;

            if (status == "done") {
                done++;
            } else {
                if (status == "inprogress") {
                    inprogress++;
                } else {
                    todo++;
                }
            }
        }

        tileResumenTextAttributes[0].appendChild(tileResumenXml.createTextNode(todo + " To Do"));
        tileResumenTextAttributes[1].appendChild(tileResumenXml.createTextNode(inprogress + " In Progress"));
        tileResumenTextAttributes[2].appendChild(tileResumenXml.createTextNode(done + " Done"));
        tileResumenTextAttributes[3].appendChild(tileResumenXml.createTextNode(""));
        var pomodoros = Pomodoro.getTotalPomodoros();
        tileResumenTextAttributes[4].appendChild(tileResumenXml.createTextNode(pomodoros));
        tileResumenTextAttributes[5].appendChild(tileResumenXml.createTextNode(pomodoros == 1 ? "Pomodoro" : "Pomodoros"));

        // Square
        var squareTemplate = notifications.TileTemplateType.tileSquareText03;
        var squareTileXml = notifications.TileUpdateManager.getTemplateContent(squareTemplate);

        var squareTileTextAttributes = squareTileXml.getElementsByTagName("text");
        squareTileTextAttributes[0].appendChild(squareTileXml.createTextNode(todo + " To Do"));
        squareTileTextAttributes[1].appendChild(squareTileXml.createTextNode(inprogress + " In Progress"));
        squareTileTextAttributes[2].appendChild(squareTileXml.createTextNode(done + " Done"));
        squareTileTextAttributes[3].appendChild(squareTileXml.createTextNode(""));

        var node = tileResumenXml.importNode(squareTileXml.getElementsByTagName("binding").item(0), true);
        tileResumenXml.getElementsByTagName("visual").item(0).appendChild(node);
        
        createTile(tileResumenXml, 86400);
    }
    
    function createPomodoroTileSquare() {

        var squareTemplate = notifications.TileTemplateType.tileSquareBlock;
        var squareTileXml = notifications.TileUpdateManager.getTemplateContent(squareTemplate);

        var squareTileTextAttributes = squareTileXml.getElementsByTagName("text");
        
        var pomodoros = Pomodoro.getTotalPomodoros();
        squareTileTextAttributes[0].appendChild(squareTileXml.createTextNode(pomodoros));
        squareTileTextAttributes[1].appendChild(squareTileXml.createTextNode(pomodoros == 1 ? "Pomodoro" : "Pomodoros"));

        var node = squareTileXml.importNode(squareTileXml.getElementsByTagName("binding").item(0), true);
        squareTileXml.getElementsByTagName("visual").item(0).appendChild(node);

        createTile(squareTileXml, 86400);
    }
    
    function createGroupTileTasks(notes) {

        var notesEmpty = [];
        for (var note in notes) {
            if (notes[note].text != "") {
                notesEmpty.push(notes[note]);
            }     
        }

        var groups = notesEmpty.length / 4;

        for (var i = 0; i < groups; i++) {
            var subnotes = notesEmpty.slice(i * 4, i * 4 + 4);
            createTileTasks(subnotes);
        }
    }
    
    function createTileTasks(notes) {
        var template = notifications.TileTemplateType.tileWideText11;
        var tileXml = notifications.TileUpdateManager.getTemplateContent(template);
        var tileTextAttributes = tileXml.getElementsByTagName("text");
        var blankTile = true;
            
        for (var i = 0, index = 0; i < notes.length; i++) {
            var contentNote = clearText(notes[i].text);
            if (contentNote != "") {
                blankTile = false;
                tileTextAttributes[index].appendChild(tileXml.createTextNode(notes[i].status == "done" ? "✔" : "☐"));
                tileTextAttributes[index + 1].appendChild(tileXml.createTextNode(contentNote));
                index += 2;
            }
           
        }

        if (!blankTile) {
            createTile(tileXml);
        }
    }

    function clearText(text) {
        return $.trim(Utils.stripTags(text));
    }
    
    function scheduleToast(startTime, text) {
        var template = Windows.UI.Notifications.ToastTemplateType.toastText01;
        var toastXml = Windows.UI.Notifications.ToastNotificationManager.getTemplateContent(template);

        var toastNode = toastXml.selectSingleNode("/toast");
        toastNode.setAttribute("duration", "long");

        var audio = toastXml.createElement("audio");
        audio.setAttribute("src", "ms-winsoundevent:Notification.Reminder");
        audio.setAttribute("loop", "true");

        toastNode.appendChild(audio);
        
        var toastTextElements = toastXml.getElementsByTagName("text");
        toastTextElements[0].appendChild(toastXml.createTextNode(text));
       
        
        var scheduledToast = new Windows.UI.Notifications.ScheduledToastNotification(toastXml, startTime);
        
        scheduledToast.id = "Pomodoro_Toast";
        
        toastNotifier = Windows.UI.Notifications.ToastNotificationManager.createToastNotifier();
        toastNotifier.addToSchedule(scheduledToast);
    }

    function removeToast() {

        if (!toastNotifier) return;
        
        var scheduled = toastNotifier.getScheduledToastNotifications();
        for (var i = 0, len = scheduled.length; i < len; i++) {

            // The itemId value is the unique ScheduledTileNotification.Id assigned to the 
            // notification when it was created.
            if (scheduled[i].id === "Pomodoro_Toast") {
                toastNotifier.removeFromSchedule(scheduled[i]);
            }
        }
    }


    function sendBadgeNumber(value) {
        var badgeType = notifications.BadgeTemplateType.badgeNumber;
        var badgeXml = notifications.BadgeUpdateManager.getTemplateContent(badgeType);
        
        var badgeAttributes = badgeXml.getElementsByTagName("badge");
        badgeAttributes[0].setAttribute("value", value);

        var badgeNotification = new notifications.BadgeNotification(badgeXml);
        notifications.BadgeUpdateManager.createBadgeUpdaterForApplication().update(badgeNotification);
    }

    function sendBadgeText(value, minutes) {
        var badgeType = notifications.BadgeTemplateType.badgeGlyph;
        var badgeXml = notifications.BadgeUpdateManager.getTemplateContent(badgeType);

        var badgeAttributes = badgeXml.getElementsByTagName("badge");
        badgeAttributes[0].setAttribute("value", value);

        var badgeNotification = new notifications.BadgeNotification(badgeXml);
        var currentTime = new Date();
        badgeNotification.expirationTime = new Date(currentTime.getTime() + minutes * 60 * 1000);
        
        notifications.BadgeUpdateManager.createBadgeUpdaterForApplication().update(badgeNotification);
    }
    
    function sendUpdate(notes) {

        // The tile template catalog 
        // http://msdn.microsoft.com/en-us/library/windows/apps/hh761491.aspx
        
        clearTiles();

        createSummary(notes);

        if (notes.length > 0) {
            createGroupTileTasks(notes);
        }
       
        createPomodoroTileSquare();
    }

    function createTile(tileXml, secondsExpirationTime) {

        var tileNotification = new notifications.TileNotification(tileXml);

        notifications.TileUpdateManager.createTileUpdaterForApplication().enableNotificationQueue(true);

        if (secondsExpirationTime) {
            var currentTime = new Date();
            tileNotification.expirationTime = new Date(currentTime.getTime() + (secondsExpirationTime * 1000));
        }
        
        notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileNotification);
    }

    function clearBadge() {
        notifications.BadgeUpdateManager.createBadgeUpdaterForApplication().clear();
    }

    function clearTiles() {
        notifications.TileUpdateManager.createTileUpdaterForApplication().clear();
    }

    WinJS.Namespace.define("Notifications", {
        sendUpdate: sendUpdate,
        scheduleToast: scheduleToast,
        sendBadgeNumber: sendBadgeNumber,
        sendBadgeText: sendBadgeText,
        removeToast: removeToast,
        clearBadge: clearBadge
    });



})();
