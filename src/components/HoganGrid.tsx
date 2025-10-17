import { range } from '../utils';

interface HoganGridProps {
  width: number;
  height: number;
}

export default function HoganGrid({ width, height }: HoganGridProps) {
  const vlines = range(width / 20).map(i => i * 20 + 0.5);
  const hlines = range(height / 20).map(i => i * 20 + 0.5);

  return (
    <g>
      {vlines.map((line, index) => (
        <line
          key={`v-${index}`}
          x1={line}
          y1={0}
          x2={line}
          y2={height}
        />
      ))}
      {hlines.map((line, index) => (
        <line
          key={`h-${index}`}
          x1={0}
          y1={line}
          x2={width}
          y2={line}
        />
      ))}
    </g>
  );
}
