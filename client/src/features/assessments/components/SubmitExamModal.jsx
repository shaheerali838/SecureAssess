import React from 'react';

export const SubmitExamModal = ({
  isOpen,
  totalQuestions,
  answeredCount,
  flaggedCount,
  onConfirm,
  onCancel,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
          Submit Examination?
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
          Once submitted, your answers will be locked for grading and you cannot resume this attempt.
        </p>

        {/* Summary Card */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-around',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{answeredCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Answered</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>{flaggedCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Flagged</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: unansweredCount > 0 ? '#ef4444' : '#64748b' }}>
              {unansweredCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Unanswered</div>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              color: '#92400e',
              fontSize: '13px',
              marginBottom: '24px',
            }}
          >
            ⚠ You still have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Return to Exam
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{
              padding: '10px 22px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '14px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Yes, Submit Final'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitExamModal;
