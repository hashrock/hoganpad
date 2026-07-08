import { BoxItem, Item } from '../types';
import { Selection, SelectionComputed } from './state';

/** Selection を正規化した矩形に変換する。 */
export function getSelectionRect(selection: Selection): SelectionComputed {
  const { cursor, anchor } = selection;
  return {
    left: Math.min(cursor.x, anchor.x),
    top: Math.min(cursor.y, anchor.y),
    right: Math.max(cursor.x, anchor.x),
    bottom: Math.max(cursor.y, anchor.y),
    w: Math.abs(cursor.x - anchor.x) + 1,
    h: Math.abs(cursor.y - anchor.y) + 1,
  };
}

/** (x, y) を内側に含む box を返す。 */
export function findContainingBox(
  items: Item[],
  x: number,
  y: number
): BoxItem | undefined {
  return items.find(
    (i): i is BoxItem =>
      i.type === 'box' &&
      i.x <= x &&
      x <= i.x + i.width - 1 &&
      i.y <= y &&
      y <= i.y + i.height - 1
  );
}

/** (x, y) にちょうど始まる item を返す（左上セルが一致）。 */
export function getItemAt(items: Item[], x: number, y: number): Item | undefined {
  return items.find((it) => it.x === x && it.y === y);
}

/** box 全体を覆う選択を作る（cursor=左上, anchor=右下）。 */
export function expandSelectionToBox(box: BoxItem): Selection {
  return {
    cursor: { x: box.x, y: box.y },
    anchor: { x: box.x + box.width - 1, y: box.y + box.height - 1 },
  };
}

/** 単一セルの選択を作る。 */
export function singleCell(x: number, y: number): Selection {
  return { cursor: { x, y }, anchor: { x, y } };
}
