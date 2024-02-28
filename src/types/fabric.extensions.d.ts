import { Object as FabricObject } from 'fabric/fabric-impl';

declare module 'fabric/fabric-impl' {
  interface Object {
    cl?: string;
    id?: string;
    virtual: boolean;
    force: boolean;
    initleft?: number;
  }
}