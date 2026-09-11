import React, { useState, useEffect } from 'react';
import {
  Mail, Calendar, Award, ShieldCheck, Video, FileText,
  Activity, TrendingUp, AlertCircle, CheckCircle2, Download,
  ChevronRight, Eye, MonitorPlay, ArrowLeft, Users
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, StatusBadge, RiskBadge, Button,
  Avatar, ProgressRing, ProgressBar, Tabs, PageHeader, SkeletonProfile, EmptyState
} from '@/components/ui';
import { printPDFCertificate } from '@/utils/exportUtils';
import candidateService from '@/services/candidate.service';
import attemptService from '@/services/attempt.service';
import proctoringService from '@/services/proctoring.service';

export function ParticipantProfile({ onNavigate }) {
  const [candidate, setCandidate] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        let activeCand = null;
        const rawStored = sessionStorage.getItem('secureassess_active_candidate');
        if (rawStored) {
          try {
            activeCand = JSON.parse(rawStored);
          } catch (e) {}
        }

        if (!activeCand) {
          const candsRes = await candidateService.getCandidates({ limit: 1 });
          const items = Array.isArray(candsRes) ? candsRes : (candsRes?.items || candsRes?.data?.items || candsRes?.data || []);
          if (items && items.length > 0) {
            activeCand = items[0];
          }
        }

        setCandidate(activeCand);

        if (activeCand) {
          const candId = activeCand._id || activeCand.id;
          const [attemptsRes, sessionsRes] = await Promise.allSettled([
            attemptService.getAttempts({ candidateId: candId, limit: 10 }),
            proctoringService.getSessions({ candidateId: candId, limit: 10 }),
          ]);

          if (attemptsRes.status === 'fulfilled' && attemptsRes.value) {
            const aList = Array.isArray(attemptsRes.value)
              ? attemptsRes.value
              : (attemptsRes.value.items || attemptsRes.value.data?.items || attemptsRes.value.data || []);
            setAttempts(aList);
          }
        }
      } catch (err) {
        console.warn('Could not load participant profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const tabs = [
    { label: 'Overview', id: 'overview' },
    { label: 'Assessment Performance', id: 'assessment' },
    { label: 'Proctoring Telemetry', id: 'integrity' },
    { label: 'Raw Sessions & Video', id: 'sessions' },
  ];

  const candName = candidate
    ? (candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate')
    : 'Candidate Profile';
  const candEmail = candidate?.email || '';
  const latestAttempt = attempts[0] || null;
  const examScore = latestAttempt ? Math.round(latestAttempt.scorePercentage || latestAttempt.score || 0) : 0;
  const integrityScore = latestAttempt ? (latestAttempt.integrityScore ?? 100) : 100;
  const riskLevel = integrityScore < 70 ? 'High' : integrityScore < 90 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6">
      <PageHeader
        title={candName}
        subtitle={candidate?.departmentId?.name ? `${candidate.departmentId.name} · Academic Record Dossier` : `Candidate Dossier & Assessment History`}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Candidates', onClick: () => onNavigate('org-participants') },
          { label: candName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={15} />}
              onClick={() => onNavigate('org-participants')}
            >
              Candidate List
            </Button>
            {candidate && (
              <Button
                variant="outline"
                size="sm"
                icon={<Download size={15} />}
                onClick={() => printPDFCertificate({ candidateName: candName, assessmentTitle: latestAttempt?.assessmentTitle || 'Comprehensive Assessment', score: examScore })}
              >
                Export PDF
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<Video size={15} />}
              onClick={() => onNavigate('org-session-review')}
            >
              Playback Session
            </Button>
          </div>
        }
      />

      {loading ? (
        <SkeletonProfile />
      ) : !candidate ? (
        <Card>
          <CardBody className="p-8">
            <EmptyState
              icon={<Users size={28} />}
              title="No candidate profile selected"
              description="Select a candidate from the Candidate Management roster to inspect individual test performance and forensic telemetry."
              action={
                <Button variant="primary" icon={<Users size={15} />} onClick={() => onNavigate('org-participants')}>
                  Go to Candidates Roster
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Candidate Dossier Header */}
          <Card>
            <CardBody className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar name={candName} color="#2563eb" size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold font-display text-accent-900 dark:text-white">{candName}</h2>
                  <StatusBadge status={candidate.status || 'Active'} />
                  <RiskBadge level={riskLevel} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-accent-500 dark:text-accent-400 flex-wrap font-medium">
                  <span className="flex items-center gap-1.5"><Mail size={13} /> {candEmail}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={13} /> {candidate.candidateCode ? `ID: ${candidate.candidateCode}` : 'Enrolled'}</span>
                  {candidate.programId?.name && <span>Program: {candidate.programId.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono text-accent-900 dark:text-white">{examScore}%</p>
                  <p className="text-[10px] text-accent-400 uppercase tracking-wider">Exam Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono text-success-600 dark:text-success-400">{integrityScore}%</p>
                  <p className="text-[10px] text-accent-400 uppercase tracking-wider">Integrity Score</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Navigation Tabs */}
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-accent-900 dark:text-white">Proctoring Telemetry Signals</h3>
              <div className="flex justify-center py-2">
                <ProgressRing progress={integrityScore} size={110} strokeWidth={8} color="#16a34a" label="Clean Telemetry" />
              </div>
              <div className="space-y-2 text-xs pt-3 border-t border-accent-100 dark:border-accent-800">
                <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                  <span>Tab Focus Losses</span>
                  <span className="font-bold text-accent-900 dark:text-white font-mono">{latestAttempt?.flagsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                  <span>Multi-Person Detections</span>
                  <span className="font-bold text-accent-900 dark:text-white font-mono">0</span>
                </div>
                <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                  <span>Audio Anomalies</span>
                  <span className="font-bold text-accent-900 dark:text-white font-mono">0</span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 p-5 space-y-4">
              <h3 className="text-sm font-bold text-accent-900 dark:text-white">Assessment Attempts History</h3>
              {attempts.length === 0 ? (
                <div className="py-8 text-center text-xs text-accent-500 dark:text-accent-400">
                  No recorded test attempts found for this candidate.
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.map((att, i) => {
                    const score = Math.round(att.scorePercentage || att.score || 0);
                    return (
                      <div key={i} className="p-3.5 rounded-xl border border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/40 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-accent-900 dark:text-white">{att.assessmentTitle || att.assessmentId?.title || 'Examination Test'}</p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400 font-mono mt-0.5">
                            {att.startedAt ? new Date(att.startedAt).toLocaleDateString() : 'Recent'} · Status: {att.status || 'SUBMITTED'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold font-mono text-primary-600 dark:text-primary-400">{score}%</span>
                          <Button variant="outline" size="sm" onClick={() => onNavigate('org-session-review')}>
                            Review
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default ParticipantProfile;
