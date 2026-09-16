import React from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

export function ScheduleOpenEntry({
  candidateNameEntry,
  setCandidateNameEntry,
  candidateEmailEntry,
  setCandidateEmailEntry,
  generatedEntryLink,
  copiedLink,
  handleCopyLink,
  getCandidateLinkOrigin,
}) {
  const displayLink =
    generatedEntryLink ||
    `${getCandidateLinkOrigin()}/interview/entry/1-time-${Math.random().toString(36).substring(7)}`;

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-between text-xs text-primary-900 dark:text-primary-200">
        <span className="flex items-center gap-2 font-medium">
          <Sparkles size={15} className="text-primary-500 shrink-0" />
          Candidate will automatically receive an official 1-time room access invitation in their email inbox.
        </span>
        <Badge variant="primary" size="sm">Direct Email Dispatch</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 mb-1">
            Candidate Full Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Jane Doe (Applicant / Examinee)"
            value={candidateNameEntry}
            onChange={(e) => setCandidateNameEntry(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-800 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-[11px] text-accent-500 mt-1">Recipient name for the formal invitation.</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 mb-1">
            Candidate Email Address <span className="text-danger-500">*</span>
          </label>
          <input
            type="email"
            required
            placeholder="e.g. applicant@company.com"
            value={candidateEmailEntry}
            onChange={(e) => setCandidateEmailEntry(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-800 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-[11px] text-accent-500 mt-1">1-time entry link will be dispatched to this email.</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800">
        <p className="text-xs font-bold text-primary-900 dark:text-primary-200 flex items-center gap-1.5 mb-1.5">
          <Sparkles size={14} /> 1-Time Entry Access Link
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={displayLink}
            className="flex-1 text-xs h-8 px-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-300 dark:border-accent-700 font-mono text-accent-800 dark:text-accent-200 select-all"
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            icon={copiedLink ? <Check size={14} className="text-success-600" /> : <Copy size={14} />}
            onClick={() => {
              navigator.clipboard.writeText(displayLink);
              handleCopyLink();
            }}
          >
            {copiedLink ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="text-[11px] text-accent-500 mt-2">
          Distribute this one-time entry link to hiring candidates, recruitment applicants, or guest examinees.
        </p>
      </div>
    </div>
  );
}
