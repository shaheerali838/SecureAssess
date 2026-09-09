import React from "react";

export const PerformanceChart = ({ title = "Performance Trend", data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center text-slate-500 text-xs">
        No time-series data available.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        <span className="text-xs text-slate-400">Monthly Progression</span>
      </div>

      <div className="h-44 flex items-end gap-3 pt-6 px-2">
        {data.map((item, idx) => {
          const heightPct = Math.round((item.value / maxValue) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition">
                {item.value}
              </div>
              <div className="w-full bg-slate-800 rounded-t-lg overflow-hidden flex items-end h-32">
                <div
                  className="w-full bg-blue-500 group-hover:bg-blue-400 transition-all rounded-t-lg"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-full font-mono">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PerformanceChart;
