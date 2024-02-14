const MenuController = (function () {

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function init () {

        const toolbar = document.getElementById('toolbar');

        toolbar.addEventListener('click', (event) => {
          const actionElement = event.target.closest('[data-action]');
          
          if (!actionElement) return;
          
          const action = actionElement.getAttribute('data-action');
          
          switch (action) {
            case 'hamburguer-picker':
                const hamMenu = document.querySelector('#hamburger-menu');
                hamMenu.classList.toggle('hidden');
                break;
            case 'pen-picker':
                const penMenu = document.querySelector('#pen-menu');
                penMenu.classList.toggle('hidden');
                break;
            case 'text-picker':
                Sketch.changeColor('text');
                break;
            case 'pointer-picker':
                Sketch.changeColor('pointer');
                break;
            case 'selection-picker':
                Sketch.changeColor('selection');
                break;
            case 'aiadvisor-picker':
                Sketch.nextAdvice();
                break;
            case 'black-picker':
                Sketch.changeColor('black');
                break;
            case 'green-picker':
                Sketch.changeColor('green');
                break;
            case 'red-picker':
                Sketch.changeColor('red');
                break;
            case 'blue-picker':
                Sketch.changeColor('blue');
                break;
            default:
              console.log('Acción no reconocida:', action);
          }
        });


        
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
                Sketch.changeColor(selection);
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

        $('.menuitem').on('click touchend', function(e) {
            e.stopPropagation();
            
            var toolFunction = $(this).data('action');
            
            switch (toolFunction) {
                case 'downloadPNG':
                    Sketch.download('png');
                    break;
                case 'openGitHub':
                    window.open('https://github.com/acasquete/taskmeapp', '_blank');
                    break;
                case 'downloadSVG':
                    Sketch.download('svg');
                    break;

            }

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
        const copy = document.querySelector('#modal-liveshare #copy');

        input.value = fullURL;

        copy.innerHTML = 'Copy URL';
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
            const copy = document.querySelector('#modal-liveshare #copy');
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