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
                    closeAllModals();
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
                case 'aiAdvisor':
                    Sketch.nextAdvice();
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

        document.querySelector('#modal-liveshare #copy').addEventListener('click', handleLiveShareCopy);
        document.querySelector('#modal-liveshare #close').addEventListener('click', handleLiveShareClose);

    }
    
    function showModal(sharedId) {

        closeAllModals(); 

        const currentDomain = window.location.origin; 
        const fullURL = `${currentDomain}?sid=${sharedId}`;

        const input = document.querySelector('#modal-liveshare #shareURL');

        input.value = fullURL;
        document.querySelector('#modal-liveshare').classList.remove('hidden');
        
    }   
    
    class GridItem {
        constructor(element) {
            this.element = element;

            this.update = function (dashboardNumber) {
                var elementNumber = this.element.text();

                closeAllModals();

                if (elementNumber === dashboardNumber.toString()) {
                    this.element.addClass('active');
                } else {
                    this.element.removeClass('active');
                }
            };
        }
    }

    function closeAllModals() {
        handleLiveShareClose();
        Sketch.handleClearClose();
    }


    function handleLiveShareCopy() {

        const input = document.querySelector('#modal-liveshare #shareURL')
        input.select();
        input.setSelectionRange(0, 99999); /* For mobile devices */

        navigator.clipboard.writeText(input.value).then(function() {
            console.debug('Copying to clipboard was successful!');
            copy.innerHTML = '<i class="fas fa-check" style="color: white;"></i>';
        }, function(err) {
            console.debug('Could not copy text: ', err);
        });
    }

    function handleLiveShareClose() {
        document.querySelector('#modal-liveshare').classList.add('hidden');
    }

    return { init };

})();

window.MenuController = MenuController;