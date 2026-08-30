import React, { useState, useEffect } from 'react';
import {
  Mail, Calendar, Award, ShieldCheck, Video, FileText,
  Activity, TrendingUp, AlertCircle, CheckCircle2, Download,
  ChevronRight, Eye, MonitorPlay
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, StatusBadge, RiskBadge, Button,
  Avatar, ProgressRing, ProgressBar, Tabs, PageHeader, SkeletonProfile
} from '@/components/ui';
import { printPDFCertificate } from '@/utils/exportUtils';

export function ParticipantProfile({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { label: 'Overview', id: 'overview' },
    { label: 'Assessment Performance', id: 'assessment' },
    { label: 'Interview Scorecard', id: 'interview' },
    { label: 'Proctoring Telemetry', id: 'integrity' },
    { label: 'Raw Sessions & Video', id: 'sessions' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ahmed Khan"
        subtitle="Computer Science 101 · Midterm Examination Comprehensive Dossier"
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Candidates', onClick: () => onNavigate('org-participants') },
          { label: 'Ahmed Khan' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={15} />}
              onClick={() => printPDFCertificate({ candidateName: 'Ahmed Khan', assessmentTitle: 'Data Structures & Algorithms Midterm', score: 78 })}
            >
              Export Certified PDF
            </Button>
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
      ) : (
        <>
          {/* Candidate Dossier Header */}
          <Card>
            <CardBody className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar name="Ahmed Khan" color="#2563eb" size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold font-display text-accent-900 dark:text-white">Ahmed Khan</h2>
                  <StatusBadge status="Completed" />
                  <RiskBadge level="Low" />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-accent-500 dark:text-accent-400 flex-wrap font-medium">
                  <span className="flex items-center gap-1.5"><Mail size={13} /> a.khan@stanford.edu</span>
                  <span className="flex items-center gap-1.5"><Calendar size={13} /> Completed Today</span>
                  <span>Cohort: CS101 Fall 2026</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono text-accent-900 dark:text-white">78%</p>
                  <p className="text-[10px] text-accent-400 uppercase tracking-wider">Exam Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono text-success-600 dark:text-success-400">99%</p>
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
                <ProgressRing progress={99} size={110} strokeWidth={8} color="#16a34a" label="Clean Telemetry" />
              </div>
              <div className="space-y-2 text-xs pt-3 border-t border-accent-100 dark:border-accent-800">
                <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                  <span>Tab Focus Losses</span>
                  <span className="font-bold text-accent-900 dark:text-white font-mono">0</span>
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
              <h3 className="text-sm font-bold text-accent-900 dark:text-white">Topic Competency Breakdown</h3>
              <div className="space-y-3">
                {[
                  { topic: 'Binary Search & Tree Traversals', score: 85, color: 'success' },
                  { topic: 'Dynamic Programming & Memoization', score: 70, color: 'warning' },
                  { topic: 'Database Concurrency & ACID', score: 80, color: 'primary' },
                  { topic: 'System Design & Complexity', score: 75, color: 'info' },
                ].map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold text-accent-800 dark:text-accent-200 mb-1">
                      <span>{t.topic}</span>
                      <span className="font-mono">{t.score}%</span>
                    </div>
                    <ProgressBar value={t.score} color={t.color} size="sm" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default ParticipantProfile;
