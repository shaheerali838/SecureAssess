import React from 'react';
import {
  ShieldCheck, AlertCircle, Clock, Activity, Eye, X,
  MessageSquare, CheckCircle2, Camera, Download,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, RiskBadge, Button, ProgressRing,
  ProgressBar, PageHeader, Textarea
} from '@/components/ui';

export function IntegrityEvidence({ onNavigate }) {
  const flag = {
    title: 'Potential Unauthorized Multi-Window Activity',
    timestamp: '00:26:18',
    source: 'Telemetry & WebRTC AI Engine',
    confidence: 'High',
    context: 'Multiple sudden focus losses and concurrent browser tab shifts recorded within a 180-second window during high-stakes question sections.',
    riskLevel: 'High',
    participant: 'Fatima Zahra',
    session: 'Flight Training Safety Assessment',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proctoring Anomaly Evidence"
        subtitle="Forensic breakdown, synchronized camera snapshots, and examiner resolution notes."
        icon={<ShieldCheck size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Integrity Center', onClick: () => onNavigate('org-integrity') },
          { label: 'Incident Evidence' },
        ]}
        actions={
          <Button variant="outline" size="sm" icon={<Download size={15} />}>
            Export Certified Dossier
          </Button>
        }
      />

      {/* Incident Header */}
      <Card>
        <CardBody className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 flex items-center justify-center shrink-0 shadow-soft border border-danger-200 dark:border-danger-900/40">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="text-base font-bold font-display text-accent-900 dark:text-white">{flag.title}</h2>
                <RiskBadge level={flag.riskLevel} />
                <Badge variant="neutral">Confidence: {flag.confidence}</Badge>
              </div>
              <p className="text-xs text-accent-600 dark:text-accent-300 leading-relaxed">{flag.context}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-accent-500 dark:text-accent-400 flex-wrap font-mono">
                <span className="flex items-center gap-1.5"><Clock size={13} /> {flag.timestamp}</span>
                <span className="flex items-center gap-1.5"><Activity size={13} /> {flag.source}</span>
                <span className="flex items-center gap-1.5 font-sans font-semibold text-accent-800 dark:text-accent-200">Candidate: {flag.participant}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evidence Frame Preview */}
        <Card>
          <CardHeader title="Synchronized Video Frame" subtitle="Captured at timestamp marker 00:26:18" icon={<Camera size={18} />} />
          <CardBody className="p-5">
            <div className="aspect-video bg-accent-950 rounded-2xl border border-accent-800 flex items-center justify-center mb-3 relative overflow-hidden shadow-soft">
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-danger-600 text-white text-[11px] font-mono font-bold">
                {flag.timestamp}
              </div>
              <Camera size={36} className="text-accent-700" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-accent-100 dark:bg-accent-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-accent-200 dark:hover:bg-accent-700 transition-colors border border-accent-200 dark:border-accent-700">
                  <Camera size={16} className="text-accent-400" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Anomaly Signal Aggregates */}
        <Card>
          <CardHeader title="Telemetry Metrics" icon={<Activity size={18} />} />
          <CardBody className="p-5 space-y-4">
            <div className="flex items-center justify-around mb-2">
              <ProgressRing value={68} label="68" sublabel="Anomaly Risk" color="#ef4444" size={100} />
              <div className="space-y-2 flex-1 ml-4">
                {[
                  { label: 'Window Blur Events', value: 12, max: 15 },
                  { label: 'Secondary Tab Shifts', value: 8, max: 15 },
                  { label: 'Fullscreen Disconnects', value: 3, max: 5 },
                  { label: 'Gaze / Face Occlusions', value: 5, max: 10 },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-accent-600 dark:text-accent-400">{s.label}</span>
                      <span className="font-bold text-accent-900 dark:text-white font-mono">{s.value}</span>
                    </div>
                    <ProgressBar value={s.value} max={s.max} color="danger" size="sm" />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-accent-100 dark:border-accent-800 space-y-2">
              {[
                { label: 'Incident Classification', value: flag.title },
                { label: 'Detector Engine', value: flag.source },
                { label: 'Candidate Name', value: flag.participant },
                { label: 'Target Assessment', value: flag.session },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-accent-500 dark:text-accent-400">{item.label}</span>
                  <span className="font-semibold text-accent-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Reviewer Resolution Form */}
      <Card>
        <CardHeader title="Faculty Examiner Determination" icon={<MessageSquare size={18} />} />
        <CardBody className="p-5 space-y-4">
          <Textarea label="Examiner Justification & Notes" rows={3} placeholder="Document findings following candidate interview or log inspection..." />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="danger" size="md">Flag for Formal Disciplinary Board</Button>
            <Button variant="success" size="md" icon={<CheckCircle2 size={16} />}>Dismiss / Verified False Positive</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default IntegrityEvidence;
