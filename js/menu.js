    $(document).ready(function() {
        $('.hamburger-button').click(function() {
            $('#hamburgerMenu').toggleClass('active');
        });

        $(document).mouseup(function(e) {
            var menu = $("#hamburgerMenu");
            
            if (!menu.is(e.target) && menu.has(e.target).length === 0 && !$('.hamburger-button').is(e.target)) {
                menu.removeClass('active');
            }
        });

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
    
    