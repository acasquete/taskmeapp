var Sketch = (function () {
    var context;
    var canvas;
    var currentColor;
    var lineWidth = 25;
    var lastX, lastY;
    var startTime;
    var pathDuration = 800; 
    var colors = ['black', 'blue', 'red', 'green'];
    var currentColorIndex = 0;
    var cursorCircle;
    var isEraserMode = false; 
    var eraserSize = 80;
    var defaultLineWidth = 25;
    var hideCursorTimeout;
    var maxSize = 6000; 
    var highResCanvas;
    var highResContext;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    
        context.drawImage(highResCanvas, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    }

    function updateHighResCanvas() {
        highResContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    }
    
    window.addEventListener('resize', resizeCanvas);

    var toggleEraserMode = function () {
        isEraserMode = !isEraserMode;
        if (isEraserMode) {
            sCursorVisible = true;
            cursorCircle.style.display = 'block';
            cursorCircle.style.width = (eraserSize + 20) + 'px';
            cursorCircle.style.height = eraserSize + 'px';
            cursorCircle.style.borderRadius = '30px';
            cursorCircle.style.backgroundColor = 'white';
            cursorCircle.style.border = '2px solid black';
            cursorCircle.style.marginLeft = -((eraserSize + 20) / 2) + 'px';
            cursorCircle.style.marginTop = -(eraserSize / 2) + 'px';
            lineWidth = eraserSize; // Establecer el ancho del trazo para el modo borrador
        } else {
            resetCursorCircle();
            lineWidth = defaultLineWidth; // Restaurar el ancho de línea original
        }
    };

    function hideCursor() {
        cursorCircle.style.display = 'none';
        isCursorVisible = false;
    }

    var resetCursorCircle = function() {
        cursorCircle.style.display = 'block';
        cursorCircle.style.width = '30px';
        cursorCircle.style.height = '30px';
        cursorCircle.style.borderRadius = '15px';
        cursorCircle.style.backgroundColor = colors[currentColorIndex];
        cursorCircle.style.border = 'none';
        cursorCircle.style.marginLeft = '-15px';
        cursorCircle.style.marginTop = '-15px';

        clearTimeout(hideCursorTimeout);
        hideCursorTimeout = setTimeout(hideCursor, 2000);
    };

    var createCursorCircle = function () {
        cursorCircle = document.createElement('div');
        isCursorVisible = true;
        cursorCircle.style.width = '30px';
        cursorCircle.style.height = '30px';
        cursorCircle.style.borderRadius = '15px';
        cursorCircle.style.position = 'absolute';
        cursorCircle.style.backgroundColor = currentColor;
        cursorCircle.style.marginLeft = '-15px';
        cursorCircle.style.marginTop = '-15px'; 
        cursorCircle.style.pointerEvents = 'none'; 
        
        document.body.appendChild(cursorCircle);
        hideCursorTimeout = setTimeout(hideCursor, 2000);
        document.onmousemove = function (e) {
            cursorCircle.style.left = e.clientX + 'px';
            cursorCircle.style.top = e.clientY + 'px';
        };
    };

    var onKeyPress = function (e) {
        if (Taskboard.isAnyNoteSelected()) {
            return;
        }
        if (e.key === 'c') {
            currentColorIndex = (currentColorIndex + 1) % colors.length;
            currentColor = colors[currentColorIndex];
            Config.saveCanvas(); 
            if (isEraserMode) {
                toggleEraserMode(); 
            }
            resetCursorCircle();
        } else if (e.key === 'e') {
            toggleEraserMode();
        } else if (e.key === 'a') {
            clearCanvas(); 
        } else if (e.key === 'h') {
            Taskboard.toggleNotes(); 
         } else if (e.key === 'f') {
            Taskboard.toggleFullscreen(); 
        }

    };

    var draw = function (x, y) {
        context.lineJoin = "round";
        context.lineCap = "round";
        context.strokeStyle = currentColor;
        context.lineWidth = lineWidth;

        context.globalCompositeOperation = isEraserMode ? 'destination-out' : 'source-over';
        
        if (!canvas.pathBegun) {
            context.beginPath();
            context.moveTo(x, y);
            canvas.pathBegun = true;
            startTime = new Date();
        } else {
            context.lineTo(x, y);
            context.stroke();
        }
    };

    var updateLineWidth = function (x, y) {
        if (lastX !== undefined && lastY !== undefined) {
            const dx = x - lastX;
            const dy = y - lastY;
            
            if (!isEraserMode) {
                lineWidth = Math.sqrt(dx * dx + dy * dy) * 0.2;
                if (lineWidth > 20) lineWidth = 20;
            } 
        }

        lastX = x;
        lastY = y;
    };

    var checkPathDuration = function () {
        if (new Date() - startTime > pathDuration) {
            canvas.pathBegun = false; 
            startTime = new Date();
        }
    };

    var onMove = function (event) {
        if (canvas.drawing) {
            var x, y;
            if (event.touches) {
                x = event.touches[0].clientX;
                y = event.touches[0].clientY;
            } else {
                x = event.clientX;
                y = event.clientY;
            }
            updateLineWidth(x, y);
            draw(x, y);
            checkPathDuration();
            event.preventDefault();
        }
    };

    var onStart = function (event) {
        $('.note').removeClass('selected');
        canvas.drawing = true;
        canvas.pathBegun = false;
        onMove(event);
    };

    var onEnd = function (event) {
        canvas.drawing = false;
        canvas.pathBegun = false;
        updateHighResCanvas();
        Config.saveCanvas(); 
    };

    var showCursorCircle = function () {
        if (isCursorVisible) cursorCircle.style.display = 'block';
    };

    var hideCursorCircle = function () {
        isEraserMode = false;
        cursorCircle.style.display = 'none';
    };

    var clearCanvas = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        highResContext.clearRect(0, 0, highResCanvas.width, highResCanvas.height);

        if (isEraserMode) {
            toggleEraserMode(); 
        }
    };

    var onCanvasClick = function () {
        Taskboard.deselectAllNotes();
    };

    return {
        initialize: function (idcanvas) {
            if (typeof idcanvas === 'undefined') {
                idcanvas = "canvas";
            }

            canvas = document.getElementById(idcanvas);
            context = canvas.getContext('2d');
            highResCanvas = document.createElement('canvas');
            highResContext = highResCanvas.getContext('2d');

            highResCanvas.width = maxSize;
            highResCanvas.height = maxSize;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            canvas.addEventListener('click', onCanvasClick);
            canvas.addEventListener('mousemove', onMove, false);
            canvas.addEventListener('mousedown', onStart, false);
            canvas.addEventListener('mouseup', onEnd, false);
            canvas.addEventListener('touchmove', onMove, false);
            canvas.addEventListener('touchstart', onStart, false);
            canvas.addEventListener('touchend', onEnd, false);
            canvas.addEventListener('mouseenter', showCursorCircle);
            canvas.addEventListener('mouseleave', hideCursorCircle);
            canvas.addEventListener('mouseout', onEnd);
            document.addEventListener('keypress', onKeyPress);

            currentColor = Config.getColor();

            if (!currentColor) {
                currentColor = "black";
            }

            createCursorCircle();


        },

        setColor: function (color) {
            currentColor = color;
        },

        getColor: function () {
            return currentColor;
        },

        getContext: function () {
            return context;
        },
        
        clearCanvas: clearCanvas
    };

})();
