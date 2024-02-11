import { CanvasUtilities } from './canvasUtilities';
import { Config } from './configService';
import { KanbanAdvisor } from './kanbanAdvisor';

export class CanvasController {
    
    private canvas: fabric.Canvas;
    public isLoading: boolean = true;
    private isEditKanbanMode: boolean = false;
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
    private state: any = [];
    private mods = 0;
    private currentCanvasId: number = 0;
    private sharedCanvasId: string = '';
    private isTextMode = false;
    private shouldCancelMouseDown = false;
    private circleToDrag: fabric.Object | null = null;
    private isDraggingDot: boolean = false;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    public reset () {
        this.canvas.clear();
    }

    isSeparatorElement(object: fabric.Object) : boolean {
        return object.cl === 'k' && object.id.startsWith('sep');
    }

    saveState(): void {
        if (this.mods < this.state.length) {
            this.state = this.state.slice(0, this.mods + 1);
        }
        this.state.push(this.canvas.toJSON());
        this.mods++;
    }

    public switchDashboard(id: number, initial: boolean) {
        this.currentCanvasId = id;
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
            let target = this.canvas.findTarget(options.e);

            this.canvas.setCursor('grabbing');

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

                        console.debug('dentro');

                        target.lockMovementX =  true;
                        target.lockMovementY = true;

                        this.canvas.requestRenderAll();

                        obj.clone( (cloned)=> {

                            console.log('coned');
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

            if (this.isDraggingDot && this.circleToDrag) {
                this.circleToDrag.set({
                    left: pointer.x,
                    top: pointer.y,
                });
            } else if (this.isEditKanbanMode && this.targetElement) {
               
                this.targetElement.set({
                    left: pointer.x
                });
                let deltaX = pointer.x - this.originalPosition.x;
                this.moveRelatedElements (this.targetElement.id, deltaX);
               
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
                this.targetElement.selectable = false;
                const pointer = this.canvas.getPointer(options.e);
                const deltaX = pointer.x - this.originalPosition.x;

                this.moveRelatedElements(this.targetElement.id, deltaX); 
                this.targetElement = null;

                // Kludge to force refresh
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
            this.canvas.setCursor('grabbing');

        });

        
        this.canvas.on('object:scaling', this.onUpdatingObject.bind(this));
        this.canvas.on('object:moving', this.onUpdatingObject.bind(this));
        this.canvas.on('object:rotating', this.onUpdatingObject.bind(this));

        this.canvas.on('object:added', (event: fabric.IEvent) => {
            
            if (this.isLoading) return;

            const uniqueId = this.genId();
            const obj = event.target; 

            if (obj.virtual) return;

            obj.set({ id: uniqueId }); 

            const objData = obj.toJSON(['id','virtual','left','top']); 

            Data.sendCanvasObject({ a: 'oa', d: JSON.stringify(objData) } );

            this.saveState();
        });
        
        this.canvas.on('object:modified', (event: fabric.IEvent) => {
            
            this.saveState();

            const movedObject = event.target;

            console.debug('moved');
        
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

            console.debug('modified');

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

    private moveObjectToRandomPositionAroundGroup(object: fabric.Object, group: fabric.Group) {
        // Calcular un rango aleatorio alrededor del grupo
        const padding = 50; // Espacio alrededor del grupo
        const minX = group.left - padding;
        const maxX = group.left + group.width + padding;
        const minY = group.top - padding;
        const maxY = group.top + group.height + padding;
    
        // Generar posiciones aleatorias dentro del rango
        const newX = Math.random() * (maxX - minX) + minX;
        const newY = Math.random() * (maxY - minY) + minY;
    
        // Mover el objeto a la nueva posición
        object.set({
            left: newX,
            top: newY
        });
    
        // Asegurarse de que el objeto se vuelve a agregar al canvas y se renderiza
        this.canvas.add(object);
        this.canvas.renderAll();
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

    public moveRelatedElements(id: string, deltaX: number): void {
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
            Data.sendCanvasObject({a:'do', d: object.id });
            this.canvas.remove(object);
          });
        } else {
            Data.sendCanvasObject({a:'do', d: activeObject.id })
            this.canvas.remove(activeObject);
        }
      
        this.saveCanvas();
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();
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
        const columnConfigurations: ColumnConfiguration[] = this.getColumnConfiguration();

        const separators: fabric.Object[] = this.canvas.getObjects().filter(obj => (obj as any).id && (obj as any).id.startsWith('sep'));
        
        this.canvas.getObjects().forEach(obj => {
            if ((obj as any).cl === 'n') {
                const columnIndex: number = separators.findIndex(sep => sep && (obj.left || 0) < (sep.left || 0));
                if (columnIndex > -1) {
                    columnConfigurations[columnIndex].count++;
                }
            }
        });
        
        columnConfigurations.forEach(column => {
            this.updateColumnTitle(column.id, column.count);
            if (column.colorThreshold && column.count > column.colorThreshold) {
                this.setColorForColumn(column.id, '#ef3340');
            } else {
                this.setColorForColumn(column.id, 'default');
            }
        });
    }

    public setColorForColumn(columnId: string, color: string): void {
        const columnTitle = this.canvas.getObjects().find(obj => obj.id === columnId) as fabric.Text;
        if (columnTitle) {
            columnTitle.set('fill', color === 'default' ? 'black' : color); 
            this.canvas.requestRenderAll();
        }
    }

    public updateColumnTitle(columnId: string, counter: number): void {
        const column = this.canvas.getObjects().find(obj => obj.id === columnId) as fabric.Text;
        if (column) {
            const baseText = column.text?.split(' - ')[0];
            column.text = counter > 0 ? `${baseText} - ${counter}` : baseText;
            this.canvas.requestRenderAll();
        }
    }

    public getColumnConfiguration(): ColumnConfiguration[] {
        return [
            { id: 'col1', title: 'Todo', count: 0, proportion: 0.35 },
            { id: 'col2', title: 'In Progress', count: 0, colorThreshold: 3, proportion: 0.35 },
            { id: 'col3', title: 'Done', count: 0, proportion: 0.3 }
        ];
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
        this.canvas.defaultCursor = 'default';
    }

    private setTextMode(): void {
        console.debug('text mode');
        
        this.canvas.isDrawingMode = false;
        this.canvas.selection = false;
        this.isTextMode = true;

        this.canvas.defaultCursor = 'crosshair';
    }

    private setDrawingMode(colorIndex: number) {
        this.canvas.freeDrawingBrush.color = CanvasUtilities.getColorByIndex(colorIndex);
        this.canvas.isDrawingMode = true;
        this.canvas.selection = false;
    }

    private setEraserMode(): void {
        // TODO: Implement
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
}