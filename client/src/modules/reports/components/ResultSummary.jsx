import React from "react";

export const ResultSummary = ({ resultStats = {} }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Evaluation & Score Summary</h3>
        <span className="text-xs text-slate-400">Aggregated Metrics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-[11px] text-slate-400">Total Results</div>
          <div className="text-xl font-bold text-white mt-1">{resultStats.totalResults || 0}</div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-[11px] text-slate-400">Pass Rate</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{resultStats.passRate || 0}%</div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-[11px] text-slate-400">Average Score</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{resultStats.average || 0}%</div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-[11px] text-slate-400">High / Low</div>
          <div className="text-xl font-bold text-white mt-1">
            {resultStats.highest || 0}% / {resultStats.lowest || 0}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultSummary;
