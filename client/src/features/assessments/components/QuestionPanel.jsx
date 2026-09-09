import React from 'react';
import QuestionCard from './QuestionCard';
import QuestionNavigation from './QuestionNavigation';
import ExamProgress from './ExamProgress';

export const QuestionPanel = ({
  questions = [],
  currentIndex,
  answers = {},
  flaggedMap = {},
  onSelectQuestion,
  onAnswerChange,
  onToggleFlag,
  onNext,
  onPrev,
}) => {
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion ? currentQuestion.id || currentQuestion._id : null;
  const currentAnswer = currentQuestionId ? answers[currentQuestionId] : null;
  const isFlagged = currentQuestionId ? Boolean(flaggedMap[currentQuestionId]) : false;

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== ''
  ).length;

  const flaggedCount = Object.keys(flaggedMap).filter((k) => flaggedMap[k]).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '24px',
        maxWidth: '1300px',
        margin: '24px auto',
        padding: '0 24px',
        alignItems: 'start',
      }}
    >
      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        currentAnswer={currentAnswer}
        isFlagged={isFlagged}
        onAnswerChange={(val) => onAnswerChange(currentQuestionId, val)}
        onToggleFlag={() => onToggleFlag(currentQuestionId)}
        onNext={onNext}
        onPrev={onPrev}
      />

      {/* Sidebar (Progress + Palette) */}
      <div>
        <ExamProgress
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          flaggedCount={flaggedCount}
        />

        <QuestionNavigation
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          flaggedMap={flaggedMap}
          onSelectQuestion={onSelectQuestion}
        />
      </div>
    </div>
  );
};

export default QuestionPanel;
