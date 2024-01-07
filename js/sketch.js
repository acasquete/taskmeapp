var Sketch = (function () {
    var context;
    var canvas;
    var currentColor;

    var draw = function (x, y) {
        if (!canvas.pathBegun) {
            context.lineJoin = "round";
            context.lineCap = "round";
            context.lineWidth = 6;
            context.strokeStyle = currentColor;
            context.beginPath();
            context.moveTo(x, y);
            canvas.pathBegun = true;
        } else {
            context.lineTo(x, y);
            context.stroke();
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
            draw(x, y);
            event.preventDefault();
        }
    };

    var onStart = function (event) {
        canvas.drawing = true;
        canvas.pathBegun = false;
        onMove(event); // Start drawing immediately
    };

    var onEnd = function (event) {
        canvas.drawing = false;
        canvas.pathBegun = false;
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
                currentColor = "blue";
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
