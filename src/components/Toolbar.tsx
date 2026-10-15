import { ReactNode } from 'react';
import { Action } from '../editor';
import { Align, Border, CELL_SIZES_MM, Page, Style, VAlign } from '../model/doc';
import { Rect } from '../model/rect';

const FONT_SIZES = [8, 9, 10.5, 12, 14, 16, 20, 24, 32, 48];
const COLORS: [string, string][] = [
  ['#000000', '黒'],
  ['#555555', '灰'],
  ['#c62828', '赤'],
  ['#1565c0', '青'],
  ['#2e7d32', '緑'],
];
const FILLS: [string, string][] = [
  ['', 'なし'],
  ['#f2f2f2', '灰'],
  ['#fff8dc', '黄'],
  ['#e3f2fd', '青'],
  ['#e8f5e9', '緑'],
  ['#fdecea', '赤'],
];
const BORDERS: [Border, string][] = [
  ['none', '罫線なし'],
  ['thin', '細線'],
  ['thick', '太線'],
  ['dashed', '破線'],
  ['double', '二重線'],
];
const ALIGNS: [Align, string][] = [
  ['left', '左'],
  ['center', '中'],
  ['right', '右'],
];
const VALIGNS: [VAlign, string][] = [
  ['top', '上'],
  ['middle', '中'],
  ['bottom', '下'],
];

interface Props {
  style: Style;
  page: Page;
  selection: Rect;
  canUndo: boolean;
  canRedo: boolean;
  /** 操作後は入力欄へフォーカスを戻し、すぐキーボード操作に戻れるようにする。 */
  run: (action: Action) => void;
  onOpen: () => void;
  onSave: () => void;
}

function Button(props: { title: string; onClick: () => void; active?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={props.title}
      className={props.active ? 'active' : undefined}
      disabled={props.disabled}
      // mousedown でフォーカスを奪わない
      onMouseDown={(e) => e.preventDefault()}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function Select<T extends string | number>(props: {
  title: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <select
      title={props.title}
      value={props.value}
      onChange={(e) => props.onChange(props.options[e.target.selectedIndex][0])}
    >
      {props.options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function Toolbar({ style, page, selection, canUndo, canRedo, run, onOpen, onSave }: Props) {
  const setStyle = (s: Partial<Style>) => run({ type: 'setStyle', style: s });
  const { cellMm } = page;

  return (
    <header className="toolbar">
      <div className="group">
        <Button title="新規（元に戻せます）" onClick={() => run({ type: 'load', doc: { page, frames: [] } })}>
          新規
        </Button>
        <Button title="JSON を開く" onClick={onOpen}>
          開く
        </Button>
        <Button title="JSON で保存" onClick={onSave}>
          保存
        </Button>
        <Button title="印刷 / PDF 保存" onClick={() => window.print()}>
          印刷
        </Button>
      </div>
      <div className="group">
        <Button title="元に戻す (Ctrl+Z)" disabled={!canUndo} onClick={() => run({ type: 'undo' })}>
          ↶
        </Button>
        <Button title="やり直す (Ctrl+Y)" disabled={!canRedo} onClick={() => run({ type: 'redo' })}>
          ↷
        </Button>
      </div>
      <div className="group">
        <Select
          title="文字サイズ (pt)"
          value={style.fontSize}
          options={FONT_SIZES.map((n) => [n, `${n}pt`])}
          onChange={(fontSize) => setStyle({ fontSize })}
        />
        <Button title="太字 (Ctrl+B)" active={style.bold} onClick={() => run({ type: 'toggleStyle', key: 'bold' })}>
          <b>B</b>
        </Button>
        <Button title="斜体 (Ctrl+I)" active={style.italic} onClick={() => run({ type: 'toggleStyle', key: 'italic' })}>
          <i>I</i>
        </Button>
        <Select title="文字色" value={style.color} options={COLORS} onChange={(color) => setStyle({ color })} />
      </div>
      <div className="group">
        {ALIGNS.map(([align, label]) => (
          <Button key={align} title={`${label}揃え`} active={style.align === align} onClick={() => setStyle({ align })}>
            {label}
          </Button>
        ))}
        <span className="sep" />
        {VALIGNS.map(([valign, label]) => (
          <Button
            key={valign}
            title={`${label}揃え（縦）`}
            active={style.valign === valign}
            onClick={() => setStyle({ valign })}
          >
            {label}
          </Button>
        ))}
        <Button title="折り返し" active={style.wrap} onClick={() => run({ type: 'toggleStyle', key: 'wrap' })}>
          折返
        </Button>
      </div>
      <div className="group">
        <Select title="罫線" value={style.border} options={BORDERS} onChange={(border) => setStyle({ border })} />
        <Select title="塗り" value={style.fill ?? ''} options={FILLS} onChange={(fill) => setStyle({ fill: fill || null })} />
        <Button title="セル結合 (Ctrl+M)" onClick={() => run({ type: 'merge' })}>
          結合
        </Button>
        <Button title="最前面へ (Ctrl+])" onClick={() => run({ type: 'reorder', to: 'front' })}>
          前面
        </Button>
        <Button title="最背面へ (Ctrl+[)" onClick={() => run({ type: 'reorder', to: 'back' })}>
          背面
        </Button>
      </div>
      <div className="group">
        <Select
          title="用紙の向き（A4）"
          value={page.orientation}
          options={[
            ['portrait', 'A4 縦'],
            ['landscape', 'A4 横'],
          ]}
          onChange={(orientation) => run({ type: 'setPage', page: { orientation } })}
        />
        <Select
          title="方眼の大きさ"
          value={cellMm}
          options={CELL_SIZES_MM.map((n) => [n, `${n}mm 方眼`])}
          onChange={(cellMm) => run({ type: 'setPage', page: { cellMm } })}
        />
      </div>
      <div className="status" title="選択位置 / 大きさ">
        {selection.x + 1},{selection.y + 1} ／ {selection.w}×{selection.h} マス（{selection.w * cellMm}×
        {selection.h * cellMm}mm）
      </div>
    </header>
  );
}
