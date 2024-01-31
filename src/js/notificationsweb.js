var Notifications = (function() {
    'use strict';

    var notification;

    function isSupported() {
        return "Notification" in window;
    }

    function requestPermission() {
        if (!isSupported()) {
            console.error("Las notificaciones no son soportadas por este navegador.");
            return;
        }
        Notification.requestPermission().then(function(permission) {
            console.log(permission);
        });
    }

    function sendNotification(title, options) {
        if (!isSupported() || Notification.permission !== "granted") {
            console.error("Las notificaciones no están habilitadas o no son soportadas.");
            return;
        }

        var notification = new Notification(title, options);
        notification.onclick = function() {
            window.open('https://taskmeapp.com');
           };
        return notification;
    }

    function scheduleNotification(title, options, delayMs) {
        if (!isSupported() || Notification.permission !== "granted") {
            console.error("Las notificaciones no están habilitadas o no son soportadas.");
            return;
        }

        notification = window.setTimeout(function() {
            sendNotification(title, options);
        }, delayMs);
    }

    function cancelNotification ()
    {
        if (notification) {
            window.clearTimeout(notification);
            notification = null; // Restablece el identificador del temporizador
        } 
    }

    return {
        requestPermission: requestPermission,
        sendNotification: sendNotification,
        scheduleNotification: scheduleNotification,
        cancelNotification: cancelNotification
    };
})();

window.Notifications = Notifications;