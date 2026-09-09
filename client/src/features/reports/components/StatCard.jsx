import React from "react";

export const StatCard = ({ title, value, subtitle, icon, trend, color = "blue" }) => {
  const getColorClasses = () => {
    switch (color) {
      case "emerald":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      case "amber":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      case "red":
        return "border-red-500/30 bg-red-500/10 text-red-400";
      case "indigo":
        return "border-indigo-500/30 bg-indigo-500/10 text-indigo-400";
      default:
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>

      <div className="my-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>
      )}
    </div>
  );
};

export default StatCard;
