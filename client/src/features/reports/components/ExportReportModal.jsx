import React, { useState } from "react";

export const ExportReportModal = ({
  isOpen = false,
  assessmentTitle = "",
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState("CSV");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white">Export Assessment Report</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <p className="text-xs text-slate-300">
          Download analytical report and candidate scores for <strong>{assessmentTitle}</strong>.
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400">Select Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            {["CSV", "PDF", "JSON"].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  format === fmt
                    ? "border-blue-500 bg-blue-500/20 text-white"
                    : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
          >
            {isExporting ? "Generating..." : `Download ${format}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;
