import { Dashboard } from "../types/dashboard";
import { Canvas } from "../types/canvas";
import { PomodoroState } from "../types/pomodoroState";

export class Config {
    constructor() {
    }

    public saveItem(key:string, id: string): void {
        localStorage.setItem(key, id);
    }

    public saveDataItem(queue: string, key:string, data: string): void {
        Data.saveItem(queue, key, data, false);
    }

    public getItem(key:string): string | null {
        return localStorage.getItem(key);
    }

    public getLocalOpenAIAPIKey(): string | null {
        return this.getItem("openAIAPIKey");
    }

    public saveLocalOpenAIAPIKey(apikey:string):void {
        this.saveItem("openAIAPIKey", apikey);
    }

    public getActiveDashboard(): string | number {
        return this.getItem("ad") ?? 1;
    }

    public saveActiveDashboard(id: string): void {
        this.saveItem("ad", id);
    }

    public saveCanvas(id: number, canvas: Canvas, force?: boolean): void {
        console.debug('save local canvas');
        
        this.saveItem("c" + id, JSON.stringify(canvas));
        Data.saveCanvas(id, canvas, force);
    }

    public async getItemTimestamp (object: string, key: string) {
        console.debug('getting object...');

        const objRemote = await Data.getItem(object, key);
        const objLocalS  = this.getItem(key);
        const objLocal  =  objLocalS ? JSON.parse(objLocalS) : null;
        
        if (objLocal && objRemote) { 
            let remoteUp = !objLocal.timestamp || objRemote.timestamp > objLocal.timestamp;
            if (remoteUp) console.debug('remote loaded (2)');
            else console.debug('local loaded (2)');
            return remoteUp ? objRemote : objLocal;
        } else if (objRemote) {
            console.debug('remote loaded (1)');
            return objRemote;
        } else if (objLocal) {
            console.debug('local loaded (1)');
            return objLocal;
        }
    }

    public async getCanvas(id: number, sharedId: string): Promise<Canvas> {
        console.debug('getting canvas...');
        
        const canvasRemotePromise = Data.getCanvas(id, sharedId);
        const canvasLocalString = this.getItem("c" + id);
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

