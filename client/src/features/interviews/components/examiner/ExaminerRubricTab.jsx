import React from 'react';
import { Star } from 'lucide-react';

export const ExaminerRubricTab = ({
  questions = [],
  activeQuestion = 0,
  setActiveQuestion,
  handleSaveQuestionRating,
}) => {
  const totalScore = questions.reduce((acc, q) => acc + (q.rating || 0), 0);
  const maxScore = questions.length * 5;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 bg-accent-950/60 border-b border-accent-800 flex items-center justify-between text-xs">
        <span className="text-accent-400">Total Evaluated Score:</span>
        <span className="font-bold text-emerald-400 font-mono text-sm">
          {totalScore} / {maxScore} pts
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {questions.map((q, idx) => (
          <div
            key={q.id || idx}
            onClick={() => setActiveQuestion?.(idx)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeQuestion === idx
                ? 'bg-primary-600/15 border-primary-500/40 shadow-md'
                : 'bg-accent-850/60 border-accent-800 hover:bg-accent-800/80'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-800 text-primary-400 font-mono">
                  Q{idx + 1}
                </span>
                <span className="text-xs font-bold text-white truncate">{q.title}</span>
              </div>
              <span className="text-[10px] text-accent-400 font-semibold px-2 py-0.5 rounded bg-accent-800/60 uppercase">
                {q.category}
              </span>
            </div>

            <p className="text-xs text-accent-300 mb-2 leading-relaxed">{q.prompt}</p>

            <div className="flex items-center justify-between pt-2 border-t border-accent-800/60">
              <span className="text-[11px] text-accent-400">Examiner Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveQuestionRating(idx, star);
                    }}
                    title={`Rate ${star} / 5 stars`}
                    className={`p-0.5 transition-transform hover:scale-125 cursor-pointer ${
                      q.rating >= star ? 'text-amber-400' : 'text-accent-700 hover:text-amber-400'
                    }`}
                  >
                    <Star size={14} fill={q.rating >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
