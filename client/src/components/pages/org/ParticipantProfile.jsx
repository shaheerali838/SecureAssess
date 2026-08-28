import React, { useState } from 'react';
import {
  Mail, Calendar, Award, ShieldCheck, Video, FileText,
  Activity, TrendingUp, AlertCircle, CheckCircle2, Download,
  ChevronRight, Eye, MonitorPlay
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, StatusBadge, RiskBadge, Button,
  Avatar, ProgressRing, ProgressBar, Tabs, PageHeader,
} from '@/components/ui';

export function ParticipantProfile({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { label: 'Overview', key: 'overview' },
    { label: 'Assessment Performance', key: 'assessment' },
    { label: 'Interview Scorecard', key: 'interview' },
    { label: 'Proctoring Telemetry', key: 'integrity' },
    { label: 'Raw Sessions & Video', key: 'sessions' },
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
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
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
              <span className="flex items-center gap-1.5"><Mail size={13} /> ahmed.khan@stanford.edu</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> Aug 25, 2026</span>
              <span className="flex items-center gap-1.5"><FileText size={13} /> CS101 Online Midterm Exam</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-soft"><Award size={18} /></div>
            <p className="text-xs font-semibold text-accent-600 dark:text-accent-400">Exam Score</p>
          </div>
          <p className="text-2xl font-bold font-display text-accent-900 dark:text-white font-mono">78%</p>
          <ProgressBar value={78} color="primary" size="sm" className="mt-2" />
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 dark:text-secondary-400 flex items-center justify-center shadow-soft"><Video size={18} /></div>
            <p className="text-xs font-semibold text-accent-600 dark:text-accent-400">Interview Rating</p>
          </div>
          <p className="text-2xl font-bold font-display text-accent-400 font-mono">—</p>
          <p className="text-[11px] text-accent-400 mt-2">Not scheduled</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 flex items-center justify-center shadow-soft"><TrendingUp size={18} /></div>
            <p className="text-xs font-semibold text-accent-600 dark:text-accent-400">Final Percentile</p>
          </div>
          <p className="text-2xl font-bold font-display text-accent-900 dark:text-white font-mono">86th</p>
          <ProgressBar value={86} color="success" size="sm" className="mt-2" />
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 flex items-center justify-center shadow-soft"><ShieldCheck size={18} /></div>
            <p className="text-xs font-semibold text-accent-600 dark:text-accent-400">Integrity Trust</p>
          </div>
          <p className="text-2xl font-bold font-display text-success-600 dark:text-success-400 font-mono">94 / 100</p>
          <Badge variant="success" dot className="mt-1">Verified Clean</Badge>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          <Card>
            <CardHeader title="Assessment Summary" icon={<FileText size={18} />} />
            <CardBody className="p-5 space-y-3">
              {[
                { label: 'Assessment Format', value: 'Online Timed Examination' },
                { label: 'Testing Window', value: '1h 52m elapsed' },
                { label: 'Item Bank Questions', value: '45 items' },
                { label: 'Correct Answers', value: '35 / 45 (77.8%)' },
                { label: 'Minimum Passing Threshold', value: '50.0%' },
                { label: 'Accreditation Result', value: 'PASSED' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-accent-100 dark:border-accent-800/60 last:border-0">
                  <span className="text-accent-500 dark:text-accent-400">{item.label}</span>
                  <span className="font-semibold text-accent-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Proctoring Anomaly Log"
              icon={<ShieldCheck size={18} />}
              action={
                <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} onClick={() => onNavigate('org-integrity')}>
                  Full Log
                </Button>
              }
            />
            <CardBody className="p-5">
              <div className="flex items-center gap-6 mb-4">
                <ProgressRing value={18} label="18" sublabel="Anomaly Pts" color="#22c55e" size={100} />
                <div className="flex-1 space-y-2 text-xs">
                  {[
                    { label: 'Window Focus Shifts', value: 2 },
                    { label: 'Tab Switches', value: 1 },
                    { label: 'Fullscreen Exits', value: 0 },
                    { label: 'Gaze / Angle Warnings', value: 1 },
                  ].map((sig, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-accent-500 dark:text-accent-400">{sig.label}</span>
                      <span className="font-bold text-accent-900 dark:text-white font-mono">{sig.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ParticipantProfile;
