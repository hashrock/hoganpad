import { describe, it, expect } from 'vitest';
import type { BoxItem, Item } from '../src/types';
import {
  editorReducer,
  getSelectionRect,
  type EditorState,
  type Selection,
} from '../src/editor';

// reducer 本体（moveArrow の box skip ロジック）を直接検証する。
// 選択は cursor(動く方)/anchor(固定端) で表す。

/** 旧 {x1,y1,x2,y2} 記法で Selection を組む簡易ヘルパ。 */
function sel(x1: number, y1: number, x2: number, y2: number): Selection {
  return { cursor: { x: x1, y: y1 }, anchor: { x: x2, y: y2 } };
}

function makeState(items: Item[], selection: Selection): EditorState {
  return { items, selection, editing: null };
}

function arrow(state: EditorState, dx: number, dy: number): EditorState {
  return editorReducer(state, { type: 'moveArrow', dx, dy, shift: false });
}

const box2x2: BoxItem = {
  x: 2,
  y: 2,
  width: 2,
  height: 2,
  type: 'box',
  text: '',
};

describe('2x2ボックスへの侵入（選択がボックス全体に展開）', () => {
  const expanded = sel(2, 2, 3, 3);

  it('左から右矢印で侵入 → ボックス全体が選択される', () => {
    const s = arrow(makeState([box2x2], sel(1, 2, 1, 2)), 1, 0);
    expect(s.selection).toEqual(expanded);
  });

  it('右から左矢印で侵入 → ボックス全体が選択される', () => {
    const s = arrow(makeState([box2x2], sel(4, 2, 4, 2)), -1, 0);
    expect(s.selection).toEqual(expanded);
  });

  it('上から下矢印で侵入 → ボックス全体が選択される', () => {
    const s = arrow(makeState([box2x2], sel(2, 1, 2, 1)), 0, 1);
    expect(s.selection).toEqual(expanded);
  });

  it('下から上矢印で侵入 → ボックス全体が選択される', () => {
    const s = arrow(makeState([box2x2], sel(2, 4, 2, 4)), 0, -1);
    expect(s.selection).toEqual(expanded);
  });
});

describe('2x2ボックスからの脱出（box skip）', () => {
  const insideExpanded = sel(2, 2, 3, 3);

  it('右矢印で右端の外側に抜ける', () => {
    const s = arrow(makeState([box2x2], insideExpanded), 1, 0);
    expect(s.selection).toEqual(sel(4, 2, 4, 2));
  });

  it('左矢印で左端の外側に抜ける', () => {
    const s = arrow(makeState([box2x2], insideExpanded), -1, 0);
    expect(s.selection).toEqual(sel(1, 2, 1, 2));
  });

  it('下矢印で下端の外側に抜ける', () => {
    const s = arrow(makeState([box2x2], insideExpanded), 0, 1);
    expect(s.selection).toEqual(sel(2, 4, 2, 4));
  });

  it('上矢印で上端の外側に抜ける', () => {
    const s = arrow(makeState([box2x2], insideExpanded), 0, -1);
    expect(s.selection).toEqual(sel(2, 1, 2, 1));
  });
});

describe('幅10のボックス', () => {
  const wideBox: BoxItem = {
    x: 2,
    y: 2,
    width: 10,
    height: 2,
    type: 'box',
    text: '',
  };

  it('侵入時に選択が幅10全体に展開される', () => {
    const s = arrow(makeState([wideBox], sel(1, 2, 1, 2)), 1, 0);
    expect(s.selection).toEqual(sel(2, 2, 11, 3));
  });

  it('右矢印で幅に関わらず右外に一発で抜ける', () => {
    const s = arrow(makeState([wideBox], sel(2, 2, 11, 3)), 1, 0);
    expect(s.selection).toEqual(sel(12, 2, 12, 2));
  });

  it('左矢印で幅に関わらず左外に一発で抜ける', () => {
    const s = arrow(makeState([wideBox], sel(2, 2, 11, 3)), -1, 0);
    expect(s.selection).toEqual(sel(1, 2, 1, 2));
  });
});

