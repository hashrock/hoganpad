import { Item } from '../types';
import { Action, EditorState, Selection } from './state';
import {
  expandSelectionToBox,
  findContainingBox,
  getItemAt,
  getSelectionRect,
  singleCell,
} from './selectors';

/** 選択セル（左上）に item があればそのテキスト、なければ ''。 */
function selectedText(state: EditorState): string {
  const rect = getSelectionRect(state.selection);
  return getItemAt(state.items, rect.left, rect.top)?.text ?? '';
}

/** 編集中の内容を items に確定し、editing を閉じる。非編集ならそのまま返す。 */
function commit(state: EditorState): EditorState {
  if (state.editing === null) return state;
  const value = state.editing.value;
  const rect = getSelectionRect(state.selection);
  const target = getItemAt(state.items, rect.left, rect.top);

  let items: Item[];
  if (target) {
    // 既存 item のテキストを更新
    items = state.items.map((it) => (it === target ? { ...it, text: value } : it));
  } else if (rect.w > 1 || rect.h > 1) {
    // 複数セル選択 → box を新規作成
    items = [
      ...state.items,
      { type: 'box', x: rect.left, y: rect.top, width: rect.w, height: rect.h, text: value },
    ];
  } else {
    // 単一セル → text を新規作成
    items = [...state.items, { type: 'text', x: rect.left, y: rect.top, text: value }];
  }
  return { ...state, items, editing: null };
}

/** 指定セルへカーソルを移動する。box に着地したら box 全体を選択。 */
function moveToCell(state: EditorState, x: number, y: number): EditorState {
  const box = findContainingBox(state.items, x, y);
  const selection: Selection = box ? expandSelectionToBox(box) : singleCell(x, y);
  return { ...state, selection };
}

export function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'moveTo':
      return moveToCell(commit(state), action.x, action.y);

    case 'dragTo':
      return {
        ...state,
        selection: { ...state.selection, cursor: { x: action.x, y: action.y } },
      };

    case 'moveArrow': {
      const { cursor } = state.selection;
      const box = findContainingBox(state.items, cursor.x, cursor.y);
      // box 内にいる時は反対端の外へ一発ジャンプ、そうでなければ 1 セル移動
      const nx = box
        ? action.dx > 0
          ? box.x + box.width
          : action.dx < 0
            ? box.x - 1
            : cursor.x
        : cursor.x + action.dx;
      const ny = box
        ? action.dy > 0
          ? box.y + box.height
          : action.dy < 0
            ? box.y - 1
            : cursor.y
        : cursor.y + action.dy;
      if (action.shift) {
        return {
          ...state,
          selection: { ...state.selection, cursor: { x: nx, y: ny } },
        };
      }
      return moveToCell(commit(state), nx, ny);
    }

    case 'moveRelative': {
      const { cursor } = state.selection;
      const nx = cursor.x + action.dx;
      const ny = cursor.y + action.dy;
      if (action.shift) {
        return {
          ...state,
          selection: { ...state.selection, cursor: { x: nx, y: ny } },
        };
      }
      return moveToCell(commit(state), nx, ny);
    }

    case 'startEdit':
      return { ...state, editing: { value: selectedText(state) } };

    case 'changeEditValue':
      if (state.editing === null) return state;
      return { ...state, editing: { value: action.value } };

    case 'commitEdit':
      return commit(state);

    case 'remove': {
      const rect = getSelectionRect(state.selection);
      const target = getItemAt(state.items, rect.left, rect.top);
      if (!target) return state;
      return { ...state, items: state.items.filter((it) => it !== target) };
    }

    default:
      return state;
  }
}
