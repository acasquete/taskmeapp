import { CanvasStyleManager } from './CanvasStyleManager';

export class SwimlaneManager {

    private canvas: fabric.Canvas;
    private initialPositions: number[] = [];
    private styleManager: CanvasStyleManager;
    private targetElement!: fabric.Object | null;
    private originalPosition: { y: number } = { y: 0 };

    constructor(canvas: fabric.Canvas, styleMngr: CanvasStyleManager) {
        this.canvas = canvas;
        this.styleManager = styleMngr;
    }

    public release() {
        this.targetElement = null;
    }

    public isElement(object: fabric.Object) : boolean {
        return (object.cl === 'k' && object.id?.startsWith('swl')) ?? false;
    }

    public initSepPositions(target: fabric.Object) {
        this.canvas.selection = false;
        this.targetElement = target;
        this.targetElement.selectable = false;
        this.originalPosition = { y: target.top || 0 }
        this.initialPositions = this.getLanesPositionsArray(); 
    }

    public getLanesPositionsArray(): number[] {
        const lanesPos: number[] = [];
        const objects = this.canvas.getObjects();

        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            if (this.isElement(object)) {
                lanesPos.push(object.top || 0);
            } else if (object.cl == 'n') {
                object.set('inittop', object.top);
            }
        }

