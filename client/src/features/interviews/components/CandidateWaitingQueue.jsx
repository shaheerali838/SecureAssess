import React from 'react';
import { Users, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

export function CandidateWaitingQueue({ isOccupied, roomQueueCount = 1, onRetry }) {
  if (!isOccupied) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-scale-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-4 animate-pulse">
          <Users size={32} />
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider inline-block mb-2">
          Single-Seat Viva Policy Active
        </span>

        <h3 className="text-xl font-bold text-accent-900 dark:text-white">
          Oral Defense Room Currently Occupied
        </h3>

        <p className="text-xs text-accent-600 dark:text-accent-400 mt-2 leading-relaxed">
          Another candidate is currently completing their viva defense with the examination panel. You are held in the live queue and will be admitted automatically when the room opens.
        </p>

        <div className="mt-5 p-4 rounded-xl bg-accent-50 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700/60 text-xs text-accent-700 dark:text-accent-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary-500" />
            <span>Estimated Wait Time:</span>
          </div>
          <span className="font-bold text-accent-900 dark:text-white">~3 - 5 mins</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw size={14} />}
          >
            Check Room Availability
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CandidateWaitingQueue;
