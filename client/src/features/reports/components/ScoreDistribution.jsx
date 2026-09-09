import React from "react";

export const ScoreDistribution = ({ distribution = {} }) => {
  const brackets = [
    { label: "90–100%", count: distribution["90-100"] || 0, color: "bg-emerald-500" },
    { label: "80–89%", count: distribution["80-89"] || 0, color: "bg-blue-500" },
    { label: "70–79%", count: distribution["70-79"] || 0, color: "bg-cyan-500" },
    { label: "60–69%", count: distribution["60-69"] || 0, color: "bg-amber-500" },
    { label: "<60%", count: distribution["<60"] || 0, color: "bg-red-500" },
  ];

  const maxCount = Math.max(...brackets.map((b) => b.count), 1);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Score Distribution</h3>
        <span className="text-xs text-slate-400">Cohort Breakdown</span>
      </div>

      <div className="space-y-3 pt-1">
        {brackets.map((item) => {
          const percentage = Math.round((item.count / maxCount) * 100);

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">{item.label}</span>
                <span className="font-mono text-slate-400">{item.count} Candidates</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreDistribution;
