import React from 'react';
import { Award, CheckCircle2, Star, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { Button, Avatar, Badge } from '@/components/ui';

export function ExaminerConclusionModal({
  showConclusionScreen,
  candidate,
  interview,
  scores,
  feedback,
  totalScore,
  questions,
  handleHostNextCandidate,
  onNavigate,
}) {
  if (!showConclusionScreen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-3xl max-w-2xl w-full p-7 shadow-2xl animate-scale-in text-center flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-3">
          <Award size={36} />
        </div>

        <h3 className="text-xl font-bold text-accent-900 dark:text-white">
          Oral Defense Evaluation Completed!
        </h3>
        <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 max-w-md mx-auto">
          The viva score and notes have been officially logged and finalized in the candidate registry.
        </p>

        {/* Candidate & Score Summary Card */}
        <div className="mt-5 p-4 rounded-2xl bg-accent-50 dark:bg-accent-900/60 border border-accent-200 dark:border-accent-800 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <Avatar name={candidate?.name || 'Candidate'} color="#2563eb" size="lg" />
            <div>
              <span className="text-sm font-bold text-accent-900 dark:text-white block">
                {candidate?.name || 'Candidate'}
              </span>
              <span className="text-xs text-accent-500 dark:text-accent-400">
                {candidate?.email || 'Student Candidate'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-accent-400 uppercase tracking-wider block font-bold">
              Final Viva Score
            </span>
            <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
              {totalScore} <span className="text-xs text-accent-400 font-normal">/ {questions.length * 5}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onNavigate('interviews')}
            icon={<ArrowRight size={16} />}
          >
            Return to Scheduled Interviews
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleHostNextCandidate}
            icon={<RefreshCw size={16} />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Host Next Student in Queue
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExaminerConclusionModal;
