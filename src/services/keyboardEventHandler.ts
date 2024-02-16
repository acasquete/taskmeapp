import { CanvasController } from './canvasController';

class KeyboardEventHandler {
    constructor(canvasController: CanvasController) {
        this.canvasController = canvasController;
    }

    handleEvent(e) {
        // Early return if in editing mode
        if (this.canvasController.isEditingMode()) return;

        // Handle number key presses with Ctrl or Meta key for switching dashboards
        if ((e.ctrlKey || e.metaKey) && !isNaN(e.key)) {
            this.handleNumberKeyPress(e);
        }

        // Handle copy, paste, undo, redo actions
        if (e.metaKey || e.ctrlKey) {
            this.handleControlKeyPress(e);
        }

        // Handle color and tool changes
        if (['c', 'e', 's', 'h', 't'].includes(e.key.toLowerCase())) {
            this.handleChangeColorKeyPress(e);
        }

        // Handle other specific key actions
        this.handleOtherKeyPress(e);
    }

    handleNumberKeyPress(e) {
        let num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
            this.canvasController.switchDashboard(num);
            e.preventDefault();
        }
    }

    handleControlKeyPress(e) {
        switch (e.keyCode) {
            case 67: // 'C' for Copy
                this.canvasController.Copy();
                e.preventDefault();
                break;
            case 86: // 'V' for Paste
                this.canvasController.Paste();
                e.preventDefault();
                break;
            case 90: // 'Z' for Undo
                e.preventDefault();
                this.canvasController.Undo();
                break;
            case 89: // 'Y' for Redo
                e.preventDefault();
                this.canvasController.Redo();
                break;
        }
    }

    handleChangeColorKeyPress(e) {
        let colorMap = {
            'c': () => (this.canvasController.canvas.isDrawingMode ? (this.canvasController.currentColorIndex + 1) % 4 : undefined),
            'e': 'eraser',
            's': 'selection',
            'h': 'pointer',
            't': 'text'
        };

        let color = colorMap[e.key.toLowerCase()];
        if (typeof color === 'function') {
            color = color();
        }
        if (color !== undefined) {
            this.canvasController.changeColor(color);
        }
    }

    handleOtherKeyPress(e) {
        switch (e.key.toLowerCase()) {
            case 'k':
                this.canvasController.clearCanvas();
                break;
            case 'f':
                this.canvasController.toggleFullscreen();
                break;
            case 'delete':
            case 'backspace':
                this.canvasController.deleteSelectedObjects();
                e.preventDefault();
                break;
            case ' ':
                this.canvasController.defaultZoom();
                e.preventDefault();
                break;
        }
    }
}

// En algún lugar de tu código, donde inicializas el canvasController
const keyboardEventHandler = new KeyboardEventHandler(canvasController);
document.addEventListener('keypress', (e) => keyboardEventHandler.handleEvent(e));
