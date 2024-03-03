import { CanvasStyleManager } from './CanvasStyleManager';

export class DividerManager {
    private canvas: fabric.Canvas;
    private sepInitPositions: number[] = [];
    private styleManager: CanvasStyleManager;
    private targetElement!: fabric.Object | null;
    private originalPosition: { x: number } = { x: 0 };

    constructor(canvas: fabric.Canvas, styleMngr: CanvasStyleManager) {
        this.canvas = canvas;
        this.styleManager = styleMngr;
    }

    public isSeparatorElement(object: fabric.Object) : boolean {
        return (object.cl === 'k' && object.id?.startsWith('sep')) ?? false;
    }

    public initSepPositions(target: fabric.Object) {
        this.canvas.selection = false;
        this.targetElement = target;
        this.targetElement.selectable = false;
        this.originalPosition = { x: target.left || 0 }
        this.sepInitPositions = this.getSeparatorsPositionsArray(); 
    }

    public handleNewStage(addedObject: fabric.Object): void {
        const path = addedObject.path;

        if (!path) return;
    
        const zoom = this.canvas.getZoom();
        const boundingRect = addedObject.getBoundingRect();
        
        if (this.shouldAddNewStage(boundingRect, zoom, addedObject?.left)) {
            console.debug('new stage added');
            const newStage = this.createNewStage();
            this.addStageToCanvas(newStage, addedObject?.left);
            this.canvas.remove(addedObject);
        }
    }

    public organizeCanvasObjects() {
        const colObjects: Object[] = [];
        const sepObjects: Object[] = [];
      
        this.canvas.getObjects().forEach((obj: Object) => {
          if (obj.id.startsWith("col")) {
            colObjects.push(obj);
          } else if (obj.id.startsWith("sep")) {
            sepObjects.push(obj);
          }
        });
      
        colObjects.sort((a, b) => parseInt(a.id.substring(3)) - parseInt(b.id.substring(3)));
        sepObjects.sort((a, b) => parseInt(a.id.substring(3)) - parseInt(b.id.substring(3)));
      
        colObjects.forEach((obj, index) => {
            obj.id = `col${index + 1}`;
        });

        sepObjects.forEach((obj, index) => {
            obj.id = `sep${index + 1}`; 
        });

        colObjects.forEach((colObj, index) => {
          const sepIndex = index; 
          const sepObj = index>0 ? sepObjects[sepIndex - 1] : null;
          colObj.left = sepObj ? sepObj.left : 0;
          const nextSepObj = sepObjects[sepIndex];
          colObj.width = nextSepObj.left - colObj.left;
        });
      
      }
    
    public createNewStage(): ColumnConfiguration {
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

    public updateNoteCounters(): void {
        const stageConf = this.getStagesColumnsConfiguration();

        if (stageConf.length==0) return;
        
        stageConf.forEach(column => {
            this.updateColumnTitle(column.id, column.count);
            let titleColumn = this.canvas.getObjects().find(obj => obj.id === 'col' + column.id) as fabric.Text;
            
            if (titleColumn.text?.toLowerCase().includes('in progress') && column.count > 3) {
                this.setColorForColumn(column.id, '#ef3340');
            } else {
                this.setColorForColumn(column.id, this.styleManager.getTextColor());
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
    
    public addStageToCanvas(newStage: ColumnConfiguration, positionLeft: number): void {
        let lastSep = this.getObjectById('sep' + (newStage.id - 1));
        let leftLastSep = lastSep ? lastSep.left : 0;

        this.addStage(newStage, leftLastSep, Math.max(400, positionLeft-leftLastSep));
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
                cl: 'k',
                force: true,
                fill: this.styleManager.getTextColor()
            });
    
            this.canvas.add(text);
    
            let separator = new fabric.Line([left + width, 0, left + width, separatorYPosition], {
                stroke: 'gray',
                selectable: false,
                strokeWidth: 6,
                cl: 'k',
                id: 'sep' + column.id,
                force: true
                
            });

            this.canvas.add(separator);
    }
    
    private shouldAddNewStage(boundingRect: fabric.IRect, zoom: number, left: number): boolean {
        
        let stagesConfig = this.getStagesColumnsConfiguration();
        let lastSep = this.getObjectById('sep' + stagesConfig.length);
        let prop = (boundingRect.width / zoom) / (boundingRect.height / zoom);

        return (
            prop < 20 &&
            (boundingRect.width / zoom) < 50 &&
            (boundingRect.height / zoom) > 250 &&
            left > (lastSep ? lastSep?.left : 0)
        );
    }

    public moveDivider (x: number) {
        console.debug('move divider');

        let currentIdTarget = parseInt( this.targetElement.id?.replace(/[^\d]/g, '') || '1', 10);
        let prevIdTarget = currentIdTarget == 1 ? '' : 'sep' + (currentIdTarget - 1);
        let prevTargetLeft = prevIdTarget =='' ? 0 : this.getObjectById(prevIdTarget)?.left;

        let deltaX = x - this.originalPosition.x;

        if (this.targetElement.left - prevTargetLeft + deltaX > 400 ) {
            this.targetElement.set({left: x });
            this.moveRelatedElements (x, this.targetElement.id, deltaX);
        }
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

    public deleteSeparator (sepId:string) {
        
        console.debug('delete separator');

        const regex = /sep(\d+)/;
        const matchId = sepId.match(regex);

        if (matchId) {
            let id = parseInt(matchId[1], 10);

            let col = this.getObjectById(`col${id}`);
            let sep = this.getObjectById(`sep${id}`);

            this.canvas.remove(col);
            this.canvas.remove(sep);
            Data.sendCanvasObject({a:'do', d: [ col?.id, sep?.id ] });

            this.organizeCanvasObjects();
            this.canvas.renderAll();
            // TODO Save Canvas
            //this.saveCanvas();
        }
    }

    // TODO Move to canvas utilities
    private getObjectById(id: string): fabric.Object | undefined {
        return this.canvas.getObjects().find(obj => obj.id === id);
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
    
        // TODO: Send Realtime
        // if (this.isEditKanbanMode) {
        //     Data.sendCanvasObject({a: 'cm', d: JSON.stringify(colData) });
        // }

        this.updateNoteCounters();
        this.canvas.requestRenderAll();
    }

    public updateColumnTitle(columnId: number, counter: number): void {
        const column = this.canvas.getObjects().find(obj => obj.id === 'col' + columnId) as fabric.Text;
        
        if (column) {
            const baseText = column.text?.split(' - ')[0];
            column.text = counter > 0 ? `${baseText} - ${counter}` : baseText;
            this.canvas.requestRenderAll();
        }
    }

    public getStagesColumnsConfiguration (): ColumnConfiguration[] {
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

        const separators: fabric.Object[] = this.canvas.getObjects().filter(obj => (obj as any).id && (obj as any).id.startsWith('sep'));
        
        this.canvas.getObjects().forEach(obj => {
            if ((obj as any).cl === 'n') {
                const columnIndex: number = separators.findIndex(sep => sep && (obj.left || 0) < (sep.left || 0));
                if (columnIndex > -1) {
                    columns[columnIndex].count++;
                }
            }
        });

        return columns;
    }
}