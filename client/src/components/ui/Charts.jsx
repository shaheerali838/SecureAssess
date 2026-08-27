











export function BarChart({ data, height = 200, color = '#2563eb', formatValue }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * (height - 40) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group">
              <div className="text-xs font-medium text-accent-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatValue ? formatValue(d.value) : d.value}
              </div>
              <div
                className="w-full max-w-[40px] rounded-t-md transition-all duration-500 ease-out group-hover:opacity-80"
                style={{ height: Math.max(h, 2), backgroundColor: color }}
              />
              <div className="text-xs text-accent-500 mt-2 text-center truncate w-full">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}








export function LineChart({ data, height = 200, color = '#2563eb', showArea = true }) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const width = 100;
  const padding = 10;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - 30 - ((d.value - min) / range) * (height - 50);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - 30} L ${points[0].x} ${height - 30} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {showArea && <path d={areaD} fill={color} opacity={0.1} />}
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={1.5} fill={color} vectorEffect="non-scaling-stroke" />
            <text x={p.x} y={height - 10} textAnchor="middle" className="fill-accent-400" style={{ fontSize: '3px' }}>
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}








export function DonutChart({ data, size = 180, centerLabel, centerValue }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 20;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          {data.map((d, i) => {
            const dash = (d.value / total) * circumference;
            const segment = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="transition-all duration-700"
              />
            );
            offset += dash;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-2xl font-bold font-display text-accent-900">{centerValue}</span>}
          {centerLabel && <span className="text-xs text-accent-500">{centerLabel}</span>}
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-accent-600">{d.label}</span>
            <span className="font-medium text-accent-800 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}






export function StackedBar({ segments, label }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="w-full">
      {label && <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-accent-600">{label}</span>
        <span className="text-sm font-medium text-accent-800">{total}</span>
      </div>}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {segments.map((s, i) => (
          <div
            key={i}
            className="h-full transition-all duration-700"
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-accent-500">{s.label}</span>
            <span className="font-medium text-accent-700">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
