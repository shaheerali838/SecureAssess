import React from 'react';

export const ExamTimer = ({ formattedTime, isLowTime }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '15px',
        fontFamily: 'monospace',
        letterSpacing: '1px',
        backgroundColor: isLowTime ? '#fee2e2' : '#f1f5f9',
        color: isLowTime ? '#dc2626' : '#1e293b',
        border: `1px solid ${isLowTime ? '#f87171' : '#cbd5e1'}`,
        transition: 'all 0.3s ease',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>{formattedTime}</span>
    </div>
  );
};

export default ExamTimer;
