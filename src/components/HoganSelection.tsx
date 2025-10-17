import type { Selection } from '../types';
import { GRID_SIZE } from '../utils';

interface HoganSelectionProps {
  selection: Selection;
}

export default function HoganSelection({ selection }: HoganSelectionProps) {
  const selectionWidth = {
    x: selection.x1 <= selection.x2 ? selection.x1 : selection.x2,
    y: selection.y1 <= selection.y2 ? selection.y1 : selection.y2,
    w: Math.abs(selection.x1 - selection.x2) + 1,
    h: Math.abs(selection.y1 - selection.y2) + 1,
  };

  const selectionScreen = {
    x: selectionWidth.x * GRID_SIZE,
    y: selectionWidth.y * GRID_SIZE,
    w: selectionWidth.w * GRID_SIZE,
    h: selectionWidth.h * GRID_SIZE,
  };

  return (
    <rect
      x={selectionScreen.x}
      y={selectionScreen.y}
      height={selectionScreen.h}
      width={selectionScreen.w}
      className="selection"
    />
  );
}
