import { AREA_STYLE, BOX_STYLE, Doc, Frame, gridSize, isBlank, Style, TEXT_STYLE } from '../model/doc';
import { clamp, Rect, union } from '../model/rect';
import {
  cellSelection,
  frameIndexAt,
  frameIndicesIn,
  rectSelection,
  Selection,
  selectionRect,
  step,
} from './selection';
import { Action, createState, EditorState } from './state';

const HISTORY_LIMIT = 200;

type Grid = { cols: number; rows: number };

export function currentRect(state: EditorState): Rect {
  return selectionRect(state.selection, state.doc.frames);
}

export function selectedIndices(state: EditorState): number[] {
  return frameIndicesIn(state.doc.frames, currentRect(state));
}

/** アクティブセルのフレーム、なければ選択中の最前面フレーム。ツールバー表示の基準。 */
export function activeFrame(state: EditorState): Frame | undefined {
  const { frames } = state.doc;
  return frames[frameIndexAt(frames, state.selection.focus)] ?? frames[selectedIndices(state).at(-1) ?? -1];
}

/**
 * 入力の行き先。アクティブセルにフレームがあればそれ、なければ
 * 選択範囲（フレームを含まない場合）かアクティブセル 1 マスに新しいフレームを作る。
 */
export function editTarget(state: EditorState): { index: number; rect: Rect } {
  const { frames } = state.doc;
  const { focus } = state.selection;
  const index = frameIndexAt(frames, focus);
  if (index >= 0) return { index, rect: frames[index].rect };
  const rect = currentRect(state);
  if (frameIndicesIn(frames, rect).length === 0) return { index, rect };
  return { index, rect: { ...focus, w: 1, h: 1 } };
}

export function defaultStyle(rect: Rect): Style {
  return rect.w === 1 && rect.h === 1 ? TEXT_STYLE : AREA_STYLE;
}

/** ページからはみ出さないよう位置とサイズを詰める。 */
function fitRect(r: Rect, grid: Grid): Rect {
  const w = Math.min(r.w, grid.cols);
  const h = Math.min(r.h, grid.rows);
  return { x: clamp(r.x, 0, grid.cols - w), y: clamp(r.y, 0, grid.rows - h), w, h };
}

function boundingRect(rects: Rect[]): Rect {
  return rects.reduce(union);
}

/** ドキュメントを差し替え、変更があれば undo 履歴に積む。 */
function withDoc(state: EditorState, doc: Doc): EditorState {
  if (doc === state.doc) return state;
  return { ...state, doc, past: [...state.past, state.doc].slice(-HISTORY_LIMIT), future: [] };
}

function withFrames(state: EditorState, frames: Frame[], selection?: Selection): EditorState {
  const next = withDoc(state, { ...state.doc, frames });
  return selection ? { ...next, selection } : next;
}

function commit(state: EditorState): EditorState {
  if (!state.editing) return state;
  const { value } = state.editing;
  const closed = { ...state, editing: null };
  const { frames } = state.doc;
  const { index, rect } = editTarget(state);

  if (index < 0) {
    if (value === '') return closed;
    return withFrames(closed, [...frames, { rect, text: value, style: defaultStyle(rect) }]);
  }
  if (frames[index].text === value) return closed;
  const edited = { ...frames[index], text: value };
  return withFrames(
    closed,
    isBlank(edited) ? frames.filter((_, i) => i !== index) : frames.with(index, edited),
  );
}

/** 選択中のフレームの矩形を変換し、選択を変換後のフレームに合わせる。 */
function transformSelected(state: EditorState, fn: (r: Rect) => Rect): EditorState {
  const indices = new Set(selectedIndices(state));
  if (indices.size === 0) return state;
  const frames = state.doc.frames.map((f, i) => (indices.has(i) ? { ...f, rect: fn(f.rect) } : f));
  const moved = frames.filter((_, i) => indices.has(i)).map((f) => f.rect);
  return withFrames(state, frames, rectSelection(boundingRect(moved)));
}

function setStyle(state: EditorState, style: Partial<Style>): EditorState {
  const indices = new Set(selectedIndices(state));
  const { frames } = state.doc;
  if (indices.size === 0) {
    // Excel で空のセルに書式を付けるのと同じく、選択範囲に書式だけのフレームを作る
    const rect = currentRect(state);
    return withFrames(state, [...frames, { rect, text: '', style: { ...defaultStyle(rect), ...style } }]);
  }
  return withFrames(
    state,
    frames.map((f, i) => (indices.has(i) ? { ...f, style: { ...f.style, ...style } } : f)),
  );
}

function clampPoint(p: { x: number; y: number }, grid: Grid) {
  return { x: clamp(p.x, 0, grid.cols - 1), y: clamp(p.y, 0, grid.rows - 1) };
}

