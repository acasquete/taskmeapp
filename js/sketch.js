﻿const Sketch = (function () {
    let ctx, canvas, lineWidth = 8, currentColorIndex, cursorCircle;
    let isEraserMode = false, eraserSize = 80, defaultLineWidth = 6;
    let hideCursorTimeout, isCursorVisible = false, drawing = false;
    let pathsArray = [], points = [], mouse = { x: 0, y: 0 }, previous = { x: 0, y: 0 };
    const colors = ['black', 'blue', 'red', 'green'];

    function init(idCanvas = "canvas") {
        canvas = document.getElementById(idCanvas);
        ctx = canvas.getContext('2d');
        
        configureCanvas();
        assignEventListeners();
        currentColorIndex = Config.getColor();
        loadCanvas();
        createCursorCircle();
    }

    function configureCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function assignEventListeners() {
        const events = ['click', 'mousemove', 'mousedown', 'mouseup', 'touchmove', 'touchstart', 'touchend', 'mouseenter', 'mouseleave', 'mouseout'];
        events.forEach(event => canvas.addEventListener(event, eventHandlers[event]));

        document.addEventListener('keydown', onKeyPress);
        window.addEventListener('resize', resizeCanvas);
    }

    const eventHandlers = {
        click: onCanvasClick,
        mousemove: onMove,
        mousedown: onStart,
        mouseup: onEnd,
        touchmove: onMove,
        touchstart: onStart,
        touchend: onEnd,
        mouseenter: showCursorCircle,
        mouseleave: hideCursorCircle,
        mouseout: onEnd
    };

    function resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
    
        canvas.width = width;
        canvas.height = height;

        drawPaths();
    }

    function toggleEraserMode () {
        isEraserMode = !isEraserMode;
        if (isEraserMode) {
            if (hideCursorTimeout) clearTimeout(hideCursorTimeout);
            isCursorVisible = true;
            cursorCircle.style.display = 'block';
            cursorCircle.style.width = (eraserSize + 20) + 'px';
            cursorCircle.style.height = eraserSize + 'px';
            cursorCircle.style.borderRadius = '30px';
            cursorCircle.style.backgroundColor = 'white';
            cursorCircle.style.border = '2px solid black';
            cursorCircle.style.marginLeft = -((eraserSize + 20) / 2) + 'px';
            cursorCircle.style.marginTop = -(eraserSize / 2) + 'px';
            lineWidth = eraserSize; 
        } else {
            resetCursorCircle();
            lineWidth = defaultLineWidth;
        }
    };

    function hideCursor() {
        cursorCircle.style.display = 'none';
        isCursorVisible = false;
    }

    function resetCursorCircle() {
        cursorCircle.style.display = 'block';
        cursorCircle.style.width = '30px';
        cursorCircle.style.height = '30px';
        cursorCircle.style.borderRadius = '15px';
        cursorCircle.style.backgroundColor = colors[currentColorIndex];
        cursorCircle.style.border = 'none';
        cursorCircle.style.marginLeft = '-15px';
        cursorCircle.style.marginTop = '-15px';

        if (hideCursorTimeout) clearTimeout(hideCursorTimeout);
        hideCursorTimeout = setTimeout(hideCursor, 2000);
    };

    var createCursorCircle = function () {
        cursorCircle = document.createElement('div');
        isCursorVisible = true;
        cursorCircle.style.width = '30px';
        cursorCircle.style.height = '30px';
        cursorCircle.style.borderRadius = '15px';
        cursorCircle.style.position = 'absolute';
        cursorCircle.style.backgroundColor = colors[currentColorIndex];
        cursorCircle.style.marginLeft = '-15px';
        cursorCircle.style.marginTop = '-15px'; 
        cursorCircle.style.pointerEvents = 'none'; 
        cursorCircle.style.top = '-1000px';
        
        document.body.appendChild(cursorCircle);
        hideCursorTimeout = setTimeout(hideCursor, 2000);
        document.onmousemove = function (e) {
            cursorCircle.style.left = e.clientX + 'px';
            cursorCircle.style.top = e.clientY + 'px';
        };
    };

    function onKeyPress (e) {
        if (Taskboard.isAnyNoteSelected()) {
            return;
        }
        if (e.key === 'c') {
            currentColorIndex = (currentColorIndex + 1) % colors.length;
            saveCanvas(); 
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
        } else if (e.keyCode == 90 && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            Undo();
        }

    };

    function onMove (e)  {
        if(drawing){
            previous = {x:mouse.x,y:mouse.y};
            mouse = oMousePos(canvas, e);
            // saving the points in the points array
            points.push({x:mouse.x,y:mouse.y,c:currentColorIndex,e:isEraserMode,s:lineWidth});
            // drawing a line from the previous point to the current point
            ctx.beginPath();
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.globalCompositeOperation = isEraserMode ? 'destination-out' : 'source-over';
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = colors[currentColorIndex];
            ctx.moveTo(previous.x,previous.y);
            ctx.lineTo(mouse.x,mouse.y);
            ctx.stroke();
        }
    };

    function onStart (e) {
        $('.note').removeClass('selected');
        drawing = true; 
        previous = {x:mouse.x,y:mouse.y};
        mouse = oMousePos(canvas, e);
        points = [];
        points.push({x:mouse.x,y:mouse.y,c:currentColorIndex,e:isEraserMode,s:lineWidth});
    };

    function onEnd (e) {
        if (drawing) {
            console.log('end');
            drawing=false;
            pathsArray.push(points);
            saveCanvas();
        }
    };

    function showCursorCircle () {
        if (isCursorVisible) cursorCircle.style.display = 'block';
    };

    function hideCursorCircle () {
        isEraserMode = false;
        cursorCircle.style.display = 'none';
    };

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pathsArray = [];
        if (isEraserMode) {
            toggleEraserMode(); 
        }
        saveCanvas();
    };

    function onCanvasClick () {
        Taskboard.deselectAllNotes();
    };

    function drawPaths(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        pathsArray.forEach(path=>{
            ctx.beginPath();
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            for(let i = 1; i < path.length; i++){
                ctx.globalCompositeOperation = path[i].e ? 'destination-out' : 'source-over';
                ctx.lineWidth = path[i].s;
                ctx.strokeStyle = colors[path[i].c];
                ctx.lineTo(path[i].x,path[i].y); 
            }
            ctx.stroke();
            });
      }  
      
      function Undo(){
        pathsArray.splice(-1,1);
        drawPaths();
        saveCanvas();
      }
            
      function oMousePos(canvas, evt) {
        var ClientRect = canvas.getBoundingClientRect();
        
        var posX, posY;
    
        if (evt.touches) {
            var touch = evt.touches[0];
            posX = touch.clientX;
            posY = touch.clientY;
        } else {
            posX = evt.clientX;
            posY = evt.clientY;
        }

        return {
            x: Math.round(posX - ClientRect.left),
            y: Math.round(posY - ClientRect.top)
        }
    }

    function loadCanvas() {
        drawPathString = localStorage.getItem("drawPath");
        if (drawPathString) pathsArray=JSON.parse(drawPathString);
        drawPaths();
    }

    function saveCanvas() {
        Config.setColor(currentColorIndex);

        var canvas = document.getElementById("canvas");
        canvas.toBlob(function(blob) {
            var reader = new FileReader();
            reader.onload = function() { 
                localStorage.setItem("canvas.png", reader.result);
            };
            reader.readAsDataURL(blob);
        });

        localStorage.setItem("drawPath", JSON.stringify(pathsArray));
    }

    return { init, clearCanvas };
})();
