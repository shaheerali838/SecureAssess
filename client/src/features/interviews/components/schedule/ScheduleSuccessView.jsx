import React from 'react';
import { Video, CheckCircle2, Copy, Check } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

export function ScheduleSuccessView({
  scheduledInterviewResult,
  copiedLink,
  setCopiedLink,
  onClose,
  onLaunchRoom,
  setScheduledInterviewResult,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="p-5 rounded-2xl bg-success-500/10 border border-success-500/30 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-success-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-success-500/30">
          <CheckCircle2 size={30} />
        </div>
        <h3 className="text-lg font-bold text-accent-900 dark:text-white">Live Interview Scheduled!</h3>
        <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 max-w-md">
          Official invitation with the 1-time secure entry link has been dispatched to{' '}
          <strong className="text-accent-900 dark:text-white">{scheduledInterviewResult.candidateEmail}</strong>.
        </p>
      </div>

      {/* Host Join Room Card */}
      <div className="p-5 rounded-2xl bg-primary-600/10 border border-primary-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-accent-900 dark:text-white flex items-center gap-2">
              <Video size={18} className="text-primary-600 dark:text-primary-400" />
              Examiner / Recruiter Host Access
            </h4>
            <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">
              Enter the live room with full scoring rubrics, private notes, and candidate proctoring controls.
            </p>
          </div>
          <Badge variant="primary" size="sm">Host / Interviewer</Badge>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={<Video size={16} />}
            onClick={() => {
              onClose();
              onLaunchRoom(scheduledInterviewResult.interview || scheduledInterviewResult);
            }}
            className="shadow-lg shadow-primary-500/20"
          >
            Enter Room as Host Now
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setScheduledInterviewResult(null);
              onClose();
            }}
          >
            Done / View All Interviews
          </Button>
        </div>
      </div>

      {/* Candidate 1-Time Link Card */}
      <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-accent-700 dark:text-accent-300">
            Candidate 1-Time Entry Link
          </span>
          <span className="text-[11px] text-success-600 dark:text-success-400 font-semibold flex items-center gap-1">
            <Check size={13} /> Sent via Email
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={scheduledInterviewResult.roomLink}
            className="flex-1 text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-300 dark:border-accent-700 font-mono text-accent-800 dark:text-accent-200 select-all"
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            icon={copiedLink ? <Check size={14} className="text-success-600" /> : <Copy size={14} />}
            onClick={() => {
              navigator.clipboard.writeText(scheduledInterviewResult.roomLink);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
          >
            {copiedLink ? 'Copied' : 'Copy Link'}
          </Button>
        </div>
      </div>
    </div>
  );
}
