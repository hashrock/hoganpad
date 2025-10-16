export interface Selection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SelectionComputed {
  left: number;
  top: number;
  right: number;
  bottom: number;
  w: number;
  h: number;
}

export interface Item {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'text' | 'box';
  text: string;
  style?: string;
}

export interface Position {
  top: string;
  left: string;
  opacity?: number;
}
