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
    <header className="bg-accent-900 border-b border-accent-800 px-3 sm:px-5 h-14 flex items-center justify-between shrink-0 z-20 gap-2">
      {/* Left Title & Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {interviewTitle}
            </p>
            <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded bg-accent-800 text-primary-400 font-mono font-semibold shrink-0">
              {interviewType || 'TECHNICAL'}
            </span>
            <span className="hidden md:inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-primary-900/60 text-primary-300 border border-primary-700/50 shrink-0">
              Host / Examiner Cockpit
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-accent-400 truncate">
            Candidate: <span className="text-accent-200 font-medium">{examineeName}</span>
            {candCode && <span className="text-accent-500 font-mono"> ({candCode})</span>}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-600/20 border border-danger-500/30">
          <span className="w-2 h-2 rounded-full bg-danger-500 animate-ping" />
          <span className="text-[11px] font-bold text-danger-300 tracking-wider">LIVE</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-accent-800/80 border border-accent-700 text-xs sm:text-sm font-mono font-bold text-white">
          <Clock size={13} className="text-primary-400 shrink-0" />
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
          <X size={14} />
          <span className="hidden sm:inline">Exit Room</span>
        </button>
      </div>
    </header>
  );
};
