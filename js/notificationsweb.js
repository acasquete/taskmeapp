var Notifications = (function() {
    'use strict';

    function isSupported() {
        return "Notification" in window;
    }

    function requestPermission() {
        if (!isSupported()) {
            console.error("Las notificaciones no son soportadas por este navegador.");
            return;
        }
        Notification.requestPermission().then(function(permission) {
            console.log("Permiso de notificación:", permission);
        });
    }

    function sendNotification(title, options) {
        if (!isSupported() || Notification.permission !== "granted") {
            console.error("Las notificaciones no están habilitadas o no son soportadas.");
            return;
        }

        var notification = new Notification(title, options);
        return notification;
    }

    function scheduleNotification(title, options, delayMs) {
        if (!isSupported() || Notification.permission !== "granted") {
            console.error("Las notificaciones no están habilitadas o no son soportadas.");
            return;
        }

        setTimeout(function() {
            sendNotification(title, options);
        }, delayMs);
    }

    return {
        requestPermission: requestPermission,
        sendNotification: sendNotification,
        scheduleNotification: scheduleNotification
    };

    return {
        requestPermission: requestPermission,
        sendNotification: sendNotification
    };
})();
