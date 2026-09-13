import React from 'react';
import { Shield, CheckCircle, Award, Star, FileText, Video, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export const ExaminerConcludedSummary = ({
  interviewTitle,
  examineeName,
  candCode,
  elapsed,
  questions,
  handleSaveQuestionRating,
  handleHostNextCandidate,
  onNavigate,
}) => {
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const totalQuestions = questions.length;
  const evaluatedQuestions = questions.filter((q) => q.rating > 0).length;
  const avgScore =
    evaluatedQuestions > 0
      ? (questions.reduce((acc, q) => acc + (q.rating || 0), 0) / evaluatedQuestions).toFixed(1)
      : '5.0';

  return (
    <div className="min-h-screen bg-accent-950 flex flex-col justify-between text-white select-none">
      <header className="bg-accent-900 border-b border-accent-800 px-6 h-16 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">{interviewTitle}</span>
            <p className="text-xs text-accent-400">Examiner Evaluation Concluded</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Session Concluded & Submitted
        </span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col justify-center items-center text-center">
        <div className="p-8 rounded-3xl bg-accent-900 border border-accent-800 shadow-2xl space-y-6 w-full relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
            <CheckCircle size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Oral Defense Successfully Concluded</h2>
            <p className="text-sm text-accent-300 leading-relaxed">
              The evaluation scores, rubrics, and notes for <span className="text-white font-semibold">{examineeName}</span> have been finalized and recorded in the database.
            </p>
          </div>

          {/* Scorecard Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-accent-950/80 border border-accent-800">
              <p className="text-[11px] text-accent-400 font-medium">Candidate</p>
              <p className="text-sm font-bold text-white truncate mt-0.5">{examineeName}</p>
              <p className="text-[10px] text-accent-500 font-mono">{candCode}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-accent-950/80 border border-accent-800">
              <p className="text-[11px] text-accent-400 font-medium">Duration</p>
              <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{formatTime(elapsed)}</p>
              <p className="text-[10px] text-accent-500">Live WebRTC</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-accent-950/80 border border-accent-800">
              <p className="text-[11px] text-accent-400 font-medium">Rubric Graded</p>
              <p className="text-sm font-bold text-primary-400 mt-0.5">
                {evaluatedQuestions} / {totalQuestions}
              </p>
              <p className="text-[10px] text-accent-500">Items Scored</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-accent-950/80 border border-accent-800">
              <p className="text-[11px] text-accent-400 font-medium">Avg Rating</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">★ {avgScore} / 5.0</p>
              <p className="text-[10px] text-accent-500">Performance</p>
            </div>
          </div>

          {/* Rubric Breakdown List */}
          <div className="p-4 rounded-2xl bg-accent-950/60 border border-accent-800 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-accent-800/80 pb-2">
              <p className="text-xs font-bold text-accent-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-amber-400" />
                Oral Defense Rubric & Grade Scoring
              </p>
              <span className="text-[11px] text-accent-400">Click stars to adjust grades</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-3 rounded-xl bg-accent-900/80 border border-accent-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-800 text-primary-400 font-mono">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white truncate">{q.title}</span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-accent-800/60 text-accent-400 uppercase">
                        {q.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-accent-300 line-clamp-1">{q.prompt}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center bg-accent-950/60 px-2.5 py-1 rounded-lg border border-accent-800">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleSaveQuestionRating(idx, star)}
                        title={`Rate ${star} / 5 stars`}
                        className={`p-0.5 transition-all hover:scale-125 ${
                          q.rating >= star ? 'text-amber-400' : 'text-accent-700 hover:text-amber-400'
                        }`}
                      >
                        <Star size={16} fill={q.rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                    <span className="text-xs font-bold font-mono text-amber-400 ml-1.5 min-w-[32px] text-right">
                      {q.rating > 0 ? `${q.rating}/5` : '- / 5'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('org-session-review')}
              className="w-full text-xs font-bold border-accent-700 hover:bg-accent-800"
              icon={<FileText size={15} />}
            >
              Review Archive
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleHostNextCandidate}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-bold shadow-lg shadow-emerald-600/20"
              icon={<Video size={15} />}
            >
              Host Next Student in Queue
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('org-interviews')}
              className="w-full text-xs font-bold shadow-lg"
              iconRight={<ArrowRight size={15} />}
            >
              Interviews Dashboard
            </Button>
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-accent-800/80 px-6 flex items-center justify-between text-[11px] text-accent-400 bg-accent-900/50">
        <span>SecureAssess Live Oral Evaluation System</span>
        <span>Interview session and evaluation record submitted to database</span>
      </footer>
    </div>
  );
};
