import { Selection, getSelectionRect } from '../editor';

interface HoganSelectionProps {
  selection: Selection;
  gridSize?: number;
}

export function HoganSelection({ selection, gridSize = 20 }: HoganSelectionProps) {
  const { left, top, w, h } = getSelectionRect(selection);

  return (
    <rect
      x={left * gridSize + 0.5}
      y={top * gridSize + 0.5}
      width={w * gridSize}
      height={h * gridSize}
      className="selection"
    />
  );
}
