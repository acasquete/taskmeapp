import { Dashboard } from "../types/dashboard";
import { Canvas } from "../types/canvas";
import { PomodoroState } from "../types/pomodoroState";

export class Config {
    constructor() {
    }

    public getLocalOpenAIAPIKey(): string | null {
        return localStorage.getItem("openAIAPIKey");
    }

    public saveLocalOpenAIAPIKey(apikey:string):void {
        localStorage.setItem("openAIAPIKey", apikey);
    }

    public getActiveDashboard(): string | number {
        return localStorage.getItem("ad") ?? 1;
    }

    public saveActiveDashboard(id: string): void {
        localStorage.setItem("ad", id);
    }

    public saveCanvas(id: number, canvas: Canvas): void {
        console.debug('save local canvas');
        localStorage.setItem("c" + id, JSON.stringify(canvas));
        
        Data.saveCanvas(id, canvas);
    }

    public async getCanvas(id: number, sharedId: string): Promise<Canvas> {
        console.debug('getting canvas...');
        
        const canvasRemotePromise = Data.getCanvas(id, sharedId);
        const canvasLocalString = localStorage.getItem("c" + id);
        const canvasLocal: Canvas | null = canvasLocalString ? JSON.parse(canvasLocalString) : null;
    
        const canvasRemote: Canvas | null = await canvasRemotePromise;
    
        if (canvasRemote && canvasLocal) {
            let remoteUp = !canvasLocal.timestamp || canvasRemote.timestamp > canvasLocal.timestamp;
            
            if (remoteUp) console.debug('remote canvas loaded (2)');
            else console.debug('local canvas loaded (2)');

            return remoteUp ? canvasRemote : canvasLocal;
        } else if (canvasRemote) {
            console.debug('remote canvas loaded (1)');
            return canvasRemote;
        } else if (canvasLocal) {
            console.debug('local canvas loaded (1)');
            return canvasLocal;
        }
    
        console.debug('new canvas loaded (0)');
        return { isnew: true, content: '{}', colorIndex: 0, sharedCanvasId: ''};
    }

    public getPomodoroState(): PomodoroState {
        let pomodoroString = localStorage.getItem("p");
        let pomodoro: PomodoroState = {};

        if (pomodoroString) {
            pomodoro = JSON.parse(pomodoroString);
        } 

        return pomodoro;
    }

    public savePomodoroState(state: PomodoroState): void {
        localStorage.setItem("p", JSON.stringify(state));
    }
}

