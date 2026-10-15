import { Doc, Frame, Page, Style } from '../model/doc';
import { Point } from '../model/rect';
import { cellSelection, Selection } from './selection';

export interface Editing {
  value: string;
  /**
   * enter: 入力を始めた直後。矢印キーで確定して移動する（Excel の「入力モード」）。
   * edit: F2 / ダブルクリック。矢印キーは文字列内のキャレット移動（「編集モード」）。
   */
  mode: 'enter' | 'edit';
}

export interface EditorState {
  doc: Doc;
  selection: Selection;
  editing: Editing | null;
  past: Doc[];
  future: Doc[];
}

export type ToggleKey = 'bold' | 'italic' | 'wrap';

export type Action =
  /** クリック。extend で Shift+クリック / ドラッグ。 */
  | { type: 'select'; point: Point; extend: boolean }
  | { type: 'selectAll' }
  /** 矢印・Enter・Tab。extend で Shift 付き（範囲拡張）。 */
  | { type: 'move'; dx: number; dy: number; extend: boolean }
  /** value 付きは上書き入力の開始、なしは既存テキストの編集開始。 */
  | { type: 'startEdit'; value?: string }
  | { type: 'updateEdit'; value: string }
  | { type: 'cancelEdit' }
  | { type: 'delete' }
  /** 選択範囲を 1 つの罫線ボックスに結合する。 */
  | { type: 'merge' }
  /** 選択中のフレームにスタイルを適用。フレームが無ければ選択範囲にフレームを作る。 */
  | { type: 'setStyle'; style: Partial<Style> }
  | { type: 'toggleStyle'; key: ToggleKey }
  | { type: 'moveFrames'; dx: number; dy: number }
  | { type: 'resizeFrames'; dw: number; dh: number }
  | { type: 'reorder'; to: 'front' | 'back' }
  /** 左上 (0,0) 基準のフレーム群をアクティブセル位置に貼り付ける。 */
  | { type: 'paste'; frames: Frame[] }
  | { type: 'setPage'; page: Partial<Page> }
  | { type: 'load'; doc: Doc }
  | { type: 'undo' }
  | { type: 'redo' };

export function createState(doc: Doc): EditorState {
  return { doc, selection: cellSelection({ x: 0, y: 0 }), editing: null, past: [], future: [] };
}
