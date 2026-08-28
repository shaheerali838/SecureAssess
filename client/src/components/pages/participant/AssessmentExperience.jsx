import React, { useState, useEffect } from 'react';
import {
  Shield, Clock, Wifi, Lock, ChevronLeft, ChevronRight, Flag,
  CheckCircle2, AlertCircle, Save
} from 'lucide-react';
import { Button, Badge, ProgressBar } from '@/components/ui';

export function AssessmentExperience({ onNavigate }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [saved, setSaved] = useState(true);

  const totalQuestions = 30;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (optIdx) => {
    setAnswers({ ...answers, [currentQ]: optIdx });
    setSaved(false);
    setTimeout(() => setSaved(true), 800);
  };

  const questions = [
    { content: 'What is the time complexity of binary search on a sorted array of n elements?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'] },
    { content: 'Which data structure uses LIFO (Last In, First Out) ordering?', options: ['Queue', 'Stack', 'Linked List', 'Tree'] },
    { content: 'What does ACID stand for in database transactions?', options: ['Atomic, Consistent, Isolated, Durable', 'Accurate, Correct, Isolated, Direct', 'Atomic, Correct, Indexed, Durable', 'Automated, Consistent, Isolated, Dynamic'] },
    { content: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Selection Sort', 'Quick Sort', 'Insertion Sort'] },
  ];

  const q = questions[currentQ % questions.length];

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white flex flex-col transition-colors duration-200 font-sans">
      {/* Header */}
      <header className="bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-accent-900 dark:text-white">Online Examination Session</p>
              <p className="text-[11px] text-accent-500 dark:text-accent-400">Computer Science 101 · Midterm</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${timeLeft < 300 ? 'bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 border-danger-200 dark:border-danger-800/40' : 'bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 border-accent-200 dark:border-accent-700'}`}>
              <Clock size={15} />
              <span className="text-xs font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>

            {/* Connection status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success-600 dark:text-success-400 font-medium">
              <Wifi size={14} />
              <span>Connected</span>
            </div>

            {/* Secure session */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success-600 dark:text-success-400 font-medium">
              <Lock size={14} />
              <span>Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white dark:bg-accent-900 border-b border-accent-100 dark:border-accent-800">
        <div className="max-w-5xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-accent-500 dark:text-accent-400">Exam Progress</span>
            <span className="text-xs font-semibold text-accent-700 dark:text-accent-300 font-mono">
              {Object.keys(answers).length} / {totalQuestions} answered
            </span>
          </div>
          <ProgressBar value={Object.keys(answers).length} max={totalQuestions} color="primary" size="sm" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-accent-900 rounded-2xl border border-accent-200 dark:border-accent-800 shadow-soft p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="primary">Question {currentQ + 1} of {totalQuestions}</Badge>
                <div className="flex items-center gap-2 text-xs text-accent-400">
                  {saved ? (
                    <><CheckCircle2 size={14} className="text-success-500" /> <span>Synced</span></>
                  ) : (
                    <><Save size={14} className="text-warning-500 animate-pulse" /> <span>Syncing...</span></>
                  )}
                </div>
              </div>

              <p className="text-base sm:text-lg font-semibold text-accent-900 dark:text-white mb-6 leading-relaxed">
                {q.content}
              </p>

              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  const isSelected = answers[currentQ] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100'
                          : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800/60 hover:border-accent-300 dark:hover:border-accent-600 hover:bg-accent-50 dark:hover:bg-accent-800 text-accent-700 dark:text-accent-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-primary-500 bg-primary-500' : 'border-accent-300 dark:border-accent-600'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-xs sm:text-sm font-medium ${isSelected ? 'text-primary-900 dark:text-white font-semibold' : ''}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-accent-100 dark:border-accent-800">
                <Button
                  variant="outline"
                  size="md"
                  icon={<ChevronLeft size={16} />}
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                >
                  Previous
                </Button>
                <Button variant="ghost" size="md" icon={<Flag size={15} />}>
                  Flag for Review
                </Button>
                {currentQ < totalQuestions - 1 ? (
                  <Button
                    variant="primary"
                    size="md"
                    iconRight={<ChevronRight size={16} />}
                    onClick={() => setCurrentQ(currentQ + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button variant="success" size="md" onClick={() => onNavigate('participant-evaluation')}>
                    Submit Exam
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Question Palette Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-accent-900 rounded-2xl border border-accent-200 dark:border-accent-800 shadow-soft p-4 sticky top-24">
              <h3 className="text-xs font-bold text-accent-900 dark:text-white mb-3">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalQuestions }).map((_, i) => {
                  const isCurrent = currentQ === i;
                  const isAnswered = answers[i] !== undefined;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      className={`h-8 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-primary-500 bg-primary-600 text-white'
                          : isAnswered
                          ? 'bg-success-100 dark:bg-success-950/60 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800/50'
                          : 'bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-400 hover:bg-accent-200 dark:hover:bg-accent-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssessmentExperience;
