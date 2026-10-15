import { Frame, parseDoc, TEXT_STYLE } from '../model/doc';
import { Rect, translate } from '../model/rect';
import { frameIndicesIn } from './selection';

export const CLIPBOARD_MIME = 'application/x-hoganpad+json';

/** 範囲内のフレームを、範囲の左上を (0,0) とする座標で取り出す。 */
export function copyFrames(frames: Frame[], rect: Rect): Frame[] {
  return frameIndicesIn(frames, rect).map((i) => ({
    ...frames[i],
    rect: translate(frames[i].rect, -rect.x, -rect.y),
  }));
}

export function serializeFrames(frames: Frame[]): string {
  return JSON.stringify({ frames });
}

export function deserializeFrames(data: string): Frame[] {
  return parseDoc({ page: {}, ...JSON.parse(data) }).frames;
}

/** 表計算ソフトに貼れるよう、行ごとにタブ区切りのテキストにする。 */
export function framesToText(frames: Frame[]): string {
  const rows = new Map<number, Frame[]>();
  for (const f of frames) rows.set(f.rect.y, [...(rows.get(f.rect.y) ?? []), f]);
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) =>
      row
        .sort((a, b) => a.rect.x - b.rect.x)
        .map((f) => f.text)
        .join('\t'),
    )
    .join('\n');
}

/** タブ区切りテキストを 1 セル 1 フレームに展開する（Excel からの貼り付け）。 */
export function framesFromText(text: string): Frame[] {
  return text
    .replace(/\r?\n$/, '')
    .split(/\r?\n/)
    .flatMap((line, y) =>
      line.split('\t').flatMap((cell, x) =>
        cell === '' ? [] : [{ rect: { x, y, w: 1, h: 1 }, text: cell, style: TEXT_STYLE }],
      ),
    );
}
