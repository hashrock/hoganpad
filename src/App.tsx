import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import './App.css';
import HoganGrid from './components/HoganGrid';
import HoganSelection from './components/HoganSelection';
import HoganItemText from './components/HoganItemText';
import HoganItemBox from './components/HoganItemBox';
import type { Item, Selection } from './types';
import { HEIGHT, WIDTH, GRID_SIZE, examples, computeSelection } from './utils';

function App() {
  const [selection, setSelection] = useState<Selection>({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 1,
  });
  const [mouseDown, setMouseDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isCellEditing, setIsCellEditing] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const [tabOffset, setTabOffset] = useState<{ x: number; y: number } | null>(null);
  const [itemPreview, setItemPreview] = useState<Item | null>(null);
  const [moveTarget, setMoveTarget] = useState<Item | null>(null);

  const canvasRef = useRef<SVGSVGElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const selectionMode = mouseDown || shiftDown;
  const selectionComputed = computeSelection(selection);

  const editingItem = items.find(
    (item) =>
      item.x <= selection.x1 &&
      selection.x1 <= item.x + item.width - 1 &&
      item.y <= selection.y1 &&
      selection.y1 <= item.y + item.height - 1
  );

  const editingItemIndex = editingItem ? items.indexOf(editingItem) : -1;

  const inputPosition = !isCellEditing
    ? { top: '-100px', left: '-100px', opacity: 0 }
    : {
        top: `${selectionComputed.top * GRID_SIZE}px`,
        left: `${selectionComputed.left * GRID_SIZE}px`,
      };

  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  const saveItems = useCallback((newItems: Item[]) => {
    window.localStorage.setItem('hoganpad__items', JSON.stringify(newItems));
  }, []);

  const addItem = useCallback(
    (item: Item) => {
      const newItems = [...items, item];
      setItems(newItems);
      saveItems(newItems);
    },
    [items, saveItems]
  );

  const removeHere = useCallback(() => {
    if (editingItemIndex >= 0) {
      const newItems = items.filter((_, i) => i !== editingItemIndex);
      setItems(newItems);
      saveItems(newItems);
    }
    setEditingValue('');
  }, [editingItemIndex, items, saveItems]);

  const commitEditing = useCallback(() => {
    if (editingValue === '') {
      removeHere();
      return;
    }

    if (editingItem) {
      const newItems = [...items];
      const index = items.indexOf(editingItem);
      newItems[index] = { ...editingItem, text: editingValue };
      setItems(newItems);
      saveItems(newItems);
    } else {
      if (selectionComputed.w > 1 || selectionComputed.h > 1) {
        addItem({
          type: 'box',
          width: selectionComputed.w,
          height: selectionComputed.h,
          x: selectionComputed.left,
          y: selectionComputed.top,
          text: editingValue,
        });
      } else {
        addItem({
          type: 'text',
          x: selectionComputed.left,
          y: selectionComputed.top,
          width: 1,
          height: 1,
          text: editingValue,
        });
      }
    }
  }, [editingValue, editingItem, items, removeHere, addItem, selectionComputed, saveItems]);

  const editHere = useCallback(() => {
    setIsCellEditing(true);
    setTimeout(() => focusInput(), 0);
  }, [focusInput]);

  const moveSelection = useCallback(
    (x: number, y: number) => {
      if (isCellEditing) {
        commitEditing();
        setIsCellEditing(false);
      }
      setSelection({ x1: x, y1: y, x2: x, y2: y });
      const item = items.find(
        (item) =>
          item.x <= x &&
          x <= item.x + item.width - 1 &&
          item.y <= y &&
          y <= item.y + item.height - 1
      );
      setEditingValue(item ? item.text : '');
    },
    [isCellEditing, commitEditing, items]
  );

  const moveSelectionEnd = useCallback((x: number, y: number) => {
    setSelection((prev) => ({ ...prev, x1: x, y1: y }));
  }, []);

  const adjustSelectionAtEditingItem = useCallback(() => {
    if (editingItem) {
      setSelection({
        x1: editingItem.x,
        y1: editingItem.y,
        x2: editingItem.x + editingItem.width - 1,
        y2: editingItem.y + editingItem.height - 1,
      });
    }
  }, [editingItem]);

  const moveSelectionRelative = useCallback(
    (x: number, y: number) => {
      if (shiftDown) {
        moveSelectionEnd(selection.x1 + x, selection.y1 + y);
      } else {
        moveSelection(selection.x1 + x, selection.y1 + y);
      }
    },
    [shiftDown, selection, moveSelection, moveSelectionEnd]
  );

  const moveSelectionUp = useCallback(() => {
    const offset = editingItem ? -editingItem.height : -1;
    moveSelectionRelative(0, offset);
    setTimeout(() => adjustSelectionAtEditingItem(), 0);
  }, [moveSelectionRelative, editingItem, adjustSelectionAtEditingItem]);

  const moveSelectionDown = useCallback(() => {
    const offset = editingItem ? editingItem.height : 1;
    moveSelectionRelative(0, offset);
    setTimeout(() => adjustSelectionAtEditingItem(), 0);
  }, [moveSelectionRelative, editingItem, adjustSelectionAtEditingItem]);

  const moveSelectionLeft = useCallback(() => {
    const offset = editingItem ? -editingItem.width : -1;
    moveSelectionRelative(offset, 0);
    setTimeout(() => adjustSelectionAtEditingItem(), 0);
  }, [moveSelectionRelative, editingItem, adjustSelectionAtEditingItem]);

  const moveSelectionRight = useCallback(() => {
    const offset = editingItem ? editingItem.width : 1;
    moveSelectionRelative(offset, 0);
    setTimeout(() => adjustSelectionAtEditingItem(), 0);
  }, [moveSelectionRelative, editingItem, adjustSelectionAtEditingItem]);

  const moveNextLine = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (isCellEditing) {
        commitEditing();
        setIsCellEditing(false);
      }
      const height = selectionComputed.h;
      const width = selectionComputed.w;
      const nextline = selectionComputed.top + height;

      setSelection({
        x1: selectionComputed.left,
        y1: nextline,
        x2: selectionComputed.left + width - 1,
        y2: nextline + height - 1,
      });

      const item = items.find(
        (item) =>
          item.x <= selectionComputed.left &&
          selectionComputed.left <= item.x + item.width - 1 &&
          item.y <= nextline &&
          nextline <= item.y + item.height - 1
      );
      setEditingValue(item ? item.text : '');
      editHere();
    },
    [isCellEditing, commitEditing, selectionComputed, items, editHere]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const x = Math.floor(e.nativeEvent.offsetX / GRID_SIZE);
      const y = Math.floor(e.nativeEvent.offsetY / GRID_SIZE);
      moveSelection(x, y);
      setTimeout(() => adjustSelectionAtEditingItem(), 0);
      setMouseDown(true);
    },
    [moveSelection, adjustSelectionAtEditingItem]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (selectionMode) {
        moveSelectionEnd(
          Math.floor(e.nativeEvent.offsetX / GRID_SIZE),
          Math.floor(e.nativeEvent.offsetY / GRID_SIZE)
        );
      }
    },
    [selectionMode, moveSelectionEnd]
  );

  const onPointerUp = useCallback(() => {
    setMouseDown(false);
    focusInput();
  }, [focusInput]);

  const onPointerDownTab = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      if (editingItem) {
        setMoveTarget(editingItem);
        setTabOffset({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        setItemPreview({ ...editingItem });
      }
    },
    [editingItem]
  );

  const onPointerMoveTab = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      e.stopPropagation();
      if (moveTarget && tabOffset && itemPreview) {
        const newX =
          moveTarget.x +
          Math.round(((e.nativeEvent.offsetX - tabOffset.x) / 20) * 2) / 2;
        const newY =
          moveTarget.y +
          Math.round(((e.nativeEvent.offsetY - tabOffset.y) / 20) * 2) / 2;
        setItemPreview({ ...itemPreview, x: newX, y: newY });
      }
    },
    [moveTarget, tabOffset, itemPreview]
  );

  const onPointerUpTab = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      e.stopPropagation();
      if (moveTarget && itemPreview) {
        const newItems = [...items];
        const index = items.indexOf(moveTarget);
        newItems[index] = { ...moveTarget, x: itemPreview.x, y: itemPreview.y };
        setItems(newItems);
        saveItems(newItems);

        setSelection({
          x1: itemPreview.x,
          y1: itemPreview.y,
          x2: itemPreview.x + moveTarget.width - 1,
          y2: itemPreview.y + moveTarget.height - 1,
        });

        setMoveTarget(null);
        setItemPreview(null);
        setTabOffset(null);
      }
    },
    [moveTarget, itemPreview, items, saveItems]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.keyCode) {
        case 46: // delete
          removeHere();
          break;
        case 113: // F2
          editHere();
          break;
        case 16: // shift
        case 91: // ctrl
        case 37: // left
        case 38: // up
        case 39: // right
        case 40: // down
        case 13: // enter
          break;
        default:
          editHere();
          break;
      }
    },
    [removeHere, editHere]
  );

  useEffect(() => {
    const savedItems = window.localStorage.getItem('hoganpad__items');
    if (savedItems !== null) {
      setItems(JSON.parse(savedItems));
    } else {
      setItems(examples);
    }

    window.addEventListener('keydown', onKeyDown);
    focusInput();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown, focusInput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 16) setShiftDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.keyCode === 16) setShiftDown(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div id="app">
      <svg
        ref={canvasRef}
        className="a4"
        width="700"
        height="1020"
        viewBox="0 0 700 1020"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={editHere}
      >
        <defs>
          <filter id="dropshadow" x="0" y="0" width="200%" height="200%">
            <feOffset result="offOut" in="SourceAlpha" dx="3" dy="3" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
            <feComponentTransfer in="blurOut" result="alphaOut">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="alphaOut" mode="normal" />
          </filter>
        </defs>
        <HoganGrid width={WIDTH} height={HEIGHT} />
        {items.map((item, index) => (
          <g key={index}>
            <HoganItemText item={item} gridSize={GRID_SIZE} />
            <HoganItemBox item={item} gridSize={GRID_SIZE} />
          </g>
        ))}
        {editingItem && (
          <rect
            x={selection.x1 * 20 - 10}
            y={selection.y1 * 20}
            height={25}
            width={10}
            className="selection__tab"
            onPointerDown={onPointerDownTab}
            onPointerMove={onPointerMoveTab}
            onPointerUp={onPointerUpTab}
          />
        )}
        <HoganSelection selection={selection} />
        {itemPreview && (
          <HoganItemBox item={itemPreview} gridSize={GRID_SIZE} className="preview" />
        )}
      </svg>
      <form onSubmit={moveNextLine}>
        <input
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          className="hogan__hiddeninput"
          ref={hiddenInputRef}
          type="text"
          style={{
            position: 'absolute',
            zIndex: 100,
            ...inputPosition,
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              moveSelectionDown();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              moveSelectionUp();
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              moveSelectionLeft();
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              moveSelectionRight();
            }
          }}
        />
      </form>
    </div>
  );
}

export default App;
