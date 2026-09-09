import React from "react";

export const RiskIndicator = ({ score = 0, level = "LOW", size = "md" }) => {
  const getColor = () => {
    switch (level) {
      case "CRITICAL":
        return { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/30", badgeBg: "bg-red-500/10" };
      case "HIGH":
        return { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", badgeBg: "bg-amber-500/10" };
      case "MEDIUM":
        return { bg: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30", badgeBg: "bg-yellow-500/10" };
      default:
        return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", badgeBg: "bg-emerald-500/10" };
    }
  };

  const colors = getColor();

  if (size === "sm") {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${colors.border} ${colors.badgeBg} ${colors.text} text-[11px] font-semibold`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
        <span>{level} ({score} pts)</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${colors.border} ${colors.badgeBg}`}>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Risk Assessment</div>
        <div className={`text-lg font-bold ${colors.text} flex items-center gap-2`}>
          <span>{level} RISK</span>
          <span className="text-xs text-slate-400 font-normal">({score} / 100)</span>
        </div>
      </div>
      <div className="w-16 bg-slate-700/50 rounded-full h-2 overflow-hidden border border-slate-600">
        <div
          className={`h-full ${colors.bg} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
};

export default RiskIndicator;
