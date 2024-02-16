const MenuController = (function () {

    function init () {

        var menus = document.querySelectorAll('.menu');

        menus.forEach(function(menu) {
            menu.addEventListener('mouseup', function(event) {

                event.stopPropagation();

                const actionElement = event.target.closest('[data-action]');
                
                if (!actionElement) return;
                
                const action = actionElement.getAttribute('data-action');
                
                console.debug(action);

                switch (action) {
                    case 'hamburguer-picker':
                        toggleHamMenu();
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
                        Sketch.changeColor(0);
                        break;
                    case 'eraser-picker':
                        Sketch.changeColor('eraser');
                        break;
                    case 'green-picker':
                        Sketch.changeColor(3);
                        break;
                    case 'red-picker':
                        Sketch.changeColor(2);
                        break;
                    case 'blue-picker':
                        Sketch.changeColor(1);
                        break;
                    case 'toggleFullScreen':
                        Sketch.toggleFullscreen();
                        break;
                    case 'toggleNotes':
                        Sketch.toggleNotesVisibility();
                        break;
                    case 'eraseDashboard':
                        Sketch.clearCanvas();
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
                    case 'downloadPNG':
                        Sketch.download('png');
                        break;
                    case 'openGitHub':
                        window.open('https://github.com/acasquete/taskmeapp', '_blank');
                        break;
                    case 'downloadSVG':
                        Sketch.download('svg');
                            break;
                    case 'shareBoardButton':
                        if (!Data.isLogged()) {
                            Notifications.showAppNotification ('You need to log in to share a dashboard', 'regular', 8000)
                            return;
                        }
            
                        let sharedId = Sketch.createShareSketch();
                        showModal(sharedId);
                        break;
                }
                
                if (action!='hamburguer-picker') document.querySelector('#hamburger-menu').classList.add('hidden');
                if (action!=='pen-picker') document.querySelector('#pen-menu').classList.add('hidden');
            });
        });
    
        $(document).on('contextmenu', function(e) {
            e.preventDefault();
            toggleHamMenu();
        });
        
        $(document).on("click touchend", function(event) {
            if (!(event.target.matches(".hamburger-icon") || event.target.closest(".hamburger-icon"))) {
                setTimeout( function () {
                    document.querySelector('#hamburger-menu').classList.add('hidden');
                }, 100);
            }

            if (!(event.target.matches(".pen-icon") || event.target.closest(".pen-icon"))) {
                setTimeout( function () {
                    document.querySelector('#pen-menu').classList.add('hidden');
                }, 100);
            }
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

        document.querySelector('#modal-liveshare #copy').addEventListener('click', handleLiveShareCopy);
        document.querySelector('#modal-liveshare #close').addEventListener('click', handleLiveShareClose);

    }
    
    function toggleHamMenu() {
        const hamMenu = document.querySelector('#hamburger-menu');
        hamMenu.classList.toggle('hidden');
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