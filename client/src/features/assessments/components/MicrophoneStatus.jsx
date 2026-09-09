import React from "react";

export const MicrophoneStatus = ({ isEnabled = true, audioLevel = 0 }) => {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
      isEnabled
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
        : "bg-red-500/10 border-red-500/30 text-red-300"
    }`}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>{isEnabled ? "Microphone Live" : "Microphone Muted"}</span>
      </div>
      {isEnabled && (
        <div className="flex gap-0.5 items-center h-3">
          <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-2" />
          <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-3.5" />
          <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-1.5" />
        </div>
      )}
    </div>
  );
};

export default MicrophoneStatus;
