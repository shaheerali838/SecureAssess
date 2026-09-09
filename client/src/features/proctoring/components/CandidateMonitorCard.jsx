import React from "react";
import CandidateVideo from "./CandidateVideo";
import RiskIndicator from "./RiskIndicator";

export const CandidateMonitorCard = ({
  session,
  onSelect = null,
  onWarn = null,
  onTerminate = null,
}) => {
  const candidate = session.candidateId || {};
  const assessment = session.assessmentId || {};

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden hover:border-slate-500 transition-all shadow-md flex flex-col justify-between">
      <div className="p-3.5 space-y-3">
        <CandidateVideo
          candidate={candidate}
          cameraActive={session.cameraEnabled}
          micActive={session.microphoneEnabled}
          screenActive={session.screenShareEnabled}
        />

        <div className="flex items-center justify-between pt-1">
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {assessment.title || "Exam Session"}
            </div>
            <div className="text-[11px] text-slate-400">
              Violations: <span className="font-semibold text-slate-200">{session.violationCount || 0}</span>
            </div>
          </div>
          <RiskIndicator score={session.riskScore || 0} level={session.riskLevel || "LOW"} size="sm" />
        </div>
      </div>

      <div className="border-t border-slate-700/60 bg-slate-900/40 p-2.5 flex items-center justify-between gap-1.5">
        <button
          onClick={() => onSelect && onSelect(session)}
          className="flex-1 px-2.5 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-xs font-medium transition text-center"
        >
          Inspect Timeline
        </button>
        {onWarn && (
          <button
            onClick={() => onWarn(session)}
            className="px-2.5 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded text-xs font-medium transition"
            title="Send Warning"
          >
            ⚠️ Warn
          </button>
        )}
        {onTerminate && (
          <button
            onClick={() => onTerminate(session)}
            className="px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-medium transition"
            title="Terminate Exam"
          >
            ⛔
          </button>
        )}
      </div>
    </div>
  );
};

export default CandidateMonitorCard;
