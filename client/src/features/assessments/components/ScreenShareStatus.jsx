import React from "react";

export const ScreenShareStatus = ({ isSharing = true, onToggle = null }) => {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
      isSharing
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
    }`}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>{isSharing ? "Screen Sharing Active" : "Screen Sharing Inactive"}</span>
      </div>
      {onToggle && (
        <button
          onClick={onToggle}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded font-medium transition"
        >
          {isSharing ? "Stop" : "Share"}
        </button>
      )}
    </div>
  );
};

export default ScreenShareStatus;
