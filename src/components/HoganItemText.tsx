import type { Item } from '../types';

interface HoganItemTextProps {
  item: Item;
  gridSize: number;
}

export default function HoganItemText({ item, gridSize }: HoganItemTextProps) {
  if (item.type !== 'text') return null;

  const headingMatch = item.text.match(/^([#]+) (.*)/);
  const heading = headingMatch
    ? {
        level: headingMatch[1].length,
        text: headingMatch[2],
      }
    : null;

  const fontSize = heading ? [56, 42, 28][heading.level - 1] : 14;
  const text = heading ? heading.text : item.text;

  return (
    <text
      x={item.x * gridSize + gridSize / 4}
      y={item.y * gridSize}
      dominantBaseline="text-before-edge"
      fontSize={fontSize}
    >
      {text}
    </text>
  );
}
