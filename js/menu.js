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

        var toolboxGrid = $('.switch-dashboard');

        for (var i = 1; i <= 9; i++) {
            var toolDiv = $('<div>', {
                'class': 'dash',
                'data-action': 'switchDashboard',
                'text': i,
                'click': function() {
                    var dashboardNumber = $(this).text();
                    Taskboard.switch(dashboardNumber);
                }
            });

            toolboxGrid.append(toolDiv);
        }
        

        $('.tool').click(function() {
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
    });
    
    