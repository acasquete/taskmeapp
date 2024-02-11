import { Dashboard } from "../types/dashboard";
import { Canvas } from "../types/canvas";
import { PomodoroState } from "../types/pomodoroState";

export class Config {
    constructor() {
    }

    getLocalOpenAIAPIKey(): string | null {
        return localStorage.getItem("openAIAPIKey");
    }

    getActiveDashboard(): string | number {
        return localStorage.getItem("ad") ?? 1;
    }

    saveActiveDashboard(id: string): void {
        localStorage.setItem("ad", id);
    }

    public static saveCanvas(id: number, canvas: Canvas): void {
        localStorage.setItem("c" + id, JSON.stringify(canvas));
        Data.saveCanvas(id, canvas);
    }

    async getCanvas(id: string, sharedId: string): Promise<Canvas> {
        const canvasRemote: Canvas | null = await Data.getCanvas(id, sharedId);
        if (canvasRemote != null) {
            return canvasRemote;
        }
    
        const canvasString = localStorage.getItem("c" + id);
        return canvasString ? JSON.parse(canvasString) : { content: '{}', colorIndex: 0, sharedCanvasId: '' };
    }

    getPomodoroState(): PomodoroState {
        let pomodoroString = localStorage.getItem("p");
        let pomodoro: PomodoroState = {};

        if (pomodoroString) {
            pomodoro = JSON.parse(pomodoroString);
        } 

        return pomodoro;
    }

    savePomodoroState(state: PomodoroState): void {
        localStorage.setItem("p", JSON.stringify(state));
    }
}

