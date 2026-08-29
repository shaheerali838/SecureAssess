import React from 'react';

export const ExamProgress = ({ totalQuestions, answeredCount, flaggedCount }) => {
  const percentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
        <span>Progress ({answeredCount}/{totalQuestions})</span>
        <span>{percentage}%</span>
      </div>

      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#10b981',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
        <span>Answered: <strong>{answeredCount}</strong></span>
        <span>Flagged: <strong>{flaggedCount}</strong></span>
        <span>Remaining: <strong>{Math.max(0, totalQuestions - answeredCount)}</strong></span>
      </div>
    </div>
  );
};

export default ExamProgress;
