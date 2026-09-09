import React from "react";

export const EventTimeline = ({ events = [], onReviewEvent = null }) => {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
      case "HIGH":
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">HIGH</span>;
      case "MEDIUM":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">MED</span>;
      case "LOW":
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">LOW</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">INFO</span>;
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-xs">
        No security anomalies or integrity events logged.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
      {events.map((evt, idx) => {
        const timeStr = new Date(evt.serverOccurredAt || evt.createdAt).toLocaleTimeString();

        return (
          <div key={evt._id || idx} className="relative group">
            <div className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${evt.riskPoints > 0 ? "bg-amber-400" : "bg-blue-400"}`} />
            
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-1.5 hover:border-slate-500 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-200">{evt.type}</span>
                  {getSeverityBadge(evt.severity)}
                  {evt.riskPoints > 0 && (
                    <span className="text-[11px] text-amber-400 font-semibold">+{evt.riskPoints} pts</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{timeStr}</span>
              </div>

              {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded font-mono">
                  {JSON.stringify(evt.metadata)}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-500">Source: {evt.source || "BROWSER"} (Confidence: {(evt.confidence * 100).toFixed(0)}%)</span>
                {evt.reviewed ? (
                  <span className="text-emerald-400 font-medium">✓ Reviewed ({evt.resolution || "VERIFIED"})</span>
                ) : (
                  onReviewEvent && (
                    <button
                      onClick={() => onReviewEvent(evt)}
                      className="text-blue-400 hover:text-blue-300 font-medium underline"
                    >
                      Annotate Review
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventTimeline;
