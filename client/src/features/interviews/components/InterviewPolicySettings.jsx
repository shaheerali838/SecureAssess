import React from 'react';
import { Shield } from 'lucide-react';

export function InterviewPolicySettings({
  waitingRoomEnabled,
  setWaitingRoomEnabled,
  recordingEnabled,
  setRecordingEnabled,
  candidateCameraRequired,
  setCandidateCameraRequired,
  candidateMicrophoneRequired,
  setCandidateMicrophoneRequired,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-emerald-500" />
        <h4 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider">
          Room Security & Proctoring Controls
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-accent-700 dark:text-accent-300">
        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-800/60 transition-colors">
          <input
            type="checkbox"
            checked={waitingRoomEnabled}
            onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="font-semibold block">Enable Waiting Room Queue</span>
            <span className="text-[10px] text-accent-400">Enforces single-seat viva lock with auto-admit</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-800/60 transition-colors">
          <input
            type="checkbox"
            checked={recordingEnabled}
            onChange={(e) => setRecordingEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="font-semibold block">Record Session Media</span>
            <span className="text-[10px] text-accent-400">Saves audio/video recordings for audit review</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-800/60 transition-colors">
          <input
            type="checkbox"
            checked={candidateCameraRequired}
            onChange={(e) => setCandidateCameraRequired(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="font-semibold block">Candidate Webcam Mandatory</span>
            <span className="text-[10px] text-accent-400">Candidate video feed required to join</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-800/60 transition-colors">
          <input
            type="checkbox"
            checked={candidateMicrophoneRequired}
            onChange={(e) => setCandidateMicrophoneRequired(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="font-semibold block">Candidate Microphone Mandatory</span>
            <span className="text-[10px] text-accent-400">Candidate microphone required for oral defense</span>
          </div>
        </label>
      </div>
    </div>
  );
}

export default InterviewPolicySettings;
