import React, { useState, useEffect } from "react";
import LiveMonitoring from "./LiveMonitoring";
import ProctoringReview from "./ProctoringReview";
import api from "../../../services/api";

export const ProctorDashboard = () => {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await api.get("/assessments", { params: { status: "PUBLISHED" } }).catch(() => ({ data: { data: { items: [] } } }));
        setAssessments(res.data?.data?.items || []);
      } catch (err) {
        console.warn("Failed to load assessments:", err);
      }
    };
    fetchAssessments();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {selectedSessionId ? (
        <div>
          <button
            onClick={() => setSelectedSessionId(null)}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            ← Back to Live Grid
          </button>
          <ProctoringReview sessionId={selectedSessionId} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <h2 className="text-lg font-bold text-white">Active Proctoring Supervision</h2>
              <p className="text-xs text-slate-400">Filter active examination streams by assessment cohort</p>
            </div>
            {assessments.length > 0 && (
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">All Active Assessments</option>
                {assessments.map((a) => (
                  <option key={a._id} value={a._id}>{a.title} ({a.code})</option>
                ))}
              </select>
            )}
          </div>

          <LiveMonitoring assessmentId={selectedAssessmentId || null} />
        </div>
      )}
    </div>
  );
};

export default ProctorDashboard;
