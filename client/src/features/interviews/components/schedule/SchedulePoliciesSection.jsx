import React from 'react';

export function SchedulePoliciesSection({
  recordingEnabled,
  setRecordingEnabled,
  screenSharingEnabled,
  setScreenSharingEnabled,
  waitingRoomEnabled,
  setWaitingRoomEnabled,
  candidateCameraRequired,
  setCandidateCameraRequired,
  candidateMicrophoneRequired,
  setCandidateMicrophoneRequired,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-2">
        4. Room Policies & Telemetry
      </label>
      <div className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
            <input
              type="checkbox"
              checked={recordingEnabled}
              onChange={(e) => setRecordingEnabled(e.target.checked)}
              className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Cloud Video Recording</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
            <input
              type="checkbox"
              checked={screenSharingEnabled}
              onChange={(e) => setScreenSharingEnabled(e.target.checked)}
              className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Screen Sharing & IDE Mirror</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
            <input
              type="checkbox"
              checked={waitingRoomEnabled}
              onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
              className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Host Waiting Room</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
            <input
              type="checkbox"
              checked={candidateCameraRequired}
              onChange={(e) => setCandidateCameraRequired(e.target.checked)}
              className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Enforce HD Camera</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
            <input
              type="checkbox"
              checked={candidateMicrophoneRequired}
              onChange={(e) => setCandidateMicrophoneRequired(e.target.checked)}
              className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Enforce Live Microphone</span>
          </label>
        </div>
      </div>
    </div>
  );
}
