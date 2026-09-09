import React, { useState, useEffect } from "react";
import QuestionAnalysisTable from "../components/QuestionAnalysisTable";
import reportsService from "../services/reports.service";

export const QuestionAnalytics = ({ assessmentId }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!assessmentId) return;
      try {
        const res = await reportsService.getAssessmentQuestions(assessmentId);
        setData(res.data || {});
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [assessmentId]);

  if (isLoading) {
    return <div className="py-16 text-center text-slate-500 text-xs">Loading item analysis...</div>;
  }

  return (
    <div className="space-y-6">
      <QuestionAnalysisTable
        questions={data?.questions || []}
        difficultySummary={data?.difficultySummary || {}}
      />
    </div>
  );
};

export default QuestionAnalytics;
