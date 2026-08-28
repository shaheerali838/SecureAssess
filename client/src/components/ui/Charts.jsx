import React from 'react';

export function BarChart({ data, height = 200, color = '#2563eb', formatValue }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * (height - 40) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group">
              <div className="text-[11px] font-semibold text-accent-700 dark:text-accent-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatValue ? formatValue(d.value) : d.value}
              </div>
              <div
                className="w-full max-w-[36px] rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-80"
                style={{ height: Math.max(h, 3), backgroundColor: color }}
              />
              <div className="text-[11px] text-accent-500 dark:text-accent-400 mt-2 text-center truncate w-full font-medium">
                {d.label}
              </div>
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
        {showArea && <path d={areaD} fill={color} opacity={0.12} />}
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={1.5} fill={color} vectorEffect="non-scaling-stroke" />
            <text x={p.x} y={height - 10} textAnchor="middle" className="fill-accent-400 dark:fill-accent-500 font-sans" style={{ fontSize: '3px' }}>
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
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-accent-100 dark:text-accent-800" strokeWidth={strokeWidth} />
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
          {centerValue && <span className="text-2xl font-bold font-display text-accent-900 dark:text-white">{centerValue}</span>}
          {centerLabel && <span className="text-[11px] font-medium text-accent-500 dark:text-accent-400">{centerLabel}</span>}
        </div>
      </div>
      <div className="space-y-2 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-accent-600 dark:text-accent-300 truncate">{d.label}</span>
            <span className="font-bold text-accent-900 dark:text-white ml-auto">{d.value}</span>
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
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-accent-600 dark:text-accent-400">{label}</span>
          <span className="text-xs font-bold text-accent-900 dark:text-white">{total}</span>
        </div>
      )}
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-accent-100 dark:bg-accent-800">
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
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-accent-500 dark:text-accent-400">{s.label}</span>
            <span className="font-semibold text-accent-800 dark:text-accent-200">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BarChart;
