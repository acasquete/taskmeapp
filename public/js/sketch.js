const Sketch = (function () {
    "use strict";
    let canvas, lineWidth = 4, currentColorIndex, cursorCircle;
    let isEraserMode = false, eraserSize = 40, defaultLineWidth = 4;
    let hideCursorTimeout, isCursorVisible = false;
    let currentCanvasId;
    let isEditMode = false;

    async function init() {
        initCanvas();
        assignEventListeners();
        createCursorCircle();
    }

    function initCanvas() {
        if (canvas) canvas.dispose();
    
        canvas = new fabric.Canvas('canvas');
        resizeCanvas();
        $(window).resize(resizeCanvas);
        adjustCanvasZoom();
        canvas.isDrawingMode = false;
    }
    
    function resizeCanvas() {
        canvas.setWidth($(window).width());
        canvas.setHeight($(window).height());
        canvas.requestRenderAll();
    }

    function darkenColor(color, amount) {
        let usePound = false;
        if (color[0] === "#") {
            color = color.slice(1);
            usePound = true;
        }
        let num = parseInt(color, 16);
        let r = (num >> 16) - amount;
        let b = ((num >> 8) & 0x00FF) - amount;
        let g = (num & 0x0000FF) - amount;
        r = Math.max(Math.min(255, r), 0);
        b = Math.max(Math.min(255, b), 0);
        g = Math.max(Math.min(255, g), 0);
        return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
    }
    
    function adjustCanvasZoom() {
        let canvasWidth = 2000; // El ancho total de tu canvas
        let viewportWidth = window.innerWidth; // El ancho disponible en la ventana del navegador
    
        let zoomLevel = viewportWidth / canvasWidth;
    
        canvas.setZoom(zoomLevel);
        canvas.requestRenderAll();
    }

    function assignEventListeners() {

        document.addEventListener('keydown', onKeyPress);

        fabric.util.requestAnimFrame(function requestAnimFrameRender() {
            canvas.requestRenderAll();
            fabric.util.requestAnimFrame(requestAnimFrameRender);
        });

        canvas.on('mouse:wheel', function(opt) {
            var delta = opt.e.deltaY;
            var zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 2) zoom = 2;
            if (zoom < 0.5) zoom = 0.5;
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
            canvas.requestRenderAll();

          });
    
          canvas.on('mouse:down', function(opt) {
            var evt = opt.e;
            if (evt.altKey === true) {
              this.isDragging = true;
              this.selection = false;
              this.lastPosX = evt.clientX;
              this.lastPosY = evt.clientY;
            }
          });

          canvas.on('mouse:move', function(opt) {
            if (this.isDragging) {
              var e = opt.e;
              var vpt = this.viewportTransform;
              vpt[4] += e.clientX - this.lastPosX;
              vpt[5] += e.clientY - this.lastPosY;
              canvas.requestRenderAll();
              this.lastPosX = e.clientX;
              this.lastPosY = e.clientY;
            }
          });

          canvas.on('mouse:up', function(opt) {
            this.setViewportTransform(this.viewportTransform);
            this.isDragging = false;
            this.selection = true;
          });
              
        canvas.on('object:moving', function(e) {
            var obj = e.target;
    
            if (obj.isNote) {
                updateNoteCounters();
            }

        });

        canvas.on('object:modified', function(event) {
            var activeObject = event.target;
            if (activeObject.type === 'group') {
                canvas.bringToFront(activeObject);

                let randomAngle = (Math.random() * 6) - 3; 
                activeObject.animate('angle', randomAngle, {
                    duration: 300, 
                    onChange: canvas.renderAll.bind(canvas)
                });

                if (activeObject.top < 10) {
                    activeObject.animate({
                        'top': activeObject.top - 250, 
                        'opacity': 0 // Desvanecer
                    }, {
                        duration: 500,
                        easing: fabric.util.ease['easeOutExpo'],
                        onChange: canvas.renderAll.bind(canvas),
                        onComplete: function() {
                            canvas.remove(activeObject);
                            normalizeZIndex();
                            saveCanvas();
                        }
                    });
                    return;
                }
            }
            normalizeZIndex();
            saveCanvas();
        });

        canvas.on('path:created', function(event) {
            normalizeZIndex();
            saveCanvas();
        });

        

        $(".new-small").on('mousedown touchstart', onNew);
        $('.new-normal').on('mousedown touchstart', onNew);
    }

    function updateNoteCounters() {
        let columnConfigurations = getColumnConfiguration();

        let separators = columnConfigurations.map(col => col.separator).filter(id => id).map(id => canvas.getObjects().find(obj => obj.id === id));
    
        canvas.getObjects().forEach(obj => {
            if (obj.isNote) {
                let columnIndex = separators.findIndex(sep => sep && obj.left < sep.left);
                if (columnIndex === -1) {
                    columnIndex = separators.length;
                }
                columnConfigurations[columnIndex].count++;
            }
        });
    
        columnConfigurations.forEach(column => {
            updateColumnTitle(column.id, column.count);
            if (column.id === 'col2' && column.count > column.colorThreshold) {
                setColorForColumn(column.id, 'red');
            } else {
                setColorForColumn(column.id, 'default'); // Cambiar 'default' por el color original
            }
        });
    }

    function setColorForColumn(columnId, color) {
        let columnTitle = canvas.getObjects().find(obj => obj.id === columnId);
        if (columnTitle) {
            columnTitle.set('fill', color === 'default' ? 'black' : color); 
            canvas.requestRenderAll();
        }
    }

    function updateColumnTitle(columnId, counter) {
        let column = canvas.getObjects().find(obj => obj.id === columnId);
        if (column) {
            column.setText(column.text.split(' - ')[0] + ' - ' + counter);
            canvas.requestRenderAll();
        }
    }

    function getColumnConfiguration () {
        return [
            { id: 'col1', title: 'Todo', count: 0, separator: null, proportion: 0.35 },
            { id: 'col2', title: 'In Progress', count: 0, separator: 'sep1', colorThreshold: 3, proportion: 0.35 },
            { id: 'col3', title: 'Done', count: 0, separator: 'sep2', proportion: 0.3 }
        ];
    }

    function normalizeZIndex() {
        let maxPathIndex = -1;
        let objects = canvas.getObjects();
    
        objects.forEach((object, index) => {
            if (object.type === 'path') {
                maxPathIndex = Math.max(maxPathIndex, index);
            }
        });
    
        objects.forEach(object => {
            if (object.type === 'group' && canvas.getObjects().indexOf(object) <= maxPathIndex) {
                canvas.bringToFront(object);
            }
        });
    
        canvas.renderAll();
    }

    function onNew () {

        normalizeZIndex ();

            const colors = {
                yellow: {
                    primary: '#fef639',
                    secondary: darkenColor('#fef639', 20)
                },
                blue: {
                    primary: '#34afd8',
                    secondary: darkenColor('#34afd8', 20)
                },
                rose: {
                    primary: '#fd4289',
                    secondary: darkenColor('#fd4289', 20)
                },
                violet: {
                    primary: '#cf7aef',
                    secondary: darkenColor('#cf7aef', 20)
                },
                green: {
                    primary: '#bdda1e',
                    secondary: darkenColor('#bdda1e', 20)
                },
                orange: {
                    primary: '#ffca20',
                    secondary: darkenColor('#ffca20', 20)
                }
            };

            let str = $(this).attr("class");
            let regex = /new-(\w+)\s+(\w+)/;
            
            let matches = str.match(regex);
            
            let size = matches[1];
            let color = matches[2];

            var gradient = new fabric.Gradient({
                type: 'radial',
                coords: {
                    x1: 75,
                    y1: noteHeight / 2,
                    x2: 75,
                    y2: noteHeight / 2,
                    r1: 60,
                    r2: noteHeight,
                },
                colorStops: [
                { offset: 0, color: colors[color].primary }, // Color de inicio
                { offset: 1, color:  colors[color].secondary }  // Color de fin
                ]
            });

            var noteHeight = size === 'small' ? 75 : 150; 

            var text = new fabric.Textbox('Note', {
                fontSize: 20,
                width: 150, 
                height: noteHeight,
                fontFamily: 'Kalam',
                splitByGrapheme: 'split',
                textAlign: 'center'
              });

            var square = new fabric.Rect({
                left: 0, 
                top: 0,  
                width: 150,
                height: noteHeight,
                fill: gradient,
                shadow: 'rgba(0,0,0,0.6) 0px 0px 5px'
            });

            var group = new fabric.Group([square, text], {
                originX: 'center',
                originY: 'top',
                left: 170,
                top: 170,
                hasControls: false, 
                hasBorders: false,
                opacity: 0,
                isNote: true
            });

            const noteWidth = 150;
            const margin = 5;

            let separator1 = canvas.getObjects().find(obj => obj.id === 'sep1');
            let separatorLeft = separator1 ? separator1.left : canvas.width / 3;

            let notesInFirstCol = canvas.getObjects().filter(obj => obj.isNote && obj.left < separatorLeft);

            let newLeft = 150;
            let newTop = 150;
            let placed = false;

            for (let top = 80; top < separator1.height - noteHeight; top += margin) {
                for (let left = 150; left < separatorLeft - (noteWidth * 0.5); left += margin) {
                    let potentialSpace = { left: left, top: top };
                    let isSpaceOccupied = notesInFirstCol.some(note => {
                        return isOverlapping(note, potentialSpace, noteWidth, noteHeight);
                    });

                    if (!isSpaceOccupied) {
                        newLeft = left;
                        newTop = top;
                        placed = true;
                        break;
                    }
                }

                if (placed) break;
            }

            if (!placed) {
                let lastNote = notesInFirstCol.sort((a, b) => b.top - a.top)[0];
                newTop = lastNote ? lastNote.top + lastNote.height + margin : margin;
            }

            group.set({ left: newLeft, top: newTop });

            let randomAngle = Math.floor((Math.random() * 6) + 1) - 3; 
            group.set('angle', 0);

            group.animate('opacity', 1, {
                duration: 300, 
                onChange: canvas.renderAll.bind(canvas),
                onComplete: function () {  group.set('opacity', 1);  saveCanvas() }
            });

            group.animate('angle', randomAngle, {
                duration: 200, 
                onChange: canvas.renderAll.bind(canvas)
            });

            group.on('mousedblclick', editNote);
            canvas.add(group);
            updateNoteCounters();
            saveCanvas();
    }

    function isOverlapping(note, space, width, height) {
        return note.left < space.left + width && 
               note.left + note.width > space.left &&
               note.top < space.top + height &&
               note.top + note.height > space.top;
    }

    function editNote (opt) {

        let target = opt.target;
        var text = target.getObjects().find(obj => obj.type === 'textbox');

        let textForEditing = new fabric.Textbox(text.text, {
            originX: 'center',
            originY: 'top',
            textAlign: text.textAlign,
            fontSize: text.fontSize,
            fontFamily: 'Kalam',
            width: 150,
            height: 150,
            splitByGrapheme: 'split',
            left: target.left,
            top: target.top,
            angle: target.angle
        })
        
        text.visible = false;
        target.addWithUpdate();
        
        textForEditing.visible = true;
        textForEditing.hasConstrols = false;
        
        canvas.add(textForEditing);
        canvas.setActiveObject(textForEditing);
        isEditMode = true;
        textForEditing.enterEditing();
        textForEditing.selectAll();

        textForEditing.on('editing:exited', () =>{
            isEditMode = false;
            let newVal = textForEditing.text;
            
            text.set({
                text: newVal,
                visible: true,
            });
            target.addWithUpdate();
            
            textForEditing.visible = false;
            canvas.remove(textForEditing);
            
            canvas.setActiveObject(target);
            saveCanvas();
        })
    }


    function toggleEraserMode () {
        isEraserMode = !isEraserMode;
        if (isEraserMode) {
            if (hideCursorTimeout) clearTimeout(hideCursorTimeout);
            isCursorVisible = true;
            canvas.isDrawingMode = false;
            canvas.selection = true;

            cursorCircle.style.display = 'block';
            cursorCircle.style.width = (eraserSize + 20) + 'px';
            cursorCircle.style.height = eraserSize + 'px';
            cursorCircle.style.borderRadius = '30px';
            cursorCircle.style.backgroundColor = 'white';
            cursorCircle.style.border = '2px solid black';
            cursorCircle.style.marginLeft = -((eraserSize + 20) / 2) + 'px';
            cursorCircle.style.marginTop = -(eraserSize / 2) + 'px';
            lineWidth = eraserSize; 

           // var eraser = new fabric.PencilBrush(canvas);
           // eraser.color = 'rgba(0,0,0,1)'; // Color semitransparente para el borrador
           // eraser.globalCompositeOperation = 'destination-out'; // Configura el borrador para eliminar lo que está debajo
           // canvas.freeDrawingBrush = eraser;
        } else {
            resetCursorCircle();
            lineWidth = defaultLineWidth;
            //canvas.freeDrawingBrush.color = colors[currentColorIndex];
            //canvas.freeDrawingBrush.globalCompositeOperation = 'source-over'; 
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
        cursorCircle.style.backgroundColor = getColorByIndex(currentColorIndex);
        cursorCircle.style.border = 'none';
        cursorCircle.style.marginLeft = '-15px';
        cursorCircle.style.marginTop = '-15px';

        if (hideCursorTimeout) clearTimeout(hideCursorTimeout);
        hideCursorTimeout = setTimeout(hideCursor, 2000);
    };

    var createCursorCircle = function () {

        if (cursorCircle !== undefined) return;

        isCursorVisible = false;

        cursorCircle = document.createElement('div');
        cursorCircle.style.width = '20px';
        cursorCircle.style.height = '20px';
        cursorCircle.style.borderRadius = '10px';
        cursorCircle.style.position = 'absolute';
        cursorCircle.style.backgroundColor = getColorByIndex(currentColorIndex);
        cursorCircle.style.marginLeft = '-10px';
        cursorCircle.style.marginTop = '-10px'; 
        cursorCircle.style.pointerEvents = 'none'; 
        cursorCircle.style.top = '-1000px';
        
        document.body.appendChild(cursorCircle);
        hideCursorTimeout = setTimeout(hideCursor, 1);

        document.onmousemove = function (e) {
            cursorCircle.style.left = e.clientX + 'px';
            cursorCircle.style.top = e.clientY + 'px';
        };
    };

    function changeColor (color) {
        if (color==='eraser') {
            toggleEraserMode();
        } else {
            currentColorIndex = color;
            canvas.freeDrawingBrush.color = getColorByIndex(currentColorIndex);

            if (isEraserMode) {
                toggleEraserMode(); 
            }
        }
        resetCursorCircle();
    }

    function deleteSelectedObjects() {
        var activeObject = canvas.getActiveObject();
      
        if (!activeObject) {
          return;
        }
      
        if (activeObject.type === 'activeSelection') {
          activeObject.forEachObject(function(object) {
            canvas.remove(object);
          });
        } else {
          canvas.remove(activeObject);
        }

        saveCanvas();
        canvas.discardActiveObject(); 
        canvas.requestRenderAll(); 
      }

    function onKeyPress (e) {
        if (isEditMode) return;

        if (e.key === 'c') {
            currentColorIndex = (currentColorIndex + 1) % 4;
            changeColor(currentColorIndex);
        } else if (e.key === 'e') {
            toggleEraserMode();
        } else if (e.key === 'd') {
            canvas.isDrawingMode =  !canvas.isDrawingMode;
            canvas.requestRenderAll();
        } else if (e.key === 'a') {
            clearCanvas(); 
        } else if (e.key === 'h') {
            Taskboard.toggleNotes(); 
         } else if (e.key === 'f') {
            Taskboard.toggleFullscreen(); 
        } else if (e.keyCode == 90 && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            Undo();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelectedObjects();
            e.preventDefault();
        }
    };

    function clearCanvas() {
        canvas.clear();
        initKanbanBoard();
        lineWidth = defaultLineWidth;
        if (isEraserMode) {
            toggleEraserMode(); 
        }
        saveCanvas();
    };
      
    function Undo() {
        pathsArray.splice(-1,1);
        drawPaths();
        saveCanvas();
    }

   
    function initKanbanBoard() {
        let kanbanElements = canvas.getObjects().filter(obj => obj.kanbanElement);
        if (kanbanElements.length > 0) {
            return;
        }
    
        let canvasWidth = 2000;
        let separatorYPosition = 2000;
        let columnConfigurations = getColumnConfiguration();
    
        let currentLeft = 0;
    
        columnConfigurations.forEach((column, index) => {
            let columnWidth = canvasWidth * column.proportion;
            let text = new fabric.Textbox(column.title, {
                left: currentLeft + (columnWidth / 2) - 150,
                top: 10,
                fontSize: 30,
                fontWeight: 'bold',
                fontFamily: 'PermanentMarker',
                selectable: false,
                kanbanElement: true,
                width: 300,
                textAlign: 'center',
                id: column.id
            });
    
            canvas.add(text);
    
            if (index < columnConfigurations.length - 1) {
                let separator = new fabric.Line([currentLeft + columnWidth, 0, currentLeft + columnWidth, separatorYPosition], {
                    stroke: 'black',
                    selectable: false,
                    kanbanElement: true,
                    id: 'sep' + (index + 1)
                });
                canvas.add(separator);
            }
    
            currentLeft += columnWidth;
        });
    }
    

   
    function loadCanvas(id) {
        currentCanvasId = id;

        const font1 = new FontFace('Kalam', 'url(/fonts/Kalam-Regular.ttf)');
        const font2 = new FontFace('PermanentMarker', 'url(/fonts/PermanentMarker-Regular.ttf)');
    
        const promesasDeCarga = [
            font1.load(),
            font2.load(),
        ];
    
        Promise.all(promesasDeCarga).then((fuentesCargadas) => {
            fuentesCargadas.forEach((fuente) => document.fonts.add(fuente));
    
            loadCanvasAsync();
        }).catch((error) => {
            console.error("Error al cargar las fuentes", error);
        });
    }
            
    async function loadCanvasAsync() {

        let storeCanvas = await Config.getCanvas(currentCanvasId); 
        currentColorIndex = storeCanvas.colorIndex;
        canvas.freeDrawingBrush.width = lineWidth;
        canvas.freeDrawingBrush.color = getColorByIndex(currentColorIndex);

        if (storeCanvas.content) {
            var jsonString = storeCanvas.content;
            canvas.loadFromJSON(JSON.parse(jsonString), function() {
                canvas.forEachObject(function(obj) {

                    if (obj.type === 'group') {
                        obj.set({
                            hasControls: false,
                            hasBorders: false,
                            lockRotation: true,
                            isNote: true
                        });

                        obj.on('mousedblclick', editNote);
                    }

                    if (obj.kanbanElement) {
                        obj.set({
                            hasControls: false,
                            hasBorders: false,
                            lockRotation: true,
                            selectable: false
                        });

                        obj.on('mousedblclick', editNote);
                    }
                });
                canvas.requestRenderAll();
            });

            initKanbanBoard();
        }
    }

    function saveCanvas() {
        const currentMode = canvas.isDrawingMode;
        canvas.isDrawingMode = false;
        let jsonCanvas = canvas.toJSON(['id', 'isNote', 'kanbanElement']);
        let storeCanvas = { colorIndex: currentColorIndex, content:  JSON.stringify(jsonCanvas) };
        Config.saveCanvas(currentCanvasId, storeCanvas);
        canvas.isDrawingMode = currentMode;
    }

    function getColorByIndex (index) {
        const colors = ['#000000', '#0047bb', '#ef3340', '#00a651'];
        return colors[index];
    }

    return { init, loadCanvas, clearCanvas, changeColor };
})();
