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
            Sketch.switch(dashboardNumber);
        });
    
        var gridItem = new GridItem(toolDiv);
        Sketch.addObserver(gridItem);
        toolboxGrid.append(toolDiv);
    }

    $('.tool').on('click touchend', function(e) {
        e.stopPropagation();
        
        var toolFunction = $(this).data('action');

        switch (toolFunction) {
            case 'black':
            case 'blue':
            case 'red': 
            case 'green':
            case 'eraser': 
            case 'pointer':
            case 'selection':

            var selectionMap = {
                'black': 0,
                'blue': 1,
                'red': 2,
                'green': 3,
                'eraser': 'eraser',
                'pointer': 'pointer',
                'selection': 'selection'
            };

            var selection = selectionMap[toolFunction];
            Sketch.changeColor(selection);
            break;

            case 'toggleFullScreen':
                Taskboard.toggleFullscreen();
                break;
            case 'eraseDashboard':
                Sketch.clearCanvas();
                break;
            case 'toggleNotes':
                Sketch.toggleNotesVisibility();
                break;
            case 'welcome':
                Sketch.showWelcome();
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
        $('#hamburgerMenu').toggleClass('active');

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
