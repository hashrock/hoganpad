import { CSSProperties } from 'react';
import { Border, Style } from '../model/doc';
import { Rect } from '../model/rect';

const PT_TO_MM = 25.4 / 72;

const BORDERS: Record<Border, string | undefined> = {
  none: undefined,
  thin: '0.2mm solid',
  thick: '0.6mm solid',
  dashed: '0.3mm dashed',
  double: '0.8mm double',
};

const FLEX: Record<string, string> = {
  left: 'flex-start',
  top: 'flex-start',
  center: 'center',
  middle: 'center',
  right: 'flex-end',
  bottom: 'flex-end',
};

export function rectCss(r: Rect, cellMm: number): CSSProperties {
  return { left: `${r.x * cellMm}mm`, top: `${r.y * cellMm}mm`, width: `${r.w * cellMm}mm`, height: `${r.h * cellMm}mm` };
}

/** 行送りを方眼の整数倍に揃える。文字が大きければ 2 マス、3 マス…と送る。 */
export function lineHeightMm(fontSize: number, cellMm: number): number {
  return Math.max(1, Math.ceil((fontSize * PT_TO_MM * 1.2) / cellMm)) * cellMm;
}

/** フレームとその編集欄で共通の文字組み。 */
export function textCss(style: Style, cellMm: number): CSSProperties {
  return {
    fontSize: `${style.fontSize}pt`,
    lineHeight: `${lineHeightMm(style.fontSize, cellMm)}mm`,
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
    textAlign: style.align,
    color: style.color,
    whiteSpace: style.wrap ? 'pre-wrap' : 'pre',
  };
}

export function frameCss(style: Style, rect: Rect, cellMm: number): CSSProperties {
  const border = BORDERS[style.border];
  return {
    ...rectCss(rect, cellMm),
    ...textCss(style, cellMm),
    border: border && `${border} ${style.color}`,
    background: style.fill ?? undefined,
    alignItems: FLEX[style.align],
    justifyContent: FLEX[style.valign],
  };
}
