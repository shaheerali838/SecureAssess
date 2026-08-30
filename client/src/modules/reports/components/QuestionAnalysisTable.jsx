import React from "react";

export const QuestionAnalysisTable = ({ questions = [], difficultySummary = {} }) => {
  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case "HARD":
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded">HARD ⚠️</span>;
      case "EASY":
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">EASY</span>;
      default:
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded">MEDIUM</span>;
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
        No question analytics recorded for this assessment.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Item / Question Analysis</h3>
          <p className="text-xs text-slate-400">Discriminatory index, accuracy rates, and difficulty indicators</p>
        </div>

        {difficultySummary && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Easy: {difficultySummary.easyAverage || 0}%</span>
            <span className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">Med: {difficultySummary.mediumAverage || 0}%</span>
            <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">Hard: {difficultySummary.hardAverage || 0}%</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="pb-3 px-2">#</th>
              <th className="pb-3 px-2">Attempts</th>
              <th className="pb-3 px-2">Correct</th>
              <th className="pb-3 px-2">Incorrect</th>
              <th className="pb-3 px-2">Skipped</th>
              <th className="pb-3 px-2">Accuracy</th>
              <th className="pb-3 px-2">Avg Marks</th>
              <th className="pb-3 px-2">Difficulty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {questions.map((q, idx) => (
              <tr key={q.questionId || idx} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-2 font-mono font-bold text-slate-300">Q{idx + 1}</td>
                <td className="py-3 px-2 font-mono text-slate-200">{q.attempts}</td>
                <td className="py-3 px-2 font-mono text-emerald-400">{q.correct}</td>
                <td className="py-3 px-2 font-mono text-red-400">{q.incorrect}</td>
                <td className="py-3 px-2 font-mono text-slate-400">{q.skipped}</td>
                <td className="py-3 px-2 font-mono font-bold text-white">{q.accuracy}%</td>
                <td className="py-3 px-2 font-mono text-slate-300">{q.averageMarks}</td>
                <td className="py-3 px-2">{getDifficultyBadge(q.difficulty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionAnalysisTable;
