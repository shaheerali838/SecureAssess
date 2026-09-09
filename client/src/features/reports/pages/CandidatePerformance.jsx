import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import reportsService from "../services/reports.service";

export const CandidatePerformance = ({ candidateId }) => {
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCandidateData = async () => {
      if (!candidateId) return;
      try {
        const res = await reportsService.getCandidatePerformance(candidateId);
        setPerformance(res.data || {});
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidateData();
  }, [candidateId]);

  if (isLoading) {
    return <div className="py-16 text-center text-slate-500 text-xs">Loading candidate profile analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-lg font-bold text-white">
          {performance?.candidate?.name || "Candidate Performance"}
        </h2>
        <p className="text-xs text-slate-400 font-mono">{performance?.candidate?.code} — {performance?.candidate?.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Assigned"
          value={performance?.assessmentsAssigned || 0}
          subtitle={`${performance?.attemptsCompleted || 0} completed`}
          icon="📝"
          color="blue"
        />
        <StatCard
          title="Pass Rate"
          value={`${performance?.passRate || 0}%`}
          subtitle={`${performance?.passedCount || 0} passed / ${performance?.failedCount || 0} failed`}
          icon="🏆"
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={`${performance?.averageScore || 0}%`}
          subtitle={`Highest: ${performance?.highestScore || 0}%`}
          icon="📊"
          color="amber"
        />
        <StatCard
          title="Proctoring Violations"
          value={performance?.totalProctoringViolations || 0}
          subtitle={`Avg risk: ${performance?.averageRiskScore || 0}`}
          icon="🛡️"
          color="red"
        />
      </div>
    </div>
  );
};

export default CandidatePerformance;
