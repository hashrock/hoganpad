import { describe, it, expect } from 'vitest';
import type { BoxItem, Item, Selection } from '../src/types';

// src/App.tsx の moveSelectionArrow の box skip ロジックをエミュレート。
// editingItem/containingBox 検出、矢印キーでの端外ジャンプを検証する。

function findContainingBox(items: Item[], x: number, y: number): BoxItem | undefined {
  return items.find(
    (i): i is BoxItem =>
      i.type === 'box' &&
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

  pressArrow(dx: number, dy: number): void {
    const { x1, y1 } = this.selection;
    const containingBox = findContainingBox(this.items, x1, y1);
    let nx: number;
    let ny: number;
    if (containingBox) {
      nx =
        dx > 0
          ? containingBox.x + containingBox.width
          : dx < 0
            ? containingBox.x - 1
            : x1;
      ny =
        dy > 0
          ? containingBox.y + containingBox.height
          : dy < 0
            ? containingBox.y - 1
            : y1;
    } else {
      nx = x1 + dx;
      ny = y1 + dy;
    }
    const landingBox = findContainingBox(this.items, nx, ny);
    if (landingBox) {
      this.selection = {
        x1: landingBox.x,
        y1: landingBox.y,
        x2: landingBox.x + landingBox.width - 1,
        y2: landingBox.y + landingBox.height - 1,
      };
    } else {
      this.selection = { x1: nx, y1: ny, x2: nx, y2: ny };
    }
  }
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
  const expanded = { x1: 2, y1: 2, x2: 3, y2: 3 };

  it('左から右矢印で侵入 → ボックス全体が選択される', () => {
    const sim = new CursorSim([box2x2], { x1: 1, y1: 2, x2: 1, y2: 2 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual(expanded);
  });

  it('右から左矢印で侵入 → ボックス全体が選択される', () => {
    const sim = new CursorSim([box2x2], { x1: 4, y1: 2, x2: 4, y2: 2 });
    sim.pressArrow(-1, 0);
    expect(sim.selection).toEqual(expanded);
  });

  it('上から下矢印で侵入 → ボックス全体が選択される', () => {
    const sim = new CursorSim([box2x2], { x1: 2, y1: 1, x2: 2, y2: 1 });
    sim.pressArrow(0, 1);
    expect(sim.selection).toEqual(expanded);
  });

  it('下から上矢印で侵入 → ボックス全体が選択される', () => {
    const sim = new CursorSim([box2x2], { x1: 2, y1: 4, x2: 2, y2: 4 });
    sim.pressArrow(0, -1);
    expect(sim.selection).toEqual(expanded);
  });
});

describe('2x2ボックスからの脱出（box skip）', () => {
  const insideExpanded = { x1: 2, y1: 2, x2: 3, y2: 3 };

  it('右矢印で右端の外側に抜ける', () => {
    const sim = new CursorSim([box2x2], insideExpanded);
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 4, y1: 2, x2: 4, y2: 2 });
  });

  it('左矢印で左端の外側に抜ける', () => {
    const sim = new CursorSim([box2x2], insideExpanded);
    sim.pressArrow(-1, 0);
    expect(sim.selection).toEqual({ x1: 1, y1: 2, x2: 1, y2: 2 });
  });

  it('下矢印で下端の外側に抜ける', () => {
    const sim = new CursorSim([box2x2], insideExpanded);
    sim.pressArrow(0, 1);
    expect(sim.selection).toEqual({ x1: 2, y1: 4, x2: 2, y2: 4 });
  });

  it('上矢印で上端の外側に抜ける', () => {
    const sim = new CursorSim([box2x2], insideExpanded);
    sim.pressArrow(0, -1);
    expect(sim.selection).toEqual({ x1: 2, y1: 1, x2: 2, y2: 1 });
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
    const sim = new CursorSim([wideBox], { x1: 1, y1: 2, x2: 1, y2: 2 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 2, y1: 2, x2: 11, y2: 3 });
  });

  it('右矢印で幅に関わらず右外に一発で抜ける', () => {
    const sim = new CursorSim([wideBox], { x1: 2, y1: 2, x2: 11, y2: 3 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 12, y1: 2, x2: 12, y2: 2 });
  });

  it('左矢印で幅に関わらず左外に一発で抜ける', () => {
    const sim = new CursorSim([wideBox], { x1: 2, y1: 2, x2: 11, y2: 3 });
    sim.pressArrow(-1, 0);
    expect(sim.selection).toEqual({ x1: 1, y1: 2, x2: 1, y2: 2 });
  });
});

describe('連続移動シナリオ', () => {
  it('左から右3回で 箱の左→箱全体選択→箱の右外→さらに右 と進む', () => {
    const sim = new CursorSim([box2x2], { x1: 1, y1: 2, x2: 1, y2: 2 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 2, y1: 2, x2: 3, y2: 3 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 4, y1: 2, x2: 4, y2: 2 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 5, y1: 2, x2: 5, y2: 2 });
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
    const sim = new CursorSim([textItem], { x1: 5, y1: 5, x2: 5, y2: 5 });
    sim.pressArrow(1, 0);
    expect(sim.selection).toEqual({ x1: 6, y1: 5, x2: 6, y2: 5 });
  });
});
