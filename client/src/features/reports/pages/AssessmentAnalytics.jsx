import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import ScoreDistribution from "../components/ScoreDistribution";
import QuestionAnalysisTable from "../components/QuestionAnalysisTable";
import ResultSummary from "../components/ResultSummary";
import ProctoringSummary from "../components/ProctoringSummary";
import ExportReportModal from "../components/ExportReportModal";
import reportsService from "../services/reports.service";

export const AssessmentAnalytics = ({ assessmentId }) => {
  const [summary, setSummary] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [results, setResults] = useState(null);
  const [proctoring, setProctoring] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      if (!assessmentId) return;
      setIsLoading(true);
      try {
        const [sumRes, qRes, resRes, procRes] = await Promise.all([
          reportsService.getAssessmentSummary(assessmentId).catch(() => ({ data: {} })),
          reportsService.getAssessmentQuestions(assessmentId).catch(() => ({ data: {} })),
          reportsService.getAssessmentResults(assessmentId).catch(() => ({ data: {} })),
          reportsService.getAssessmentProctoring(assessmentId).catch(() => ({ data: {} })),
        ]);

        setSummary(sumRes.data || {});
        setQuestions(qRes.data || {});
        setResults(resRes.data || {});
        setProctoring(procRes.data || {});
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllMetrics();
  }, [assessmentId]);

  const handleExport = async (format) => {
    await reportsService.exportAssessment(assessmentId, format);
  };

  if (isLoading) {
    return <div className="py-16 text-center text-slate-500 text-xs">Loading assessment metrics...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white">
            {summary?.assessment?.title || "Assessment Analytics"}
          </h2>
          <p className="text-xs text-slate-400 font-mono">{summary?.assessment?.code}</p>
        </div>

        <button
          onClick={() => setIsExportOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
        >
          📥 Export Report (CSV / PDF)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Assigned"
          value={summary?.assigned || 0}
          subtitle={`${summary?.started || 0} started`}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Completed"
          value={summary?.completed || 0}
          subtitle={`${summary?.submitted || 0} submitted`}
          icon="📝"
          color="indigo"
        />
        <StatCard
          title="Pass Rate"
          value={`${summary?.passRate || 0}%`}
          subtitle={`${summary?.passed || 0} passed / ${summary?.failed || 0} failed`}
          icon="🏆"
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={`${summary?.averageScore || 0}%`}
          subtitle={`High: ${summary?.highestScore || 0}%`}
          icon="📊"
          color="amber"
        />
      </div>

      {/* Results & Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResultSummary resultStats={results} />
        <ScoreDistribution distribution={results?.scoreDistribution || {}} />
      </div>

      {/* Item Analysis & Proctoring Breakdown */}
      <QuestionAnalysisTable
        questions={questions?.questions || []}
        difficultySummary={questions?.difficultySummary || {}}
      />

      <ProctoringSummary proctoringStats={proctoring} />

      <ExportReportModal
        isOpen={isExportOpen}
        assessmentTitle={summary?.assessment?.title || "Assessment"}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
};

export default AssessmentAnalytics;
