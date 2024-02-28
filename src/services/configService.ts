import { Canvas } from "../types/canvas";
import { PomodoroState } from "../types/pomodoroState";
import { Helper } from "./Helper";

export class Config {
    constructor() {
    }

    public saveItem(key:string, id: string): void {
        localStorage.setItem(key, id);
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

    public getActiveBoardIndex(): number {
        const item = this.getItem("ab");
        return item !== null && item !== undefined ? parseInt(item) : 1;
    }

    public saveActiveBoardIndex(index: number): void {
        this.saveItem("ab", index.toString());
    }

    public saveCanvas(index: number, canvas: Canvas, force?: boolean): void {
        console.debug('save local canvas');
        
        if (index>0) {
            this.saveItem("b" + index, JSON.stringify(canvas));
        }
        Data.saveCanvas(index, canvas, force);
    }

    public async getRemoteCanvas(boardGUID: string): Promise<Canvas> {
        return await Data.getCanvas(boardGUID);
    }

    public async getCanvas(boardIndex: number): Promise<Canvas> {
        console.debug('getting canvas...');
        
        let canvasRemote;
        let boardGUID = await Data.getGUIDByIndex(boardIndex);

        if (boardGUID) {
            canvasRemote = await Data.getCanvas(boardGUID);
        }
        
        const canvasLocalString = this.getItem("b" + boardIndex);
        const canvasLocal: Canvas | null = canvasLocalString ? JSON.parse(canvasLocalString) : null;
    
        if (canvasRemote && canvasLocal) {
            let remoteUp = !canvasLocal.timestamp || canvasRemote.timestamp >= canvasLocal.timestamp;
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

        let guid = Helper.generateCompactGUID();
        return { guid: guid, isnew: true, content: '{}', colorIndex: 0, shared: false, cfd: {} };
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

