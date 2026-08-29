import React from "react";

export const EvidenceViewer = ({ evidence = [], selectedEvidence = null, onSelect = null }) => {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-xs">
        No media evidence recorded for this proctoring session.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {evidence.map((item) => (
          <div
            key={item._id}
            onClick={() => onSelect && onSelect(item)}
            className={`border rounded-lg p-2 cursor-pointer transition ${
              selectedEvidence?._id === item._id
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-700 bg-slate-800/60 hover:border-slate-600"
            }`}
          >
            <div className="aspect-video bg-slate-900 rounded overflow-hidden flex items-center justify-center text-slate-600 text-xs font-mono mb-1.5">
              {item.type}
            </div>
            <div className="text-[11px] font-semibold text-slate-200 truncate">{item.type}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {new Date(item.capturedAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvidenceViewer;
