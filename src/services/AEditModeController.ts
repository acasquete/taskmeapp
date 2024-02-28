import { CanvasUtilities } from "./CanvasUtilities";

export class EditModeController {
    private canvas: fabric.Canvas;
    private editMode: EditorMode = 'Selection';
    private currentColorIndex: number = 0;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
        this.setSelectionMode();
    }

    public setSelectionMode(): void {
        this.editMode = 'Selection';
        this.canvas.isDrawingMode = false;
        this.canvas.selection = true;
        this.canvas.defaultCursor = 'default';

        this.enableSelectable();
    }

    public setTextMode(): void {

        this.editMode = 'Text';
        this.canvas.isDrawingMode = false;
        this.canvas.selection = false;
        this.canvas.defaultCursor = 'crosshair';

        this.enableSelectable();
    }

    public setDrawingMode(colorIndex: number) : void {
        this.currentColorIndex = colorIndex;
        this.editMode = 'Drawing';
        this.canvas.freeDrawingBrush.color = CanvasUtilities.getColorByIndex(colorIndex);
        this.canvas.isDrawingMode = true;
        this.canvas.selection = false;

        this.disableSelectable();
    }

    public setPointerMode(): void {
        console.debug('pointer mode');

        this.editMode = 'Panning';
        this.canvas.isDrawingMode = false;
        this.canvas.selection = false;
        this.canvas.defaultCursor = 'pointer';

        this.disableSelectable();
    }

    public setEraserMode(): void {
        this.editMode = 'Eraser';
        this.canvas.isDrawingMode = false;
        this.canvas.selection = true;
        this.canvas.defaultCursor = 'crosshair';

        this.enableSelectable();
    }

    private enableSelectable(): void {
        this.canvas.forEachObject((obj) => {
            if (!obj?.id?.startsWith('sep') && obj.id!=='cfd') {
                obj.selectable = true;
                obj.evented = true;
            }
        });
        this.canvas.requestRenderAll(); 
    }

    private disableSelectable(): void {
        this.canvas.forEachObject((obj) => {
            if (obj.selectable) {
                obj.selectable = false;
                obj.evented = false;
            }
        });
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();
    }

    public getEditMode(): EditorMode {
        return this.editMode;
    }

    public getCurrentColor(): number {
        return this.currentColorIndex;
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
                this.setDrawingMode(color);
                break;
        }

        this.canvas.requestRenderAll();
    }

    public refreshMode(): void {
        console.debug('refresh mode');

        switch (this.editMode) {
            case 'Drawing':
                this.setDrawingMode(this.currentColorIndex);
                break;
            case 'Selection':
                this.setSelectionMode();
                break;
            case 'Eraser':
                this.setEraserMode();
                break;
            case 'Text':
                this.setTextMode();
                break;
            case 'Panning':
                this.setPointerMode();
                break;
        }
    }
    
}
