import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import examService from '../services/exam.service';
import api from '../../../services/api';

export const ExamInstructions = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assessments/assignments/${assignmentId}`);
        const data = res?.data || res;
        setAssessment(data?.assessment || data);
      } catch (err) {
        console.error('Failed to load assignment instructions:', err);
        setError(err.message || 'Unable to load assessment details');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId]);

  const handleStartExam = async () => {
    if (!agreed) return;
    try {
      setStarting(true);
      const res = await examService.startAttempt(assignmentId);
      const attempt = res?.data || res;
      navigate(`/exam/attempts/${attempt.id || attempt._id}`);
    } catch (err) {
      console.error('Failed to start attempt:', err);
      setError(err.message || 'Could not start examination attempt');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading examination instructions...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '36px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
          {assessment?.title || 'Examination Instructions'}
        </h1>
        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
          Duration: <strong>{assessment?.durationSeconds ? Math.round(assessment.durationSeconds / 60) : 60} Minutes</strong> • Total Points: <strong>{assessment?.totalPoints || 0}</strong>
        </div>

        {error && (
          <div
            style={{
              padding: '14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
            System Rules & Integrity Protocols
          </h2>
          <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '1.8' }}>
            <li>The examination timer will start immediately upon clicking <strong>Start Examination</strong>.</li>
            <li>Your answers are automatically saved in the background.</li>
            <li>Do not switch tabs, exit fullscreen mode, or minimize the browser window.</li>
            <li>Maintain audio and camera clearance during proctored sessions.</li>
            <li>You can flag questions to review them later using the Question Palette.</li>
          </ul>
        </div>

        {assessment?.instructions && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#334155',
              lineHeight: '1.6',
            }}
          >
            <strong>Examiner Instructions:</strong>
            <p style={{ margin: '8px 0 0 0' }}>{assessment.instructions}</p>
          </div>
        )}

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '12px 0',
            fontSize: '14px',
            color: '#1e293b',
            fontWeight: '500',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
          />
          <span>I have read, understood, and agree to adhere to the examination rules.</span>
        </label>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleStartExam}
            disabled={!agreed || starting}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: agreed && !starting ? '#2563eb' : '#94a3b8',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '15px',
              cursor: agreed && !starting ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
          >
            {starting ? 'Initializing Session...' : 'Start Examination'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructions;