describe('連続移動シナリオ', () => {
  it('左から右3回で 箱の左→箱全体選択→箱の右外→さらに右 と進む', () => {
    let s = makeState([box2x2], sel(1, 2, 1, 2));
    s = arrow(s, 1, 0);
    expect(s.selection).toEqual(sel(2, 2, 3, 3));
    s = arrow(s, 1, 0);
    expect(s.selection).toEqual(sel(4, 2, 4, 2));
    s = arrow(s, 1, 0);
    expect(s.selection).toEqual(sel(5, 2, 5, 2));
  });
});

describe('text アイテム上での挙動', () => {
  const textItem: Item = {
    x: 5,
    y: 5,
    type: 'text',
    text: 'hello',
  };

  it('text アイテム上では box skip は発動せず1セル移動', () => {
    const s = arrow(makeState([textItem], sel(5, 5, 5, 5)), 1, 0);
    expect(s.selection).toEqual(sel(6, 5, 6, 5));
  });
});

describe('編集の確定（commitEdit）', () => {
  it('空セルで単一選択 → text アイテムが新規作成される', () => {
    let s = makeState([], sel(3, 3, 3, 3));
    s = editorReducer(s, { type: 'startEdit' });
    s = editorReducer(s, { type: 'changeEditValue', value: 'ほげ' });
    s = editorReducer(s, { type: 'commitEdit' });
    expect(s.editing).toBeNull();
    expect(s.items).toEqual([{ type: 'text', x: 3, y: 3, text: 'ほげ' }]);
  });

  it('複数セル選択 → box アイテムが新規作成される', () => {
    let s = makeState([], sel(2, 2, 4, 3));
    s = editorReducer(s, { type: 'startEdit' });
    s = editorReducer(s, { type: 'changeEditValue', value: '箱' });
    s = editorReducer(s, { type: 'commitEdit' });
    expect(s.items).toEqual([
      { type: 'box', x: 2, y: 2, width: 3, height: 2, text: '箱' },
    ]);
  });

  it('既存アイテム上での編集 → テキストのみ更新される', () => {
    const item: Item = { type: 'text', x: 1, y: 1, text: 'old' };
    let s = makeState([item], sel(1, 1, 1, 1));
    s = editorReducer(s, { type: 'startEdit' });
    expect(s.editing).toEqual({ value: 'old' });
    s = editorReducer(s, { type: 'changeEditValue', value: 'new' });
    s = editorReducer(s, { type: 'commitEdit' });
    expect(s.items).toEqual([{ type: 'text', x: 1, y: 1, text: 'new' }]);
  });

  it('移動アクションは編集を確定してからカーソルを動かす', () => {
    let s = makeState([], sel(0, 0, 0, 0));
    s = editorReducer(s, { type: 'startEdit' });
    s = editorReducer(s, { type: 'changeEditValue', value: 'a' });
    s = editorReducer(s, { type: 'moveRelative', dx: 0, dy: 1, shift: false });
    expect(s.editing).toBeNull();
    expect(s.items).toContainEqual({ type: 'text', x: 0, y: 0, text: 'a' });
    expect(s.selection).toEqual(sel(0, 1, 0, 1));
  });
});

describe('削除（remove）', () => {
  it('選択セルの item を削除する', () => {
    const item: Item = { type: 'text', x: 5, y: 5, text: 'x' };
    const s = editorReducer(makeState([item], sel(5, 5, 5, 5)), { type: 'remove' });
    expect(s.items).toEqual([]);
  });

  it('box を選択して削除する', () => {
    const s = editorReducer(makeState([box2x2], sel(2, 2, 3, 3)), { type: 'remove' });
    expect(s.items).toEqual([]);
  });
});

describe('getSelectionRect', () => {
  it('cursor/anchor の前後関係に依らず正規化する', () => {
    expect(getSelectionRect(sel(3, 3, 1, 1))).toEqual({
      left: 1,
      top: 1,
      right: 3,
      bottom: 3,
      w: 3,
      h: 3,
    });
  });
});
