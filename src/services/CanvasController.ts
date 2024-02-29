import { CanvasUtilities } from './CanvasUtilities';
import { Config } from './ConfigService';
import { CanvasHistory } from './CanvasHistory';
import { EditModeController } from './EditModeController';
import { CumulativeFlowDiagram } from './CumulativeFlowDiagram';
import { Canvas } from '../types/canvas';
import { DividerManager } from './DividerManager';

export class CanvasController {
    private canvas: fabric.Canvas;
    private boardGUID: string = '';
    private boardIndex: number = 0;
    private isShared: boolean = false;
    public isLoading: boolean = true;
    private isEditKanbanMode: boolean = false;
    private targetElement!: fabric.Object | null;
    private originalPosition: { x: number } = { x: 0 };
    private pausePanning: boolean = false;
    private currentX: number = 0;
    private currentY: number = 0;
    private lastX: number = 0;
    private lastY: number = 0;
    private xChange: number = 0;
    private yChange: number = 0;
    private zoomStartScale: number = 0;
    private shouldCancelMouseDown = false;
    private circleToDrag: fabric.Object | null = null;
    private isDraggingDot: boolean = false;
    private canvasHistory : CanvasHistory;
    private editController : EditModeController;
    private dividerManager : DividerManager;
    private cfd : CumulativeFlowDiagram;
    private lastTap = 0;
    private lastPY = 0;
    private config: Config;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
        this.canvasHistory = new CanvasHistory(canvas);
        this.editController = new EditModeController(canvas);
        this.dividerManager = new DividerManager(canvas);
        this.config = new Config();

