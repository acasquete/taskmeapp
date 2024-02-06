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
    
        document.getElementById('copyButton').addEventListener('click', function() {
            copyURL();
        });

        // Modal Share
        document.getElementById('closeButton').addEventListener('click', function() {
            document.getElementById('modalBackdrop').style.display = 'none';
        });

        document.getElementById('modalBackdrop').addEventListener('click', function(event) {
            if (event.target === this) {
                this.style.display = 'none';
            }
        });
        const modal = document.querySelector('.modal'); 

        modal.addEventListener('mousedown', onMouseDown);
    }

    function onMouseDown(e) {
        const modal = document.querySelector('.modal'); 
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        isDragging = true;

        dragOffsetX = e.clientX - modal.getBoundingClientRect().left;
        dragOffsetY = e.clientY - modal.getBoundingClientRect().top;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e) {
        if (isDragging) {
            const modal = document.querySelector('.modal'); 
            modal.style.left = (e.clientX - dragOffsetX) + 'px';
            modal.style.top = (e.clientY - dragOffsetY) + 'px';
        }
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    function copyURL() {
        const urlInput = document.getElementById('urlInput');
        urlInput.select();
        document.execCommand('copy');
    
        document.getElementById('copyButton').innerHTML = '<i class="fas fa-check" style="color: green;"></i>';
    }
    
    function showModal(sharedId) {

        const currentDomain = window.location.origin; 
        const fullURL = `${currentDomain}?sid=${sharedId}`;
        document.getElementById('modalBackdrop').style.display = 'flex';
        document.getElementById('urlInput').value = fullURL;
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