import React from 'react';
import ExamTimer from './ExamTimer';

export const ExamHeader = ({
  assessmentTitle,
  attemptNumber,
  formattedTime,
  isLowTime,
  savingStatus,
  onSubmitClick,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          {assessmentTitle || 'Secure Examination'}
        </h1>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
          Attempt #{attemptNumber || 1} • <span style={{ color: '#10b981', fontWeight: 600 }}>● Online & Proctored</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Autosave Indicator */}
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          {savingStatus === 'saving' && <span style={{ color: '#eab308' }}>● Saving...</span>}
          {savingStatus === 'saved' && <span style={{ color: '#10b981' }}>✓ All changes saved</span>}
          {savingStatus === 'error' && <span style={{ color: '#ef4444' }}>⚠ Save failed</span>}
        </div>

        {/* Timer */}
        <ExamTimer formattedTime={formattedTime} isLowTime={isLowTime} />

        {/* Finish / Submit button */}
        <button
          onClick={onSubmitClick}
          style={{
            padding: '8px 18px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
        >
          Submit Exam
        </button>
      </div>
    </header>
  );
};

export default ExamHeader;
