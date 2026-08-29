import React from "react";

export const SecurityEventBadge = ({ status = "SUCCESS", action = "" }) => {
  const isSecurityAlert =
    action.includes("DENIED") ||
    action.includes("FAILED") ||
    action.includes("WARNING") ||
    action.includes("TERMINATE") ||
    action.includes("REUSE") ||
    status === "DENIED" ||
    status === "WARNING" ||
    status === "FAILED";

  const getStatusColor = () => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      case "DENIED":
        return "bg-red-500/20 border-red-500/40 text-red-400 font-bold";
      case "FAILED":
        return "bg-amber-500/20 border-amber-500/40 text-amber-400";
      case "WARNING":
        return "bg-orange-500/20 border-orange-500/40 text-orange-400";
      default:
        return "bg-slate-800 border-slate-700 text-slate-300";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider border ${getStatusColor()}`}
    >
      {isSecurityAlert && <span className="text-red-400">🛡️</span>}
      {status}
    </span>
  );
};

export default SecurityEventBadge;
