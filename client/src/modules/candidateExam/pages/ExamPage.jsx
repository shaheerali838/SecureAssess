import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExamHeader from '../components/ExamHeader';
import QuestionPanel from '../components/QuestionPanel';
import SubmitExamModal from '../components/SubmitExamModal';
import useExamTimer from '../hooks/useExamTimer';
import useExamAutosave from '../hooks/useExamAutosave';
import useExamHeartbeat from '../hooks/useExamHeartbeat';
import examService from '../services/exam.service';

export const ExamPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedMap, setFlaggedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autosave Hook
  const { saveAnswer, savingStatus } = useExamAutosave(attemptId, 800);

  // Expiration Handler
  const handleExpire = useCallback(async () => {
    try {
      await examService.submitAttempt(attemptId);
      navigate(`/exam/attempts/${attemptId}/submitted`, { state: { autoSubmitted: true } });
    } catch (err) {
      console.error('Auto-submit failed:', err);
      navigate(`/exam/attempts/${attemptId}/submitted`);
    }
  }, [attemptId, navigate]);

  // Timer Hook
  const { formattedTime, isLowTime, setSecondsRemaining } = useExamTimer(
    attempt?.timeRemainingSeconds || 0,
    handleExpire
  );

  // Heartbeat Hook
  useExamHeartbeat(attemptId, 30000, (serverRemainingSeconds) => {
    if (serverRemainingSeconds !== undefined) {
      setSecondsRemaining(serverRemainingSeconds);
    }
  });

  // Load Attempt & Questions
  useEffect(() => {
    const loadExamSession = async () => {
      try {
        setLoading(true);
        const [attemptRes, questionsRes] = await Promise.all([
          examService.getAttempt(attemptId),
          examService.getAttemptQuestions(attemptId),
        ]);

        const attemptData = attemptRes?.data || attemptRes;
        const questionsList = questionsRes?.data || questionsRes || [];

        if (attemptData.status === 'SUBMITTED' || attemptData.status === 'EXPIRED') {
          navigate(`/exam/attempts/${attemptId}/submitted`);
          return;
        }

        setAttempt(attemptData);
        setQuestions(questionsList);

        // Pre-populate saved answers and flags
        const initialAnswers = {};
        const initialFlags = {};
        questionsList.forEach((q) => {
          const qId = q.id || q._id;
          if (q.savedAnswer !== null && q.savedAnswer !== undefined) {
            initialAnswers[qId] = q.savedAnswer;
          }
          if (q.flagged) {
            initialFlags[qId] = true;
          }
        });
        setAnswers(initialAnswers);
        setFlaggedMap(initialFlags);
      } catch (err) {
        console.error('Failed to load examination session:', err);
        setError(err.message || 'Failed to initialize exam interface');
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      loadExamSession();
    }
  }, [attemptId, navigate]);

  // Answer change handler
  const handleAnswerChange = (questionId, newAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: newAnswer }));
    saveAnswer(questionId, newAnswer);
  };

  // Toggle flag handler
  const handleToggleFlag = async (questionId) => {
    const nextFlag = !flaggedMap[questionId];
    setFlaggedMap((prev) => ({ ...prev, [questionId]: nextFlag }));
    try {
      await examService.flagQuestion(attemptId, questionId, nextFlag);
    } catch (err) {
      console.error('Failed to update question flag:', err);
    }
  };

  // Submit attempt handler
  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      await examService.submitAttempt(attemptId);
      setIsSubmitModalOpen(false);
      navigate(`/exam/attempts/${attemptId}/submitted`);
    } catch (err) {
      console.error('Submission failed:', err);
      alert(err.message || 'Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
        Loading examination interface...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#dc2626' }}>
        <h2>Error Loading Exam</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== ''
  ).length;
  const flaggedCount = Object.keys(flaggedMap).filter((k) => flaggedMap[k]).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '60px' }}>
      {/* Top sticky header with timer and autosave */}
      <ExamHeader
        assessmentTitle={attempt?.assessment?.title}
        attemptNumber={attempt?.attemptNumber}
        formattedTime={formattedTime}
        isLowTime={isLowTime}
        savingStatus={savingStatus}
        onSubmitClick={() => setIsSubmitModalOpen(true)}
      />

      {/* Main question panel and palette */}
      <QuestionPanel
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        flaggedMap={flaggedMap}
        onSelectQuestion={(idx) => setCurrentIndex(idx)}
        onAnswerChange={handleAnswerChange}
        onToggleFlag={handleToggleFlag}
        onNext={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
        onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
      />

      {/* Confirmation Modal */}
      <SubmitExamModal
        isOpen={isSubmitModalOpen}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        flaggedCount={flaggedCount}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsSubmitModalOpen(false)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ExamPage;
