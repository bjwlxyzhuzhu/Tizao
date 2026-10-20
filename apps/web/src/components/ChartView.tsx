interface Props {
  timeS: number[];
  series: number[];
}

export function ChartView({ timeS, series }: Props) {
  if (timeS.length < 2 || series.length < 2) return null;

  const width = 600;
  const height = 200;
  const pad = 28;
  const minX = Math.min(...timeS);
  const maxX = Math.max(...timeS);
  const minY = Math.min(...series);
  const maxY = Math.max(...series);

  const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (width - pad * 2);
  const sy = (y: number) => height - pad - ((y - minY) / (maxY - minY || 1)) * (height - pad * 2);

  const points = timeS
    .map((x, index) => `${sx(x).toFixed(1)},${sy(series[index] ?? minY).toFixed(1)}`)
    .join(' ');

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="温度曲线">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#22344f" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#22344f" />
      <polyline points={points} fill="none" stroke="#43d6c5" strokeWidth={2.5} strokeLinejoin="round" />
      <text x={pad} y={16} fill="#8ba0bb" fontSize={11}>{maxY.toFixed(0)} °C</text>
      <text x={pad} y={height - 8} fill="#8ba0bb" fontSize={11}>{minY.toFixed(0)} °C</text>
      <text x={width - pad - 40} y={height - 8} fill="#8ba0bb" fontSize={11}>{maxX.toFixed(0)} s</text>
    </svg>
  );
}
