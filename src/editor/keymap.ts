import { Action, Editing } from './state';

export interface KeyInput {
  key: string;
  shift: boolean;
  alt: boolean;
  /** Ctrl（Mac では Cmd）。 */
  mod: boolean;
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

const MOD_KEYS: Record<string, Action> = {
  y: { type: 'redo' },
  b: { type: 'toggleStyle', key: 'bold' },
  i: { type: 'toggleStyle', key: 'italic' },
  m: { type: 'merge' },
  a: { type: 'selectAll' },
  ']': { type: 'reorder', to: 'front' },
  '[': { type: 'reorder', to: 'back' },
};

/**
 * キー入力を Excel 風の操作に割り当てる。null はブラウザ既定の動作
 * （文字入力・IME・キャレット移動・クリップボード）に任せることを表す。
 */
export function keyToAction(k: KeyInput, editing: Editing | null): Action | null {
  const arrow = ARROWS[k.key];
  const back = k.shift ? -1 : 1;

  // Enter / Tab は編集中でも非編集でも「確定して移動」（確定は reducer が行う）
  if (k.key === 'Enter' && !k.alt) return { type: 'move', dx: 0, dy: back, extend: false };
  if (k.key === 'Tab') return { type: 'move', dx: back, dy: 0, extend: false };

  if (editing) {
    if (k.key === 'Escape') return { type: 'cancelEdit' };
    if (arrow && editing.mode === 'enter') return { type: 'move', dx: arrow[0], dy: arrow[1], extend: k.shift };
    return null;
  }

  if (arrow) {
    const [dx, dy] = arrow;
    if (k.alt) return k.shift ? { type: 'resizeFrames', dw: dx, dh: dy } : { type: 'moveFrames', dx, dy };
    return { type: 'move', dx, dy, extend: k.shift };
  }
  if (k.mod) {
    const key = k.key.toLowerCase();
    if (key === 'z') return { type: k.shift ? 'redo' : 'undo' };
    return MOD_KEYS[key] ?? null;
  }
  if (k.key === 'F2') return { type: 'startEdit' };
  if (k.key === 'Delete' || k.key === 'Backspace') return { type: 'delete' };
  return null;
}
