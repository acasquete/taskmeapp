export interface Dashboard {
    notes: any[];
    dots: any[];
    screenWidth: number | null;
}

declare module 'fabric' {
  namespace fabric {
    interface Object {
      cl: string;
      id: string;
    }
  }
}