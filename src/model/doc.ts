import { Rect } from './rect';

export type Align = 'left' | 'center' | 'right';
export type VAlign = 'top' | 'middle' | 'bottom';
export type Border = 'none' | 'thin' | 'thick' | 'dashed' | 'double';

export interface Style {
  /** 文字サイズ（pt）。 */
  fontSize: number;
  bold: boolean;
  italic: boolean;
  align: Align;
  valign: VAlign;
  /** false なら Excel のセルのように枠からはみ出して 1 行で表示する。 */
  wrap: boolean;
  border: Border;
  color: string;
  /** 塗りつぶし。null で透明。 */
  fill: string | null;
}

/** 方眼に吸着する唯一の配置要素。テキストも罫線ボックスもすべて Frame。 */
export interface Frame {
  rect: Rect;
  text: string;
  style: Style;
}

export interface Page {
  orientation: 'portrait' | 'landscape';
  /** 方眼 1 マスの一辺（mm）。 */
  cellMm: number;
}

export interface Doc {
  page: Page;
  /** 配列の後ろほど前面。 */
  frames: Frame[];
}

/** 1 セルに文字を打ったときのスタイル。Excel のセル同様、はみ出し表示。 */
export const TEXT_STYLE: Style = {
  fontSize: 10.5,
  bold: false,
  italic: false,
  align: 'left',
  valign: 'middle',
  wrap: false,
  border: 'none',
  color: '#000000',
  fill: null,
};

/** 範囲に文字を打ったときのスタイル（テキストフレーム）。 */
export const AREA_STYLE: Style = { ...TEXT_STYLE, valign: 'top', wrap: true };

/** セル結合（Ctrl+M）で作る罫線ボックスのスタイル。 */
export const BOX_STYLE: Style = { ...TEXT_STYLE, align: 'center', wrap: true, border: 'thin' };

export const PAPER_MM = { w: 210, h: 297 } as const; // A4
export const MARGIN_MM = 10;
export const CELL_SIZES_MM = [4, 5, 6, 8, 10] as const;

export function paperSize(page: Page): { w: number; h: number } {
  return page.orientation === 'portrait' ? PAPER_MM : { w: PAPER_MM.h, h: PAPER_MM.w };
}

/** 余白を除いた印刷可能領域に収まるマス数。 */
export function gridSize(page: Page): { cols: number; rows: number } {
  const paper = paperSize(page);
  return {
    cols: Math.floor((paper.w - MARGIN_MM * 2) / page.cellMm),
    rows: Math.floor((paper.h - MARGIN_MM * 2) / page.cellMm),
  };
}

/** フレームが装飾も文字も持たない（＝存在する意味がない）か。 */
export function isBlank(frame: Frame): boolean {
  return frame.text === '' && frame.style.border === 'none' && frame.style.fill === null;
}

export const EMPTY_DOC: Doc = {
  page: { orientation: 'portrait', cellMm: 5 },
  frames: [],
};

export const SAMPLE_DOC: Doc = {
  page: { orientation: 'portrait', cellMm: 5 },
  frames: [
    {
      rect: { x: 1, y: 1, w: 20, h: 2 },
      text: 'Hoganpad',
      style: { ...TEXT_STYLE, fontSize: 20, bold: true },
    },
    { rect: { x: 1, y: 4, w: 1, h: 1 }, text: 'Excel方眼紙の操作感で、そのまま印刷できる紙面を組めます。', style: TEXT_STYLE },
    { rect: { x: 1, y: 6, w: 16, h: 3 }, text: 'Ctrl+M で結合した箱', style: BOX_STYLE },
    {
      rect: { x: 18, y: 6, w: 18, h: 6 },
      text: '範囲を選んで入力すると、折り返すテキストフレームになります。行送りは方眼に揃います。',
      style: { ...AREA_STYLE, border: 'dashed', fill: '#fff8dc' },
    },
  ],
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseRect(v: unknown): Rect {
  if (!isObject(v)) throw new Error('rect がありません');
  const { x, y, w, h } = v;
  const ints = [x, y, w, h].every((n) => Number.isInteger(n));
  if (!ints || (w as number) < 1 || (h as number) < 1) throw new Error('rect が不正です');
  return { x: x as number, y: y as number, w: w as number, h: h as number };
}

/** JSON から Doc を復元する。欠けたスタイルは既定値で補う。 */
export function parseDoc(json: unknown): Doc {
  if (!isObject(json) || !isObject(json.page) || !Array.isArray(json.frames)) {
    throw new Error('Hoganpad のドキュメントではありません');
  }
  const { orientation, cellMm } = json.page;
  const page: Page = {
    orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
    cellMm: typeof cellMm === 'number' && cellMm > 0 ? cellMm : EMPTY_DOC.page.cellMm,
  };
  const frames = json.frames.map((f): Frame => {
    if (!isObject(f)) throw new Error('frame が不正です');
    return {
      rect: parseRect(f.rect),
      text: typeof f.text === 'string' ? f.text : '',
      style: { ...TEXT_STYLE, ...(isObject(f.style) ? f.style : {}) },
    };
  });
  return { page, frames };
}
