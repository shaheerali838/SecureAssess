import React, { useState, useEffect } from "react";
import ProctoringSummary from "../components/ProctoringSummary";
import reportsService from "../services/reports.service";

export const ProctoringAnalytics = ({ assessmentId = null }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProcData = async () => {
      try {
        const res = assessmentId
          ? await reportsService.getAssessmentProctoring(assessmentId)
          : await reportsService.getOrganizationDashboard();
        setData(res.data || {});
      } finally {
        setIsLoading(false);
      }
    };
    fetchProcData();
  }, [assessmentId]);

  if (isLoading) {
    return <div className="py-16 text-center text-slate-500 text-xs">Loading proctoring analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <ProctoringSummary proctoringStats={data} />
    </div>
  );
};

export default ProctoringAnalytics;
