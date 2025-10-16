import type { Selection, SelectionComputed, Item } from './types';

export const HEIGHT = 1020;
export const WIDTH = 700;
export const GRID_SIZE = 20;
export const GRID_X = Math.floor(WIDTH / GRID_SIZE);
export const GRID_Y = Math.floor(HEIGHT / GRID_SIZE);

export function range(max: number): number[] {
  return [...new Array(max).keys()];
}

export function computeSelection(selection: Selection): SelectionComputed {
  return {
    left: selection.x1 <= selection.x2 ? selection.x1 : selection.x2,
    top: selection.y1 <= selection.y2 ? selection.y1 : selection.y2,
    right: selection.x1 > selection.x2 ? selection.x1 : selection.x2,
    bottom: selection.y1 > selection.y2 ? selection.y1 : selection.y2,
    w: Math.abs(selection.x1 - selection.x2) + 1,
    h: Math.abs(selection.y1 - selection.y2) + 1,
  };
}

export const examples: Item[] = [
  {
    x: 1,
    y: 1,
    height: 1,
    width: 1,
    type: "text",
    text: "Excel方眼紙だよ",
    style: "bold"
  },
  {
    x: 2,
    y: 2,
    type: "box",
    width: 10,
    height: 2,
    text: "箱だよ"
  }
];
