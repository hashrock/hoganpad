import { ClipboardEvent, Dispatch, KeyboardEvent, PointerEvent, RefObject, useRef, useState } from 'react';
import {
  Action,
  CLIPBOARD_MIME,
  copyFrames,
  currentRect,
  defaultStyle,
  deserializeFrames,
  editTarget,
  EditorState,
  frameIndexAt,
  framesFromText,
  framesToText,
  keyToAction,
  selectedIndices,
  serializeFrames,
} from '../editor';
import { gridSize, MARGIN_MM, paperSize } from '../model/doc';
import { Point, Rect, union } from '../model/rect';
import { frameCss, rectCss, textCss } from './frameCss';

/** マウスドラッグ中の操作。move / resize は離すまでゴーストだけ動かし、離した時に 1 回で確定する。 */
type Drag = { kind: 'select' } | { kind: 'move' | 'resize'; start: Point; delta: Point };

interface Props {
  state: EditorState;
  dispatch: Dispatch<Action>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export function Page({ state, dispatch, inputRef }: Props) {
  const { doc, selection, editing } = state;
  const { frames, page } = doc;
  const { cellMm } = page;
  const grid = gridSize(page);
  const paper = paperSize(page);
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const selRect = currentRect(state);
  const selected = selectedIndices(state);
  const target = editTarget(state);
  const targetStyle = frames[target.index]?.style ?? defaultStyle(target.rect);

  function cellAt(e: PointerEvent): Point {
    const r = gridRef.current!.getBoundingClientRect();
    return {
      x: Math.floor(((e.clientX - r.left) / r.width) * grid.cols),
      y: Math.floor(((e.clientY - r.top) / r.height) * grid.rows),
    };
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || e.target === inputRef.current) return;
    e.preventDefault(); // フォーカスを入力欄に残す
    inputRef.current?.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = cellAt(e);
    const delta = { x: 0, y: 0 };
    if ((e.target as HTMLElement).dataset.handle) {
      setDrag({ kind: 'resize', start: p, delta });
    } else if (!e.shiftKey && !editing && selected.includes(frameIndexAt(frames, p))) {
      setDrag({ kind: 'move', start: p, delta });
    } else {
      dispatch({ type: 'select', point: p, extend: e.shiftKey });
      setDrag({ kind: 'select' });
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const p = cellAt(e);
    if (drag.kind === 'select') {
      if (p.x !== selection.focus.x || p.y !== selection.focus.y) {
        dispatch({ type: 'select', point: p, extend: true });
      }
    } else {
      setDrag({ ...drag, delta: { x: p.x - drag.start.x, y: p.y - drag.start.y } });
    }
  }

  function onPointerUp() {
    if (drag?.kind === 'move') {
      const { start, delta } = drag;
      if (delta.x || delta.y) dispatch({ type: 'moveFrames', dx: delta.x, dy: delta.y });
      else dispatch({ type: 'select', point: start, extend: false });
    } else if (drag?.kind === 'resize') {
      dispatch({ type: 'resizeFrames', dw: drag.delta.x, dh: drag.delta.y });
    }
    setDrag(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    if (editing && e.key === 'Enter' && e.altKey) {
      // Excel と同じく Alt+Enter でセル内改行
      e.preventDefault();
      e.currentTarget.setRangeText('\n', e.currentTarget.selectionStart, e.currentTarget.selectionEnd, 'end');
      dispatch({ type: 'updateEdit', value: e.currentTarget.value });
      return;
    }
    const action = keyToAction(
      { key: e.key, shift: e.shiftKey, alt: e.altKey, mod: e.ctrlKey || e.metaKey },
      editing,
    );
    if (action) {
      e.preventDefault();
      dispatch(action);
    }
  }

  function onCopy(e: ClipboardEvent, cut: boolean) {
    if (editing) return;
    e.preventDefault();
    const copied = copyFrames(frames, selRect);
    e.clipboardData.setData(CLIPBOARD_MIME, serializeFrames(copied));
    e.clipboardData.setData('text/plain', framesToText(copied));
    if (cut) dispatch({ type: 'delete' });
  }

  function onPaste(e: ClipboardEvent) {
    if (editing) return;
    e.preventDefault();
    const data = e.clipboardData.getData(CLIPBOARD_MIME);
    dispatch({
      type: 'paste',
      frames: data ? deserializeFrames(data) : framesFromText(e.clipboardData.getData('text/plain')),
    });
  }

  let ghost: Rect | null = null;
  if (drag?.kind === 'move' && selected.length > 0) {
    const box = selected.map((i) => frames[i].rect).reduce(union);
    ghost = { ...box, x: box.x + drag.delta.x, y: box.y + drag.delta.y };
  } else if (drag?.kind === 'resize') {
    ghost = { ...selRect, w: Math.max(1, selRect.w + drag.delta.x), h: Math.max(1, selRect.h + drag.delta.y) };
  }

  // 非編集時も入力欄はアクティブセル上に透明で置き、そのまま打ち始められるようにする（IME 対応）
  const inputRect = editing ? target.rect : { ...selection.focus, w: 1, h: 1 };

  return (
    <div className="paper" style={{ width: `${paper.w}mm`, height: `${paper.h}mm`, padding: `${MARGIN_MM}mm` }}>
      <div
        ref={gridRef}
        className="grid"
        style={{
          width: `${grid.cols * cellMm}mm`,
          height: `${grid.rows * cellMm}mm`,
          backgroundSize: `${cellMm}mm ${cellMm}mm`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
        onDoubleClick={() => !editing && dispatch({ type: 'startEdit' })}
      >
        {frames.map((f, i) => (
          <div key={i} className="frame" style={frameCss(f.style, f.rect, cellMm)}>
            <span className="frame-text">{f.text}</span>
          </div>
        ))}
        <div className="selection screen-only" style={rectCss(selRect, cellMm)}>
          {selected.length > 0 && !editing && <div className="handle" data-handle="1" />}
        </div>
        {ghost && <div className="ghost screen-only" style={rectCss(ghost, cellMm)} />}
        <textarea
          ref={inputRef}
          className={editing ? 'cell-input editing' : 'cell-input'}
          style={{
            ...rectCss(inputRect, cellMm),
            // 編集欄は内容に合わせて伸びる（折り返し有りなら幅は枠に固定）
            ...(editing && {
              ...textCss(targetStyle, cellMm),
              ...(!targetStyle.wrap && { width: 'auto' }),
              height: 'auto',
            }),
            minWidth: `${inputRect.w * cellMm}mm`,
            minHeight: `${inputRect.h * cellMm}mm`,
          }}
          value={editing?.value ?? ''}
          onChange={(e) =>
            dispatch(
              editing ? { type: 'updateEdit', value: e.target.value } : { type: 'startEdit', value: e.target.value },
            )
          }
          onKeyDown={onKeyDown}
          onCopy={(e) => onCopy(e, false)}
          onCut={(e) => onCopy(e, true)}
          onPaste={onPaste}
          spellCheck={false}
          autoFocus
          aria-label="セル入力"
        />
      </div>
    </div>
  );
}
