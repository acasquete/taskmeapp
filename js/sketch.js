(function () {

    var context;
    var canvas;
    var currentColor;

    WinJS.Namespace.define("Sketch", {

        initialize: function (idcanvas) {
            if (typeof (idcanvas) == 'undefined') {
                idcanvas = "canvas";
            }
            canvas = document.getElementById(idcanvas);
            context = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            canvas.addEventListener('mousemove', onMouseMoveOnCanvas, false);
            canvas.addEventListener('mousedown', onMouseDownOnCanvas, false);
            canvas.addEventListener('mouseup', onMouseUpOnCanvas, false);
            if (!currentColor) currentColor = "blue";
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
    
    });

    var onMouseMoveOnCanvas = function (event) {
        if (canvas.drawing) {
            var mouseX = event.clientX;
            var mouseY = event.clientY;

            if (canvas.pathBegun == false) {
                context.lineJoin = "round";
                context.lineCap = "round";
                context.lineWidth = 6;
                context.strokeStyle = currentColor;
                context.beginPath();
                canvas.pathBegun = true;
            }
            else {
                context.lineTo(mouseX, mouseY);
                context.stroke();
            }
        }
    };

    var onMouseDownOnCanvas = function (event) {
        canvas.drawing = true;
        canvas.pathBegun = false;
    };

    var onMouseUpOnCanvas = function (event) {
        canvas.drawing = false;
        Config.saveCanvas();
    };


})();