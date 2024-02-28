export interface Canvas {
    guid: string,
    content: string;
    colorIndex: number;
    shared: boolean;
    timestamp?: number;
    isnew?: boolean;
    cfd?: Record<string, Record<string, number>>; 
}

