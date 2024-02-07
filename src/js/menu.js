const MenuController = (function () {

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function init () {

        
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
                Sketch.switchDashboard(dashboardNumber, '', false);
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
                case 'text':
    
                var selectionMap = {
                    'black': 0,
                    'blue': 1,
                    'red': 2,
                    'green': 3,
                    'eraser': 'eraser',
                    'pointer': 'pointer',
                    'selection': 'selection',
                    'text': 'text'
                };
    
                var selection = selectionMap[toolFunction];
                Sketch.changeColor(selection, );
                break;
    
                case 'toggleFullScreen':
                    Sketch.toggleFullscreen();
                    break;
                case 'eraseDashboard':
                    Sketch.clearCanvas();
                    break;
                case 'toggleNotes':
                    Sketch.toggleNotesVisibility();
                    break;
                case 'welcome':
                    Sketch.createWelcomeNote();
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

        document.getElementById('shareBoardButton').addEventListener('click', function() {
            if (!Data.isLogged()) {
                Notifications.showAppNotification ('You need to log in to share a dashboard', 'regular', 8000)
                return;
            }

            let sharedId = Sketch.createShareSketch();
            showModal(sharedId);
        });
    }

    
    function showModal(sharedId) {

        const currentDomain = window.location.origin; 
        const fullURL = `${currentDomain}?sid=${sharedId}`;

        const modal = document.querySelector('#modal-liveshare');
        const input = document.querySelector('#modal-liveshare #shareURL');
        const copy = document.querySelector('#modal-liveshare #shareURL');
        const close = document.querySelector('#modal-liveshare #close');

        input.value = fullURL;

        copy.addEventListener('click', handleCopy);
        close.addEventListener('click', handleClose);

        modal.classList.remove('hidden');

        function handleCopy() {
            input.select();
            input.select();
            input.setSelectionRange(0, 99999); /* For mobile devices */
            navigator.clipboard.writeText(input.value).then(function() {
                console.debug('Copying to clipboard was successful!');
                copy.innerHTML = '<i class="fas fa-check" style="color: green;"></i>';
            }, function(err) {
                console.debug('Could not copy text: ', err);
            });
        }

        function handleClose() {
            modal.classList.add('hidden');
            close.removeEventListener('click', handleClose);
            copy.removeEventListener('click', handleCopy);
        }
    }   
    
    class GridItem {
        constructor(element) {
            this.element = element;

            this.update = function (dashboardNumber) {
                var elementNumber = this.element.text();

                if (elementNumber === dashboardNumber.toString()) {
                    this.element.addClass('active');
                } else {
                    this.element.removeClass('active');
                }
            };
        }
    }

    return { init };

})();

window.MenuController = MenuController;