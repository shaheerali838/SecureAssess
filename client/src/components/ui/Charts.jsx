import React, { useState } from 'react';

/**
 * Modern High-Contrast Bar Chart with Interactive Tooltips
 */
export function BarChart({
  data = [],
  height = 220,
  color = '#3b82f6',
  formatValue = (v) => v,
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className="w-full select-none">
      <div className="flex items-end justify-between gap-3 pt-6 pb-2" style={{ height }}>
        {data.map((d, i) => {
          const isHovered = hoveredIdx === i;
          const barHeightPercent = Math.max((d.value / max) * 100, 4);

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Floating Value Pill */}
              <div
                className={`absolute -top-7 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono shadow-soft transition-all duration-200 pointer-events-none z-10 ${
                  isHovered
                    ? 'opacity-100 scale-100 bg-accent-900 dark:bg-white text-white dark:text-accent-900 border border-accent-700 dark:border-accent-200'
                    : 'opacity-0 scale-95'
                }`}
              >
                {formatValue(d.value)}
              </div>

              {/* Bar Fill */}
              <div className="w-full max-w-[42px] h-full flex items-end">
                <div
                  className="w-full rounded-t-lg transition-all duration-300 shadow-sm"
                  style={{
                    height: `${barHeightPercent}%`,
                    backgroundColor: d.color || color,
                    opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                    transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />
              </div>

              {/* X-Axis Label */}
              <div
                className={`mt-2 text-[12px] font-bold tracking-tight text-center truncate w-full transition-colors ${
                  isHovered
                    ? 'text-primary-600 dark:text-primary-400 font-extrabold'
                    : 'text-accent-700 dark:text-accent-200'
                }`}
              >
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Modern High-Contrast Line Chart with SVG Coordinates, Gridlines, Y-Axis, and Tooltips
 */
export function LineChart({
  data = [],
  height = 240,
  color = '#3b82f6',
  showArea = true,
  formatValue = (v) => `$${v}k`,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) return null;

  const rawValues = data.map((d) => d.value);
  const maxVal = Math.max(...rawValues);
  const minVal = Math.min(...rawValues);
  const paddingY = (maxVal - minVal) * 0.15 || maxVal * 0.1 || 10;
  const chartMax = Math.ceil(maxVal + paddingY);
  const chartMin = Math.max(0, Math.floor(minVal - paddingY));
  const range = chartMax - chartMin || 1;

  const width = 700;
  const svgHeight = 220;
  const paddingLeft = 65;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 40;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((d.value - chartMin) / range) * plotHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + plotHeight).toFixed(1)} Z`;

  // Grid steps (4 horizontal guide lines)
  const gridSteps = [0, 0.33, 0.66, 1];
  const gridLines = gridSteps.map((step) => {
    const val = chartMin + step * range;
    const y = paddingTop + plotHeight - step * plotHeight;
    return { val: Math.round(val), y };
  });

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="w-full relative select-none">
      {/* Top Stat Summary Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-sm" />
          <span className="text-xs font-semibold text-accent-500 dark:text-accent-300">
            Current Trajectory:
          </span>
          <span className="text-xs font-bold font-mono text-accent-900 dark:text-white">
            {activePoint ? `${activePoint.label}: ${formatValue(activePoint.value)}` : ''}
          </span>
        </div>
        <div className="text-[11px] font-semibold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-950/60 px-2 py-0.5 rounded-full border border-success-200 dark:border-success-800">
          +{(Math.round(((maxVal - minVal) / minVal) * 100))}% YTD Growth
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${svgHeight}`}
          className="w-full h-auto"
          style={{ maxHeight: height }}
        >
          <defs>
            <linearGradient id="lineChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="60%" stopColor={color} stopOpacity="0.10" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={color} floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {gridLines.map((grid, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={grid.y}
                x2={width - paddingRight}
                y2={grid.y}
                className="stroke-accent-200 dark:stroke-accent-800"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 12}
                y={grid.y + 4}
                textAnchor="end"
                className="fill-accent-600 dark:fill-accent-300 font-mono text-[11px] font-bold"
              >
                {formatValue(grid.val)}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {showArea && (
            <path
              d={areaD}
              fill="url(#lineChartGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineGlow)"
          />

          {/* Data Points, X-Axis Labels & Hover Interactivity */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Vertical hover guide bar */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingTop}
                    x2={p.x}
                    y2={paddingTop + plotHeight}
                    stroke={color}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                )}

                {/* Outer Ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 7 : 5}
                  fill={isHovered ? color : '#ffffff'}
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2.5}
                  className="transition-all duration-200 shadow-md"
                />

                {/* Inner Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 3 : 2}
                  fill={isHovered ? '#ffffff' : color}
                />

                {/* X-Axis Tick Label - High Contrast Bold Text */}
                <text
                  x={p.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className={`font-sans text-[12px] font-bold tracking-tight transition-colors ${
                    isHovered
                      ? 'fill-primary-600 dark:fill-primary-400 font-extrabold'
                      : 'fill-accent-800 dark:fill-accent-200'
                  }`}
                >
                  {p.label}
                </text>

                {/* Interactive Tooltip on Hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={p.x - 42}
                      y={p.y - 38}
                      width="84"
                      height="26"
                      rx="6"
                      className="fill-accent-950 dark:fill-white stroke-accent-700 dark:stroke-accent-200"
                      strokeWidth="1"
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                    />
                    <text
                      x={p.x}
                      y={p.y - 21}
                      textAnchor="middle"
                      className="fill-white dark:fill-accent-950 font-mono text-[11px] font-extrabold"
                    >
                      {formatValue(p.value)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * Modern High-Contrast Donut Chart
 */
export function DonutChart({
  data = [],
  size = 190,
  centerLabel = 'Total',
  centerValue,
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2 - 22;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 select-none">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-accent-100 dark:text-accent-800/80"
            strokeWidth={strokeWidth}
          />
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
                strokeLinecap="round"
                className="transition-all duration-700 hover:opacity-85 cursor-pointer"
              />
            );
            offset += dash;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && (
            <span className="text-2xl font-black font-display text-accent-900 dark:text-white">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-500 dark:text-accent-400">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5 flex-1 w-full min-w-0">
        {data.map((d, i) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="font-bold text-accent-800 dark:text-accent-200 truncate">
                  {d.label}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono shrink-0">
                <span className="font-bold text-accent-900 dark:text-white">{d.value}</span>
                <span className="text-[10px] text-accent-400 font-semibold">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Modern High-Contrast Stacked Bar
 */
export function StackedBar({ segments = [], label }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="w-full space-y-2 select-none">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-accent-700 dark:text-accent-300">{label}</span>
          <span className="font-bold font-mono text-accent-900 dark:text-white">{total}</span>
        </div>
      )}
      <div className="flex h-3 rounded-full overflow-hidden gap-1 bg-accent-100 dark:bg-accent-800 p-0.5">
        {segments.map((s, i) => (
          <div
            key={i}
            className="h-full rounded-sm transition-all duration-700 hover:opacity-90 cursor-pointer"
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3.5 pt-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-accent-600 dark:text-accent-300 font-medium">{s.label}</span>
            <span className="font-bold font-mono text-accent-900 dark:text-white ml-0.5">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BarChart;
