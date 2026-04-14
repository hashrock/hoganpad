import { describe, it, expect } from 'vitest';
import type { Item, Selection } from '../src/types';

// src/App.tsx のカーソル移動ロジックをブラウザ無しでエミュレート。
// moveSelection は侵入先にアイテムがあれば選択をアイテム全体に展開する。
// moveSelectionArrow は editingItem 在籍時、その端の外側1マスに絶対ジャンプする。

function findItemAt(items: Item[], x: number, y: number): Item | undefined {
  return items.find(
    (i) =>
      i.x <= x &&
      x <= i.x + i.width - 1 &&
      i.y <= y &&
      y <= i.y + i.height - 1
  );
}

class CursorSim {
  selection: Selection;

  constructor(
    readonly items: Item[],
    initialSelection: Selection
  ) {
    this.selection = { ...initialSelection };
  }

  getEditingItem(): Item | undefined {
    return findItemAt(this.items, this.selection.x1, this.selection.y1);
  }

  pressArrow(dx: number, dy: number): void {
    const editingItem = this.getEditingItem();
    let nx: number;
    let ny: number;
    if (editingItem) {
      nx =
        dx > 0
          ? editingItem.x + editingItem.width
          : dx < 0
            ? editingItem.x - 1
            : this.selection.x1;
      ny =
        dy > 0
          ? editingItem.y + editingItem.height
          : dy < 0
            ? editingItem.y - 1
            : this.selection.y1;
    } else {
      nx = this.selection.x1 + dx;
      ny = this.selection.y1 + dy;
    }
    const landed = findItemAt(this.items, nx, ny);
    if (landed) {
      this.selection = {
        x1: landed.x,
        y1: landed.y,
        x2: landed.x + landed.width - 1,
        y2: landed.y + landed.height - 1,
      };
    } else {
      this.selection = { x1: nx, y1: ny, x2: nx, y2: ny };
    }
  }
}

const box2x2: Item = {
  x: 2,
  y: 2,
  width: 2,
  height: 2,
  type: 'box',
  text: '',
};

describe('2x2ボックスへの侵入', () => {
  it('左から右矢印で進入 → ボックス内に着地', () => {
    const sim = new CursorSim([box2x2], { x1: 1, y1: 2, x2: 1, y2: 2 });
    sim.pressArrow(1, 0);
    expect(findItemAt([box2x2], sim.selection.x1, sim.selection.y1)).toBeTruthy();
  });

  it('右から左矢印で進入 → ボックス内に着地', () => {
    const sim = new CursorSim([box2x2], { x1: 4, y1: 2, x2: 4, y2: 2 });
    sim.pressArrow(-1, 0);
    expect(findItemAt([box2x2], sim.selection.x1, sim.selection.y1)).toBeTruthy();
  });

  it('上から下矢印で進入 → ボックス内に着地', () => {
    const sim = new CursorSim([box2x2], { x1: 2, y1: 1, x2: 2, y2: 1 });
    sim.pressArrow(0, 1);
    expect(findItemAt([box2x2], sim.selection.x1, sim.selection.y1)).toBeTruthy();
  });

  it('下から上矢印で進入 → ボックス内に着地', () => {
    const sim = new CursorSim([box2x2], { x1: 2, y1: 4, x2: 2, y2: 4 });
    sim.pressArrow(0, -1);
    expect(findItemAt([box2x2], sim.selection.x1, sim.selection.y1)).toBeTruthy();
  });

  it('侵入時は選択範囲がボックス全体に展開される', () => {
    const sim = new CursorSim([box2x2], { x1: 1, y1: 2, x2: 1, y2: 2 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 2, y1: 2, x2: 3, y2: 3 });
  });
});

describe('2x2ボックスからの脱出', () => {
  const insideStart: Selection = { x1: 2, y1: 2, x2: 3, y2: 3 };

  it('右矢印で右側に抜ける → ボックス外', () => {
    const sim = new CursorSim([box2x2], insideStart);
    sim.pressArrow(1, 0);
    expect(findItemAt([box2x2], sim.selection.x1, sim.selection.y1)).toBeUndefined();
    expect(sim.selection).toEqual({ x1: 4, y1: 2, x2: 4, y2: 2 });
  });

  it('左矢印で左側に抜ける → ボックス外', () => {
    const sim = new CursorSim([box2x2], insideStart);
    sim.pressArrow(-1, 0);
    expect(findItemAt([box2x2], sim.selection.x1, sim.selection.y1)).toBeUndefined();
    expect(sim.selection).toEqual({ x1: 1, y1: 2, x2: 1, y2: 2 });
  });

  it('下矢印で下側に抜ける → ボックス外', () => {
    const sim = new CursorSim([box2x2], insideStart);
    sim.pressArrow(0, 1);
    expect(findItemAt([box2x2], sim.selection.x1, sim.selection.y1)).toBeUndefined();
    expect(sim.selection).toEqual({ x1: 2, y1: 4, x2: 2, y2: 4 });
  });

  it('上矢印で上側に抜ける → ボックス外', () => {
    const sim = new CursorSim([box2x2], insideStart);
    sim.pressArrow(0, -1);
    expect(findItemAt([box2x2], sim.selection.x1, sim.selection.y1)).toBeUndefined();
    expect(sim.selection).toEqual({ x1: 2, y1: 1, x2: 2, y2: 1 });
  });
});

describe('連続移動シナリオ', () => {
  it('ボックスの左から右矢印3回で右側に抜けて1セル進む', () => {
    const sim = new CursorSim([box2x2], { x1: 1, y1: 2, x2: 1, y2: 2 });
    sim.pressArrow(1, 0);
    sim.pressArrow(1, 0);
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 5, y1: 2, x2: 5, y2: 2 });
  });
});

describe('幅10のボックスからの脱出', () => {
  const wideBox: Item = {
    x: 2,
    y: 2,
    width: 10,
    height: 2,
    type: 'box',
    text: '',
  };

  it('左矢印で幅に関わらず1セル左に抜ける（絶対ジャンプ）', () => {
    const sim = new CursorSim([wideBox], { x1: 2, y1: 2, x2: 11, y2: 3 });
    sim.pressArrow(-1, 0);
    expect(sim.selection).toEqual({ x1: 1, y1: 2, x2: 1, y2: 2 });
  });

  it('右矢印で幅に関わらず1セル右に抜ける', () => {
    const sim = new CursorSim([wideBox], { x1: 2, y1: 2, x2: 11, y2: 3 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 12, y1: 2, x2: 12, y2: 2 });
  });
});
