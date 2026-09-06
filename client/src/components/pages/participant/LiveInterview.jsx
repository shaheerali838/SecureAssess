import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CandidateLiveInterview } from './CandidateLiveInterview';
import { ExaminerLiveInterview } from '../org/ExaminerLiveInterview';

/**
 * LiveInterview acts as the high-level router/dispatcher between the
 * dedicated Candidate Live Interview page and the Examiner Evaluation Cockpit.
 */
export function LiveInterview({ onNavigate }) {
  const params = useParams();
  const location = useLocation();

  const pathToken = params?.token || window.location.pathname.split('/interview/entry/')[1]?.split('?')[0] || '';
  const pathname = window.location.pathname || '';
  const storedUser = JSON.parse(localStorage.getItem('secureassess_user') || '{}');

  const isCandidate = Boolean(
    pathToken ||
    pathname.startsWith('/interview/entry') ||
    pathname.startsWith('/candidate') ||
    storedUser?.role === 'CANDIDATE' ||
    storedUser?.isGuest === true ||
    (!pathname.startsWith('/organization') &&
      storedUser?.role !== 'ORGANIZATION_ADMIN' &&
      storedUser?.role !== 'EXAMINER' &&
      storedUser?.role !== 'RECRUITER' &&
      storedUser?.platformRole !== 'PLATFORM_OWNER' &&
      storedUser?.platformRole !== 'PLATFORM_ADMIN')
  );

  if (isCandidate) {
    return <CandidateLiveInterview onNavigate={onNavigate} />;
  }

  return <ExaminerLiveInterview onNavigate={onNavigate} />;
}

export { CandidateLiveInterview } from './CandidateLiveInterview';
export { ExaminerLiveInterview } from '../org/ExaminerLiveInterview';

export default LiveInterview;
