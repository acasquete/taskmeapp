import { Dashboard } from "../types/dashboard";
import { Canvas } from "../types/canvas";
import { PomodoroState } from "../types/pomodoroState";

export class Config {
    constructor() {
    }

    getActiveDashboard(): string | number {
        return localStorage.getItem("ad") ?? 1;
    }

    saveActiveDashboard(id: string): void {
        localStorage.setItem("ad", id);
    }

    saveDashboard(id: string, dashboard: Dashboard): void {
        localStorage.setItem("d" + id, JSON.stringify(dashboard));
        Data.saveDashboard(id, dashboard);
    }

    async getDashboard(id: string): Promise<Dashboard> {
        const dashboardRemote: Dashboard | null = await Data.getDashboard(id);
        if (dashboardRemote != null) {
            return dashboardRemote;
        }
    
        const dashboardString = localStorage.getItem("d" + id);
        return dashboardString ? JSON.parse(dashboardString) : { notes: [], dots: [], screenWidth: null };
    }

    saveCanvas(id: string, canvas: Canvas): void {
        localStorage.setItem("c" + id, JSON.stringify(canvas));
        Data.saveCanvas(id, canvas);
    }

    async getCanvas(id: string): Promise<Canvas> {
        const canvasRemote: Canvas | null = await Data.getCanvas(id);
        if (canvasRemote != null) {
            return canvasRemote;
        }
    
        const canvasString = localStorage.getItem("c" + id);
        return canvasString ? JSON.parse(canvasString) : { content: '{}', colorIndex: 0 };
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

