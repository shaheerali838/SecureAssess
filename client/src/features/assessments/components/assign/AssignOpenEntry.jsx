import React from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { Button, Badge } from "@/components/ui";

export function AssignOpenEntry({
  currentAssessment,
  customEmail,
  setCustomEmail,
  copiedLink,
  handleCopyLink,
  getPublicLinkOrigin,
}) {
  const token =
    currentAssessment?.entryToken ||
    currentAssessment?.invitationToken ||
    currentAssessment?._id ||
    currentAssessment?.id ||
    "public-demo";
  const link = `${getPublicLinkOrigin()}/assessment/entry/${token}`;

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-between text-xs text-primary-900 dark:text-primary-200">
        <span className="flex items-center gap-2 font-medium">
          <Sparkles size={15} className="text-primary-500 shrink-0" />
          Shareable 1-time public entry link for open test takers and applicants.
        </span>
        <Badge variant="primary" size="sm">
          Instant Distribution
        </Badge>
      </div>

      <div>
        <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 mb-1">
          Candidate Email (Optional Direct Dispatch)
        </label>
        <input
          type="email"
          placeholder="e.g. examinee@example.com"
          value={customEmail}
          onChange={(e) => setCustomEmail(e.target.value)}
          className="w-full text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-800 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-[11px] text-accent-500 mt-1">
          If specified, an official exam entry invitation will be automatically emailed to this recipient.
        </p>
      </div>

      <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800">
        <p className="text-xs font-bold text-primary-900 dark:text-primary-200 flex items-center gap-1.5 mb-1.5">
          <Sparkles size={14} /> Public Test Entry Link
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-1 text-xs h-8 px-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-300 dark:border-accent-700 font-mono text-accent-800 dark:text-accent-200 select-all"
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            icon={
              copiedLink ? (
                <Check size={14} className="text-success-600" />
              ) : (
                <Copy size={14} />
              )
            }
            onClick={handleCopyLink}
          >
            {copiedLink ? "Copied" : "Copy Link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
