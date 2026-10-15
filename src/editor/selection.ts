import { Frame } from '../model/doc';
import { clamp, containsPoint, containsRect, intersects, Point, Rect, rectFromPoints, union } from '../model/rect';

/**
 * 選択は Excel と同じく anchor（起点）と focus（アクティブセル）の 2 点で持つ。
 * 表示上の選択矩形は、交差するフレームを丸ごと含むまで広げたもの（結合セルと同じ挙動）。
 */
export interface Selection {
  anchor: Point;
  focus: Point;
}

export function cellSelection(p: Point): Selection {
  return { anchor: p, focus: p };
}

export function rectSelection(r: Rect): Selection {
  return { anchor: { x: r.x, y: r.y }, focus: { x: r.x + r.w - 1, y: r.y + r.h - 1 } };
}

/** フレームを部分的に切らないよう、交差するフレームを含むまで矩形を広げる。 */
export function expandToFrames(rect: Rect, frames: Frame[]): Rect {
  let r = rect;
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of frames) {
      if (intersects(r, f.rect) && !containsRect(r, f.rect)) {
        r = union(r, f.rect);
        changed = true;
      }
    }
  }
  return r;
}

export function selectionRect(sel: Selection, frames: Frame[]): Rect {
  return expandToFrames(rectFromPoints(sel.anchor, sel.focus), frames);
}

/** 指定セルを覆う最前面のフレームの index。 */
export function frameIndexAt(frames: Frame[], p: Point): number {
  return frames.findLastIndex((f) => containsPoint(f.rect, p));
}

/** 矩形と交差するフレームの index 一覧（背面から順）。 */
export function frameIndicesIn(frames: Frame[], rect: Rect): number[] {
  return frames.flatMap((f, i) => (intersects(f.rect, rect) ? [i] : []));
}

/**
 * カーソルを 1 歩進めた先のセル。フレーム上にいるときはフレームを 1 マスとして扱い、
 * 反対側の外へ抜ける（Excel の結合セルと同じ）。ページ外には出ない。
 */
export function step(
  frames: Frame[],
  p: Point,
  dx: number,
  dy: number,
  grid: { cols: number; rows: number },
): Point {
  const f = frames[frameIndexAt(frames, p)];
  const next = (pos: number, d: number, start: number, size: number) =>
    !f || d === 0 ? pos + d : d > 0 ? start + size : start - 1;
  return {
    x: clamp(next(p.x, dx, f?.rect.x, f?.rect.w), 0, grid.cols - 1),
    y: clamp(next(p.y, dy, f?.rect.y, f?.rect.h), 0, grid.rows - 1),
  };
}
