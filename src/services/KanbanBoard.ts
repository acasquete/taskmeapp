import { CanvasStyleManager } from "./CanvasStyleManager";
import { CanvasUtilities } from "./CanvasUtilities";

export class KanbanBoard  {
    private canvas: fabric.Canvas;
    private styleManager: CanvasStyleManager;
    private CANVAS_WIDTH = 2000;

    constructor(canvas: fabric.Canvas, styleManager: CanvasStyleManager) {
        this.canvas = canvas;
        this.styleManager = styleManager;
    }

    private getDefaultColumnConfiguration(): ColumnConfiguration[] {
        return [
            { id: 1, title: 'Todo', count: 0, proportion: 0.38 },
            { id: 2, title: 'In Progress', count: 0, proportion: 0.32 },
            { id: 3, title: 'Done', count: 0, proportion: 0.3 }
        ];
    }

    private getDefaultSwimlaneConfiguration(): SwimlaneConfiguration[] {
        return [
            { id: 1, title: 'First', proportion: 0.5 },
            { id: 3, title: 'Bugs', proportion: 0.3 }
        ];
    }

    public drawElements() :void {
        let kanbanElements = this.canvas.getObjects().filter(obj => obj.cl === 'k');
        
        if (kanbanElements.length > 0) {
            console.debug('init existing kanban board');
            return;
        }
        
        console.debug('init new kanban board');

        this.drawColumns(); 
        this.drawSwimlanes();
    }

    private drawSwimlanes () {
        let swimLaneConfigurations = this.getDefaultSwimlaneConfiguration();
        
        let currentTop = 60; swimLaneConfigurations[0].proportion * this.canvas.height;

        swimLaneConfigurations.forEach((swimlane, index) => {


            let text = new fabric.Textbox(swimlane.title, {
                originX: 'left',
                left: 50,
                top: currentTop,
                fontSize: 50,
                fontFamily: 'Kalam',
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
                textAlign: 'center',
                id: 'swim' + swimlane.id,
                editable: true,
                cl: 'k',
                fill: this.styleManager.getTextColor()
            });
    
            this.canvas.add(text);

            let line = new fabric.Line([0, currentTop + 60, 4000, currentTop + 60], {
                stroke: 'red',
                selectable: false,
                strokeWidth: 8,
                lockMovementX: true,
                lockScalingY: true,
                lockSkewingY: true,
                hasControls: false,
                hasBorders: false,
                cl: 'k',
                id: 'swi' + swimlane.id
            });

            this.canvas.add(line);
    
            currentTop += swimlane.proportion * this.canvas.height;;

        });
    }

    private drawColumns () {

        let sepHeight = 4000;
        let columnConfigurations = this.getDefaultColumnConfiguration();
    
        let currentLeft = 0;
    
        columnConfigurations.forEach((column, index) => {

            let columnWidth = this.CANVAS_WIDTH * column.proportion;
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
                hasControls: false,
                hasBorders: true,
                width: columnWidth,
                textAlign: 'center',
                id: 'col' + column.id,
                editable: true,
                cl: 'k',
                fill: this.styleManager.getTextColor()
            });
    
            this.canvas.add(text);
    
            let separator = new fabric.Line([currentLeft + columnWidth, 0, currentLeft + columnWidth, sepHeight], {
                stroke: 'gray',
                selectable: false,
                strokeWidth: 6,
                cl: 'k',
                id: 'sep' + column.id
            });

            this.canvas.add(separator);
    
            currentLeft += columnWidth;
        });
    }

    public adjustCanvasZoom(activeBoardIndex: string, forceReset: boolean) : void {
        var currentOrientation = CanvasUtilities.getUserOrientation(); 
        var savedConfiguration = this.retrieveConfiguration(activeBoardIndex, currentOrientation);

        if (!forceReset && savedConfiguration) {
            this.canvas.setViewportTransform(savedConfiguration.vpt);
            this.canvas.setZoom(savedConfiguration.zoom);
        } else {
            this.defaultZoom();
        }
    }

    private retrieveConfiguration(activeBoardIndex: string, orientation: string) : any {
        const key = `c_${activeBoardIndex}_${orientation}`;
        const savedConfiguration = localStorage.getItem(key);
        if (savedConfiguration) {
            return JSON.parse(savedConfiguration);
        }
        return null; 
    }

    private defaultZoom() : void {
        let viewportWidth = window.innerWidth; 
        let zoomLevel = viewportWidth / this.CANVAS_WIDTH;
        this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        this.canvas.setZoom(zoomLevel);
    }

}