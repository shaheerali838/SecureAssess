import React from 'react';

export const QuestionNavigation = ({
  questions = [],
  currentIndex,
  answers = {},
  flaggedMap = {},
  onSelectQuestion,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
        Question Palette
      </h3>

      {/* Grid of question numbers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
        }}
      >
        {questions.map((q, idx) => {
          const isCurrent = currentIndex === idx;
          const isAnswered = answers[q.id || q._id] !== undefined && answers[q.id || q._id] !== null && answers[q.id || q._id] !== '';
          const isFlagged = flaggedMap[q.id || q._id];

          let bgColor = '#f8fafc';
          let textColor = '#475569';
          let borderColor = '#cbd5e1';

          if (isAnswered) {
            bgColor = '#dcfce7';
            textColor = '#166534';
            borderColor = '#86efac';
          }
          if (isFlagged) {
            bgColor = '#fef3c7';
            textColor = '#92400e';
            borderColor = '#fcd34d';
          }
          if (isCurrent) {
            borderColor = '#2563eb';
          }

          return (
            <button
              key={q.id || q._id}
              onClick={() => onSelectQuestion(idx)}
              style={{
                height: '38px',
                borderRadius: '6px',
                border: `2px solid ${borderColor}`,
                backgroundColor: bgColor,
                color: textColor,
                fontWeight: isCurrent ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#dcfce7', border: '1px solid #86efac' }}></span>
          <span>Answered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}></span>
          <span>Flagged for Review</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}></span>
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigation;
