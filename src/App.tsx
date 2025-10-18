import { useState, useRef, useCallback, useMemo } from 'react';
import { HoganGrid } from './components/HoganGrid';
import { HoganSelection } from './components/HoganSelection';
import { Item, Selection, SelectionComputed } from './types';
import './App.css';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 1020;
const GRID_SIZE = 20;

const initialItems: Item[] = [
  {
    x: 1,
    y: 1,
    type: 'text',
    text: 'Excel方眼紙だよ',
    style: 'bold',
  },
  {
    x: 2,
    y: 2,
    type: 'box',
    width: 10,
    height: 2,
    text: '箱だよ',
  },
];

function App() {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [selection, setSelection] = useState<Selection>({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 1,
  });
  const [mouseDown, setMouseDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);
  const [isCellEditing, setIsCellEditing] = useState(false);
  const [editingValue, setEditingValue] = useState('');

  const canvasRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectionMode = mouseDown || shiftDown;

  const selectionComputed = useMemo<SelectionComputed>(() => {
    return {
      left: selection.x1 <= selection.x2 ? selection.x1 : selection.x2,
      top: selection.y1 <= selection.y2 ? selection.y1 : selection.y2,
      right: selection.x1 > selection.x2 ? selection.x1 : selection.x2,
      bottom: selection.y1 > selection.y2 ? selection.y1 : selection.y2,
      w: Math.abs(selection.x1 - selection.x2) + 1,
      h: Math.abs(selection.y1 - selection.y2) + 1,
    };
  }, [selection]);

  const editingItem = useMemo(() => {
    return items.find(
      (item) => item.x === selectionComputed.left && item.y === selectionComputed.top
    );
  }, [items, selectionComputed]);

  const editingItemIndex = useMemo(() => {
    if (!editingItem) return -1;
    return items.indexOf(editingItem);
  }, [items, editingItem]);

  const inputPosition = useMemo(() => {
    return {
      top: `${selection.y1 * GRID_SIZE}px`,
      left: `${selection.x1 * GRID_SIZE}px`,
    };
  }, [selection]);

  const focusCanvas = useCallback(() => {
    canvasRef.current?.focus();
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const commitEditing = useCallback(() => {
    if (editingItem) {
      const index = editingItemIndex;
      if (index >= 0) {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], text: editingValue };
        setItems(newItems);
      }
    } else {
      if (selectionComputed.w > 1 || selectionComputed.h > 1) {
        setItems([
          ...items,
          {
            type: 'box',
            width: selectionComputed.w,
            height: selectionComputed.h,
            x: selectionComputed.left,
            y: selectionComputed.top,
            text: editingValue,
          },
        ]);
      } else {
        setItems([
          ...items,
          {
            type: 'text',
            x: selectionComputed.left,
            y: selectionComputed.top,
            text: editingValue,
          },
        ]);
      }
    }
  }, [editingItem, editingItemIndex, editingValue, items, selectionComputed]);

  const moveSelection = useCallback(
    (x: number, y: number) => {
      if (isCellEditing) {
        commitEditing();
        setIsCellEditing(false);
        focusCanvas();
      }
      setSelection({ x1: x, y1: y, x2: x, y2: y });
      const item = items.find((item) => item.x === x && item.y === y);
      setEditingValue(item ? item.text : '');
    },
    [isCellEditing, commitEditing, focusCanvas, items]
  );

  const moveSelectionRelative = useCallback(
    (dx: number, dy: number) => {
      if (shiftDown) {
        setSelection((prev) => ({
          ...prev,
          x1: prev.x1 + dx,
          y1: prev.y1 + dy,
        }));
      } else {
        moveSelection(selection.x1 + dx, selection.y1 + dy);
      }
    },
    [shiftDown, selection, moveSelection]
  );

  const moveSelectionEnd = useCallback((x: number, y: number) => {
    setSelection((prev) => ({ ...prev, x1: x, y1: y }));
  }, []);

  const editHere = useCallback(() => {
    setIsCellEditing(true);
    setTimeout(() => {
      focusInput();
    }, 0);
  }, [focusInput]);

  const removeHere = useCallback(() => {
    if (editingItemIndex >= 0) {
      const newItems = [...items];
      newItems.splice(editingItemIndex, 1);
      setItems(newItems);
    }
  }, [editingItemIndex, items]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const x = Math.floor(e.nativeEvent.offsetX / GRID_SIZE);
      const y = Math.floor(e.nativeEvent.offsetY / GRID_SIZE);
      moveSelection(x, y);
      setMouseDown(true);
    },
    [moveSelection]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (selectionMode) {
        const x = Math.floor(e.nativeEvent.offsetX / GRID_SIZE);
        const y = Math.floor(e.nativeEvent.offsetY / GRID_SIZE);
        moveSelectionEnd(x, y);
      }
    },
    [selectionMode, moveSelectionEnd]
  );

  const onPointerUp = useCallback(() => {
    setMouseDown(false);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveSelectionRelative(-1, 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveSelectionRelative(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveSelectionRelative(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveSelectionRelative(0, 1);
          break;
        case 'Delete':
          e.preventDefault();
          removeHere();
          break;
        case 'Enter':
          e.preventDefault();
          break;
        case 'Shift':
          setShiftDown(true);
          break;
        case 'F2':
          e.preventDefault();
          editHere();
          break;
        default:
          if (e.key.length === 1) {
            editHere();
          }
          break;
      }
    },
    [moveSelectionRelative, removeHere, editHere]
  );

  const onKeyUp = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'Shift') {
      setShiftDown(false);
    }
  }, []);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      moveSelectionRelative(0, 1);
    },
    [moveSelectionRelative]
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
        onDoubleClick={editHere}
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
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          style={{
            display: isCellEditing ? 'block' : 'none',
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
