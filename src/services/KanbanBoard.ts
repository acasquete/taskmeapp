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

    public drawElements() :void {

        let kanbanElements = this.canvas.getObjects().filter(obj => obj.cl === 'k');
        if (kanbanElements.length > 0) {
            console.debug('init existing kanban board');
            return;
        }
        
        console.debug('init new kanban board');

        let separatorYPosition = 4000;
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
    
            let separator = new fabric.Line([currentLeft + columnWidth, 0, currentLeft + columnWidth, separatorYPosition], {
                stroke: 'gray',
                selectable: false,
                strokeWidth: 6,
                cl: 'k',
                id: 'sep' + column.id
            });

            this.canvas.add(separator);
    
            currentLeft += columnWidth;
        });

        //if (activeBoardIndex===1) createWelcomeNote();
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

    retrieveConfiguration(activeBoardIndex: string, orientation: string) : any {
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