        // Extension
        this.cfd = new CumulativeFlowDiagram(canvas);
    }

    public reset () {
        console.debug('controller reset');
        
        this.isShared = false;
        this.canvas.clear();
        this.editController.setSelectionMode();
        Data.sendCanvasObject({a:'rb' });
    }

    public getDefaultColumnConfiguration () {
        return this.dividerManager.getDefaultColumnConfiguration();
    }
    
    public updateNoteCounters () {
        this.dividerManager.updateNoteCounters();
    }

    public switchDashboard(index: number, board: Canvas) {
        this.boardGUID = board.guid;
        this.boardIndex = index;
        this.isShared = board.shared ?? false;

        this.cfd.init(board.cfd || {});
        this.updateCFD();
    }

    private updateCFD(): void {
        this.isLoading = true;
    
        let stages: string[] = [];
        let columns = this.dividerManager.getStagesColumnsConfiguration();
    
        const today = new Date();
        const formattedDate = (today.getMonth() + 1) + '/' + today.getDate();
    
        for (const column of columns) {
            const pattern = /^(.+?)(?: - .+)?$/;
            const match = column.title.match(pattern);
            
            if (match && match[1]) {
                const stageName = match[1].trim().toLocaleLowerCase(); 
                stages.push(stageName);
                this.cfd.addOrUpdate(formattedDate, stageName, column.count);
            }
        }
    
        this.cfd.draw(stages);

        this.isLoading = false;
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
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    }

    public assignCanvasEventListeners(): void {

        console.debug('assign CANVAS events');
        
        this.canvas.on('mouse:over', (e: fabric.IEvent) => {
            const object = e.target;
            if (object && this.dividerManager.isSeparatorElement(object)) {
                object.set('stroke', 'green');
                this.canvas.renderAll();
            }
        });

        this.canvas.on('mouse:out', (e: fabric.IEvent) => {
            const object = e.target;
            if (object && this.dividerManager.isSeparatorElement(object)) {
                object.set('stroke', 'gray');
                this.canvas.renderAll();
            }
        });

        this.canvas.on('mouse:down:before', () => {
            this.shouldCancelMouseDown = this.isEditingMode();
        });

        this.canvas.on('mouse:down', (options: fabric.IEvent) => {
            const DOUBLE_TAP_DELAY = 300;

            let target = this.canvas.findTarget(options.e, true);

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
            
            if (this.editController.getEditMode()==='Text' && target == undefined) {
                this.addTextObject(options);
            } if (this.editController.getEditMode()==='Eraser') {
                this.deleteSelectedObjects(target);
            } else if (target && this.dividerManager.isSeparatorElement(target)) {
                
                this.isEditKanbanMode = true;
                this.canvas.selection = false;
                this.targetElement = target;
                this.targetElement.selectable = false;
                this.originalPosition = { x: target.left || 0 };
                this.dividerManager.initSepPositions(); 
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
               
                let currentIdTarget = parseInt( this.targetElement.id?.replace(/[^\d]/g, '') || '1', 10);
                let prevIdTarget = currentIdTarget == 1 ? '' : 'sep' + (currentIdTarget - 1);
                let prevTargetLeft = prevIdTarget =='' ? 0 : this.getObjectById(prevIdTarget)?.left;

                let deltaX = pointer.x - this.originalPosition.x;

                if (this.targetElement.left - prevTargetLeft + deltaX > 400 ) {
                    this.targetElement.set({left: pointer.x });
                    this.dividerManager.moveRelatedElements (pointer.x, this.targetElement.id, deltaX);
                }
            } 

            this.canvas.requestRenderAll();
        });

        this.canvas.on('mouse:up', (options: fabric.IEvent) => {
            
            console.debug ('mouse:up');

            this.isEditKanbanMode = false;
            
            if (this.isDraggingDot) {
                let parentNoteId = this.circleToDrag?.parent;
                let noteObj = this.getObjectById (parentNoteId);

                noteObj?.set({
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

            this.editController.refreshMode();
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
            this.updateCFD();
            this.dividerManager.updateNoteCounters();
        });

        this.canvas.on('selection:created', (e: fabric.IEvent) => {
            let activeSelection = this.canvas.getActiveObject();
            
            if (!activeSelection) return;

            activeSelection.borderColor = 'blue';
            activeSelection.borderScaleFactor = activeSelection.cl === 'k' ? 1: 2;

            if (activeSelection?.type === 'activeSelection') {
                activeSelection.hasControls=false;

                let objects = activeSelection.getObjects().filter(obj => obj.type == 'textbox');

                if (objects.length > 0) {
                    console.debug('column selected');
                    this.canvas.discardActiveObject();
                }

            this.canvas.requestRenderAll();
            }
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
        this.canvas.on('object:deleted', (event: fabric.IEvent) => {
            if (this.isLoading) return;

            this.updateCFD();
        });
        
        this.canvas.on('object:added', (event: fabric.IEvent) => {
            if (this.isLoading) return;

            console.debug('object:added');

            const addedObject = event.target;
            
            if (!addedObject) return;

            const objectsWithClN = this.canvas.getObjects().filter(obj => obj.cl === 'n');

            if (objectsWithClN.length > 100) {
                this.canvas.remove(addedObject);
                this.canvas.discardActiveObject();
            }

            this.dividerManager.handleNewStage(addedObject);
            this.assignUniqueIdToAddedObject(addedObject);
            this.sendObjectData(addedObject);
            this.updateCFD();
            this.normalizeZIndex();
            this.saveCanvas();
        });
        
        this.canvas.on('object:modified', (event: fabric.IEvent) => {
            if (this.isLoading) return;
            console.debug('object:modified');

            const movedObject = event.target;
        
            if (movedObject && (movedObject?.cl ==='t' || movedObject?.id?.startsWith('col'))) {
                console.debug('object:modified column/text');
                Data.sendCanvasObject({a:'cu', id: movedObject.id, d: movedObject?.text });
            }

            // Drag and drop for "Dots"
            if (movedObject && movedObject.cl === 'd') {
                this.canvas.forEachObject((obj) => {
                    if (obj.cl === 'n' && obj.type === 'group' && checkIntersection(movedObject, obj)) {
                        obj.force=true;
                        this.DeleteObject(movedObject);
                        (obj as fabric.Group).addWithUpdate(movedObject);
                        this.canvas.renderAll();
                    }
                });
            }

            const activeObject = event.target;
            if (activeObject && activeObject.type === 'group') {
                this.canvas.bringToFront(activeObject);

                // Delete notes on top of the board
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
                            this.DeleteObject(activeObject);
                            this.normalizeZIndex();
                            this.saveCanvas();
                        }
                    });
                    return;
                }
            }
            this.updateCFD();
            this.normalizeZIndex();
            this.saveCanvas();
        });

        function checkIntersection(obj1: fabric.Object, obj2: fabric.Object): boolean {
            const obj1BoundingRect = obj1.getBoundingRect();
            const obj2BoundingRect = obj2.getBoundingRect();
        
            return (
                obj1BoundingRect.left < obj2BoundingRect.left + obj2BoundingRect.width &&
                obj1BoundingRect.left + obj1BoundingRect.width > obj2BoundingRect.left &&
                obj1BoundingRect.top < obj2BoundingRect.top + obj2BoundingRect.height &&
                obj1BoundingRect.top + obj1BoundingRect.height > obj2BoundingRect.top
            );
        }
    }
    
    private assignUniqueIdToAddedObject(addedObject: fabric.Object): void {
        if (addedObject.virtual) return;

        const uniqueId = this.genId();
        if (!addedObject.id) addedObject.set({ id: uniqueId });
    }
    
    private sendObjectData(addedObject: fabric.Object): void {
        console.debug('send data');
        console.debug(addedObject);
        if (addedObject.virtual) return;

        const objData = addedObject.toJSON(['id', 'cl', 'virtual', 'left', 'top']);
        Data.sendCanvasObject({ a: 'oa', d: JSON.stringify(objData) }, addedObject?.force);
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
            selectable: this.canvas.selection,
            evented: this.canvas.selection,
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
        
        if (obj.id === 'cfd') return;
        
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
            this.dividerManager.updateNoteCounters();
        }
    }

    public saveViewPortConfiguration(): void {
        const zoom = this.canvas.getZoom();
        const viewPortTransform = this.canvas.viewportTransform;
        const orientation: string = CanvasUtilities.getUserOrientation();
    
        const key: string = `c_${this.boardIndex}_${orientation}`;
        const configuration: { zoom: number; vpt: any } = {
            zoom: zoom,
            vpt: viewPortTransform,
        };
        localStorage.setItem(key, JSON.stringify(configuration));
    }

    deleteSelectedObjects(target): void {
        const activeObject = this.canvas.getActiveObject();
      
        if (target && this.dividerManager.isSeparatorElement(target)) { 
            this.DeleteObject(target);
        }

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

    public DeleteObject (object: fabric.Object) {
        console.debug('delete object');

        if (object.cl==='k' && object.id.includes('col')) return;

        if (object.cl==='k') {
            if (object.id.includes('sep')) {
                this.dividerManager.deleteSeparator(object.id);
                return;
            }
        }

        Data.sendCanvasObject({a:'do', d: object.id }, true);
        this.canvas.remove(object);
    }

    private getObjectById(id: string): fabric.Object | undefined {
        return this.canvas.getObjects().find(obj => obj.id === id);
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

    public normalizeZIndex(): void {
        console.debug('normalize zindex');

        const objects = this.canvas.getObjects();
        
        objects.filter(object => object.type === 'path').forEach(pathObject => {
            this.canvas.sendBackwards(pathObject, true);
        });

        objects.filter(object => object.cl === 'n' || object.cl === 'd').forEach(clObject => {
            this.canvas.bringToFront(clObject);
        });
    
        this.canvas.requestRenderAll();
    }

    public changeColor(color: PointerMode): void {
        this.editController.changeColor(color);
    }

    public openOption (option: string) {
        this.cfd.activate();
    }

    public getBoardGUID () {
        return this.boardGUID;
    }
    
    private async saveCanvas(force?: boolean) : void {

        console.debug('controller save canvas');

        const currentMode = this.canvas.isDrawingMode;
        this.canvas.isDrawingMode = false;
        
        this.saveViewPortConfiguration();

        let jsonCanvas = this.canvas.toJSON(['cl', 'id']);
        
        // Extension
        let exportDataCFG = this.cfd.exportData();

        let storeCanvas = { 
            guid: this.boardGUID, 
            colorIndex: this.editController.getCurrentColor(), 
            content:  JSON.stringify(jsonCanvas), 
            timestamp: Date.now(),
            shared: this.isShared,
            cfd: exportDataCFG
        };     

        await this.config.saveCanvas(this.boardIndex, storeCanvas, force);
        this.canvasHistory.saveHistory();
        this.canvas.isDrawingMode = currentMode;
    }

    public async ensureShareBoard () : Promise<string> {
        if (!this.isShared) {
            console.debug('share board');
            this.isShared = true;
            await this.saveCanvas(true);
            await this.config.getRemoteCanvas(this.boardGUID);
        }
        return this.boardGUID;
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