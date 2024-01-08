var Sketch = (function () {
    var context;
    var canvas;
    var currentColor;
    var lineWidth = 25;
    var lastX, lastY;
    var startTime;
    var pathDuration = 500; 

    var draw = function (x, y) {
        context.lineJoin = "round";
        context.lineCap = "round";
        context.strokeStyle = currentColor;
        context.lineWidth = lineWidth;

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
            lineWidth = Math.sqrt(dx * dx + dy * dy) * 0.2;

            if (lineWidth > 20) lineWidth = 20;
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
        
        clearCanvas: function() {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

})();
