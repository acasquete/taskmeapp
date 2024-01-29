$(document).ready(function() {
    $('.hamburger-button').click(function() {
        $('#hamburgerMenu').toggleClass('active');
    });

    $(document).on('contextmenu', function(e) {
        e.preventDefault();
        $('#hamburgerMenu').toggleClass('active');
    });
    
    $(document).on("click touchend", function(event) {
        if ($('#hamburgerMenu').hasClass('active') && !$(event.target).is(".hamburger-icon *")) {
            $('#hamburgerMenu').toggleClass('active');
        }
        event.stopPropagation();
    });

    $('.marker-grid .dash').on('touchend click', function() {
        var action = $(this).data('action');
        
        var colorMap = {
            'black': 0,
            'blue': 1,
            'red': 2,
            'green': 3,
            'eraser': 'eraser',
            'pointer': 'pointer',
            'selection': 'selection'
        };
        var colorValue = colorMap[action];
        Sketch.changeColor(colorValue);
    });

    $('.marker-grid .dash').each(function () {
        var gridItem = new GridItem($(this)); 
        Taskboard.addObserver(gridItem);
    });

    var toolboxGrid = $('.switch-dashboard');

    for (var i = 1; i <= 5; i++) {
        var toolDiv = $('<div>', {
            'class': 'dash',
            'data-action': 'switchDashboard',
            'text': i
        });
    
        toolDiv.on('click touchend', function(e) {
            e.preventDefault();
            var dashboardNumber = $(this).text();
            Taskboard.switch(dashboardNumber);
        });
    
        var gridItem = new GridItem(toolDiv);
        Taskboard.addObserver(gridItem);
        toolboxGrid.append(toolDiv);
    }

    $('.tool').on('click touchend', function() {
        $('#hamburgerMenu').toggleClass('active');
        var toolFunction = $(this).data('action');

        switch (toolFunction) {
            case 'toggleFullScreen':
                Taskboard.toggleFullscreen();
                break;
            case 'eraseDashboard':
                Sketch.clearCanvas();
                break;
            case 'toggleNotes':
                Sketch.toggleNotesVisibility();
                break;
            case 'openHelp':
                Taskboard.showHelpNote();
                break;
            case 'removeNotes':
                Sketch.clearAllCanvas();
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
    
            if (elementNumber === dashboardNumber.toString()) {
                this.element.addClass('active');
            } else {
                this.element.removeClass('active');
            }
        };
    }

    

});
