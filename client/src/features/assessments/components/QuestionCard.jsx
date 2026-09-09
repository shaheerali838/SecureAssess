import React from 'react';
import AnswerInput from './AnswerInput';

export const QuestionCard = ({
  question,
  currentIndex,
  totalQuestions,
  currentAnswer,
  isFlagged,
  onAnswerChange,
  onToggleFlag,
  onNext,
  onPrev,
}) => {
  if (!question) return null;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '24px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Question metadata & flag button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontWeight: '700',
              fontSize: '16px',
              color: '#0f172a',
            }}
          >
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              fontSize: '12px',
              color: '#475569',
              fontWeight: '600',
            }}
          >
            {question.marks || question.points || 1} mark{(question.marks || question.points) > 1 ? 's' : ''}
          </span>
          {question.negativeMarks > 0 && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#fee2e2',
                fontSize: '12px',
                color: '#dc2626',
                fontWeight: '600',
              }}
            >
              -{question.negativeMarks} negative
            </span>
          )}
        </div>

        <button
          onClick={onToggleFlag}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: `1px solid ${isFlagged ? '#f59e0b' : '#cbd5e1'}`,
            backgroundColor: isFlagged ? '#fffbeb' : '#ffffff',
            color: isFlagged ? '#d97706' : '#64748b',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <span>{isFlagged ? '★ Flagged' : '☆ Flag for Review'}</span>
        </button>
      </div>

      {/* Prompt */}
      <div style={{ fontSize: '17px', lineHeight: '1.6', color: '#1e293b', fontWeight: '500' }}>
        {question.prompt}
      </div>

      {/* Answer inputs */}
      <AnswerInput
        question={question}
        currentAnswer={currentAnswer}
        onAnswerChange={onAnswerChange}
      />

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: currentIndex === 0 ? '#94a3b8' : '#334155',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          ← Previous
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          style={{
            padding: '10px 24px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: currentIndex === totalQuestions - 1 ? '#e2e8f0' : '#2563eb',
            color: currentIndex === totalQuestions - 1 ? '#94a3b8' : '#ffffff',
            cursor: currentIndex === totalQuestions - 1 ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
