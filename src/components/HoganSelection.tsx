import { Selection } from '../types';

interface HoganSelectionProps {
  selection: Selection;
  gridSize?: number;
}

export function HoganSelection({ selection, gridSize = 20 }: HoganSelectionProps) {
  const x = selection.x1 <= selection.x2 ? selection.x1 : selection.x2;
  const y = selection.y1 <= selection.y2 ? selection.y1 : selection.y2;
  const w = Math.abs(selection.x1 - selection.x2) + 1;
  const h = Math.abs(selection.y1 - selection.y2) + 1;

  return (
    <rect
      x={x * gridSize + 0.5}
      y={y * gridSize + 0.5}
      width={w * gridSize}
      height={h * gridSize}
      className="selection"
    />
  );
}
