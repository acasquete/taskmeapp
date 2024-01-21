$(document).ready(function() {
    $('.hamburger-button').click(function() {
        $('#hamburgerMenu').toggleClass('active');
    });

    $(document).on('contextmenu', function(e) {
        Taskboard.deselectAllNotes();
        e.preventDefault();
        $('#hamburgerMenu').toggleClass('active');
    });
    
    $(document).on("click", function(event) {
        if ($('#hamburgerMenu').hasClass('active') && !$(event.target).is(".hamburger-icon *")) {
            $('#hamburgerMenu').toggleClass('active');
        }
    });

    $('.marker-grid .dash').click(function() {
        var action = $(this).data('action');
        var colorMap = {
            'black': 0,
            'blue': 1,
            'red': 2,
            'green': 3,
            'eraser': 'eraser'
        };
        var colorValue = colorMap[action];
        Sketch.changeColor(colorValue);
    });

    $('.marker-grid .dash').each(function () {
        var gridItem = new GridItem($(this)); 
        Taskboard.addObserver(gridItem);

        
    });

    var toolboxGrid = $('.switch-dashboard');

    for (var i = 1; i <= 10; i++) {
        var toolDiv = $('<div>', {
            'class': 'dash',
            'data-action': 'switchDashboard',
            'text': i,
            'click': function() {
                var dashboardNumber = $(this).text();
                if (dashboardNumber === '10') {
                    dashboardNumber = '0';
                }
                Taskboard.switch(dashboardNumber);
            }
        });

        var gridItem = new GridItem(toolDiv);
        Taskboard.addObserver(gridItem);
        toolboxGrid.append(toolDiv);
    }

    $('.tool').click(function() {
        $('#hamburgerMenu').toggleClass('active');
        var toolFunction = $(this).data('action');
        switch (toolFunction) {
            case 'toggleFullScreen':
                Taskboard.toggleFullscreen();
                break;
            case 'eraseDashboard':
                Taskboard.clearCanvas();
                break;
            case 'toggleNotes':
                Taskboard.toggleNotes();
                break;
            case 'openHelp':
                Taskboard.showHelpNote();
                break;
            case 'removeNotes':
                Taskboard.removeAllNotes();
                break;
            case 'startPomodoro':
                Pomodoro.startPomodoro();
                break;
            case 'startBreakShort':
                Pomodoro.startShort();
                break;
            case 'startBreakLong':
                Pomodoro.startLong();
                break;
        }
    });

    function GridItem(element) {
        this.element = element;
    
        this.update = function(dashboardNumber) {
            var elementNumber = this.element.text();
            if (elementNumber === '10') elementNumber = '0';
    
            if (elementNumber === dashboardNumber.toString()) {
                this.element.addClass('active');
            } else {
                this.element.removeClass('active');
            }
        };
    }

    

});

let isSigned = false;

function onSignIn(response) {
    if (isSigned) return;

    const jwt = response.credential;
    localStorage.setItem('googleToken', jwt);

    signInWithFirebase(jwt);
}

function signInWithFirebase(googleToken) {
    if (isTokenExpired(googleToken)) {
        localStorage.removeItem('googleToken');
        return;
    }

    const credential = firebase.auth.GoogleAuthProvider.credential(googleToken);

    firebase.auth().signInWithCredential(credential)
        .then((result) => {
            const user = result.user;
            Data.setUserId(user.uid);
            Taskboard.init();
            isSigned = true;
        }).catch((error) => {
            console.error("Error en la autenticación con Firebase:", error);
        });
}

function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
}

document.addEventListener('DOMContentLoaded', () => {
    const googleToken = localStorage.getItem('googleToken');
    if (googleToken && !isTokenExpired(googleToken)) {
        signInWithFirebase(googleToken);
    } else {
        localStorage.removeItem('googleToken');
    }
});