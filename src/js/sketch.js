﻿import kalamFontURL from '../assets/fonts/Kalam-Regular.ttf';
import permanentMarkerFontURL from '../assets/fonts/PermanentMarker-Regular.ttf';
import { CanvasUtilities } from '../services/canvasUtilities.ts';
import { CanvasController } from '../services/canvasController';

const Sketch = (function () {
    "use strict";
    let canvas, currentColorIndex;
    let isEraserMode = false;
    let currentCanvasId;
    const CANVAS_WIDTH = 2000;
    var state = [];
    var mods = 0;
    let observers = []; 
    let canvasController;
    let sharedCanvasId = '';

    async function init(sharedId) {

        initCanvas();
        assignDOMEventListeners();

        canvasController = new CanvasController(canvas);
        canvasController.assignCanvasEventListeners();

        loadCurrentDashboard(sharedId);
    }

    async function loadCurrentDashboard(sharedId) {
        if (sharedId && sharedId!='') {
            sharedCanvasId = sharedId
            currentCanvasId = 10; // 10 Start shared dashboards
        } else {
            currentCanvasId = Config.getActiveDashboard();

            if (currentCanvasId>9) {
                if (!Data.isLogged()) {
                    Notifications.showAppNotification('You are working on local dashboard now!', 'regular', 8000);
                    currentCanvasId = 1;
                }
            }
        }

        await switchDashboard(currentCanvasId, sharedCanvasId, true);
    }

    function initCanvas() { 
        if (canvas) canvas.dispose();
    
        canvas = new fabric.Canvas('c', { allowTouchScrolling: true, selection: false });

        resizeCanvas();

        $(window).on('resize orientationchange', resizeCanvas);
    }
    
    function resizeCanvas() {
        canvas.setWidth($(window).width());
        canvas.setHeight($(window).height());
        canvas.requestRenderAll();
    }

    function toggleFullscreen ()
    {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
       
    function adjustCanvasZoom(forceReset) {
        var currentOrientation = CanvasUtilities.getUserOrientation(); 
        var savedConfiguration = retrieveConfiguration(currentOrientation);

        if (!forceReset && savedConfiguration) {
            canvas.setViewportTransform(savedConfiguration.vpt);
            canvas.setZoom(savedConfiguration.zoom);
        } else {
            defaultZoom();
        }
    }

    function defaultZoom() {
        let viewportWidth = window.innerWidth; 
        let zoomLevel = viewportWidth / CANVAS_WIDTH;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.setZoom(zoomLevel);
    }

    function assignDOMEventListeners() {
        document.addEventListener('keydown', onKeyPress);
        
        $(".new-small").on('mousedown', onNew);
        $('.new-normal').on('mousedown', onNew);
        $('.new-dot').on('mousedown', onNewDot);
    }

    function addTextObject () {

        var cursorPosition = canvasController.getLastKnownPos ();

        var text = new fabric.IText('Start typing...', {
            originX: 'center',
            originY: 'top',
            fontSize: 36,
           
            fontFamily: 'Kalam',
            splitByGrapheme: false,
            textAlign: 'center',
            fill: 'black',
            left: cursorPosition.x,
            top: cursorPosition.y,
            cl: 't',
            id: genId()
          });

        canvas.add(text);
        
        canvasController.saveCanvas();
    }

    function createWelcomeNote () {
        let colors = CanvasUtilities.getColors();
        
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

        const content = `\nYou're the best! Thanks for trying TaskMe, The Natural Kanban Board!\n\n 1. Create a note by selecting a color on the left of the screen. \n 2. Edit a note by double tapping on it. \n 3. Remove a note by dragging it to the top of the screen. \n\n(c)hange pen color - (e)raser - (k)lear board \n (h)ide notes - (f)ull screen - (s)election - (p)ointer\n [Ctrl]+1..5 Switch Board \n\n If you have any questions, ideas or suggestions, please feel free \n to contact me at x.com/acasquetenotes \n or open an issue on GitHub at github.com/acasquete/taskmeapp`;

        var text = new fabric.Textbox(content, {
            originX: 'center',
            originY: 'top',
            fontSize: 24,
            width: 900, 
            height: 500,
            fontFamily: 'Kalam',
            splitByGrapheme: false,
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
            cl: 'n',
            id: genId()
        });

        group.animate('opacity', 1, {
            duration: 300, 
            onChange: canvas.renderAll.bind(canvas),
            onComplete: function () {  group.set('opacity', 1); canvasController.saveCanvas() }
        });

        group.on('mousedblclick', editNote);
        canvas.viewportCenterObject(group);
        canvas.add(group);
        
        canvasController.updateNoteCounters();
        canvasController.saveCanvas();
    }

    function genId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function onNew () {
        showNotes();

        canvasController.normalizeZIndex ();
        
        let colors = CanvasUtilities.getColors();

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

        var text = new fabric.Textbox('To Do', {
            originX: 'center',
            originY: 'top',
            fontSize: 24,
            width: 150, 
            height: noteHeight,
            fontFamily: 'Kalam',
            splitByGrapheme: false,
            textAlign: 'center',
            fill: colors[color].text 
            });

        var group = new fabric.Group([square, text], {
            originX: 'center',
            originY: 'top',
            left: 170,
            top: 170,
            hasControls: false, 
            hasBorders: false,
            opacity: 0,
            cl: 'n',
            id: genId()
        });

        const noteWidth = 150;
        const margin = 5;

        text.set({ top: square.top + (square.height - text.getScaledHeight()) / 2});

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

        let randomAngle = 0;

        group.animate('opacity', 1, {
            duration: 300, 
            onChange: canvas.renderAll.bind(canvas),
            onComplete: function () {  group.set('opacity', 1);  canvasController.saveCanvas() }
        });

        group.animate('angle', randomAngle, {
            duration: 200, 
            onChange: canvas.renderAll.bind(canvas)
        });

        assignConfigToObject (group);

        canvas.add(group);
        canvasController.updateNoteCounters();
        canvasController.saveCanvas();
    }

    function assignConfigToObject (obj) {

        if (obj.type === 'group') {
            obj.set({
                originX: 'center',
                originY: 'top',
                hasControls: false,
                hasBorders: false,
                lockRotation: true,
                visible: true,
                cl: 'n'
            });
            obj.on('mousedblclick', editNote);
           
        } else if (obj.cl === 'd') {
            obj.set({
                hasControls: false,
                hasBorders: false,
                visible: true,
            });

            obj.on('mousedblclick', removeDot);
        } else if (obj.cl==='k') {
            obj.set({
                hasControls: false,
                hasBorders: false,
                lockRotation: true,
                selectable: false
            });
        } else if (obj.cl==='t') {
            obj.set({
                hasControls: true,
                hasBorders: true,
                lockRotation: false,
                selectable: true
            });
        } 
    }



    function onNewDot () {
        showNotes();

        canvasController.normalizeZIndex ();

        const colors = {
            red: {
                primary: '#ff0000',
                secondary: CanvasUtilities.darkenColor('#ff0000', 20)
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
            { offset: 0, color: colors[color].primary }, 
            { offset: 1, color:  colors[color].secondary }  
            ]
        });

        let separator1 = canvas.getObjects().find(obj => obj.id === 'sep1');
        let firstColWidth = separator1 ? separator1.left : canvas.width / 3; 
        let firstColHeight = separator1 ? separator1.height / 3 : canvas.height / 4;

        let randomLeft = Math.random() * (firstColWidth - 150) + 150; 
        let randomTop = Math.random() * (firstColHeight - 28) + 100; 

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
        canvasController.saveCanvas();
    }

    function isOverlapping(note, space, width, height) {
        return note.left < space.left + width && 
               note.left + note.width > space.left &&
               note.top < space.top + height &&
               note.top + note.height > space.top;
    }

    function editNote (opt) {

        let target = opt.target;
        if (!target.evented) return;

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
            splitByGrapheme: false,
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
        textForEditing.enterEditing();
        textForEditing.selectAll();

        textForEditing.on('editing:exited', () =>{
            let newVal = textForEditing.text;
            
            text.set({
                text: newVal,
                visible: true,
                splitByGrapheme: false
            });

            var centeredTop = rect.top + (rect.height - textForEditing.getScaledHeight()) / 2;
            text.set('top', centeredTop);

            target.addWithUpdate();
            
            textForEditing.visible = false;

            Data.sendCanvasObject({a:'tu', id: opt.target.id, d: newVal });

            canvas.remove(textForEditing);
            canvas.requestRenderAll();
            canvas.setActiveObject(target);
            canvasController.saveCanvas();
        })
    }

    
    
    var _clipboard;  

    function Copy() {
        var activeObject = canvas.getActiveObject();

        if (activeObject) {
            activeObject.clone(function(cloned) {
            _clipboard = cloned;
            });
        }
    }

    function Paste() {
        if (_clipboard) {
            _clipboard.clone(function(clonedObj) {
            canvas.discardActiveObject();
        
            clonedObj.set({
                left: clonedObj.left + 10, 
                top: clonedObj.top + 10,
                evented: true, 
            });
        
            if (clonedObj.type === 'activeSelection') {
                clonedObj.canvas = canvas;
                clonedObj.forEachObject(function(obj) {
                assignConfigToObject(obj);
                canvas.add(obj);
                });
                clonedObj.setCoords();
            } else {
                assignConfigToObject(clonedObj);
                canvas.add(clonedObj);
            }

            _clipboard.top += 10;
            _clipboard.left += 10;
        
            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();
            });
        }
        }
   
    function changeColor(color) {
       canvasController.changeColor(color);
    }

    async function switchDashboard(id, sharedId, initial) {
        
        if (!initial) { 
            $("#dashboard-number").stop(); 
            $("#dashboard-number").text(id); 
            $("#dashboard-number").fadeIn(100).delay(700).fadeOut(100);
        }

        currentCanvasId = id;
        sharedCanvasId = sharedId

        await loadCanvas(sharedCanvasId);

        canvasController.switchDashboard(currentCanvasId, sharedCanvasId, initial);
        Config.saveActiveDashboard(currentCanvasId,);

        notifyAllObservers();
    }

    function addObserver (observer) {
        observers.push(observer);
    }

    function notifyAllObservers () {
        observers.forEach(function(observer) {
            observer.update(currentCanvasId);
        });
    }

    function onKeyPress (e) {
        if (canvasController.isEditingMode()) return;

        if ((e.ctrlKey || e.metaKey) && !isNaN(e.key)) {
            let num = parseInt(e.key);
            if (num >= 1 && num <= 5) {
                switchDashboard(num);
                e.preventDefault();
            }
        } else if ((e.metaKey || e.ctrlKey) && (e.keyCode===67)) {
            Copy();
            e.preventDefault();
        } else if ((e.metaKey || e.ctrlKey) && (e.keyCode== 86)) {
            Paste();
            e.preventDefault();
        } else if (e.key === 'c') {
            if (canvas.isDrawingMode) { currentColorIndex = (currentColorIndex + 1) % 4; }
            canvasController.changeColor(currentColorIndex);
        } else if (e.key === 'e') {
            setEraserMode();
        } else if (e.key === 's') {
            canvasController.changeColor('selection');
        } else if (e.key === 'p') {
            canvasController.changeColor('pointer');
        } else if (e.key === 'k') {
            clearCanvas(); 
        } else if (e.key === 'h') {
            toggleNotesVisibility(); 
         } else if (e.key === 'f') {
            toggleFullscreen(); 
        } else if (e.key === 't') { 
            canvasController.changeColor('text');
        } else if (e.keyCode == 90 && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            Undo();
        } else if (e.keyCode == 89 && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            Redo();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            canvasController.deleteSelectedObjects();
            e.preventDefault();
        } else if (e.keyCode === 32) {
            defaultZoom();
            e.preventDefault();
        }
    };

    function clearAllCanvas() {

        const modal = document.querySelector('#modal-clearall');
        const close = document.querySelector('#modal-clearall #close');
        const confirm = document.querySelector('#modal-clearall #confirm');

        modal.classList.remove('hidden');

        function handleClose() {
            modal.classList.add('hidden');
            close.removeEventListener('click', handleClose);
            confirm.removeEventListener('click', handleConfirm);
        }

        function handleConfirm() {
            modal.classList.add('hidden');

            canvasController.reset();
            initKanbanBoard();
            adjustCanvasZoom(true);

            canvasController.saveCanvas();

            close.removeEventListener('click', handleClose);
            confirm.removeEventListener('click', handleConfirm);
        }

        close.addEventListener('click', handleClose);
        confirm.addEventListener('click', handleConfirm);
       
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
        canvasController.saveCanvas();
    }
      
    function Undo() {
        if (mods > 0) {
            canvas.loadFromJSON(state[mods - 1], function () {
                canvas.renderAll();
                mods--;
            });
        }
    }
    
    function Redo() {
        if (mods < state.length - 1) {
            canvas.loadFromJSON(state[mods + 1], function () {
                canvas.renderAll();
                mods++;
            });
        }
    }
   
    function initKanbanBoard() {

        canvasController.isLoading = true;

        let kanbanElements = canvas.getObjects().filter(obj => obj.cl === 'k');
        if (kanbanElements.length > 0) {
            return;
        }
        
        let separatorYPosition = 4000;
        let columnConfigurations =canvasController.getColumnConfiguration();
    
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

        if (currentCanvasId==1) createWelcomeNote();

        canvasController.isLoading = false;
    }
   
    async function loadCanvas(sharedId) {
        const font1 = new FontFace('Kalam', `url(${kalamFontURL})`);
        const font2 = new FontFace('PermanentMarker', `url(${permanentMarkerFontURL})`);

        const promesasDeCarga = [
            font1.load(),
            font2.load(),
        ];
    
        Promise.all(promesasDeCarga).then((fuentesCargadas) => {
            fuentesCargadas.forEach((fuente) => document.fonts.add(fuente));
    
            loadCanvasAsync(sharedId);
        }).catch((error) => {
            console.error("Error al cargar las fuentes", error);
        });
    }
            
    async function loadCanvasAsync(sharedId) {

        canvasController.isLoading = true;

        let storeCanvas = await Config.getCanvas(currentCanvasId, sharedId);

        currentColorIndex = storeCanvas.colorIndex;
        sharedCanvasId = storeCanvas.sharedCanvasId;
        canvasController.sharedCanvasId = sharedCanvasId;

        canvas.freeDrawingBrush.width = 4;
        canvas.freeDrawingBrush.color = CanvasUtilities.getColorByIndex(currentColorIndex);

        adjustCanvasZoom();

        if (storeCanvas.content) {
            var jsonString = storeCanvas.content;
            canvas.loadFromJSON(JSON.parse(jsonString), function() {
                canvas.forEachObject(function(obj) {
                    assignConfigToObject (obj);
                });
                canvas.requestRenderAll();
            });

            initKanbanBoard();
        }

        canvasController.isLoading = false;
    }

    function removeDot(e) {
        var object = e.target;
        canvas.remove(object);
    }

    function retrieveConfiguration(orientation) {
        
        const key = `c_${currentCanvasId}_${orientation}`;
        const savedConfiguration = localStorage.getItem(key);
        if (savedConfiguration) {
            return JSON.parse(savedConfiguration);
        }
        return null; 
    }

    function updatePositionRealTime (data)
    {
        const object = canvas.getObjects().find(obj => obj.id === data.id);

        if (!object) return;

        const updates = {};
        if (typeof data.l !== 'undefined') {
            updates.left = +data.l;
        }
        if (typeof data.t !== 'undefined') {
            updates.top = +data.t;
        }
        if (typeof data.w !== 'undefined') {
            updates.width = +data.w;
        }
        if (typeof data.sx !== 'undefined') {
            updates.scaleX = +data.sx;
        }
        if (typeof data.sy !== 'undefined') {
            updates.scaleY = +data.sy;
        }
        if (typeof data.an !== 'undefined') {
            updates.angle = +data.an;
        }
        
        if (Object.keys(updates).length > 0) {
            object.set(updates);
            object.setCoords();
        }

        canvasController.updateNoteCounters();
        canvas.requestRenderAll();
    }

    function removeObjectRealTime (id)
    {
        const object = canvas.getObjects().find(obj => obj.id === id);

        canvas.remove(object);

        canvasController.updateNoteCounters();
        canvas.requestRenderAll();
    }

    function updateTextRealTime (id, newVal)
    {
        const target = canvas.getObjects().find(obj => obj.id === id);
        var text = target.getObjects().find(obj => obj.type === 'textbox');
        var rect = target.getObjects().find(obj => obj.type === 'rect');

        text.set({text:newVal});

        var centeredTop = rect.top + (rect.height - text.getScaledHeight()) / 2;
            text.set('top', centeredTop);

        canvas.requestRenderAll();
    }

    function createShareSketch () {

        if (!sharedCanvasId) {
            sharedCanvasId = generateCompactGUID();
            canvasController.setSharedId(sharedCanvasId);
        }

        return sharedCanvasId;

    }

    function generateCompactGUID() {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
        });
    }

    function addObjectRealTime(data) {
    
        if (data.type==='group') {
            fabric.util.enlivenObjects(data.objects, function(objects) {
                var group = new fabric.Group(objects, {
                    left: data.left,
                    top: data.top,
                    id: data.id,
                    cl: data.cl
                    
                });
                group.set({virtual: true});
                assignConfigToObject(group);
                canvas.add(group);
                canvas.renderAll();
            });
        } else if (data.type === 'path') {
            fabric.Path.fromObject(data, function(path) {
                path.set({virtual: true});
                canvas.add(path);
                canvas.renderAll();
            });
        }

        
    }
    
    return { init, loadCanvas, clearCanvas, clearAllCanvas, toggleNotesVisibility, createWelcomeNote, 
        addObserver, notifyAllObservers, toggleFullscreen, loadCurrentDashboard, switchDashboard, changeColor, 
        addObjectRealTime, updatePositionRealTime, removeObjectRealTime, updateTextRealTime,
        createShareSketch };
})();

window.Sketch = Sketch;