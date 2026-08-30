import React from "react";

export const ProctoringSummary = ({ proctoringStats = {} }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Proctoring & Integrity Summary</h3>
        <span className="text-xs text-slate-400">Security Telemetry</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-[11px] text-slate-400">Proctored Attempts</div>
          <div className="text-xl font-bold text-white mt-1">{proctoringStats.totalProctoredAttempts || 0}</div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-[11px] text-slate-400">Total Violations</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{proctoringStats.totalViolations || 0}</div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-[11px] text-slate-400">Confirmed Violations</div>
          <div className="text-xl font-bold text-red-400 mt-1">{proctoringStats.confirmedViolations || 0}</div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-[11px] text-slate-400">Terminations</div>
          <div className="text-xl font-bold text-red-500 mt-1">{proctoringStats.terminations || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-emerald-400">
          <div className="text-[10px] text-slate-400 uppercase">Low</div>
          <div className="font-bold">{proctoringStats.lowRisk || 0}</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg text-blue-400">
          <div className="text-[10px] text-slate-400 uppercase">Med</div>
          <div className="font-bold">{proctoringStats.mediumRisk || 0}</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-amber-400">
          <div className="text-[10px] text-slate-400 uppercase">High</div>
          <div className="font-bold">{proctoringStats.highRisk || 0}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-red-400">
          <div className="text-[10px] text-slate-400 uppercase">Crit</div>
          <div className="font-bold">{proctoringStats.criticalRisk || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringSummary;
