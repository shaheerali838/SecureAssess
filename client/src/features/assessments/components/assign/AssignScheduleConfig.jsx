import React from "react";
import { Calendar, Clock, Shield } from "lucide-react";

export function AssignScheduleConfig({
  availableFrom,
  setAvailableFrom,
  availableUntil,
  setAvailableUntil,
  attemptsAllowed,
  setAttemptsAllowed,
  sendNotification,
  setSendNotification,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-2">
        2. Availability Window & Assessment Policies
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Available From
          </label>
          <input
            type="datetime-local"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Available Until (Deadline)
          </label>
          <input
            type="datetime-local"
            value={availableUntil}
            onChange={(e) => setAvailableUntil(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Attempts Allowed
          </label>
          <select
            value={attemptsAllowed}
            onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value={1}>1 Attempt (Strict Exam)</option>
            <option value={2}>2 Attempts</option>
            <option value={3}>3 Attempts</option>
            <option value={5}>5 Attempts (Practice / Mock)</option>
            <option value={999}>Unlimited Attempts</option>
          </select>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-accent-700 dark:text-accent-300">
          <input
            type="checkbox"
            checked={sendNotification}
            onChange={(e) => setSendNotification(e.target.checked)}
            className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
          />
          <span>Dispatch automated email notifications & invitation credentials</span>
        </label>
        <span className="text-[11px] text-accent-500 flex items-center gap-1">
          <Shield size={12} className="text-emerald-500" /> Secure Tokenized Delivery
        </span>
      </div>
    </div>
  );
}
