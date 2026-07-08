import { useReducer, useRef, useCallback, useMemo, useState } from 'react';
import { HoganGrid } from './components/HoganGrid';
import { HoganSelection } from './components/HoganSelection';
import {
  editorReducer,
  initialState,
  getSelectionRect,
  getItemAt,
} from './editor';
import './App.css';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 1020;
const GRID_SIZE = 20;

function App() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  // 入力デバイスの押下状態（ドメイン状態ではないので useState のまま）
  const [mouseDown, setMouseDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);

  const canvasRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { items, selection, editing } = state;
  const selectionMode = mouseDown || shiftDown;

  const rect = useMemo(() => getSelectionRect(selection), [selection]);

  // input の表示値: 編集中は編集値、非編集時は選択セルのテキストを導出（二重管理しない）
  const inputValue = editing
    ? editing.value
    : getItemAt(items, rect.left, rect.top)?.text ?? '';

  const inputPosition = useMemo(
    () => ({
      top: `${selection.cursor.y * GRID_SIZE}px`,
      left: `${selection.cursor.x * GRID_SIZE}px`,
    }),
    [selection]
  );

  const focusCanvas = useCallback(() => {
    canvasRef.current?.focus();
  }, []);

  const startEdit = useCallback(() => {
    dispatch({ type: 'startEdit' });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const x = Math.floor(e.nativeEvent.offsetX / GRID_SIZE);
      const y = Math.floor(e.nativeEvent.offsetY / GRID_SIZE);
      dispatch({ type: 'moveTo', x, y });
      setMouseDown(true);
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!selectionMode) return;
      const x = Math.floor(e.nativeEvent.offsetX / GRID_SIZE);
      const y = Math.floor(e.nativeEvent.offsetY / GRID_SIZE);
      dispatch({ type: 'dragTo', x, y });
    },
    [selectionMode]
  );

  const onPointerUp = useCallback(() => {
    setMouseDown(false);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          dispatch({ type: 'moveArrow', dx: -1, dy: 0, shift: shiftDown });
          break;
        case 'ArrowUp':
          e.preventDefault();
          dispatch({ type: 'moveArrow', dx: 0, dy: -1, shift: shiftDown });
          break;
        case 'ArrowRight':
          e.preventDefault();
          dispatch({ type: 'moveArrow', dx: 1, dy: 0, shift: shiftDown });
          break;
        case 'ArrowDown':
          e.preventDefault();
          dispatch({ type: 'moveArrow', dx: 0, dy: 1, shift: shiftDown });
          break;
        case 'Delete':
          e.preventDefault();
          dispatch({ type: 'remove' });
          break;
        case 'Enter':
          e.preventDefault();
          break;
        case 'Shift':
          setShiftDown(true);
          break;
        case 'F2':
          e.preventDefault();
          startEdit();
          break;
        default:
          if (e.key.length === 1) {
            startEdit();
          }
          break;
      }
    },
    [shiftDown, startEdit]
  );

  const onKeyUp = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'Shift') {
      setShiftDown(false);
    }
  }, []);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      dispatch({ type: 'moveRelative', dx: 0, dy: 1, shift: shiftDown });
      focusCanvas();
    },
    [shiftDown, focusCanvas]
  );

  return (
    <div id="app" tabIndex={0}>
      <svg
        ref={canvasRef}
        tabIndex={0}
        className="a4"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onDoubleClick={startEdit}
      >
        <HoganGrid width={CANVAS_WIDTH} height={CANVAS_HEIGHT} gridSize={GRID_SIZE} />
        {items.map((item, index) => (
          <g key={index}>
            {item.type === 'text' && (
              <text
                x={item.x * GRID_SIZE}
                y={item.y * GRID_SIZE + GRID_SIZE / 2}
                dominantBaseline="central"
              >
                {item.text}
              </text>
            )}
            {item.type === 'box' && (
              <g>
                <rect
                  x={item.x * GRID_SIZE + 0.5}
                  y={item.y * GRID_SIZE + 0.5}
                  width={item.width * GRID_SIZE}
                  height={item.height * GRID_SIZE}
                />
                <text
                  dominantBaseline="central"
                  textAnchor="middle"
                  x={(item.x + item.width / 2) * GRID_SIZE}
                  y={(item.y + item.height / 2) * GRID_SIZE}
                >
                  {item.text}
                </text>
              </g>
            )}
          </g>
        ))}
        <HoganSelection selection={selection} gridSize={GRID_SIZE} />
      </svg>
      <form onSubmit={onSubmit}>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => dispatch({ type: 'changeEditValue', value: e.target.value })}
          style={{
            display: editing ? 'block' : 'none',
            position: 'absolute',
            zIndex: 100,
            ...inputPosition,
          }}
          type="text"
          className="hogan__hiddeninput"
        />
      </form>
    </div>
  );
}

export default App;
