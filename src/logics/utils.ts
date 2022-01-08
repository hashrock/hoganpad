import { Selection, ComputedSelection } from "./Selection";

export function computeSelection(selection: Selection): ComputedSelection {
  return {
    left: selection.x1 <= selection.x2 ? selection.x1 : selection.x2,
    top: selection.y1 <= selection.y2 ? selection.y1 : selection.y2,
    right: selection.x1 > selection.x2 ? selection.x1 : selection.x2,
    bottom: selection.y1 > selection.y2 ? selection.y1 : selection.y2,
    w: Math.abs(selection.x1 - selection.x2) + 1,
    h: Math.abs(selection.y1 - selection.y2) + 1
  };
}

export function range(max: number) {
  return [...new Array(max).keys()];
}