import { describe, expect, it } from 'vitest';
import {
  Action,
  cellSelection,
  createState,
  currentRect,
  editorReducer,
  EditorState,
  rectSelection,
} from '../src/editor';
import { BOX_STYLE, Doc, EMPTY_DOC, Frame, gridSize, TEXT_STYLE } from '../src/model/doc';
import { containsRect, intersects, Rect } from '../src/model/rect';

function frame(rect: Rect, text = ''): Frame {
  return { rect, text, style: BOX_STYLE };
}

function stateWith(frames: Frame[], at = { x: 0, y: 0 }): EditorState {
  const doc: Doc = { ...EMPTY_DOC, frames };
  return { ...createState(doc), selection: cellSelection(at) };
}

function run(state: EditorState, ...actions: Action[]): EditorState {
  return actions.reduce(editorReducer, state);
}

const move = (dx: number, dy: number, extend = false): Action => ({ type: 'move', dx, dy, extend });
const box = frame({ x: 2, y: 2, w: 3, h: 2 }, '箱');

describe('カーソル移動（結合セル相当のフレーム）', () => {
  it('フレームに入るとフレーム全体が選択される', () => {
    const s = run(stateWith([box], { x: 1, y: 3 }), move(1, 0));
    expect(currentRect(s)).toEqual(box.rect);
  });

  it('フレームからは 1 歩で反対側の外へ抜ける（行は保つ）', () => {
    const s = run(stateWith([box], { x: 1, y: 3 }), move(1, 0), move(1, 0));
    expect(s.selection.focus).toEqual({ x: 5, y: 3 });
    expect(run(stateWith([box], { x: 3, y: 2 }), move(0, -1)).selection.focus).toEqual({ x: 3, y: 1 });
  });

  it('ページ端では止まる', () => {
    const s = run(stateWith([]), move(-1, 0), move(0, -1));
    expect(s.selection.focus).toEqual({ x: 0, y: 0 });
  });

  it('Shift+矢印で範囲を広げ、フレームと交差したらフレームまで含める', () => {
    const s = run(stateWith([box], { x: 0, y: 2 }), move(1, 0, true), move(1, 0, true));
    expect(currentRect(s)).toEqual({ x: 0, y: 2, w: 5, h: 2 });
  });
});

describe('フレームは選択の原子単位（小さな盤面で網羅的に確認）', () => {
  const frames = [frame({ x: 1, y: 1, w: 2, h: 2 }), frame({ x: 3, y: 2, w: 2, h: 1 }), frame({ x: 0, y: 4, w: 5, h: 1 })];
  const points = Array.from({ length: 36 }, (_, i) => ({ x: i % 6, y: Math.floor(i / 6) }));

  it('どの 2 点で範囲選択してもフレームを部分的に切らない', () => {
    for (const anchor of points) {
      for (const focus of points) {
        const rect = currentRect({ ...stateWith(frames), selection: { anchor, focus } });
        for (const f of frames) {
          if (intersects(rect, f.rect)) expect(containsRect(rect, f.rect)).toBe(true);
        }
      }
    }
  });

  it('右を押し続ければどこからでも右端に着き、x は毎回前進する', () => {
    const { cols } = gridSize(EMPTY_DOC.page);
    for (const start of points) {
      let s = stateWith(frames, start);
      for (let i = 0; i < cols && s.selection.focus.x < cols - 1; i++) {
        const before = s.selection.focus.x;
        s = run(s, move(1, 0));
        expect(s.selection.focus.x).toBeGreaterThan(before);
      }
      expect(s.selection.focus.x).toBe(cols - 1);
    }
  });
});

describe('入力', () => {
  it('空セルに打つと 1 マスのテキストが Excel 同様はみ出し表示で作られる', () => {
    const s = run(stateWith([]), { type: 'startEdit', value: 'あ' }, { type: 'updateEdit', value: 'あいう' }, move(0, 1));
    expect(s.doc.frames).toEqual([{ rect: { x: 0, y: 0, w: 1, h: 1 }, text: 'あいう', style: TEXT_STYLE }]);
    expect(s.selection.focus).toEqual({ x: 0, y: 1 });
    expect(s.editing).toBeNull();
  });

  it('範囲を選んで打つと折り返すテキストフレームになる', () => {
    const s = run(
      { ...stateWith([]), selection: rectSelection({ x: 1, y: 1, w: 4, h: 3 }) },
      { type: 'startEdit', value: '文' },
      { type: 'commitEdit' },
    );
    expect(s.doc.frames[0].rect).toEqual({ x: 1, y: 1, w: 4, h: 3 });
    expect(s.doc.frames[0].style.wrap).toBe(true);
  });

  it('F2 で既存テキストを編集し、Esc で取り消せる', () => {
    let s = run(stateWith([box], { x: 2, y: 2 }), { type: 'startEdit' });
    expect(s.editing).toEqual({ value: '箱', mode: 'edit' });
    s = run(s, { type: 'updateEdit', value: '変更' }, { type: 'cancelEdit' });
    expect(s.doc.frames[0].text).toBe('箱');
  });

  it('文字も装飾もなくなったフレームは消える', () => {
    const plain = { rect: { x: 0, y: 0, w: 1, h: 1 }, text: 'a', style: TEXT_STYLE };
    const s = run(stateWith([plain]), { type: 'startEdit' }, { type: 'updateEdit', value: '' }, { type: 'commitEdit' });
    expect(s.doc.frames).toEqual([]);
  });

  it('編集中に別の操作をすると先に確定される', () => {
    const s = run(stateWith([]), { type: 'startEdit', value: 'x' }, { type: 'select', point: { x: 5, y: 5 }, extend: false });
    expect(s.doc.frames[0].text).toBe('x');
  });
});