        return lanesPos;
    }

    private getObjectById(id: string): fabric.Object | undefined {
        return this.canvas.getObjects().find(obj => obj.id === id);
    }

    public moveDivider (position: number) {
        if (!this.targetElement) return;
        
        console.debug('move swimlane');

        let currentIdTarget = parseInt( this.targetElement.id?.replace(/[^\d]/g, '') || '1', 10);
        let prevIdTarget = currentIdTarget == 2 ? '' : 'swl' + (currentIdTarget - 1);
        let prevTargetPos = prevIdTarget == '' ? 0 : this.getObjectById(prevIdTarget)?.top;

        console.debug('current ' + currentIdTarget + ' ' + this.targetElement.id);
        console.debug('prev ' + prevIdTarget);
        console.debug('prevPos ' + prevTargetPos);

        let delta = position - this.originalPosition.y;

        if (this.targetElement.top - prevTargetPos + delta > 400 ) {
            this.targetElement.set({top: position });

            let title = this.getObjectById('swc' + currentIdTarget);
            title.set({ top: position + 10 });

            this.moveRelatedElements (position, this.targetElement.id, delta);
        }
    }

    public moveRelatedElements(position: number, id: string, delta: number): void {
        const movedIndex: number = parseInt(id.replace(/[^\d]/g, ''), 10);
        this.canvas.forEachObject((obj: fabric.Object) => {
            const objId = obj.id;
            if (objId && objId.startsWith('swl')) {
                const objIndex: number = parseInt(objId.replace(/[^\d]/g, ''));

                if (objIndex > movedIndex && objId !== id) {
                    obj.set({ top: this.initialPositions[objIndex - 2] + delta });

                    let title = this.getObjectById('swc' + objIndex);
                    title.set({ top: this.initialPositions[objIndex - 2] + delta + 10 });

                }
            } else if ( obj.cl == 'n') {
                if (obj.top > position) {
                    obj.set({
                        top: obj.inittop + delta, 
                    });
                }
            }
        });

        this.canvas.renderAll();
    }

    public handleNewStage(addedObject: fabric.Object): void {
        const path = addedObject.path;

        if (!path) return;
    
        const zoom = this.canvas.getZoom();
        const boundingRect = addedObject.getBoundingRect();
        
        if (this.shouldAddNewStage(boundingRect, zoom, addedObject?.top)) {
            console.debug('new lane added');
            const newStage = this.createNewStage();
            this.addStageToCanvas(newStage, addedObject?.top);
            this.canvas.remove(addedObject);
        }
    }

    public createNewStage(): SwimlaneConfiguration {
        const stagesConf = this.getStagesColumnsConfiguration();
        const newNumber = stagesConf.length + 1 || 1;
        const newTitle = 'Swimlane ' + newNumber;
        
        return {
            id: newNumber,
            title: newTitle,
            proportion: 0.3
        };
    }

    public addStageToCanvas(newStage: ColumnConfiguration, positionLeft: number): void {
        let lastSep = this.getObjectById('swc' + (newStage.id - 1));
        let leftLastSep = lastSep ? lastSep.top : 0;

        this.addStage(newStage, leftLastSep, Math.max(400, positionLeft-leftLastSep));
    }

    private addStage (element: ColumnConfiguration, top: number, width: number) {
    
        let text = new fabric.Textbox(element.title, {
            originX: 'left',
            left: 65,
            width: 300,
            top: top + width + 10,
            fontSize: 30,
            fontFamily: 'PermanentMarker',
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
            textAlign: 'left',
            id: 'swc' + element.id,
            editable: true,
            cl: 'k',
            fill: this.styleManager.getTextColor()
        });

        this.canvas.add(text);

        let line = new fabric.Line([0, top + width, 4000, top + width], {
            stroke: '#ef3340',
            selectable: false,
            strokeWidth: 8,
            hasControls: false,
            hasBorders: false,
            cl: 'k',
            id: 'swl' + element.id,
        });

        this.canvas.add(line);
    }

    public deleteSeparator (sepId:string) {
        
        console.debug('delete swimlanes');

        const regex = /swl(\d+)/;
        const matchId = sepId.match(regex);

        if (matchId) {
            let id = parseInt(matchId[1], 10);

            let col = this.getObjectById(`swl${id}`);
            let sep = this.getObjectById(`swc${id}`);

            this.canvas.remove(col);
            this.canvas.remove(sep);
            Data.sendCanvasObject({a:'do', d: [ col?.id, sep?.id ] });

            this.organizeCanvasObjects();
            this.canvas.renderAll();
        }
    }

    public organizeCanvasObjects() {
        const colObjects: Object[] = [];
        const sepObjects: Object[] = [];
      
        this.canvas.getObjects().forEach((obj: Object) => {
          if (obj.id.startsWith("swc")) {
            colObjects.push(obj);
          } else if (obj.id.startsWith("swl")) {
            sepObjects.push(obj);
          }
        });
      
        colObjects.sort((a, b) => parseInt(a.id.substring(3)) - parseInt(b.id.substring(3)));
        sepObjects.sort((a, b) => parseInt(a.id.substring(3)) - parseInt(b.id.substring(3)));
      
        colObjects.forEach((obj, index) => {
            obj.id = `swc${index + 1}`;
        });

        sepObjects.forEach((obj, index) => {
            obj.id = `swl${index + 1}`; 
        });
    }

    private shouldAddNewStage(boundingRect: fabric.IRect, zoom: number, left: number): boolean {
        
        let stagesConfig = this.getStagesColumnsConfiguration();
        let last = this.getObjectById('swl' + stagesConfig.length);
        let prop = (boundingRect.height / zoom) / (boundingRect.width / zoom);

        let result = prop < 20 &&
        (boundingRect.height / zoom) < 50 &&
        (boundingRect.width / zoom) > 250 &&
        left > (last ? last?.top : 0);

        console.debug('add ' + result);

        return result;
    }

    public getStagesColumnsConfiguration (): SwimlaneConfiguration[] {
        const colsObj = this.canvas.getObjects().filter(obj => obj.id && obj.id.startsWith('swc'));
        let lanes: SwimlaneConfiguration[] = [];

        for (let i = 0; i < colsObj.length; i++) {
        
            let colObj = this.getObjectById('swc' + (i+1));

            let col = {
                    id: i+1, 
                    title: colObj?.text,
                    proportion: 0.35
            }

            lanes.push(col);
        }

        return lanes;
    }
}