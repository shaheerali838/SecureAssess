import React, { useState, useEffect } from "react";
import CandidateGrid from "../components/CandidateGrid";
import ProctorWarningModal from "../components/ProctorWarningModal";
import TerminateAttemptModal from "../components/TerminateAttemptModal";
import api from "../../../services/api";

export const LiveMonitoring = ({ assessmentId = null }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [warningTarget, setWarningTarget] = useState(null);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveSessions = async () => {
    try {
      const res = await api.get("/proctoring/sessions", {
        params: {
          assessmentId,
          status: "ACTIVE",
        },
      }).catch(() => ({ data: { data: [] } }));

      setSessions(res.data?.data || []);
    } catch (err) {
      console.warn("Fetch proctoring sessions error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 5000);
    return () => clearInterval(interval);
  }, [assessmentId]);

  const handleSendWarning = async (message) => {
    if (!warningTarget) return;
    await api.post(`/proctoring/sessions/${warningTarget._id}/warning`, { message });
    await fetchActiveSessions();
  };

  const handleTerminateAttempt = async (reason) => {
    if (!terminateTarget) return;
    await api.post(`/proctoring/sessions/${terminateTarget._id}/terminate`, { reason });
    await fetchActiveSessions();
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === "HIGH_RISK") return s.riskLevel === "HIGH" || s.riskLevel === "CRITICAL";
    if (filter === "VIOLATIONS") return (s.violationCount || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Proctoring Grid</h1>
          <p className="text-xs text-slate-400">Real-time candidate telemetry, AI vision monitoring, and proctor intervention.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "ALL" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Candidates ({sessions.length})
          </button>
          <button
            onClick={() => setFilter("HIGH_RISK")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "HIGH_RISK" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            High Risk ({sessions.filter((s) => s.riskLevel === "HIGH" || s.riskLevel === "CRITICAL").length})
          </button>
        </div>
      </div>

      <CandidateGrid
        sessions={filteredSessions}
        onSelectCandidate={(s) => setSelectedCandidate(s)}
        onWarnCandidate={(s) => setWarningTarget(s)}
        onTerminateCandidate={(s) => setTerminateTarget(s)}
      />

      <ProctorWarningModal
        isOpen={Boolean(warningTarget)}
        candidateName={`${warningTarget?.candidateId?.firstName || ""} ${warningTarget?.candidateId?.lastName || ""}`}
        onClose={() => setWarningTarget(null)}
        onSend={handleSendWarning}
      />

      <TerminateAttemptModal
        isOpen={Boolean(terminateTarget)}
        candidateName={`${terminateTarget?.candidateId?.firstName || ""} ${terminateTarget?.candidateId?.lastName || ""}`}
        onClose={() => setTerminateTarget(null)}
        onConfirmTerminate={handleTerminateAttempt}
      />
    </div>
  );
};

export default LiveMonitoring;
