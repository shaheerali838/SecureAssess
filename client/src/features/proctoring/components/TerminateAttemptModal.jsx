import React, { useState } from "react";

export const TerminateAttemptModal = ({
  isOpen = false,
  candidateName = "",
  onClose,
  onConfirmTerminate,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirmTerminate(reason.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-red-400">
            <span className="text-xl">⛔</span>
            <h3 className="font-bold text-base text-white">Terminate Candidate Attempt</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-200">
          This will immediately stop the examination for <strong className="text-white">{candidateName}</strong>, mark the attempt as <span className="font-bold">TERMINATED</span>, and flag a confirmed integrity violation.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mandatory Termination Reason *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              placeholder="e.g., Multiple unauthorized persons detected in exam environment despite repeated warnings."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting ? "Terminating..." : "Confirm Termination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TerminateAttemptModal;
