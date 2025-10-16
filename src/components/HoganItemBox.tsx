import type { Item } from '../types';

interface HoganItemBoxProps {
  item: Item;
  gridSize: number;
  className?: string;
}

export default function HoganItemBox({ item, gridSize, className }: HoganItemBoxProps) {
  if (item.type !== 'box') return null;

  const anchorLeft = item.text.charAt(0) === ':';
  const anchorRight = item.text.charAt(item.text.length - 1) === ':';

  const textAnchor = anchorLeft ? 'start' : anchorRight ? 'end' : 'middle';

  const text = anchorLeft
    ? item.text.slice(1)
    : anchorRight
    ? item.text.slice(0, -1)
    : item.text;

  const x = anchorLeft
    ? item.x * gridSize + gridSize / 4
    : anchorRight
    ? (item.x + item.width) * gridSize - gridSize / 4
    : (item.x + item.width / 2) * gridSize;

  const filter =
    item.x !== (item.x | 0) || item.y !== (item.y | 0)
      ? 'url(#dropshadow)'
      : undefined;

  return (
    <g className={className}>
      <rect
        x={item.x * gridSize + 0.5}
        y={item.y * gridSize + 0.5}
        width={item.width * gridSize}
        height={item.height * gridSize}
        className="box"
        filter={filter}
      />
      <text
        dominantBaseline="central"
        textAnchor={textAnchor}
        x={x}
        y={(item.y + item.height / 2) * gridSize}
      >
        {text}
      </text>
    </g>
  );
}
