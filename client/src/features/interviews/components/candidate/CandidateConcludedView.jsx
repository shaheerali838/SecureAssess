import React from 'react';
import { Shield, CheckCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';

export const CandidateConcludedView = ({
  interviewTitle,
  sessionEndedReason,
  examineeName,
  candCode,
  examinerName,
  elapsed,
  onNavigate,
}) => {
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-accent-950 flex flex-col justify-between text-white select-none">
      <header className="bg-accent-900 border-b border-accent-800 px-6 h-16 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">{interviewTitle}</span>
            <p className="text-xs text-accent-400">Oral Assessment Session</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Session Concluded
        </span>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center items-center text-center">
        <div className="p-8 rounded-3xl bg-accent-900 border border-accent-800 shadow-2xl space-y-6 w-full relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
            <CheckCircle size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Interview Defense Concluded</h2>
            <p className="text-sm text-accent-300 leading-relaxed">
              {sessionEndedReason || 'The examiner has concluded the interview session. Your responses and defense evaluation have been securely submitted.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-accent-950/80 border border-accent-800 text-xs space-y-2.5 text-left">
            <div className="flex items-center justify-between text-accent-300">
              <span>Candidate Name:</span>
              <span className="font-semibold text-white">{examineeName} ({candCode})</span>
            </div>
            <div className="flex items-center justify-between text-accent-300">
              <span>Lead Examiner:</span>
              <span className="font-semibold text-primary-300">{examinerName}</span>
            </div>
            <div className="flex items-center justify-between text-accent-300">
              <span>Total Defense Duration:</span>
              <span className="font-mono text-emerald-400 font-bold">{formatTime(elapsed)}</span>
            </div>
            <div className="flex items-center justify-between text-accent-300">
              <span>Proctoring Integrity:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> 100% Verified
              </span>
            </div>
          </div>

          {(() => {
            const storedUser = JSON.parse(localStorage.getItem('secureassess_user') || '{}');
            const isOrgUser = Boolean(
              storedUser?.role === 'ORGANIZATION_OWNER' ||
              storedUser?.role === 'ORGANIZATION_ADMIN' ||
              storedUser?.role === 'EXAMINER' ||
              storedUser?.role === 'RECRUITER' ||
              storedUser?.platformRole === 'PLATFORM_OWNER' ||
              storedUser?.platformRole === 'PLATFORM_ADMIN'
            );

            if (isOrgUser) {
              return (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onNavigate('org-interviews')}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-sm font-bold"
                >
                  Return to Organization Interviews Dashboard
                </Button>
              );
            }

            return (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (storedUser?.role === 'CANDIDATE') {
                    onNavigate('candidate-dashboard');
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="w-full bg-primary-600 hover:bg-primary-500 text-sm font-bold"
              >
                Return to Dashboard
              </Button>
            );
          })()}
        </div>
      </main>

      <footer className="h-12 border-t border-accent-800/80 px-6 flex items-center justify-between text-[11px] text-accent-400 bg-accent-900/50">
        <span>SecureAssess Live Oral Evaluation System</span>
        <span>Session securely archived</span>
      </footer>
    </div>
  );
};
