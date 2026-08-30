import React from 'react';

export const AnswerInput = ({ question, currentAnswer, onAnswerChange }) => {
  if (!question) return null;

  const { type, options } = question;

  // Single Choice (MCQ) & True/False
  if (type === 'SINGLE_CHOICE' || type === 'TRUE_FALSE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {(options || []).map((opt) => {
          const isSelected =
            currentAnswer === opt.id ||
            currentAnswer?.selectedOptionId === opt.id ||
            (type === 'TRUE_FALSE' && currentAnswer === (opt.id === 'true'));

          return (
            <label
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '8px',
                border: `1.5px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="radio"
                name={`question_${question.id || question._id}`}
                value={opt.id}
                checked={isSelected}
                onChange={() => {
                  if (type === 'TRUE_FALSE') {
                    onAnswerChange(opt.id === 'true');
                  } else {
                    onAnswerChange(opt.id);
                  }
                }}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: '15px', color: '#1e293b' }}>{opt.text}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // Multiple Choice (Multi-select)
  if (type === 'MULTIPLE_CHOICE') {
    const selectedList = Array.isArray(currentAnswer)
      ? currentAnswer
      : currentAnswer?.selectedOptionIds || [];

    const handleToggle = (optId) => {
      const next = selectedList.includes(optId)
        ? selectedList.filter((id) => id !== optId)
        : [...selectedList, optId];
      onAnswerChange(next);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {(options || []).map((opt) => {
          const isSelected = selectedList.includes(opt.id);
          return (
            <label
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '8px',
                border: `1.5px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(opt.id)}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: '15px', color: '#1e293b' }}>{opt.text}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // Short Answer & Essay
  if (type === 'SHORT_ANSWER' || type === 'ESSAY') {
    const textVal = typeof currentAnswer === 'string' ? currentAnswer : currentAnswer?.text || '';
    return (
      <div style={{ marginTop: '16px' }}>
        <textarea
          rows={type === 'ESSAY' ? 10 : 4}
          value={textVal}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            border: '1.5px solid #cbd5e1',
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
        />
      </div>
    );
  }

  // Coding problem
  if (type === 'CODING') {
    const codeVal = typeof currentAnswer === 'string' ? currentAnswer : currentAnswer?.code || '';
    return (
      <div style={{ marginTop: '16px' }}>
        <textarea
          rows={14}
          value={codeVal}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="// Write your code solution here..."
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            border: '1.5px solid #1e293b',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontSize: '14px',
            fontFamily: 'monospace',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            lineHeight: '1.5',
          }}
        />
      </div>
    );
  }

  return <div>Unsupported question format</div>;
};

export default AnswerInput;
