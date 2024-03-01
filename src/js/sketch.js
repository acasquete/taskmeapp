import kalamFontURL from '../assets/fonts/Kalam-Regular.ttf';
import permanentMarkerFontURL from '../assets/fonts/PermanentMarker-Regular.ttf';
import { CanvasUtilities } from '../services/CanvasUtilities';
import { CanvasController } from '../services/CanvasController';
import { KanbanAdvisor } from '../services/KanbanAdvisor';

const Sketch = (function () {
    "use strict";
    const CANVAS_WIDTH = 2000;
    let canvas, currentColorIndex;
    let activeBoardIndex = 0; // Current Selected Board (1-5)
    let observers = []; 
    let canvasController;
    let kanbanAdvisor;
    let _clipboard;  

    async function init() {
        await initCanvas();
        assignDOMEventListeners();

        canvasController = new CanvasController(canvas);
        canvasController.assignCanvasEventListeners();
        kanbanAdvisor = new KanbanAdvisor();
    }

   async function initCanvas() { 
        console.debug('init canvas');

        if (canvas) canvas.dispose();
    
        canvas = new fabric.Canvas('c', { allowTouchScrolling: true, selection: false });

        resizeCanvas();

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', resizeCanvas);
        document.querySelector('#modal-clearall #close').addEventListener('click', handleClearClose);
        document.querySelector('#modal-clearall #confirm').addEventListener('click', handleClearConfirm);

        const font1 = new FontFace('Kalam', `url(${kalamFontURL})`);
        const font2 = new FontFace('PermanentMarker', `url(${permanentMarkerFontURL})`);

        let fontFace1 = await font1.load();
        let fontFace2 = await font2.load();

        document.fonts.add(fontFace1);
        document.fonts.add(fontFace2);
    }
    
    function resizeCanvas() {
        canvas.setWidth(window.innerWidth);
        canvas.setHeight(window.innerHeight);
        canvas.requestRenderAll();
    }

    async function loadBoard(boardGUID) {
        if (boardGUID) {
            console.debug ('load sharing board: ' + boardGUID);
            await loadCanvasAsync(boardGUID);
        } else {
            activeBoardIndex = Config.getActiveBoardIndex();
            await switchDashboard(activeBoardIndex, true);
        }
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
        console.debug('assign DOM events');
        document.addEventListener('keydown', onKeyPress);
        
        document.querySelectorAll(".new-small").forEach(element => {
            element.addEventListener('mousedown', onNew);
        });
        
        document.querySelectorAll('.new-normal').forEach(element => {
            element.addEventListener('mousedown', onNew);
        });
        
        document.querySelectorAll('.new-dot').forEach(element => {
            element.addEventListener('mousedown', onNewDot);
        });
    }

    function createWelcomeNote () {
        let colors = CanvasUtilities.getColors();
        
        var gradient = new fabric.Gradient({
            type: 'radial',
            coords: {
                x1: 450,
                y1: 250,
                x2: 450,
                y2: 250,
                r1: 60,
                r2: 900,
            },
            colorStops: [
            { offset: 0, color: colors['yellow'].primary }, 
            { offset: 1, color:  colors['yellow'].secondary } 
            ]
        });

        const content = `You're the best! Thanks for trying TaskMe, The Natural Kanban Board!\n\n 1. Create a note by selecting a color on the left of the screen. \n 2. Edit a note by double tapping on it. \n 3. Remove a note by dragging it to the top of the screen. \n\n(c)hange pen color - (e)raser - (k)lear board \n (h)ide notes - (f)ull screen - (s)election - (p)ointer\n [Ctrl]+1..5 Switch Board \n\n If you have any questions, ideas or suggestions, please feel free \n to contact me at x.com/acasquetenotes \n or open an issue on GitHub at github.com/acasquete/taskmeapp`;

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
            opacity: 1,
            cl: 'n',
            id: genId()
        });

        var centeredTop = square.top + (square.height - text.getScaledHeight()) / 2;
        text.set('top', centeredTop);

        group.on('mousedblclick', editNote);
        canvas.viewportCenterObject(group);
        canvas.add(group);
        
        canvasController.updateNoteCounters();
    }

    function genId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function onNew (event) {
        showNotes();

        canvasController.normalizeZIndex ();
        
        let colors = CanvasUtilities.getColors();

        let str = this.className;
        let regex = /new-(\w+)\s+(\w+)/;
        
        let matches = str.match(regex);
        
        let size = matches[1];
        let color = matches[2];

        var noteHeight = size === 'small' ? 75 : 150; 

        var gradient = new fabric.Gradient({
            type: 'radial',
            coords: {
                x1: noteHeight /2,
                y1: 0,
                x2: noteHeight/2,
                y2: noteHeight/2,
                r1: noteHeight * 1.1,
                r2: 0,
            },
            colorStops: [
            { offset: 0, color: colors[color].secondary }, // Color de inicio
            { offset: 1, color:  colors[color].primary }  // Color de fin
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
            lockScalingX: true,
            lockScalingY: true,
            opacity: 1,
            cl: 'n',
            subTargetCheck: true,
            id: genId(),
            force: true
        });

        const noteWidth = 150;
        const margin = 15;

        text.set({ top: square.top + (square.height - text.getScaledHeight()) / 2});

        let separator1 = canvas.getObjects().find(obj => obj.id === 'sep1');
        let separatorLeft = separator1 ? separator1.left : canvas.width;

        let notesInFirstCol = canvas.getObjects().filter(obj => obj.cl ==='n' && obj.left < separatorLeft);

        let newLeft = 150;
        let newTop = 150;
        let placed = false;

        let initY = Math.max(canvasController.getLastPositionY() - 80, 80);

        for (let top = initY; ; top += margin) {
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

        assignConfigToObject (group);

        canvas.add(group);

        canvasController.updateNoteCounters();
    }

    function  assignConfigToObject (obj) {

        if (obj.cl === 'n') {
            obj.set({
                originX: 'center',
                originY: 'top',
                hasControls: false,
                hasBorders: false,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                visible: true,
                cl: 'n',
                selectable: canvas.selection,
                evented: canvas.selection
            });
            obj.on('mousedblclick', editNote);
           
        } else if (obj.cl === 'd') {
            obj.set({
                originX: 'center',
                originY: 'center',
                hasControls: false,
                hasBorders: false,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                visible: true,
                selectable: canvas.selection,
                evented: canvas.selection
            });

            obj.on('mousedblclick', removeDot);
        } else if (obj.cl==='k' && obj.id.includes('sep')) {
            obj.set({
                hasControls: false,
                hasBorders: false,
                lockRotation: true,
                selectable: false,
                evented: true
            });
        } else if (obj.cl==='k' && obj.id.includes('col')) {
            obj.set({
                selectable: canvas.selection,
                evented: canvas.selection,
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingFlip: true,
                lockSkewingX: true,
                lockScalingY: true,
                lockSkewingY: true,
                lockSkewingX: true,
                hasControls: false,
                hasBorders: true,
            });
            
        } else if (obj.cl==='t') {
            obj.set({
                hasControls: true,
                hasBorders: true,
                lockRotation: false,
                selectable: canvas.selection,
                evented: canvas.selection
            });
        } 
    }

    function onNewDot () {
        showNotes();

        canvasController.normalizeZIndex ();

        const colors = {
            red: {
                primary: '#e93323',
                secondary: CanvasUtilities.darkenColor('#e93323', 20)
            },
            blue: {
                primary: '#1e4bda',
                secondary: CanvasUtilities.darkenColor('#1e4bda', 20)
            },
            green: {
                primary: '#01ab6f',
                secondary: CanvasUtilities.darkenColor('#01ab6f', 20)
            },
            yellow: {
                primary: '#fef639',
                secondary: CanvasUtilities.darkenColor('#fef639', 20)
            },
        };
        
        let str = this.className;
        let regex = /new-(\w+)\s+(\w+)/;
        
        let matches = str.match(regex);
        
        let color = matches[2];

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

        let randomLeft = Math.random() * 150 + 150; 
        let randomTop = Math.max(canvasController.getLastPositionY() - 20, 80) + (Math.random() * 80);

        var circle = new fabric.Circle({
            left: randomLeft, 
            top: randomTop,  
            radius: 14,
            fill: gradient,
            shadow: 'rgba(0,0,0,0.6) 0px 0px 3px',
            hasControls: false, 
            hasBorders: false,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            cl: 'd',
            selectable: canvas.selection,
            evented: canvas.selection,
            force: true
        });

        circle.on('mousedblclick', removeDot);
        canvas.add(circle);
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

            _clipboard.top += 15;
            _clipboard.left += 15;
        
            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();
            });
        }
        }
   
    function changeColor(color) {
       canvasController.changeColor(color);
    }

    async function switchDashboard(boardIndex, initial) {
        
        if (!initial) { 
            document.getElementById("dashboard-number").textContent = boardIndex;
            document.getElementById("dashboard-number").style.display = 'block';
            setTimeout(() => {
                document.getElementById("dashboard-number").style.display = 'none';
            }, 700);

            console.debug('force save canvas before switch');
            await canvasController.saveCanvas(true);
        }

        activeBoardIndex = boardIndex;

        await loadCanvasAsync();
    }

    function addObserver (observer) {
        observers.push(observer);
    }

    function notifyAllObservers () {
        observers.forEach(function(observer) {
            observer.update(activeBoardIndex);
        });
    }

    function onKeyPress (e) {
        if (canvasController.isEditingMode() || MenuController.isModalOpen()) return;

        if ((e.ctrlKey || e.metaKey) && !isNaN(e.key)) {
            let num = parseInt(e.key);
            if (num >= 1 && num <= 5) {
                switchDashboard(num, '', false);
                e.preventDefault();
            }
        } else if ((e.metaKey || e.ctrlKey) && (e.keyCode===67)) {
            Copy();
            e.preventDefault();
        } else if ((e.metaKey || e.ctrlKey) && (e.keyCode== 86)) {
            Paste();
            e.preventDefault();
        } else if (e.key.toLowerCase() === 'c') {
            if (canvas.isDrawingMode) { currentColorIndex = (currentColorIndex + 1) % 4; }
            canvasController.changeColor(currentColorIndex);
            MenuController.setOption('pen-picker');
        } else if (e.key.toLowerCase() === 'e') {
            MenuController.setOption('eraser-picker');
            canvasController.changeColor('eraser');
        } else if (e.key.toLowerCase() === 's') {
            MenuController.setOption('selection-picker');
            canvasController.changeColor('selection');
        } else if (e.key.toLowerCase() === 'h') {
            MenuController.setOption('pointer-picker');
            canvasController.changeColor('pointer');
        } else if (e.key.toLowerCase() === 'k') {
            clearCanvas(); 
        } else if (e.key.toLowerCase() === 'v') {
            toggleNotesVisibility(); 
         } else if (e.key.toLowerCase() === 'f') {
            toggleFullscreen(); 
        } else if (e.key.toLowerCase() === 't') { 
            MenuController.setOption('text-picker');
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
        modal.classList.remove('hidden');
    };

    function handleClearClose() {
        const modal = document.querySelector('#modal-clearall');
        modal.classList.add('hidden');
    }

    function handleClearConfirm() {

        canvasController.isLoading = true;

        const modal = document.querySelector('#modal-clearall');
        modal.classList.add('hidden');

        canvasController.reset();
        initKanbanBoard();
        adjustCanvasZoom(true);
        canvasController.saveCanvas();

        canvasController.isLoading = false;
    }

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
        canvasController.isLoading = true;
        
        for (let i = canvas.getObjects().length - 1; i >= 0; i--) {
            let obj = canvas.item(i);
            if (obj.type === 'path' || obj.cl === 'd') {
                canvasController.DeleteObject(obj);
            }
        }
        canvasController.saveCanvas();
        canvasController.isLoading = false;
    }
      
    function Undo() {
        debug.info('not implemented');
        return;
        canvasController.undo();
        canvas.forEachObject(function(obj) {
            assignConfigToObject (obj);
        });
    }
    
    function Redo() {
        debug.info('not implemented');
        return;
        canvasController.redo();
        canvas.forEachObject(function(obj) {
            assignConfigToObject (obj);
        });
    }
   
    function initKanbanBoard() {

        let kanbanElements = canvas.getObjects().filter(obj => obj.cl === 'k');
        if (kanbanElements.length > 0) {
            console.debug('init existing kanban board');
            return;
        }
        
        console.debug('init new kanban board');

        let separatorYPosition = 4000;
        let columnConfigurations = canvasController.getDefaultColumnConfiguration();
    
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
                selectable: true,
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingFlip: true,
                lockSkewingX: true,
                lockScalingY: true,
                lockSkewingY: true,
                lockSkewingX: true,
                hasControls: false,
                hasBorders: true,
                width: columnWidth,
                textAlign: 'center',
                id: 'col' + column.id,
                editable: true,
                cl: 'k'
            });
    
            canvas.add(text);
    
            let separator = new fabric.Line([currentLeft + columnWidth, 0, currentLeft + columnWidth, separatorYPosition], {
                stroke: 'gray',
                selectable: false,
                strokeWidth: 6,
                cl: 'k',
                id: 'sep' + column.id
            });

            canvas.add(separator);
    
            currentLeft += columnWidth;
        });

        if (activeBoardIndex===1) createWelcomeNote();
    }
           
    async function loadCanvasAsync(guid) {
        canvasController.isLoading = true;

        let storeCanvas;

        if (guid) {
            storeCanvas = await Config.getRemoteCanvas(guid);
            if (!storeCanvas) {
                Notifications.showAppNotification ('You need to log in to access a shared dashboard', 'regular', 8000);
                return;
            }
        } else {
            storeCanvas = await Config.getCanvas(activeBoardIndex);
        }

        currentColorIndex = storeCanvas.colorIndex;
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
        }

        if (storeCanvas.isnew) {
            initKanbanBoard();
        }

        canvasController.switchDashboard(activeBoardIndex, storeCanvas);
        
        Config.saveActiveBoardIndex(activeBoardIndex);

        notifyAllObservers();

        canvasController.isLoading = false;
    }

    function removeDot(e) {
        var object = e.target;
        canvas.remove(object);
    }

    function retrieveConfiguration(orientation) {
        const key = `c_${activeBoardIndex}_${orientation}`;
        const savedConfiguration = localStorage.getItem(key);
        if (savedConfiguration) {
            return JSON.parse(savedConfiguration);
        }
        return null; 
    }

    function download (format) {
        let stages = canvasController.getStagesColumnsConfiguration();
        let lastId = stages[stages.length-1].id;

        let sepLeft = canvas.getObjects().find(obj => obj.id === 'sep' + lastId);

        let cvpt = canvas.viewportTransform;
        let czoom = canvas.getZoom();

        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.setZoom(1);

        var imageDataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            width: sepLeft.left,
            height: 2000,
            left: 0,
            top: 0
        });

        var link = document.createElement('a');
        link.href = imageDataURL;
        link.download = 'canvas-image.png'; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        canvas.setZoom(czoom);
        canvas.setViewportTransform(cvpt);
    }

    function openOption (option) {
        canvasController.openOption(option);
    }

    /* TODO: Refactor AI methods */
    async function nextAdvice () {
        const kanbanContent = getKanbanContent();
         
        let recommendations = await kanbanAdvisor.getProductivityRecommendations(kanbanContent)
        let jsonRecommendation = JSON.parse(recommendations);

        if (jsonRecommendation.response) {
            Notifications.showAppNotification(jsonRecommendation.response, 'small', 30000);
        }
    }

    function getKanbanContent () {
        let separators = [];
        let columns = [];
        let notas = canvas.getObjects().filter(obj => {
            if (obj.id && obj.id.includes('sep')) {
                separators.push(obj);
            }
            return obj.cl === 'n';
        });

        for (let i = 0; i < separators.length; i++) {
        let inicioSep = i === 0 ? 0 : separators[i-1].left;
        let finSep = separators[i].left;
        let colTitle = canvas.getObjects().find(obj => obj.id === `col${i+1}`)?.text || `Stage ${i+1}`;
        let colTitleCleaned = colTitle.includes(" - ") ? colTitle.split(" - ")[0] : colTitle;

        let items = notas.filter(nota => {
            let posNota = nota.left + nota.width / 2; 
            return posNota > inicioSep && posNota < finSep;
        }).map(nota => {
            let noteText = nota._objects.find(obj => obj.type === 'textbox')?.text;
            let rectWithGradient = nota._objects.find(obj => obj.type === 'rect' && obj.fill instanceof fabric.Gradient);
            let gradientColor = rectWithGradient ? rectWithGradient.fill.colorStops[0].color : 'defaultColor';
            let dots = nota._objects.filter(obj => obj.type === 'circle').length;

            return {
                text: noteText,
                color: gradientColor,
                dots: dots
            };
        });

        columns.push({
            name: colTitleCleaned,
            notes: items
        });
        }

        return columns;
    }

    /* TODO: Refactor Real-time methods */

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
            canvas.bringToFront(object);
        }
        
        canvasController.updateNoteCounters();
        canvas.requestRenderAll();
    }

    function removeObjectRealTime(idOrArray) {
        if (Array.isArray(idOrArray)) {
            idOrArray.forEach(id => {
                removeSingleObject(id); 
            });

            canvasController.organizeCanvasObjects();


        } else {
            removeSingleObject(idOrArray); 
        }
    }

    function removeSingleObject(id) {
        console.debug('remove object #' + id);

        const object = canvas.getObjects().find(obj => obj.id === id);

        if (object) { 
            canvas.remove(object);

            if (object.cl !== 'k') {
                canvasController.updateNoteCounters();
            }
            canvas.requestRenderAll();
        }
    }

    function updateNoteRealTime (id, newVal)
    {
        const target = canvas.getObjects().find(obj => obj.id === id);
        var text = target.getObjects().find(obj => obj.type === 'textbox');
        var rect = target.getObjects().find(obj => obj.type === 'rect');

        text.set({text:newVal});

        var centeredTop = rect.top + (rect.height - text.getScaledHeight()) / 2;
            text.set('top', centeredTop);

        canvas.requestRenderAll();
    }

    function updateTextControlRealTime (id, newVal)
    {
        const target = canvas.getObjects().find(obj => obj.id === id);

        target.set({text:newVal});

        canvas.requestRenderAll();
    }

    async function createShareSketch () {
        return await canvasController.ensureShareBoard();
    }

    function addObjectRealTime(data) {
        console.debug(data.type);
    
        if (data.type==='group') {
            fabric.util.enlivenObjects(data.objects, function(objects) {
                var group = new fabric.Group(objects, {
                    left: data.left,
                    top: data.top,
                    id: data.id,
                    cl: data.cl
                    
                });
                group.set({virtual: true});
                canvas.add(group);
                assignConfigToObject(group);
                canvas.renderAll();
            });
        } else if (data.type === 'path') {
            fabric.Path.fromObject(data, function(obj) {
                obj.set({virtual: true});
                canvas.add(obj);
                assignConfigToObject(obj);
                canvas.renderAll();
            });
        } else if (data.type === 'i-text') {
            console.debug('new text');
            fabric.IText.fromObject(data, function(obj) {
                obj.set({virtual: true});
                canvas.add(obj);
                assignConfigToObject(obj);
                canvas.renderAll();
            });
        } else if (data.type === 'textbox') {
            console.debug('new text');
            fabric.Textbox.fromObject(data, function(obj) {
                obj.set({virtual: true});
                canvas.add(obj);
                assignConfigToObject(obj);
                canvas.renderAll();
            });
        } else if (data.type === 'line') {
            console.debug('new line');
            fabric.Line.fromObject(data, function(obj) {
                obj.set({virtual: true});
                canvas.add(obj);
                assignConfigToObject(obj);
                canvas.renderAll();
            });
        } else if (data.type === 'circle') {
            console.debug('new circle');
            fabric.Circle.fromObject(data, function(obj) {
                obj.set({virtual: true});
                canvas.add(obj);
                assignConfigToObject(obj);
                canvas.renderAll();
            });
        }
    }

    function clearBoardRealTime () {
        handleClearConfirm();
    }
    
    return { init, clearCanvas, clearAllCanvas, toggleNotesVisibility, createWelcomeNote, 
        addObserver, notifyAllObservers, toggleFullscreen, loadBoard, switchDashboard, changeColor, 
        addObjectRealTime, updatePositionRealTime, removeObjectRealTime, updateNoteRealTime,
        createShareSketch, handleClearClose, nextAdvice, download, updateTextControlRealTime, openOption,
        clearBoardRealTime };
})();

window.Sketch = Sketch;