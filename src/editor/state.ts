import { Item } from '../types';

/** グリッド上の座標（セル単位）。 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 選択範囲。cursor と anchor の 2 点で表す。
 * - cursor: ドラッグ / Shift / 矢印で動く「主カーソル」。編集位置であり、box 判定の基準。
 * - anchor: クリック起点で固定される選択の反対端。
 * 単一セル選択では cursor === anchor。
 */
export interface Selection {
  cursor: Point;
  anchor: Point;
}

/** Selection を正規化した矩形（描画・判定用）。getSelectionRect で導出する。 */
export interface SelectionComputed {
  left: number;
  top: number;
  right: number;
  bottom: number;
  w: number;
  h: number;
}

/**
 * エディタのドメイン状態。
 * mouseDown / shiftDown のような入力デバイス状態はここには含めない（App の useState で持つ）。
 */
export interface EditorState {
  items: Item[];
  selection: Selection;
  /** null = 非編集 / { value } = セル編集中。「編集中フラグ」と「編集値」を 1 つに統合。 */
  editing: { value: string } | null;
}

export type Action =
  /** クリック / pointerDown。指定セルへカーソル移動（box なら全体選択）。 */
  | { type: 'moveTo'; x: number; y: number }
  /** ドラッグ中。anchor を固定したまま cursor だけ動かす。 */
  | { type: 'dragTo'; x: number; y: number }
  /** 矢印キー。box skip 込みで移動。shift 時は選択を伸縮。 */
  | { type: 'moveArrow'; dx: number; dy: number; shift: boolean }
  /** Enter 確定後などの相対移動。shift 時は選択を伸縮。 */
  | { type: 'moveRelative'; dx: number; dy: number; shift: boolean }
  /** セル編集を開始（選択セルの現在テキストを初期値にする）。 */
  | { type: 'startEdit' }
  /** 編集中の入力値を更新。 */
  | { type: 'changeEditValue'; value: string }
  /** 編集内容を items へ確定し、編集を終了。 */
  | { type: 'commitEdit' }
  /** 選択セルの item を削除。 */
  | { type: 'remove' };

const initialItems: Item[] = [
  {
    x: 1,
    y: 1,
    type: 'text',
    text: 'Excel方眼紙だよ',
    style: 'bold',
  },
  {
    x: 2,
    y: 2,
    type: 'box',
    width: 10,
    height: 2,
    text: '箱だよ',
  },
];

export const initialState: EditorState = {
  items: initialItems,
  selection: { cursor: { x: 0, y: 0 }, anchor: { x: 0, y: 1 } },
  editing: null,
};
