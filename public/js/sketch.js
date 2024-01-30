const Sketch = (function () {
    "use strict";
    let canvas, currentColorIndex;
    let isEraserMode = false;
    let currentCanvasId;
    let isEditMode = false;
    const CANVAS_WIDTH = 2000;

    async function init() {
        initCanvas();
        assignEventListeners();
    }

    function initCanvas() {
        if (canvas) canvas.dispose();
    
        canvas = new fabric.Canvas('c', { allowTouchScrolling: true, selection: false });

        resizeCanvas();

        $(window).resize(resizeCanvas);

        adjustCanvasZoom();
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
        let viewportWidth = window.innerWidth; 
        let zoomLevel = viewportWidth / CANVAS_WIDTH;
    
        canvas.setZoom(zoomLevel);
        canvas.requestRenderAll();
    }

    let isEditKanbanMode = false;
    let targetElement = null;
    let originalPosition = null;

    let sepInitPositions;

    function getObjectById(id) {
        return canvas.getObjects().find(obj => obj.id === id) || null;
    }

    function adjustColumns() {
        var cols = canvas.getObjects().filter(obj => obj.id && obj.id.startsWith('col'));
    
        cols.forEach((col, index) => {
            var minColumnWidth = 400;
            var sepLeft = index === 0 ? 0 : getObjectById('sep' + index).left;
            var nextSep = getObjectById('sep' + (index + 1));
            var nextSepLeft = nextSep ? nextSep.left : canvas.width;
    
            if (nextSepLeft - sepLeft < minColumnWidth) {
                nextSep.set({ left: sepLeft + minColumnWidth });
                nextSepLeft = nextSep.left;
            }
                
            col.left = sepLeft;
            col.width = nextSepLeft - sepLeft;
        });
        updateNoteCounters();
        canvas.requestRenderAll();
    }

    function moveRelatedElements(id, deltaX) {
        let movedIndex =  parseInt(id.replace(/[^\d]/g, ''), 10);
    
        canvas.forEachObject(function(obj) {
            if (obj.id && (obj.id.startsWith('sep'))) {
                let objIndex = parseInt(obj.id.replace(/[^\d]/g, ''));

                if (objIndex > movedIndex && obj.id != id) {
                    obj.set({
                        left: sepInitPositions[objIndex-1] + deltaX,
                    });
                }
            }
            adjustColumns();
        });
    
        canvas.renderAll();
    }

    function getSeparatorsPositionsArray() {
        var separatorsPositions = [];
        var objects = canvas.getObjects();
    
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].id && objects[i].id.startsWith('sep')) {
                separatorsPositions.push(objects[i].left);
            }
        }
        return separatorsPositions;
    }

    function assignEventListeners() {

        document.addEventListener('keydown', onKeyPress);

        function isSeparatorElement(object) {
            return object.cl === 'k' && object.id.startsWith('sep');
        }

        canvas.on('mouse:over', function(e) {
            var objeto = e.target;
            if (objeto && objeto.id && objeto.id.startsWith('sep')) {
                objeto.set('stroke', 'green');
                canvas.renderAll();
            }
        });
        
        canvas.on('mouse:out', function(e) {
            var objeto = e.target;
            if (objeto && objeto.id && objeto.id.startsWith('sep')) {
                objeto.set('stroke', 'gray');
                canvas.renderAll();
            }
        });

        canvas.on('mouse:down', function (options) {
            let target = canvas.findTarget(options.e);
            if (target && isSeparatorElement(target)) {
                isEditKanbanMode = true;
                canvas.selection = false;
                targetElement = target;
                targetElement.selectable = false; 
                originalPosition = { x: target.left };
                sepInitPositions = getSeparatorsPositionsArray();
            }
        });

        canvas.on('mouse:move', function (options) {
            if (isEditKanbanMode && targetElement) {
                let pointer = canvas.getPointer(options.e);
                targetElement.set({
                    left: pointer.x
                });
                let deltaX = pointer.x - originalPosition.x;
                moveRelatedElements (targetElement.id, deltaX);
                canvas.requestRenderAll();
            }
        });

        canvas.on('mouse:up', function (options) {
            isEditKanbanMode = false;
            if (targetElement) {
                targetElement.selectable = false;
                let pointer = canvas.getPointer(options.e);
                let deltaX = pointer.x - originalPosition.x;
                moveRelatedElements (targetElement.id, deltaX);
                targetElement = null;
                saveCanvas();
            }
        });

        canvas.on('mouse:wheel', function(opt) {

            var zoom = canvas.getZoom();

            if (opt.e.ctrlKey) {
                var evt = opt.e;
                var deltaY = evt.deltaY;
                zoom = zoom - deltaY / 100;

                if (zoom > 3) zoom = 3;
                if (zoom < 0.4) zoom = 0.4;

                canvas.zoomToPoint(new fabric.Point(evt.offsetX, evt.offsetY), zoom);
              } else {
                var deltaX = -opt.e.deltaX;
                var deltaY = -opt.e.deltaY;
            
                var currentX = canvas.viewportTransform[4];
                var currentY = canvas.viewportTransform[5];
            
                var newX = currentX + deltaX;
                var newY = currentY + deltaY;
            
                canvas.relativePan(new fabric.Point(newX - currentX, newY - currentY));
              }
                opt.e.preventDefault();
                opt.e.stopPropagation();
            
          });

          let pausePanning = false;
          let currentX;
          let currentY;
          let lastX;
          let lastY;
          let xChange;
          let yChange;

          canvas.on({
            'touch:gesture': function(e) {
                if (e.e.touches && e.e.touches.length == 2) {
                    pausePanning = true;
                    var point = new fabric.Point(e.self.x, e.self.y);
                    if (e.self.state == "start") {
                        zoomStartScale = self.canvas.getZoom();
                    }
                    var delta = zoomStartScale * e.self.scale;
                    self.canvas.zoomToPoint(point, delta);
                    pausePanning = false;
                }
            },
            'object:selected': function() {
                pausePanning = true;
            },
            'selection:cleared': function() {
                pausePanning = false;
            },
            'touch:drag': function(e) {
                
                if (!isEditKanbanMode && !canvas.selection && !canvas.isDrawingMode && pausePanning == false && undefined != e.e.layerX && undefined != e.e.layerY) {
                    var target = canvas.findTarget(e.e);
            
                    if (target && (target.cl === 'n' || target.cl === 'd' || target.type == 'path')) {
                        pausePanning = true;
                        return;
                    }
            
                    currentX = e.e.layerX;
                    currentY = e.e.layerY;
                    xChange = currentX - lastX;
                    yChange = currentY - lastY;
            
                    if ((Math.abs(currentX - lastX) <= 50) && (Math.abs(currentY - lastY) <= 50)) {
                        var currentViewPort = canvas.viewportTransform;
                        var newX = currentViewPort[4] + xChange;
                        var newY = currentViewPort[5] + yChange;
            
                        var delta = new fabric.Point(newX - currentViewPort[4], newY - currentViewPort[5]);
                        canvas.relativePan(delta);
                    }
            
                    lastX = e.e.layerX;
                    lastY = e.e.layerY;
                }
            }
        });

        canvas.on('object:moving', function(e) {
            var obj = e.target;
    
            if (obj.cl ==='n') {
                updateNoteCounters();
            }
        });

        canvas.on('object:modified', function(event) {
            var activeObject = event.target;
            if (activeObject.type === 'group') {
                canvas.bringToFront(activeObject);

                //let intangle = activeObject.getObjects().find(obj => obj.type === 'textbox').angle;
                //console.log(activeObject.getObjects().find(obj => obj.type === 'textbox').angle);

                // activeObject.animate('angle', randomAngle - intangle, {
                //       duration: 300, 
                //       onChange: canvas.renderAll.bind(canvas)
                // });

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
        
        $(".new-small").on('mousedown', onNew);
        $('.new-normal').on('mousedown', onNew);
        $('.new-dot').on('mousedown', onNewDot);
    }

    function updateNoteCounters() {
        let columnConfigurations = getColumnConfiguration();

        let separators =  canvas.getObjects().filter(obj => obj.id && obj.id.startsWith('sep'));
    
        canvas.getObjects().forEach(obj => {
            if (obj.cl==='n') {
                let columnIndex = separators.findIndex(sep => sep && obj.left < sep.left);
                if (columnIndex > -1) {
                    columnConfigurations[columnIndex].count++;
                }
            }
        });
    
        columnConfigurations.forEach(column => {
            updateColumnTitle(column.id, column.count);
            if (column.colorThreshold && column.count > column.colorThreshold) {
                setColorForColumn(column.id, '#ef3340');
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
            let baseText = column.text.split(' - ')[0];
            if (counter > 0) {
                column.setText(baseText + ' - ' + counter);
            } else {
                column.setText(baseText);
            }
            canvas.requestRenderAll();
        }
    }

    function getColumnConfiguration () {
        return [
            { id: 'col1', title: 'Todo', count: 0, proportion: 0.35 },
            { id: 'col2', title: 'In Progress', count: 0, colorThreshold: 3, proportion: 0.35 },
            { id: 'col3', title: 'Done', count: 0, proportion: 0.3 }
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

    function getColors () {
        return {
            yellow: {
                primary: '#fef639',
                secondary: darkenColor('#fef639', 20),
                text: '#000000'
            },
            blue: {
                primary: '#34afd8',
                secondary: darkenColor('#34afd8', 20),
                text: '#ffffff'
            },
            rose: {
                primary: '#fd4289',
                secondary: darkenColor('#fd4289', 20),
                text: '#ffffff'
            },
            violet: {
                primary: '#cf7aef',
                secondary: darkenColor('#cf7aef', 20),
                text: '#ffffff'
            },
            green: {
                primary: '#bdda1e',
                secondary: darkenColor('#bdda1e', 20),
                text: '#000000'
            },
            orange: {
                primary: '#ffca20',
                secondary: darkenColor('#ffca20', 20),
                text: '#000000'
            },
            welcome: {
                primary: '#ffffff',
                secondary: darkenColor('#ffffff', 20),
                text: '#000000'
            }
        };
    }

    function Welcome () {
        let colors = getColors();

        var gradient = new fabric.Gradient({
            type: 'radial',
            coords: {
                x1: 75,
                y1: 150 / 2,
                x2: 75,
                y2: 150 / 2,
                r1: 60,
                r2: 300,
            },
            colorStops: [
            { offset: 0, color: colors['yellow'].primary }, 
            { offset: 1, color:  colors['yellow'].secondary } 
            ]
        });

        const content = `\nYou're the best! Thanks for trying TaskMe, The Natural Kanban Board!\n\n 1. Create a note by selecting a color on the left of the screen. \n 2. Edit a note by clicking on it. \n 3. Remove a note by dragging it to the top of the screen. \n\n(c)hange pen color - (e)raser - clear (a)ll \n (h)ide notes - (f)ull screen - (s)election - (p)ointer\n [Ctrl]+1..5 Switch Board \n\n If you have any questions, ideas or suggestions, please feel free \n to contact me at x.com/acasquetenotes \n or open an issue on GitHub at github.com/acasquete/taskmeapp`;

        var text = new fabric.Textbox(content, {
            originX: 'center',
            originY: 'top',
            fontSize: 24,
            width: 900, 
            height: 500,
            fontFamily: 'Kalam',
            splitByGrapheme: 'split',
            textAlign: 'center',
            fill: colors['yellow'].text 
          });

        var square = new fabric.Rect({
            originX: 'center',
            originY: 'top',
            left: 0, 
            top: 0,  
            width: 900,
            height: 500,
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
            cl: 'n'
        });

        let randomAngle = 0; // Math.floor((Math.random() * 6) + 1) - 3; 

        group.animate('opacity', 1, {
            duration: 300, 
            onChange: canvas.renderAll.bind(canvas),
            onComplete: function () {  group.set('opacity', 1);  saveCanvas() }
        });

        group.animate('angle', randomAngle, {
            duration: 200, 
            onChange: canvas.renderAll.bind(canvas)
        });

        group.on('mouseup', editNote);
        canvas.viewportCenterObject(group);
        canvas.add(group);
        
        updateNoteCounters();
        saveCanvas();
    }

    function onNew () {
        showNotes();

        normalizeZIndex ();
        
            let colors = getColors();

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

            var text = new fabric.Textbox('To Do', {
                originX: 'center',
                originY: 'top',
                fontSize: 24,
                width: 150, 
                height: noteHeight,
                fontFamily: 'Kalam',
                splitByGrapheme: 'split',
                textAlign: 'center',
                fill: colors[color].text 
              });

            var square = new fabric.Rect({
                originX: 'center',
                originY: 'top',
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
                cl: 'n'
            });

            const noteWidth = 150;
            const margin = 5;

            let separator1 = canvas.getObjects().find(obj => obj.id === 'sep1');
            let separatorLeft = separator1 ? separator1.left : canvas.width / 3;

            let notesInFirstCol = canvas.getObjects().filter(obj => obj.cl ==='n' && obj.left < separatorLeft);

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

            let randomAngle = 0; // Math.floor((Math.random() * 6) + 1) - 3; 

            group.animate('opacity', 1, {
                duration: 300, 
                onChange: canvas.renderAll.bind(canvas),
                onComplete: function () {  group.set('opacity', 1);  saveCanvas() }
            });

            group.animate('angle', randomAngle, {
                duration: 200, 
                onChange: canvas.renderAll.bind(canvas)
            });

            group.on('mouseup', editNote);

            canvas.add(group);
            updateNoteCounters();
            saveCanvas();
    }

    function onNewDot () {
        showNotes();

        normalizeZIndex ();

            const colors = {
                red: {
                    primary: '#ff0000',
                    secondary: darkenColor('#ff0000', 20)
                }
            };
            
            let color = 'red';

            var gradient = new fabric.Gradient({
                type: 'radial',
                coords: {
                    x1: 25,
                    y1: 25,
                    x2: 25,
                    y2: 25,
                    r1: 20,
                    r2: 50,
                },
                colorStops: [
                { offset: 0, color: colors[color].primary }, // Color de inicio
                { offset: 1, color:  colors[color].secondary }  // Color de fin
                ]
            });

            let separator1 = canvas.getObjects().find(obj => obj.id === 'sep1');
            let firstColWidth = separator1 ? separator1.left : canvas.width / 3; // o cualquier otro cálculo para la primera columna
            let firstColHeight = separator1 ? separator1.height / 3 : canvas.height / 4; // o cualquier otro cálculo para la primera columna

            let randomLeft = Math.random() * (firstColWidth - 150) + 150; // 28 es el diámetro del círculo (2 * radio)
            let randomTop = Math.random() * (firstColHeight - 28) + 100; // Asumiendo que quieres que pueda aparecer en cualquier parte de la altura del canvas

            var circle = new fabric.Circle({
                left: randomLeft, 
                top: randomTop,  
                radius: 14,
                fill: gradient,
                shadow: 'rgba(0,0,0,0.6) 0px 0px 3px',
                hasControls: false, 
                hasBorders: false,
                cl: 'd'
            });

            circle.on('mousedblclick', removeDot);
            canvas.add(circle);
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
        var rect = target.getObjects().find(obj => obj.type === 'rect');
        
        rect.angle = 0;
        target.angle = 0;
        text.angle = 0;

        canvas.renderAll();

        let textForEditing = new fabric.Textbox(text.text, {
            originX: 'center',
            originY: 'top',
            textAlign: text.textAlign,
            fontSize: text.fontSize,
            fontFamily: 'Kalam',
            width: text.width,
            height: text.height,
            splitByGrapheme: 'split',
            left: target.left,
            top: target.top,
            editingBorderColor: 'rgba(255,255,255,0)',
            fill: text.fill
        })
        
        text.visible = false;
        target.addWithUpdate();
        
        textForEditing.visible = true;
        textForEditing.hasConstrols = false;
        
        textForEditing.angle = 0;

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
                visible: true
            });
            target.addWithUpdate();
            
            textForEditing.visible = false;
            canvas.remove(textForEditing);
            canvas.requestRenderAll();
            canvas.setActiveObject(target);
            saveCanvas();
        })
    }

    
    function setPointerMode() {
        canvas.isDrawingMode = false;
        canvas.selection = false;
    }

    function setSelectionMode() {
        canvas.isDrawingMode = false;
        canvas.selection = true;
    }
    
    function setEraserMode() {
        
        // Crear un objeto de círculo en Fabric.js
        var circle = new fabric.Circle({
            radius: 10,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 1,
            left: 100,
            top: 100,
            selectable: false,
            hasBorders: false,
            hasControls: false
        });
        canvas.add(circle);

        // Ocultar el cursor real
        canvas.getElement().style.cursor = "none";



    }
    
    function setDrawingMode(colorIndex) {
        canvas.freeDrawingBrush.color = getColorByIndex(colorIndex);
        canvas.isDrawingMode = true;
        canvas.selection = false;
    
        if (isEraserMode) {
            toggleEraserMode();
        }
    }
    
    function changeColor(color) {
        switch (color) {
            case 'pointer':
                setPointerMode();
                break;
            case 'selection':
                setSelectionMode();
                break;
            case 'eraser':
                setEraserMode();
                break;
            default:
                currentColorIndex = color;
                setDrawingMode(currentColorIndex);
                break;
        }

        
        canvas.requestRenderAll();
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
            if (canvas.isDrawingMode) { currentColorIndex = (currentColorIndex + 1) % 4; }
            changeColor(currentColorIndex);
        } else if (e.key === 'e') {
            setEraserMode();
        } else if (e.key === 's') {
            changeColor('selection');
        } else if (e.key === 'd') {
            changeColor('pointer');
        } else if (e.key === 'a') {
            clearCanvas(); 
        } else if (e.key === 'h') {
            toggleNotesVisibility(); 
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

    function clearAllCanvas() {


        $( "#dialog-confirm" ).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
              "Delete Board": function() {

                canvas.clear();
                initKanbanBoard();
                if (isEraserMode) {
                    toggleEraserMode(); 
                }
                saveCanvas();
                $( this ).dialog( "close" );
              },
              Cancel: function() {
                $( this ).dialog( "close" );
              }
            }
          });

       
    };

    function toggleNotesVisibility() {
        canvas.getObjects().forEach(function(obj) {
            if (obj.cl === 'n' || obj.cl === 'd') {
                obj.set('visible', !obj.visible); 
            }
        });
    
        canvas.requestRenderAll();
    }

    function showNotes() {
        canvas.getObjects().forEach(function(obj) {
            if (obj.cl === 'n' || obj.cl === 'd') {
                obj.set('visible', true); 
            }
        });
    
        canvas.requestRenderAll();
    }

    function clearCanvas() {
        for (let i = canvas.getObjects().length - 1; i >= 0; i--) {
            let obj = canvas.item(i);
            if (obj.type === 'path' || obj.cl === 'd') {
                canvas.remove(obj);
            }
        }
        saveCanvas();
    }
      
    function Undo() {
        pathsArray.splice(-1,1);
        drawPaths();
        saveCanvas();
    }

   
    function initKanbanBoard() {
        let kanbanElements = canvas.getObjects().filter(obj => obj.cl === 'k');
        if (kanbanElements.length > 0) {
            return;
        }
        
        let separatorYPosition = 4000;
        let columnConfigurations = getColumnConfiguration();
    
        let currentLeft = 0;
    
        columnConfigurations.forEach((column, index) => {
            let columnWidth = CANVAS_WIDTH * column.proportion;
            let text = new fabric.Textbox(column.title, {
                originX: 'left',
                left: currentLeft,
                top: 10,
                fontSize: 30,
                fontWeight: 'bold',
                fontFamily: 'PermanentMarker',
                selectable: false,
                width: columnWidth,
                textAlign: 'center',
                id: column.id,
                cl: 'k'
            });
    
            canvas.add(text);
    
            let separator = new fabric.Line([currentLeft + columnWidth, 0, currentLeft + columnWidth, separatorYPosition], {
                stroke: 'gray',
                selectable: false,
                strokeWidth: 6,
                cl: 'k',
                id: 'sep' + (index+1)
            });
            canvas.add(separator);
    
            currentLeft += columnWidth;
        });

        if (currentCanvasId==1) Welcome();
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
        canvas.freeDrawingBrush.width = 4;
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
                            visible: true,
                            cl: 'n'
                        });

                        obj.on('mouseup', editNote);
                    }

                    if (obj.cl === 'd') {
                        obj.set({
                            hasControls: false,
                            hasBorders: false,
                            visible: true,
                        });

                        obj.on('mousedblclick', removeDot);
                    }

                    if (obj.cl==='k') {
                        obj.set({
                            hasControls: false,
                            hasBorders: false,
                            lockRotation: true,
                            selectable: false
                        });
                    }
                });
                canvas.requestRenderAll();
            });

            initKanbanBoard();
        }
    }

    function removeDot(e) {
        var object = e.target;
        canvas.remove(object);
    }

    function saveCanvas() {
        const currentMode = canvas.isDrawingMode;
        canvas.isDrawingMode = false;
        let jsonCanvas = canvas.toJSON(['cl', 'id']);
        let storeCanvas = { colorIndex: currentColorIndex, content:  JSON.stringify(jsonCanvas) };
        Config.saveCanvas(currentCanvasId, storeCanvas);
        canvas.isDrawingMode = currentMode;
    }

    function getColorByIndex (index) {
        const colors = ['#000000', '#0047bb', '#ef3340', '#00a651'];
        return colors[index];
    }

    return { init, loadCanvas, clearCanvas, changeColor, clearAllCanvas, toggleNotesVisibility };
})();
