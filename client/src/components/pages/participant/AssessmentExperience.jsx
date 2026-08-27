import { useState, useEffect } from 'react';
import {
  Shield, Clock, Wifi, Lock, ChevronLeft, ChevronRight, Flag,
  CheckCircle2, AlertCircle, Save,
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
      setTimeLeft(t => Math.max(0, t - 1));
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
    <div className="min-h-screen bg-accent-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-accent-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-accent-900">Online Midterm Examination</p>
              <p className="text-xs text-accent-500">Computer Science 101</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timeLeft < 300 ? 'bg-danger-50 text-danger-600' : 'bg-accent-100 text-accent-700'}`}>
              <Clock size={16} />
              <span className="text-sm font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>

            {/* Connection status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success-600">
              <Wifi size={14} />
              <span>Connected</span>
            </div>

            {/* Secure session */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success-600">
              <Lock size={14} />
              <span>Secure session active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-accent-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-accent-500">Progress</span>
            <span className="text-xs font-medium text-accent-700">{Object.keys(answers).length} of {totalQuestions} answered</span>
          </div>
          <ProgressBar value={Object.keys(answers).length} max={totalQuestions} color="primary" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-accent-200 shadow-soft p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="primary">Question {currentQ + 1} of {totalQuestions}</Badge>
                <div className="flex items-center gap-2 text-xs text-accent-400">
                  {saved ? (
                    <><CheckCircle2 size={14} className="text-success-500" /> <span>Saved</span></>
                  ) : (
                    <><Save size={14} className="text-warning-500 animate-pulse" /> <span>Saving...</span></>
                  )}
                </div>
              </div>

              <p className="text-lg text-accent-900 mb-6 leading-relaxed">{q.content}</p>

              <div className="space-y-3">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      answers[currentQ] === i
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-accent-200 bg-white hover:border-accent-300 hover:bg-accent-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      answers[currentQ] === i ? 'border-primary-500 bg-primary-500' : 'border-accent-300'
                    }`}>
                      {answers[currentQ] === i && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm ${answers[currentQ] === i ? 'text-primary-800 font-medium' : 'text-accent-700'}`}>{opt}</span>
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-accent-100">
                <Button
                  variant="outline"
                  icon={<ChevronLeft size={18} />}
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" icon={<Flag size={14} />}>Flag</Button>
                </div>

                {currentQ < totalQuestions - 1 ? (
                  <Button
                    variant="primary"
                    iconRight={<ChevronRight size={18} />}
                    onClick={() => setCurrentQ(c => c + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button variant="success" icon={<CheckCircle2 size={18} />} onClick={() => onNavigate('participant-evaluation')}>
                    Submit Assessment
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Question navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-accent-200 shadow-soft p-5 sticky top-24">
              <p className="text-sm font-semibold text-accent-700 mb-3">Questions</p>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                      i === currentQ ? 'bg-primary-600 text-white' :
                      answers[i] !== undefined ? 'bg-success-100 text-success-700' : 'bg-accent-100 text-accent-500 hover:bg-accent-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-accent-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-accent-500">
                  <div className="w-3 h-3 rounded bg-primary-600" /> Current
                </div>
                <div className="flex items-center gap-2 text-xs text-accent-500">
                  <div className="w-3 h-3 rounded bg-success-100" /> Answered
                </div>
                <div className="flex items-center gap-2 text-xs text-accent-500">
                  <div className="w-3 h-3 rounded bg-accent-100" /> Unanswered
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-accent-200">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between text-xs text-accent-400">
          <span className="flex items-center gap-1.5"><Lock size={12} /> Secure session active</span>
          <span className="flex items-center gap-1.5"><AlertCircle size={12} /> Do not leave this page or switch tabs</span>
        </div>
      </footer>
    </div>
  );
}
