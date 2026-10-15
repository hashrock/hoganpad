import { describe, expect, it } from 'vitest';
import {
  copyFrames,
  deserializeFrames,
  framesFromText,
  framesToText,
  keyToAction,
  serializeFrames,
} from '../src/editor';
import { parseDoc, SAMPLE_DOC, TEXT_STYLE } from '../src/model/doc';

const key = (k: string, mods: Partial<{ shift: boolean; alt: boolean; mod: boolean }> = {}) => ({
  key: k,
  shift: false,
  alt: false,
  mod: false,
  ...mods,
});

describe('keyToAction', () => {
  it('非編集時: 矢印は移動、Alt で フレーム移動、Alt+Shift でサイズ変更', () => {
    expect(keyToAction(key('ArrowRight'), null)).toEqual({ type: 'move', dx: 1, dy: 0, extend: false });
    expect(keyToAction(key('ArrowUp', { shift: true }), null)).toEqual({ type: 'move', dx: 0, dy: -1, extend: true });
    expect(keyToAction(key('ArrowLeft', { alt: true }), null)).toEqual({ type: 'moveFrames', dx: -1, dy: 0 });
    expect(keyToAction(key('ArrowDown', { alt: true, shift: true }), null)).toEqual({ type: 'resizeFrames', dw: 0, dh: 1 });
  });

  it('文字キーはブラウザに任せる（入力欄経由で上書き入力が始まる）', () => {
    expect(keyToAction(key('a'), null)).toBeNull();
  });

  it('入力モードでは矢印で確定・移動、編集モードではキャレット移動', () => {
    expect(keyToAction(key('ArrowDown'), { value: '', mode: 'enter' })).toEqual({ type: 'move', dx: 0, dy: 1, extend: false });
    expect(keyToAction(key('ArrowDown'), { value: '', mode: 'edit' })).toBeNull();
  });

  it('編集中の Ctrl+Z はテキストの取り消しに任せる', () => {
    expect(keyToAction(key('z', { mod: true }), { value: '', mode: 'edit' })).toBeNull();
    expect(keyToAction(key('Z', { mod: true, shift: true }), null)).toEqual({ type: 'redo' });
  });
});

describe('クリップボード', () => {
  it('フレームは範囲の左上基準で往復できる', () => {
    const copied = copyFrames(SAMPLE_DOC.frames, { x: 1, y: 4, w: 30, h: 10 });
    expect(copied[0].rect).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(deserializeFrames(serializeFrames(copied))).toEqual(copied);
  });

  it('タブ区切りテキストと相互変換できる', () => {
    const frames = framesFromText('a\tb\r\n\tc\n');
    expect(frames).toEqual([
      { rect: { x: 0, y: 0, w: 1, h: 1 }, text: 'a', style: TEXT_STYLE },
      { rect: { x: 1, y: 0, w: 1, h: 1 }, text: 'b', style: TEXT_STYLE },
      { rect: { x: 1, y: 1, w: 1, h: 1 }, text: 'c', style: TEXT_STYLE },
    ]);
    expect(framesToText(frames)).toBe('a\tb\nc');
  });
});

describe('parseDoc', () => {
  it('保存した JSON を復元でき、欠けたスタイルは補う', () => {
    expect(parseDoc(JSON.parse(JSON.stringify(SAMPLE_DOC)))).toEqual(SAMPLE_DOC);
    const doc = parseDoc({ page: {}, frames: [{ rect: { x: 0, y: 0, w: 1, h: 1 }, style: { bold: true } }] });
    expect(doc.frames[0]).toEqual({ rect: { x: 0, y: 0, w: 1, h: 1 }, text: '', style: { ...TEXT_STYLE, bold: true } });
  });

  it('不正なデータは拒否する', () => {
    expect(() => parseDoc({})).toThrow();
    expect(() => parseDoc({ page: {}, frames: [{ rect: { x: 0, y: 0, w: 0, h: 1 } }] })).toThrow();
  });
});
