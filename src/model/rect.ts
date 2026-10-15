/** グリッド上のセル座標。 */
export interface Point {
  x: number;
  y: number;
}

/** セル単位の矩形。w, h は 1 以上。右端・下端は x + w, y + h（排他的）。 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 2 セルを対角とする矩形。 */
export function rectFromPoints(a: Point, b: Point): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
}

export function containsPoint(r: Rect, p: Point): boolean {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}

export function containsRect(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(a.x + a.w, b.x + b.w) - x,
    h: Math.max(a.y + a.h, b.y + b.h) - y,
  };
}

export function boundingRect(rects: Rect[]): Rect {
  return rects.reduce(union);
}

export function translate(r: Rect, dx: number, dy: number): Rect {
  return { ...r, x: r.x + dx, y: r.y + dy };
}

export function cellRect(p: Point): Rect {
  return { ...p, w: 1, h: 1 };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
