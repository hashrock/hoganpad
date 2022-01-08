export interface Item {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: "text" | "box";
  style?: string;
}
