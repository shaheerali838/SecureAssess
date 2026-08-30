import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import examService from '../services/exam.service';

export const ExamSubmitted = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  const autoSubmitted = location.state?.autoSubmitted;

  useEffect(() => {
    const fetchAttemptSummary = async () => {
      try {
        setLoading(true);
        const res = await examService.getAttempt(attemptId);
        setAttempt(res?.data || res);
      } catch (err) {
        console.error('Failed to load submission summary:', err);
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchAttemptSummary();
    }
  }, [attemptId]);

  return (
    <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '48px 36px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: '32px',
          }}
        >
          ✓
        </div>

        <h1 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
          {autoSubmitted ? 'Time Expired — Exam Auto-Submitted' : 'Examination Submitted Successfully!'}
        </h1>

        <p style={{ margin: '0 0 28px 0', fontSize: '15px', color: '#64748b', lineHeight: '1.6' }}>
          Your responses have been recorded and securely encrypted on the platform. Results and evaluation reports will be released according to your institution's schedule.
        </p>

        {/* Submission Details Card */}
        {attempt && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              marginBottom: '32px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '14px',
              color: '#334155',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Assessment:</span>
              <strong>{attempt.assessment?.title || 'Examination'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Attempt Number:</span>
              <strong>#{attempt.attemptNumber || 1}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Submitted At:</span>
              <strong>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : new Date().toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Questions Answered:</span>
              <strong>{attempt.answeredQuestions || 0} / {attempt.totalQuestions || 0}</strong>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 28px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ExamSubmitted;
