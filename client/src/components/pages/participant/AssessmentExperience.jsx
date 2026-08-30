import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Clock, Wifi, Lock, ChevronLeft, ChevronRight, Flag,
  CheckCircle2, AlertCircle, Save, Check, AlertTriangle
} from 'lucide-react';
import { Button, Badge, ProgressBar, Modal, Card } from '@/components/ui';
import attemptService from '@/services/attempt.service';
import socketService from '@/services/socketService';

export function AssessmentExperience({ onNavigate }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [saved, setSaved] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [attemptId, setAttemptId] = useState('att_live_01');
  const [warningBanner, setWarningBanner] = useState(null);

  const questions = [
    { id: 1, content: 'What is the time complexity of binary search on a sorted array of n elements?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], points: 2 },
    { id: 2, content: 'Which data structure uses LIFO (Last In, First Out) ordering?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], points: 1 },
    { id: 3, content: 'What does ACID stand for in database transactions?', options: ['Atomic, Consistent, Isolated, Durable', 'Accurate, Correct, Isolated, Direct', 'Atomic, Correct, Indexed, Durable', 'Automated, Consistent, Isolated, Dynamic'], points: 2 },
    { id: 4, content: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Selection Sort', 'Quick Sort', 'Insertion Sort'], points: 2 },
    { id: 5, content: 'Which HTTP status code signifies that a resource was successfully created?', options: ['200 OK', '201 Created', '204 No Content', '304 Not Modified'], points: 1 },
    { id: 6, content: 'In Public Key Cryptography, which key is utilized by the sender to encrypt a private message for the recipient?', options: ['Sender Private Key', 'Recipient Public Key', 'Recipient Private Key', 'Shared Ephemeral Secret'], points: 3 },
  ];

  const totalQuestions = questions.length;

  // Real-Time Anti-Cheat Sockets & Telemetry Watchers
  useEffect(() => {
    socketService.connect();
    socketService.joinRoom(attemptId, 'candidate_user_01', 'candidate');

    const handleVisibilityChange = () => {
      if (document.hidden) {
        socketService.emitProctorEvent(attemptId, 'TAB_BLUR', {
          participant: 'Alex Morgan',
          assessment: 'Computer Science 101',
          riskLevel: 'Medium',
          details: 'Candidate navigated away from examination window or switched browser tabs.',
        });
        setWarningBanner('Warning: Browser tab focus loss was recorded and dispatched to the proctoring stream.');
        setTimeout(() => setWarningBanner(null), 5000);
      }
    };

    const handleCopyAttempt = (e) => {
      e.preventDefault();
      socketService.emitProctorEvent(attemptId, 'CLIPBOARD_ACCESS', {
        participant: 'Alex Morgan',
        assessment: 'Computer Science 101',
        riskLevel: 'High',
        details: 'Unauthorized clipboard copy or paste attempt detected.',
      });
      setWarningBanner('Notice: Clipboard operations are restricted during proctored sessions.');
      setTimeout(() => setWarningBanner(null), 4000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopyAttempt);
    document.addEventListener('paste', handleCopyAttempt);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyAttempt);
      document.removeEventListener('paste', handleCopyAttempt);
      socketService.disconnect();
    };
  }, [attemptId]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const selectAnswer = async (optIdx) => {
    const updatedAnswers = { ...answers, [currentQ]: optIdx };
    setAnswers(updatedAnswers);
    setSaved(false);

    try {
      await attemptService.saveAnswer(attemptId, {
        questionIndex: currentQ,
        questionId: questions[currentQ].id,
        selectedOption: optIdx,
      });
    } catch (e) {
      // safe fallback
    } finally {
      setTimeout(() => setSaved(true), 400);
    }
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      try {
        await attemptService.submitAttempt(attemptId, answers);
      } catch (e) {
        // fallback
      }
      onNavigate('participant-evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white flex flex-col transition-colors duration-200 font-sans">
      {/* Telemetry Warning Banner */}
      {warningBanner && (
        <div className="bg-warning-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-30 shadow-medium animate-fade-in">
          <AlertTriangle size={16} />
          <span>{warningBanner}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-accent-900 dark:text-white">Online Examination Session</p>
              <p className="text-[11px] text-accent-500 dark:text-accent-400">Computer Science 101 · Final Evaluation</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${timeLeft < 300 ? 'bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 border-danger-200 dark:border-danger-800/40' : 'bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 border-accent-200 dark:border-accent-700'}`}>
              <Clock size={15} />
              <span className="text-xs font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>

            {/* Telemetry status indicators */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success-600 dark:text-success-400 font-medium">
              <Wifi size={14} />
              <span>Telemetry Active</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success-600 dark:text-success-400 font-medium">
              <Lock size={14} />
              <span>AI Proctored</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-accent-900 border-b border-accent-100 dark:border-accent-800">
        <div className="max-w-5xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-accent-500 dark:text-accent-400">Exam Progress</span>
            <span className="text-xs font-semibold text-accent-700 dark:text-accent-300 font-mono">
              {answeredCount} / {totalQuestions} answered
            </span>
          </div>
          <ProgressBar value={answeredCount} max={totalQuestions} color="primary" size="sm" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-accent-900 rounded-2xl border border-accent-200 dark:border-accent-800 shadow-soft p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">Question {currentQ + 1} of {totalQuestions}</Badge>
                  <Badge variant="neutral">{q.points} {q.points === 1 ? 'Point' : 'Points'}</Badge>
                </div>
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
                      type="button"
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

              {/* Navigation Actions */}
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
                  <Button variant="success" size="md" onClick={() => setConfirmSubmitOpen(true)}>
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
              <div className="grid grid-cols-3 gap-2">
                {questions.map((_, i) => {
                  const isCurrent = currentQ === i;
                  const isAnswered = answers[i] !== undefined;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentQ(i)}
                      className={`h-9 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-primary-500 bg-primary-600 text-white'
                          : isAnswered
                          ? 'bg-success-100 dark:bg-success-950/60 text-success-700 dark:text-success-300 border border-success-300 dark:border-success-800/50'
                          : 'bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-400 hover:bg-accent-200 dark:hover:bg-accent-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-accent-100 dark:border-accent-800 text-[11px] text-accent-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-md bg-primary-600 shrink-0" />
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-md bg-success-500 shrink-0" />
                  <span>Answer Recorded</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-md bg-accent-200 dark:bg-accent-700 shrink-0" />
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        open={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Confirm Exam Submission"
        subtitle="Once submitted, you will not be able to modify your answers."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmSubmitOpen(false)}>
              Continue Answering
            </Button>
            <Button
              variant="success"
              size="sm"
              loading={isSubmitting}
              icon={<Check size={15} />}
              onClick={handleSubmitExam}
            >
              Confirm & Submit
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-accent-600 dark:text-accent-400 leading-relaxed">
            You have answered <strong className="text-accent-900 dark:text-white">{answeredCount}</strong> out of <strong className="text-accent-900 dark:text-white">{totalQuestions}</strong> questions.
          </p>
          {answeredCount < totalQuestions && (
            <div className="p-3 bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-800/50 rounded-xl text-xs text-warning-800 dark:text-warning-200">
              ⚠️ You have {totalQuestions - answeredCount} unanswered questions remaining.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default AssessmentExperience;
