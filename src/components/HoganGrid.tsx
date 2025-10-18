interface HoganGridProps {
  width: number;
  height: number;
  gridSize?: number;
}

const range = (max: number) => [...Array(max).keys()];

export function HoganGrid({ width, height, gridSize = 20 }: HoganGridProps) {
  const vlines = range(Math.floor(width / gridSize)).map((i) => i * gridSize + 0.5);
  const hlines = range(Math.floor(height / gridSize)).map((i) => i * gridSize + 0.5);

  return (
    <g>
      {vlines.map((line, index) => (
        <line key={`v-${index}`} x1={line} y1={0} x2={line} y2={height} />
      ))}
      {hlines.map((line, index) => (
        <line key={`h-${index}`} x1={0} y1={line} x2={width} y2={line} />
      ))}
    </g>
  );
}
