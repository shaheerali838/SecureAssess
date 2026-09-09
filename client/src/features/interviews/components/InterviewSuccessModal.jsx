import React from 'react';
import { CheckCircle2, Video, Copy, Check, PlayCircle, X } from 'lucide-react';
import { Button } from '@/components/ui';

export function InterviewSuccessModal({
  scheduledInterviewResult,
  generatedEntryLink,
  copiedLink,
  handleCopyLink,
  onLaunchRoom,
  onClose,
}) {
  if (!scheduledInterviewResult) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-scale-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 size={36} />
        </div>

        <h3 className="text-xl font-bold text-accent-900 dark:text-white">
          Oral Defense Session Scheduled!
        </h3>
        <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 max-w-md mx-auto">
          The viva session has been registered. Invitations and dashboard notifications have been dispatched.
        </p>

        {generatedEntryLink && (
          <div className="mt-5 p-4 rounded-xl bg-accent-50 dark:bg-accent-900/60 border border-accent-200 dark:border-accent-800 text-left">
            <span className="text-[11px] font-bold text-accent-400 uppercase tracking-wider block mb-1.5">
              Candidate Direct Entry Link:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedEntryLink}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-white dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-800 dark:text-accent-200 focus:outline-none select-all"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                icon={copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              >
                {copiedLink ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onLaunchRoom(scheduledInterviewResult._id || scheduledInterviewResult.id)}
            icon={<PlayCircle size={16} />}
          >
            Launch Examiner Room Now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InterviewSuccessModal;
