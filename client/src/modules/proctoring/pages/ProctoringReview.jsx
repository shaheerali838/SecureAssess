import React, { useState } from "react";
import useRealtimeMonitoring from "../hooks/useRealtimeMonitoring";
import CandidateVideo from "../components/CandidateVideo";
import RiskIndicator from "../components/RiskIndicator";
import EventTimeline from "../components/EventTimeline";
import EvidenceViewer from "../components/EvidenceViewer";
import ProctorWarningModal from "../components/ProctorWarningModal";
import TerminateAttemptModal from "../components/TerminateAttemptModal";

export const ProctoringReview = ({ sessionId }) => {
  const {
    session,
    events,
    evidence,
    isLoading,
    error,
    sendWarning,
    pauseSession,
    terminateSession,
    reviewEvent,
  } = useRealtimeMonitoring(sessionId, 4000);

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  if (isLoading && !session) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading proctoring telemetry...</div>;
  }

  if (error || !session) {
    return <div className="p-8 text-center text-red-400 text-sm">{error || "Proctoring session not found."}</div>;
  }

  const candidate = session.candidateId || {};
  const assessment = session.assessmentId || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {session.status}
            </span>
            <span className="text-xs text-slate-400 font-mono">{candidate.candidateCode}</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {candidate.firstName} {candidate.lastName} — {assessment.title || "Examination"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWarningOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition"
          >
            ⚠️ Send Warning
          </button>
          <button
            onClick={() => pauseSession("Proctor verification paused examination.")}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
          >
            ⏸️ Pause
          </button>
          <button
            onClick={() => setIsTerminateOpen(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition"
          >
            ⛔ Terminate
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Feed & Risk Overview */}
        <div className="space-y-4">
          <CandidateVideo
            candidate={candidate}
            cameraActive={session.cameraEnabled}
            micActive={session.microphoneEnabled}
            screenActive={session.screenShareEnabled}
          />
          <RiskIndicator score={session.riskScore || 0} level={session.riskLevel || "LOW"} />

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-semibold text-slate-200">Session Telemetry</h4>
            <div className="flex justify-between text-slate-400">
              <span>Integrity Status:</span>
              <span className="font-mono text-white font-medium">{session.integrityStatus || "CLEAR"}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Anomalies:</span>
              <span className="font-mono text-white font-medium">{session.violationCount || 0}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IP Address:</span>
              <span className="font-mono text-white font-medium">{session.ipAddress || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Event Timeline & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Integrity Audit Timeline</h3>
            <EventTimeline
              events={events}
              onReviewEvent={(evt) => reviewEvent(evt._id, { reviewed: true, resolution: "CONFIRMED_VIOLATION" })}
            />
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Captured Media Evidence</h3>
            <EvidenceViewer
              evidence={evidence}
              selectedEvidence={selectedEvidence}
              onSelect={(item) => setSelectedEvidence(item)}
            />
          </div>
        </div>
      </div>

      <ProctorWarningModal
        isOpen={isWarningOpen}
        candidateName={`${candidate.firstName || ""} ${candidate.lastName || ""}`}
        onClose={() => setIsWarningOpen(false)}
        onSend={sendWarning}
      />

      <TerminateAttemptModal
        isOpen={isTerminateOpen}
        candidateName={`${candidate.firstName || ""} ${candidate.lastName || ""}`}
        onClose={() => setIsTerminateOpen(false)}
        onConfirmTerminate={terminateSession}
      />
    </div>
  );
};

export default ProctoringReview;
