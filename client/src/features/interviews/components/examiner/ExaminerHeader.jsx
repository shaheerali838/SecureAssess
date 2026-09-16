import React from 'react';
import { Shield, Clock, Monitor, X } from 'lucide-react';

export const ExaminerHeader = ({
  interviewTitle,
  interviewType,
  examineeName,
  candCode,
  elapsed,
  formatTime,
  activeLayout,
  setActiveLayout,
  handleExitRoom,
}) => {
  return (
    <header className="bg-accent-900 border-b border-accent-800 px-5 h-14 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">{interviewTitle}</p>
            <span className="text-[11px] px-2 py-0.5 rounded bg-accent-800 text-primary-400 font-mono font-semibold">
              {interviewType || 'TECHNICAL'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-primary-900/60 text-primary-300 border border-primary-700/50">
              Host / Examiner Cockpit
            </span>
          </div>
          <p className="text-xs text-accent-400">
            Candidate: <span className="text-accent-200 font-medium">{examineeName}</span> ({candCode})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-danger-600/20 border border-danger-500/30">
          <span className="w-2 h-2 rounded-full bg-danger-500 animate-ping" />
          <span className="text-xs font-bold text-danger-300 tracking-wider">LIVE RECORDING</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-800/80 border border-accent-700 text-sm font-mono font-bold text-white">
          <Clock size={14} className="text-primary-400" />
          <span>{formatTime(elapsed)}</span>
        </div>

        <button
          type="button"
          onClick={() => setActiveLayout(activeLayout === 'grid' ? 'focus-main' : 'grid')}
          className="hidden lg:flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-accent-800 hover:bg-accent-700 text-accent-300 transition-colors cursor-pointer"
        >
          <Monitor size={13} /> {activeLayout === 'grid' ? 'Focus View' : 'Grid View'}
        </button>

        <button
          type="button"
          onClick={handleExitRoom}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-accent-800 hover:bg-accent-700 text-accent-300 transition-colors cursor-pointer"
          title="Exit Room without concluding session"
        >
          <X size={14} /> Exit Room
        </button>
      </div>
    </header>
  );
};
