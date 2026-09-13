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

  const searchParams = new URLSearchParams(location?.search || window.location.search || '');
  const roleParam = searchParams.get('role');
  const purposeParam = searchParams.get('purpose');
  const pathname = window.location.pathname || '';
  const storedUser = JSON.parse(localStorage.getItem('secureassess_user') || '{}');

  // Check if current user is an Examiner / Org Admin / Platform Owner / Host
  const isHostAdmin = Boolean(
    roleParam === 'examiner' ||
    roleParam === 'host' ||
    roleParam === 'admin' ||
    purposeParam === 'examiner' ||
    purposeParam === 'host' ||
    pathname.startsWith('/organization') ||
    storedUser?.role === 'ORGANIZATION_ADMIN' ||
    storedUser?.role === 'EXAMINER' ||
    storedUser?.role === 'RECRUITER' ||
    storedUser?.role === 'ADMIN' ||
    storedUser?.platformRole === 'PLATFORM_OWNER' ||
    storedUser?.platformRole === 'PLATFORM_ADMIN'
  );

  // If host/admin, ALWAYS route to Examiner Evaluation Cockpit
  if (isHostAdmin) {
    return <ExaminerLiveInterview onNavigate={onNavigate} />;
  }

  // Otherwise, route candidate to Candidate Live Interview
  return <CandidateLiveInterview onNavigate={onNavigate} />;
}

export { CandidateLiveInterview } from './CandidateLiveInterview';
export { ExaminerLiveInterview } from '../org/ExaminerLiveInterview';

export default LiveInterview;
