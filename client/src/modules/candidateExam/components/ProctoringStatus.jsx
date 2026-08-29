import React from "react";

export const ProctoringStatus = ({
  status = "ACTIVE",
  cameraConnected = true,
  micConnected = true,
  screenConnected = true,
  riskLevel = "LOW",
}) => {
  const getRiskBadge = () => {
    switch (riskLevel) {
      case "CRITICAL":
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">Integrity Alert</span>;
      case "HIGH":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">Elevated Attention</span>;
      case "MEDIUM":
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">Moderate</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">Protected</span>;
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Proctoring Mode: {status}</span>
        </div>
        {getRiskBadge()}
      </div>

      <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] text-slate-400">
        <div className={`flex items-center gap-1 p-1 rounded ${cameraConnected ? "text-emerald-400" : "text-red-400"}`}>
          <span>📹</span>
          <span>Camera</span>
        </div>
        <div className={`flex items-center gap-1 p-1 rounded ${micConnected ? "text-emerald-400" : "text-red-400"}`}>
          <span>🎙️</span>
          <span>Mic</span>
        </div>
        <div className={`flex items-center gap-1 p-1 rounded ${screenConnected ? "text-emerald-400" : "text-amber-400"}`}>
          <span>🖥️</span>
          <span>Screen</span>
        </div>
      </div>
    </div>
  );
};

export default ProctoringStatus;
