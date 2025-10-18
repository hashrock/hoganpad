export interface TextItem {
  x: number;
  y: number;
  type: 'text';
  text: string;
  style?: string;
}

export interface BoxItem {
  x: number;
  y: number;
  type: 'box';
  width: number;
  height: number;
  text: string;
}

export type Item = TextItem | BoxItem;

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
