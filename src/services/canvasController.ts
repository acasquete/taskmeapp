import { CanvasUtilities } from './canvasUtilities';
import { Config } from './configService';
import { CanvasHistory } from './canvasHistory';
import { Object } from 'fabric/fabric-impl';

export class CanvasController {
    
    private canvas: fabric.Canvas;
    public isLoading: boolean = true;
    private isEditKanbanMode: boolean = false;
    private isEraserMode: boolean = false;
    private targetElement!: fabric.Object | null;
    private originalPosition: { x: number } = { x: 0 };
    private sepInitPositions: number[] = [];
    private pausePanning: boolean = false;
    private currentX: number = 0;
    private currentY: number = 0;
    private lastX: number = 0;
    private lastY: number = 0;
    private xChange: number = 0;
    private yChange: number = 0;
    private zoomStartScale: number = 0;
    private currentColorIndex: number = 0;
    private currentCanvasId: number = 0;
    private sharedCanvasId: string = '';
    private isTextMode = false;
    private shouldCancelMouseDown = false;
    private circleToDrag: fabric.Object | null = null;
    private isDraggingDot: boolean = false;
    private canvasHistory : CanvasHistory;
    private lastTap = 0;
    private lastPY = 0;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
        this.canvasHistory = new CanvasHistory(canvas);
    }

    public reset () {
        this.canvas.clear();
    }

    isSeparatorElement(object: fabric.Object) : boolean {
        return object.cl === 'k' && object.id?.startsWith('sep');
    }

    public switchDashboard(id: number, initial: boolean) {
        this.currentCanvasId = id;
    }

    private triggerDblClick(event: MouseEvent | TouchEvent) {
        const dblClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 2
        });
      
        if (event.target) {
          (event.target as HTMLElement).dispatchEvent(dblClickEvent);
          event.stopPropagation();
        }
    }

    private isTouchDevice(): boolean {
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    }

    public assignCanvasEventListeners(): void {
        
        this.canvas.on('mouse:over', (e: fabric.IEvent) => {
            const object = e.target;
            if (object && this.isSeparatorElement(object)) {
                object.set('stroke', 'green');
                this.canvas.renderAll();
            }
        });

        this.canvas.on('mouse:out', (e: fabric.IEvent) => {
            const object = e.target;
            if (object && this.isSeparatorElement(object)) {
                object.set('stroke', 'gray');
                this.canvas.renderAll();
            }
        });

        this.canvas.on('mouse:down:before', (options: fabric.IEvent) => {
            this.shouldCancelMouseDown = this.isEditingMode();
        });

        this.canvas.on('mouse:down', (options: fabric.IEvent) => {
            const DOUBLE_TAP_DELAY = 300;

            let target = this.canvas.findTarget(options.e);

            if (this.isTouchDevice() && target && target.type === 'group' && target.cl === 'n') {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - this.lastTap;
                if (tapLength < DOUBLE_TAP_DELAY && tapLength > 0) {
                    this.triggerDblClick(options.e);
                }
                this.lastTap = currentTime;
            }

            if (this.shouldCancelMouseDown) {
                this.shouldCancelMouseDown = false;
                return;
            }

            const pointer = this.canvas.getPointer(options.e);

            if (target && target.type==='group') {
           
                
                const group = options.target;
                
                target.forEachObject((obj) => {

                    if (obj.cl === 'd') {

                    const objLeft =  target.left + obj.left;
                    const objTop =target.top + obj.top + (target.height/2);
                    const objWidth = obj.width;
                    const objHeight = obj.height;
                    
                    if (pointer.x >= objLeft - (obj.width/2) && pointer.x <= objLeft + (objWidth/2) &&
                        pointer.y >= objTop - (obj.height/2)  && pointer.y <= objTop + (objHeight/2)) {

                        target.lockMovementX =  true;
                        target.lockMovementY = true;

                        this.canvas.requestRenderAll();

                        obj.clone( (cloned)=> {

                            cloned.set({
                                left: pointer.x,
                                top: pointer.y,
                                hasControls: false,
                                hasBorders: false,
                                cl: 'd',
                                visible: true,
                                parent: target.id,
                                originX: 'center',
                                originY: 'center',
                            });
                            
                            group.removeWithUpdate(obj);
                            this.circleToDrag = cloned;

                            this.canvas.add(cloned);
                            this.canvas.bringToFront(cloned);
                            this.canvas.renderAll();
                            
                            options.e.stopPropagation();

                            this.isDraggingDot = true;
                        });

                        }
                }
                });
            }   
            
            if (this.isTextMode && target == undefined) {
                this.addTextObject(options);
            } if (this.isEraserMode) {
                this.deleteSelectedObjects();
            } else if (target && this.isSeparatorElement(target)) {
                
                this.isEditKanbanMode = true;
                this.canvas.selection = false;
                this.targetElement = target;
                this.targetElement.selectable = false;
                this.originalPosition = { x: target.left || 0 };
                this.sepInitPositions = this.getSeparatorsPositionsArray(); 

                
            }
        });

        this.canvas.on('mouse:move', (options: fabric.IEvent) => {
            
            let pointer = this.canvas.getPointer(options.e, false);

            this.lastPY=pointer.y;

            if (this.isDraggingDot && this.circleToDrag) {
                this.circleToDrag.set({
                    left: pointer.x,
                    top: pointer.y,
                });
            } else if (this.isEditKanbanMode && this.targetElement) {
               
                let currentIdTarget = parseInt( this.targetElement.id.replace(/[^\d]/g, ''), 10);
                let prevIdTarget = currentIdTarget == 1 ? '' : 'sep' + (currentIdTarget - 1);
                let prevTargetLeft = prevIdTarget =='' ? 0 : this.getObjectById(prevIdTarget)?.left;

                let deltaX = pointer.x - this.originalPosition.x;

                if (this.targetElement.left-prevTargetLeft+deltaX > 400 ) {
                    this.targetElement.set({left: pointer.x });
                    this.moveRelatedElements (pointer.x, this.targetElement.id, deltaX);
                }
            } 

            this.canvas.requestRenderAll();
        });

        this.canvas.on('mouse:up', (options: fabric.IEvent) => {
            
            this.isEditKanbanMode = false;
            
            if (this.isDraggingDot) {
                let parentNoteId = this.circleToDrag.parent;
                let noteObj = this.getObjectById (parentNoteId);

                noteObj.set({
                    lockMovementX: false,
                    lockMovementY: false
                });

                this.canvas.requestRenderAll()
                this.isDraggingDot = false;
            }

            if (this.targetElement) {
                //Kludge to force refresh
                this.canvas.relativePan(new fabric.Point(1, 0));
                this.canvas.relativePan(new fabric.Point(-1, 0));
                this.saveCanvas();
            }
            
        });

        this.canvas.on('mouse:wheel', (opt: fabric.IEvent) => {
            let zoom = this.canvas.getZoom();
            const evt = opt.e as WheelEvent; 

            if (evt.ctrlKey) {
                const deltaY = evt.deltaY;
                zoom -= deltaY / 400;
                zoom = Math.max(0.2, Math.min(3, zoom)); 
                this.canvas.zoomToPoint(new fabric.Point(evt.offsetX, evt.offsetY), zoom);
            } else {
                const deltaX = -evt.deltaX;
                const deltaY = -evt.deltaY;

                const currentX = this.canvas.viewportTransform ? this.canvas.viewportTransform[4] : 0;
                const currentY = this.canvas.viewportTransform ? this.canvas.viewportTransform[5] : 0;

                const newX = currentX + deltaX;
                const newY = currentY + deltaY;

                this.canvas.relativePan(new fabric.Point(newX - currentX, newY - currentY));
            }
            
            this.saveViewPortConfiguration();
            evt.preventDefault();
            evt.stopPropagation();
        });

        this.canvas.on('touch:gesture', (e: any) => { 
            if (e.e.touches && e.e.touches.length === 2) {
                this.pausePanning = true;
                const point = new fabric.Point(e.self.x, e.self.y);
                if (e.self.state === "start") {
                    this.zoomStartScale = this.canvas.getZoom();
                }
                const delta = this.zoomStartScale! * e.self.scale;
                this.canvas.zoomToPoint(point, delta);
                this.pausePanning = false;
                this.saveViewPortConfiguration();
            }
        });

        this.canvas.on('object:selected', () => {
            this.pausePanning = true;
        });

        this.canvas.on('selection:cleared', () => {
            this.pausePanning = false;
            this.updateNoteCounters();
        });

        this.canvas.on('touch:drag', (e: fabric.IEvent) => {
            if (this.isEditKanbanMode || this.canvas.selection || this.canvas.isDrawingMode || this.pausePanning || e.e.layerX === undefined || e.e.layerY === undefined) {
                
                if (e.e.layerX === undefined && e.e.layerY === undefined) {
                    this.lastX = 0;
                    this.lastY = 0;
                    this.pausePanning = false;
                }
                return;
            }
            
            const target = this.canvas.findTarget(e.e, true);
            if (target && ((target.cl && ['n', 'd', 't'].includes(target.cl)) || target.type === 'path')) {
                this.pausePanning = true;
                return;
            }
        
            const updateCoordinates = (axis: 'X' | 'Y') => {
                const current = e.e[`layer${axis}`];
                const last = this[`last${axis}`] || current; 
                this[`current${axis}`] = current;
                return current - last;
            };
        
            this.xChange = updateCoordinates('X');
            this.yChange = updateCoordinates('Y');
        
            const panTo = new fabric.Point(this.xChange, this.yChange);
            this.canvas.relativePan(panTo);
            this.saveViewPortConfiguration();
        
            this.lastX = this.currentX;
            this.lastY = this.currentY;

        });

        
        this.canvas.on('object:scaling', this.onUpdatingObject.bind(this));
        this.canvas.on('object:moving', this.onUpdatingObject.bind(this));
        this.canvas.on('object:rotating', this.onUpdatingObject.bind(this));
        
        this.canvas.on('object:removed', () => {
            if (this.isLoading) return;
            this.canvasHistory.saveHistory()
        } );

        this.canvas.on('object:added', (event: fabric.IEvent) => {
            if (this.isLoading) return;

            const addedObject = event.target;
            if (!addedObject) return;

            this.handleNewStage(addedObject);
            this.assignUniqueIdToAddedObject(addedObject);
            this.sendObjectData(addedObject);

            this.canvasHistory.saveHistory();
        });
        
        this.canvas.on('object:modified', (event: fabric.IEvent) => {
            if (this.isLoading) return;

            const movedObject = event.target;
        
            // Drag and drop for "Dots"
            if (movedObject && movedObject.cl === 'd') {
                this.canvas.forEachObject((obj) => {
                    if (obj.cl === 'n' && obj.type === 'group' && checkIntersection(movedObject, obj)) {
                        this.canvas.remove(movedObject);
                        (obj as fabric.Group).addWithUpdate(movedObject);
                        this.canvas.renderAll();
                    }
                });
            }

            const activeObject = event.target;
            if (activeObject && activeObject.type === 'group') {
                this.canvas.bringToFront(activeObject);

                // Delete notes 
                if (activeObject.top && activeObject.top < 10) {
                    activeObject.evented = false;
                    activeObject.animate({
                        top: activeObject.top - 250,
                        opacity: 0
                    }, { 
                        duration: 500,
                        easing: fabric.util.ease.easeOutExpo,
                        onChange: () => this.canvas.renderAll(),
                        onComplete: () => {
                            this.canvas.remove(activeObject);
                            this.normalizeZIndex();
                            this.saveCanvas();
                        }
                    });
                    return;
                }
            }

            this.normalizeZIndex();
            this.saveCanvas();

            this.canvasHistory.saveHistory();
        });

        function checkIntersection(obj1: fabric.Object, obj2: fabric.Object): boolean {
            // Obtener bounding rects para comparar
            const obj1BoundingRect = obj1.getBoundingRect();
            const obj2BoundingRect = obj2.getBoundingRect();
        
            // Comprobar si hay intersección
            return (
                obj1BoundingRect.left < obj2BoundingRect.left + obj2BoundingRect.width &&
                obj1BoundingRect.left + obj1BoundingRect.width > obj2BoundingRect.left &&
                obj1BoundingRect.top < obj2BoundingRect.top + obj2BoundingRect.height &&
                obj1BoundingRect.top + obj1BoundingRect.height > obj2BoundingRect.top
            );
        }
    }

    private handleNewStage(addedObject: fabric.Object): void {
        const path = addedObject.path;

        if (!path) return;
    
        const zoom = this.canvas.getZoom();
        const boundingRect = addedObject.getBoundingRect();
        
        if (this.shouldAddNewStage(boundingRect, zoom, addedObject?.left)) {
            console.debug('new stage added');
            const newStage = this.createNewStage();
            this.addStageToCanvas(newStage, addedObject?.left);
            this.canvas.remove(addedObject);
            this.saveCanvas();
        }
    }
    
    private shouldAddNewStage(boundingRect: fabric.IRect, zoom: number, left: number): boolean {
        
        let stagesConfig = this.getStagesColumnsConfiguration();

        let lastSep = this.getObjectById('sep' + stagesConfig.length);

        let prop = (boundingRect.width / zoom) / (boundingRect.height / zoom);

        console.debug('hand stage, p:' +  (boundingRect.width / zoom) / (boundingRect.height / zoom) + ' w:' + boundingRect.width / zoom + ' h:' + boundingRect.height / zoom + ' l:' + lastSep?.left);

        return (
            prop < 20 &&
            left > lastSep?.left
        );
    }
    
    private createNewStage(): ColumnConfiguration {
        const stagesConf = this.getStagesColumnsConfiguration();
        const newNumber = stagesConf.length + 1 || 1;
        const newTitle = 'Stage ' + newNumber;
        
        return {
            id: newNumber,
            title: newTitle,
            count: 0,
            proportion: 0.3
        };
    }
    
    private addStageToCanvas(newStage: ColumnConfiguration, positionLeft: number): void {
        let lastSep = this.getObjectById('sep' + (newStage.id - 1));
        this.addStage(newStage, lastSep?.left, Math.max(400, positionLeft-lastSep?.left));
    }
    
    private assignUniqueIdToAddedObject(addedObject: fabric.Object): void {
        if (addedObject.virtual) return;
        const uniqueId = this.genId();
        if (!addedObject.id) addedObject.set({ id: uniqueId });
    }
    
    private sendObjectData(addedObject: fabric.Object): void {
        const objData = addedObject.toJSON(['id', 'virtual', 'left', 'top']);
        Data.sendCanvasObject({ a: 'oa', d: JSON.stringify(objData) });
    }

    private addStage (column: ColumnConfiguration, left: number, width: number) {
        let separatorYPosition = 4000;
    
        let text = new fabric.Textbox(column.title, {
                originX: 'left',
                left: left,
                top: 10,
                fontSize: 30,
                fontWeight: 'bold',
                fontFamily: 'PermanentMarker',
                width: width,
                textAlign: 'center',
                id: 'col' + column.id,
                selectable: true,
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingFlip: true,
                lockSkewingX: true,
                lockScalingY: true,
                lockSkewingY: true,
                hasControls: false,
                hasBorders: true,
                cl: 'k'
            });
    
            this.canvas.add(text);
    
            let separator = new fabric.Line([left + width, 0, left + width, separatorYPosition], {
                stroke: 'gray',
                selectable: false,
                strokeWidth: 6,
                cl: 'k',
                id: 'sep' + column.id
            });

            this.canvas.add(separator);
    }

    genId() : string {
        return Math.random().toString(36).substr(2, 9);
    }

    public addTextObject (e: fabric.IEvent) {

        var pointer = this.canvas.getPointer(e);

        var text = new fabric.IText('Start typing...', {
            originX: 'left',
            originY: 'top',
            fontSize: 36,
            fontFamily: 'Kalam',
            textAlign: 'center',
            fill: 'black',
            left: pointer.x,
            top: pointer.y,
            lockSkewingX: true,
            lockSkewingY: true,
            cl: 't',
            id: this.genId()
          });

        
        this.canvas.add(text);
        
        this.canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();

        this.saveCanvas();
    }

    public isEditingMode(): boolean {
        const objects = this.canvas.getObjects();
    
        const isEditing = objects.some((obj: fabric.Object) => {
            return (
                (obj.type === 'textbox' || obj.type === 'i-text') &&
                (obj as fabric.IText).isEditing === true
            );
        });

        return isEditing;
    }

    private onUpdatingObject (e: fabric.IEvent) {

        const obj = e.target as fabric.Object & { cl?: string };
        
        let objectData = { 
            id: obj.id, 
            l: obj.left?.toFixed(2), 
            t: obj.top?.toFixed(2), 
            sx: obj.scaleX?.toFixed(2),
            sy: obj.scaleY?.toFixed(2),
            an: obj.angle?.toFixed(2),
            a: 'om' 
        };
            
        Data.sendCanvasObject(objectData);

        if (obj && obj.cl === 'n') {
            this.updateNoteCounters();
        }
    }

    public saveViewPortConfiguration(): void {
        const zoom = this.canvas.getZoom();
        const viewPortTransform = this.canvas.viewportTransform;
        const orientation: string = CanvasUtilities.getUserOrientation();
    
        const key: string = `c_${this.currentCanvasId}_${orientation}`;
        const configuration: { zoom: number; vpt: any } = {
            zoom: zoom,
            vpt: viewPortTransform,
        };
        localStorage.setItem(key, JSON.stringify(configuration));
    }

    public moveRelatedElements(leftPosition: number, id: string, deltaX: number): void {
        const movedIndex: number = parseInt(id.replace(/[^\d]/g, ''), 10);
        this.canvas.forEachObject((obj: fabric.Object) => {
            const objId = obj.id;
            if (objId && objId.startsWith('sep')) {
                const objIndex: number = parseInt(objId.replace(/[^\d]/g, ''));

                if (objIndex > movedIndex && objId !== id) {
                    obj.set({
                        left: this.sepInitPositions[objIndex - 1] + deltaX,
                    });
                }
            } else if ( obj.cl == 'n') {
                if (obj.left > leftPosition) {
                    obj.set({
                        left: obj.initleft + deltaX, 
                    });
                }
            }
        });

        this.adjustColumns();
        this.canvas.renderAll();
    }

    deleteSelectedObjects(): void {
        const activeObject = this.canvas.getActiveObject();
      
        if (!activeObject) {
          return;
        }
      
        if (activeObject.type === 'activeSelection') {
          activeObject.forEachObject((object: fabric.Object) => {
            this.DeleteObject(object);
          });
        } else {
           this.DeleteObject(activeObject);
        }
      
        this.saveCanvas();
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();
      }

    private DeleteObject (object: fabric.Object) {
        if (object.cl==='k' && object.id.includes('col')) return;
        
        Data.sendCanvasObject({a:'do', d: object.id })
        this.canvas.remove(object);
    }

    public adjustColumns(): void {
        const cols = this.canvas.getObjects().filter(obj => obj.id && obj.id.startsWith('col'));

        let colData: any[] = [];
        
        cols.forEach((col, index) => {
            const minColumnWidth = 400;
            const sepLeft = index === 0 ? 0 : (this.getObjectById('sep' + index) as fabric.Object).left as number;
            const nextSep = this.getObjectById('sep' + (index + 1)) as fabric.Object;
            let nextSepLeft = nextSep ? nextSep.left as number : this.canvas.width as number;

            if (nextSepLeft - sepLeft < minColumnWidth) {
                nextSep.set({ left: sepLeft + minColumnWidth });
                nextSepLeft = nextSep.left as number;
            }

            col.set({ 
                left: sepLeft,
                width: nextSepLeft - sepLeft
            });

            colData.push({i: (index +1 ), l: sepLeft.toFixed(2), w: col.width?.toFixed(2) });
           
        });
    
        if (this.isEditKanbanMode) {
            Data.sendCanvasObject({a: 'cm', d: JSON.stringify(colData) });
        }

        this.updateNoteCounters();
        this.canvas.requestRenderAll();
    }

    private getObjectById(id: string): fabric.Object | undefined {
        return this.canvas.getObjects().find(obj => obj.id === id);
    }

    public getSeparatorsPositionsArray(): number[] {
        const separatorsPositions: number[] = [];
        const objects = this.canvas.getObjects();

        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            if (this.isSeparatorElement(object)) {
                separatorsPositions.push(object.left || 0);
            } else if (object.cl == 'n') {
                object.set('initleft', object.left);
            }
        }

        return separatorsPositions;
    }

    public toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    private updateNoteCounters(): void {
        const stageConf = this.getStagesColumnsConfiguration();

        if (stageConf.length==0) return;

        const separators: fabric.Object[] = this.canvas.getObjects().filter(obj => (obj as any).id && (obj as any).id.startsWith('sep'));
        
        stageConf.forEach(stage => { stage.count = 0; });

        this.canvas.getObjects().forEach(obj => {
            if ((obj as any).cl === 'n') {
                const columnIndex: number = separators.findIndex(sep => sep && (obj.left || 0) < (sep.left || 0));
                
                if (columnIndex > -1) {
                    stageConf[columnIndex].count++;
                }
            }
        });
        
        stageConf.forEach(column => {
            this.updateColumnTitle(column.id, column.count);
            let titleColumn = this.canvas.getObjects().find(obj => obj.id === 'col' + column.id) as fabric.Text;
            
            if (titleColumn.text?.toLowerCase().includes('in progress') && column.count > 3) {
                this.setColorForColumn(column.id, '#ef3340');
            } else {
                this.setColorForColumn(column.id, 'default');
            }
        });
    }

    public setColorForColumn(columnId: number, color: string): void {
        const columnTitle = this.canvas.getObjects().find(obj => obj.id === 'col' + columnId) as fabric.Text;

        if (columnTitle) {
            columnTitle.set('fill', color === 'default' ? 'black' : color); 
            this.canvas.requestRenderAll();
        }
    }

    public updateColumnTitle(columnId: number, counter: number): void {
        const column = this.canvas.getObjects().find(obj => obj.id === 'col' + columnId) as fabric.Text;
        
        if (column) {
            const baseText = column.text?.split(' - ')[0];
            column.text = counter > 0 ? `${baseText} - ${counter}` : baseText;
            this.canvas.requestRenderAll();
        }
    }

    public getDefaultColumnConfiguration(): ColumnConfiguration[] {
        return [
            { id: 1, title: 'Todo', count: 0, proportion: 0.35 },
            { id: 2, title: 'In Progress', count: 0, proportion: 0.35 },
            { id: 3, title: 'Done', count: 0, proportion: 0.3 }
        ];
    }

    public getStagesColumnsConfiguration (): ColumnConfiguration[] {

        console.debug('calc columns dynamic configuration');

        const colsObj = this.canvas.getObjects().filter(obj => obj.id && obj.id.startsWith('col'));
        let columns: ColumnConfiguration[] = [];

        for (let i = 0; i < colsObj.length; i++) {
        
            let colObj = this.getObjectById('col' + (i+1));

            let col = {
                    id: i+1, 
                    title: colObj?.text,
                    count: 0,
                    proportion: 0.35
            }
            columns.push(col);
        }

        return columns;
    }

    public normalizeZIndex(): void {
        
        let maxPathIndex = -1;
        const objects = this.canvas.getObjects();
    
        objects.forEach((object, index) => {
            if (object.type === 'path') {
                maxPathIndex = Math.max(maxPathIndex, index);
            }
        });
    
        objects.forEach(object => {
            if (object.type === 'group' && this.canvas.getObjects().indexOf(object) <= maxPathIndex) {
                this.canvas.bringToFront(object);
            }
        });
    
        this.canvas.requestRenderAll();
    }

    public changeColor(color: PointerMode): void {
        switch (color) {
            case 'pointer':
                this.setPointerMode();
                break;
            case 'selection':
                this.setSelectionMode();
                break;
            case 'eraser':
                this.setEraserMode();
                break;
            case 'text':
                this.setTextMode();
                break;
            default:
                this.currentColorIndex = color;
                this.setDrawingMode(this.currentColorIndex);
                Notifications.showAppNotification('Remember, you can draw a straight line by holding down the Shift key while drawing', 'small', 16000);
                break;
        }

        this.canvas.requestRenderAll();
    }

    private setPointerMode(): void {
        console.debug('pointer mode');
        
        this.canvas.isDrawingMode = false;
        this.canvas.selection = false;
        this.isTextMode = false;
        this.canvas.defaultCursor = 'pointer';
    }

    private setSelectionMode(): void {
        console.debug('selection mode');

        this.canvas.isDrawingMode = false;
        this.canvas.selection = true;
        this.isTextMode = false;
        this.isEraserMode = false;
        this.canvas.defaultCursor = 'default';
    }

    private setTextMode(): void {
        console.debug('text mode');
        
        this.canvas.isDrawingMode = false;
        this.canvas.selection = false;
        this.isTextMode = true;
        this.isEraserMode = false;
        this.canvas.defaultCursor = 'crosshair';
    }

    private setDrawingMode(colorIndex: number) {
        this.canvas.freeDrawingBrush.color = CanvasUtilities.getColorByIndex(colorIndex);
        this.canvas.isDrawingMode = true;
        this.canvas.selection = false;
        this.isEraserMode = false;
        this.isTextMode = false;

    }

    private setEraserMode(): void {
        this.isEraserMode = true;
        this.canvas.isDrawingMode = false;
        this.canvas.selection = false;
        this.isTextMode = false;
        this.canvas.defaultCursor = 'crosshair';
    }

    public showWelcome(): void {
        // Implementación específica para mostrar mensaje de bienvenida
    }

    private saveCanvas() : void {
        const currentMode = this.canvas.isDrawingMode;
        this.canvas.isDrawingMode = false;
        
        this.saveViewPortConfiguration();

        let jsonCanvas = this.canvas.toJSON(['cl', 'id']);
        let storeCanvas = { sharedCanvasId: this.sharedCanvasId, colorIndex: this.currentColorIndex, content:  JSON.stringify(jsonCanvas) };     
        
        Config.saveCanvas(this.currentCanvasId, storeCanvas);
        this.canvas.isDrawingMode = currentMode;
    }

    public setSharedId (sharedId: string) : void {
        this.sharedCanvasId = sharedId;
        this.saveCanvas();
    }

    public undo ():void {
        this.isLoading = true;
        this.canvasHistory.undo();
        this.isLoading = false;
    }

    public redo ():void{
        this.isLoading = true;
        this.canvasHistory.redo();
        this.isLoading = false;

    }

    public getLastPositionY () : number {
        return this.lastPY;
    }
}