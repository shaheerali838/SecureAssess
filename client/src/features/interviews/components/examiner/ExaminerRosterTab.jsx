import React from 'react';
import { Mic, Video } from 'lucide-react';
import { Avatar } from '@/components/ui';

export const ExaminerRosterTab = ({
  examineeName,
  candCode,
  examinerName,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="p-3.5 rounded-xl bg-accent-850 border border-accent-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={examineeName} color="#3b82f6" size="sm" />
          <div>
            <p className="text-xs font-bold text-white">{examineeName}</p>
            <p className="text-[10px] text-accent-400">Examinee / Candidate ({candCode})</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Mic size={14} />
          <Video size={14} />
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-accent-850 border border-accent-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={examinerName} color="#9333ea" size="sm" />
          <div>
            <p className="text-xs font-bold text-white">{examinerName} (You)</p>
            <p className="text-[10px] text-accent-400">Lead Examiner / Host</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-primary-600/20 text-primary-300 font-semibold">
          Host
        </span>
      </div>
    </div>
  );
};
