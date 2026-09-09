import React from "react";

export const SecurityWarning = ({ warning, onDismiss = null }) => {
  if (!warning) return null;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-md bg-amber-950/90 border-2 border-amber-500 text-amber-200 p-4 rounded-xl shadow-2xl backdrop-blur-md animate-bounce">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h4 className="font-bold text-sm text-white mb-1">Proctor Notice</h4>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            {typeof warning === "string" ? warning : warning.message}
          </p>
          <div className="mt-2 text-[10px] text-amber-300/80">
            All integrity anomalies are logged and reviewed. Please adhere to examination rules.
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-400 hover:text-white text-xs font-bold px-2 py-1 bg-amber-900/60 rounded"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SecurityWarning;
