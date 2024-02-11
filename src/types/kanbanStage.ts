export interface KanbanNote {
  text: string;
  color: string;
  dots: number;
}

export interface KanbanStage {
  name: string;
  notes: KanbanNote[];
}