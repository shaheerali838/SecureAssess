import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import PerformanceChart from "../components/PerformanceChart";
import AssessmentAnalytics from "./AssessmentAnalytics";
import reportsService from "../services/reports.service";
import api from "../../../services/api";

export const ReportsDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, assessRes] = await Promise.all([
          reportsService.getOrganizationDashboard().catch(() => ({ data: {} })),
          api.get("/assessments", { params: { status: "PUBLISHED" } }).catch(() => ({ data: { data: { items: [] } } })),
        ]);

        setDashboard(dashRes.data || {});
        setAssessments(assessRes.data?.data?.items || []);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics Engine</h1>
          <p className="text-xs text-slate-400">Institutional performance dashboards, item discrimination metrics, and proctoring telemetry.</p>
        </div>

        {assessments.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Overview Dashboard</option>
              {assessments.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title} ({a.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedAssessmentId ? (
        <AssessmentAnalytics assessmentId={selectedAssessmentId} />
      ) : (
        <div className="space-y-6">
          {/* KPI Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Assessments"
              value={dashboard?.totalAssessments || 0}
              subtitle="Published curriculum tests"
              icon="📚"
              color="blue"
            />
            <StatCard
              title="Candidates"
              value={dashboard?.candidates || 0}
              subtitle="Enrolled test takers"
              icon="👥"
              color="indigo"
            />
            <StatCard
              title="Exam Attempts"
              value={dashboard?.attempts || 0}
              subtitle={`${dashboard?.completedAttempts || 0} completed`}
              icon="📝"
              color="emerald"
            />
            <StatCard
              title="Pass Rate"
              value={`${dashboard?.passRate || 0}%`}
              subtitle={`Avg score: ${dashboard?.averageScore || 0}%`}
              icon="🏆"
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart
              title="Monthly Examination Volume"
              data={[
                { label: "May", value: 120 },
                { label: "Jun", value: 245 },
                { label: "Jul", value: 318 },
                { label: "Aug", value: 402 },
              ]}
            />

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Assessment Drill-down</h3>
              <p className="text-xs text-slate-400">Select an assessment to view deep analytics, difficulty indexes, and question performance.</p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {assessments.map((a) => (
                  <div
                    key={a._id}
                    onClick={() => setSelectedAssessmentId(a._id)}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">{a.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{a.code}</div>
                    </div>
                    <span className="text-xs text-blue-400 font-semibold">Inspect →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
