export class CanvasHistory {
    private undoStack: string[] = [];
    private redoStack: string[] = [];
    private isRestoringState: boolean = false; 

    constructor(private canvas: fabric.Canvas) {}

    public saveHistory(): void {
        if (!this.isRestoringState) {
            console.debug('save history');

            const canvasJson = JSON.stringify(this.canvas.toJSON(['cl', 'id']));

            this.undoStack.push(canvasJson);
            this.redoStack = [];
        }
    }

    public undo(): void {

        console.log(this.undoStack.length);
        
        if (this.undoStack.length > 0) {
            this.isRestoringState = true; 
            const prevState = this.undoStack.pop()!;
            
            this.redoStack.push( JSON.stringify(this.canvas.toJSON(['cl', 'id'])));

            this.canvas.loadFromJSON(prevState, () => {
                this.canvas.renderAll();
                this.isRestoringState = false;
            });
        }
    }

    public redo(): void {
        if (this.redoStack.length > 0) {
            this.isRestoringState = true;
            const nextState = this.redoStack.pop()!;
            this.undoStack.push( JSON.stringify(this.canvas.toJSON(['cl', 'id'])));
            this.canvas.loadFromJSON(nextState, () => {
                this.canvas.renderAll();
                this.isRestoringState = false;
            });
        }
    }
}