describe('DTP 操作', () => {
  it('結合で範囲が罫線ボックスになり、中の文字はまとめられる', () => {
    const a = { rect: { x: 0, y: 0, w: 1, h: 1 }, text: 'A', style: TEXT_STYLE };
    const b = { rect: { x: 1, y: 1, w: 1, h: 1 }, text: 'B', style: TEXT_STYLE };
    const s = run({ ...stateWith([a, b]), selection: rectSelection({ x: 0, y: 0, w: 3, h: 2 }) }, { type: 'merge' });
    expect(s.doc.frames).toEqual([{ rect: { x: 0, y: 0, w: 3, h: 2 }, text: 'A\nB', style: BOX_STYLE }]);
  });

  it('空の範囲に罫線を付けるとボックスができる', () => {
    const s = run(
      { ...stateWith([]), selection: rectSelection({ x: 0, y: 0, w: 2, h: 2 }) },
      { type: 'setStyle', style: { border: 'thick' } },
    );
    expect(s.doc.frames[0].style.border).toBe('thick');
  });

  it('移動はページ内に収まり、選択も追従する', () => {
    const s = run(stateWith([box], { x: 2, y: 2 }), { type: 'moveFrames', dx: -10, dy: 1 });
    expect(s.doc.frames[0].rect).toEqual({ x: 0, y: 3, w: 3, h: 2 });
    expect(currentRect(s)).toEqual({ x: 0, y: 3, w: 3, h: 2 });
  });

  it('サイズ変更は 1 マス未満にならない', () => {
    const s = run(stateWith([box], { x: 2, y: 2 }), { type: 'resizeFrames', dw: -5, dh: 1 });
    expect(s.doc.frames[0].rect).toEqual({ x: 2, y: 2, w: 1, h: 3 });
  });

  it('Ctrl+B は太字を切り替える', () => {
    const on = run(stateWith([box], { x: 2, y: 2 }), { type: 'toggleStyle', key: 'bold' });
    expect(on.doc.frames[0].style.bold).toBe(true);
    expect(run(on, { type: 'toggleStyle', key: 'bold' }).doc.frames[0].style.bold).toBe(false);
  });

  it('前面・背面の入れ替え', () => {
    const other = frame({ x: 10, y: 10, w: 1, h: 1 }, '他');
    const s = run(stateWith([box, other], { x: 2, y: 2 }), { type: 'reorder', to: 'front' });
    expect(s.doc.frames.map((f) => f.text)).toEqual(['他', '箱']);
  });

  it('貼り付けはアクティブセル基準で、ページからはみ出さない', () => {
    const { cols } = gridSize(EMPTY_DOC.page);
    const s = run(stateWith([], { x: cols - 1, y: 0 }), { type: 'paste', frames: [frame({ x: 0, y: 0, w: 3, h: 1 })] });
    expect(s.doc.frames[0].rect).toEqual({ x: cols - 3, y: 0, w: 3, h: 1 });
  });

  it('用紙を横にするとページ外のフレームは内側に寄る', () => {
    const { rows } = gridSize({ orientation: 'landscape', cellMm: 5 });
    const low = frame({ x: 0, y: 50, w: 2, h: 2 });
    const s = run(stateWith([low]), { type: 'setPage', page: { orientation: 'landscape' } });
    expect(s.doc.frames[0].rect.y).toBe(rows - 2);
  });
});

describe('元に戻す / やり直す', () => {
  it('ドキュメントの変更だけが履歴に積まれる', () => {
    let s = run(stateWith([box], { x: 2, y: 2 }), { type: 'delete' }, move(1, 0));
    expect(s.past).toHaveLength(1);
    s = run(s, { type: 'undo' });
    expect(s.doc.frames).toEqual([box]);
    s = run(s, { type: 'redo' });
    expect(s.doc.frames).toEqual([]);
  });

  it('新しい変更で redo 履歴は消える', () => {
    const s = run(stateWith([box], { x: 2, y: 2 }), { type: 'delete' }, { type: 'undo' }, { type: 'merge' });
    expect(s.future).toEqual([]);
  });
});
