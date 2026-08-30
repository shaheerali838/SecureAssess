import React from "react";

export const ReportFilters = ({
  assessments = [],
  selectedAssessmentId = "",
  onSelectAssessment,
  datePreset = "THIS_MONTH",
  onSelectPreset,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="w-full sm:w-auto flex-1 max-w-md">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Select Assessment
        </label>
        <select
          value={selectedAssessmentId}
          onChange={(e) => onSelectAssessment(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Choose an assessment...</option>
          {assessments.map((a) => (
            <option key={a._id} value={a._id}>
              {a.title} ({a.code})
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto flex items-center gap-2">
        {["THIS_WEEK", "THIS_MONTH", "THIS_YEAR"].map((preset) => (
          <button
            key={preset}
            onClick={() => onSelectPreset && onSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              datePreset === preset
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {preset.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportFilters;
