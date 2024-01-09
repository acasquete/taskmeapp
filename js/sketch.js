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

    var isEraserMode = false; // Variable para el modo borrador

    var eraserSize = 80; // Tamaño del borrador
    var defaultLineWidth = 25; // Ancho de línea por defecto

    var toggleEraserMode = function () {
        isEraserMode = !isEraserMode;
        if (isEraserMode) {
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

    var resetCursorCircle = function() {
        cursorCircle.style.width = '20px';
        cursorCircle.style.height = '20px';
        cursorCircle.style.borderRadius = '10px';
        cursorCircle.style.backgroundColor = colors[currentColorIndex];
        cursorCircle.style.border = 'none';
        cursorCircle.style.marginLeft = '-10px';
        cursorCircle.style.marginTop = '-10px';
    };

    var createCursorCircle = function () {
        cursorCircle = document.createElement('div');
        cursorCircle.style.width = '10px';
        cursorCircle.style.height = '10px';
        cursorCircle.style.borderRadius = '5px';
        cursorCircle.style.position = 'absolute';
        cursorCircle.style.backgroundColor = currentColor;
        cursorCircle.style.marginLeft = '-5px';
        cursorCircle.style.marginTop = '-5px'; 
        cursorCircle.style.pointerEvents = 'none'; 
        document.body.appendChild(cursorCircle);

        document.onmousemove = function (e) {
            cursorCircle.style.left = e.clientX + 'px';
            cursorCircle.style.top = e.clientY + 'px';
        };
    };

    var onKeyPress = function (e) {
        if (e.key === 'c') {
            currentColorIndex = (currentColorIndex + 1) % colors.length;
            currentColor = colors[currentColorIndex];
            if (isEraserMode) {
                toggleEraserMode(); 
            }
            resetCursorCircle();
        } else if (e.key === 'e') {
            toggleEraserMode();
        } else if (e.key === 'a') {
            clearCanvas(); // All Clear or Annihilate
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
        canvas.drawing = true;
        canvas.pathBegun = false;
        //lastX = lastY = undefined; 
        onMove(event);
    };

    var onEnd = function (event) {
        canvas.drawing = false;
        canvas.pathBegun = false;
        //lastX = lastY = undefined; // Reset last positions
        Config.saveCanvas(); 
    };

    var showCursorCircle = function () {
        cursorCircle.style.display = 'block';
    };

    var hideCursorCircle = function () {
        cursorCircle.style.display = 'none';
    };

    var clearCanvas = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (isEraserMode) {
            toggleEraserMode(); 
        }
    };

    return {
        initialize: function (idcanvas) {
            if (typeof idcanvas === 'undefined') {
                idcanvas = "canvas";
            }
            canvas = document.getElementById(idcanvas);
            context = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            canvas.addEventListener('mousemove', onMove, false);
            canvas.addEventListener('mousedown', onStart, false);
            canvas.addEventListener('mouseup', onEnd, false);

            canvas.addEventListener('touchmove', onMove, false);
            canvas.addEventListener('touchstart', onStart, false);
            canvas.addEventListener('touchend', onEnd, false);

            createCursorCircle();

            canvas = document.getElementById(idcanvas);
            canvas.addEventListener('mouseenter', showCursorCircle);
            canvas.addEventListener('mouseleave', hideCursorCircle);

            document.addEventListener('keypress', onKeyPress);

            if (!currentColor) {
                currentColor = "black";
            }
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