function reduce(state: EditorState, action: Action): EditorState {
  const { frames } = state.doc;
  const grid = gridSize(state.doc.page);

  switch (action.type) {
    case 'select': {
      const point = clampPoint(action.point, grid);
      const selection = action.extend ? { ...state.selection, focus: point } : cellSelection(point);
      return { ...state, selection };
    }

    case 'selectAll':
      return { ...state, selection: { anchor: { x: 0, y: 0 }, focus: { x: grid.cols - 1, y: grid.rows - 1 } } };

    case 'move': {
      const focus = step(frames, state.selection.focus, action.dx, action.dy, grid);
      const selection = action.extend ? { ...state.selection, focus } : cellSelection(focus);
      return { ...state, selection };
    }

    case 'startEdit':
      return {
        ...state,
        editing:
          action.value === undefined
            ? { value: frames[editTarget(state).index]?.text ?? '', mode: 'edit' }
            : { value: action.value, mode: 'enter' },
      };

    case 'updateEdit':
      return state.editing ? { ...state, editing: { ...state.editing, value: action.value } } : state;

    case 'commitEdit':
      return state; // 確定は reducer 冒頭の commit が行う

    case 'cancelEdit':
      return { ...state, editing: null };

    case 'delete': {
      const indices = new Set(selectedIndices(state));
      if (indices.size === 0) return state;
      return withFrames(state, frames.filter((_, i) => !indices.has(i)));
    }

    case 'merge': {
      const rect = currentRect(state);
      const indices = new Set(selectedIndices(state));
      const text = frames
        .filter((_, i) => indices.has(i))
        .map((f) => f.text)
        .filter(Boolean)
        .join('\n');
      return withFrames(
        state,
        [...frames.filter((_, i) => !indices.has(i)), { rect, text, style: BOX_STYLE }],
        rectSelection(rect),
      );
    }

    case 'setStyle':
      return setStyle(state, action.style);

    case 'toggleStyle':
      return setStyle(state, { [action.key]: !(activeFrame(state)?.style[action.key] ?? false) });

    case 'moveFrames': {
      const indices = selectedIndices(state);
      if (indices.length === 0) return state;
      const box = boundingRect(indices.map((i) => frames[i].rect));
      const dx = clamp(action.dx, -box.x, grid.cols - box.x - box.w);
      const dy = clamp(action.dy, -box.y, grid.rows - box.y - box.h);
      if (dx === 0 && dy === 0) return state;
      return transformSelected(state, (r) => ({ ...r, x: r.x + dx, y: r.y + dy }));
    }

    case 'resizeFrames':
      return transformSelected(state, (r) => ({
        ...r,
        w: clamp(r.w + action.dw, 1, grid.cols - r.x),
        h: clamp(r.h + action.dh, 1, grid.rows - r.y),
      }));

    case 'reorder': {
      const indices = new Set(selectedIndices(state));
      if (indices.size === 0) return state;
      const picked = frames.filter((_, i) => indices.has(i));
      const rest = frames.filter((_, i) => !indices.has(i));
      return withFrames(state, action.to === 'front' ? [...rest, ...picked] : [...picked, ...rest]);
    }

    case 'paste': {
      if (action.frames.length === 0) return state;
      const origin = currentRect(state);
      const pasted = action.frames.map((f) => ({
        ...f,
        rect: fitRect({ ...f.rect, x: f.rect.x + origin.x, y: f.rect.y + origin.y }, grid),
      }));
      return withFrames(state, [...frames, ...pasted], rectSelection(boundingRect(pasted.map((f) => f.rect))));
    }

    case 'setPage': {
      const page = { ...state.doc.page, ...action.page };
      const nextGrid = gridSize(page);
      const doc = { page, frames: frames.map((f) => ({ ...f, rect: fitRect(f.rect, nextGrid) })) };
      return { ...withDoc(state, doc), selection: cellSelection(clampPoint(state.selection.focus, nextGrid)) };
    }

    case 'load':
      return { ...withDoc(state, action.doc), selection: createState(action.doc).selection };

    case 'undo': {
      const doc = state.past.at(-1);
      if (!doc) return state;
      return { ...state, doc, past: state.past.slice(0, -1), future: [state.doc, ...state.future] };
    }

    case 'redo': {
      const [doc, ...future] = state.future;
      if (!doc) return state;
      return { ...state, doc, past: [...state.past, state.doc], future };
    }
  }
}

const EDIT_ACTIONS = new Set<Action['type']>(['startEdit', 'updateEdit', 'cancelEdit']);

export function editorReducer(state: EditorState, action: Action): EditorState {
  // 編集中に他の操作が来たら、Excel と同じく先に入力を確定する
  return reduce(EDIT_ACTIONS.has(action.type) ? state : commit(state), action);
}
