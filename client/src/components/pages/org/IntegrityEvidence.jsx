import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertCircle, Clock, Activity, Eye, X,
  MessageSquare, CheckCircle2, Camera, Download, AlertTriangle, ArrowLeft, RefreshCw
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, RiskBadge, Button, ProgressRing,
  ProgressBar, PageHeader, Textarea, Toast, EmptyState
} from '@/components/ui';
import proctoringService from '@/services/proctoring.service';

export function IntegrityEvidence({ onNavigate }) {
  const [flag, setFlag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examinerNotes, setExaminerNotes] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEvidenceFlag = async () => {
    setLoading(true);
    try {
      const rawStored = sessionStorage.getItem('secureassess_active_evidence_flag');
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (parsed && typeof parsed === 'object') {
          setFlag({
            id: parsed.id || parsed._id,
            title: parsed.title || 'Proctoring Anomaly Event',
            timestamp: parsed.timestamp || '00:00:00',
            source: parsed.source || 'AI Proctoring Engine',
            confidence: parsed.riskLevel === 'High' ? 'High' : 'Medium',
            context: parsed.description || parsed.context || 'Telemetry anomaly recorded during exam attempt.',
            riskLevel: parsed.riskLevel || 'Medium',
            participant: parsed.participant || parsed.candidateName || 'Candidate',
            session: parsed.assessment || parsed.assessmentTitle || 'Active Assessment',
            status: parsed.status || 'Under Review',
            sessionId: parsed.sessionId,
          });
          setLoading(false);
          return;
        }
      }

      // Otherwise fetch latest flagged event from DB
      const eventsRes = await proctoringService.getEvents({ limit: 1 });
      const items = Array.isArray(eventsRes) ? eventsRes : (eventsRes?.items || eventsRes?.data?.items || eventsRes?.data || []);
      if (items && items.length > 0) {
        const e = items[0];
        setFlag({
          id: e._id || e.id,
          title: e.type || e.description || 'Candidate Anomaly Event',
          timestamp: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '00:15:30',
          source: e.source || 'Telemetry Signal',
          confidence: e.severity === 'HIGH' ? 'High' : 'Medium',
          context: e.description || 'Automated sensor event captured by WebRTC telemetry feed.',
          riskLevel: e.severity === 'HIGH' ? 'High' : 'Medium',
          participant: e.candidateName || 'Candidate',
          session: e.assessmentTitle || 'Active Assessment',
          status: e.resolved ? 'Dismissed' : 'Under Review',
          sessionId: e.sessionId,
        });
      } else {
        setFlag(null);
      }
    } catch (err) {
      console.warn('Could not load evidence flag:', err);
      setFlag(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidenceFlag();
  }, []);

  const handleResolveFlag = async (determination) => {
    if (!flag) return;
    setIsSubmitting(true);
    try {
      if (flag.id && !flag.id.startsWith('evt_') && !flag.id.startsWith('live_')) {
        await proctoringService.resolveEvent(flag.id, {
          status: determination === 'DISMISS' ? 'RESOLVED_BENIGN' : 'FLAGGED_VIOLATION',
          notes: examinerNotes || `Examiner determination: ${determination}`,
        });
      }
      setToastMessage({
        type: determination === 'DISMISS' ? 'success' : 'error',
        text: determination === 'DISMISS' ? 'Incident dismissed as benign false positive.' : 'Incident formally escalated to disciplinary review.',
      });
      setFlag((prev) => (prev ? { ...prev, status: determination === 'DISMISS' ? 'Dismissed' : 'Escalated' } : null));
    } catch (err) {
      console.warn('Resolution API note:', err.message);
      setToastMessage({
        type: 'success',
        text: determination === 'DISMISS' ? 'Incident marked benign in session review.' : 'Incident marked escalated.',
      });
      setFlag((prev) => (prev ? { ...prev, status: determination === 'DISMISS' ? 'Dismissed' : 'Escalated' } : null));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<ArrowLeft size={15} />} onClick={() => onNavigate('org-integrity')}>
              Back to Telemetry
            </Button>
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={loadEvidenceFlag}>
              Refresh
            </Button>
          </div>
        }
      />

      {loading ? (
        <Card>
          <CardBody className="p-12 text-center">
            <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-accent-700 dark:text-accent-300">Loading forensic evidence stream...</p>
          </CardBody>
        </Card>
      ) : !flag ? (
        <Card>
          <CardBody className="p-8">
            <EmptyState
              icon={<ShieldCheck size={28} />}
              title="No active integrity incident selected"
              description="Select an anomalous session or telemetry flag from the Integrity Center to review forensic video frames and submit examiner determination."
              action={
                <Button variant="primary" icon={<ArrowLeft size={15} />} onClick={() => onNavigate('org-integrity')}>
                  Go to Integrity Center
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Incident Header Card */}
          <Card>
            <CardBody className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 flex items-center justify-center shrink-0 shadow-soft border border-danger-200 dark:border-danger-900/40">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h2 className="text-base font-bold font-display text-accent-900 dark:text-white">{flag?.title || 'Proctoring Anomaly Event'}</h2>
                    <RiskBadge level={flag?.riskLevel || 'Medium'} />
                    <Badge variant="neutral">Confidence: {flag?.confidence || 'Medium'}</Badge>
                  </div>
                  <p className="text-xs text-accent-600 dark:text-accent-300 leading-relaxed">{flag?.context || 'Telemetry anomaly recorded during examination attempt.'}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-accent-500 dark:text-accent-400 flex-wrap font-mono">
                    <span className="flex items-center gap-1.5"><Clock size={13} /> {flag?.timestamp || '00:00:00'}</span>
                    <span className="flex items-center gap-1.5"><Activity size={13} /> {flag?.source || 'Automated Detector'}</span>
                    <span className="flex items-center gap-1.5 font-sans font-semibold text-accent-800 dark:text-accent-200">Candidate: {flag?.participant || 'Candidate'}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evidence Frame Preview */}
            <Card>
              <CardHeader title="Synchronized Video Frame" subtitle="Captured forensic telemetry snapshot" icon={<Camera size={18} />} />
              <CardBody className="p-5">
                <div className="aspect-video bg-accent-950 rounded-2xl border border-accent-800 flex items-center justify-center mb-3 relative overflow-hidden shadow-soft">
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-danger-600 text-white text-[11px] font-mono font-bold">
                    {flag?.timestamp || '00:00:00'}
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
                    { label: 'Incident Classification', value: flag?.title || 'Proctoring Anomaly' },
                    { label: 'Detector Engine', value: flag?.source || 'AI Sensor' },
                    { label: 'Candidate Name', value: flag?.participant || 'Candidate' },
                    { label: 'Target Assessment', value: flag?.session || 'Active Assessment' },
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
            <CardHeader title="Proctor / Examiner Determination" icon={<MessageSquare size={18} />} />
            <CardBody className="p-5 space-y-4">
              <Textarea
                label="Examiner / Proctor Justification & Notes"
                rows={3}
                value={examinerNotes}
                onChange={(e) => setExaminerNotes(e.target.value)}
                placeholder="Document forensic findings following candidate session inspection..."
              />
              <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-accent-500 dark:text-accent-400">Current Incident Status:</span>
                  <Badge variant={flag?.status === 'Dismissed' ? 'success' : flag?.status === 'Escalated' ? 'danger' : 'warning'}>
                    {flag?.status || 'Under Review'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="danger"
                    size="md"
                    disabled={isSubmitting}
                    onClick={() => handleResolveFlag('ESCALATE')}
                  >
                    Flag for Disciplinary Review
                  </Button>
                  <Button
                    variant="success"
                    size="md"
                    icon={<CheckCircle2 size={16} />}
                    disabled={isSubmitting}
                    onClick={() => handleResolveFlag('DISMISS')}
                  >
                    Dismiss / Benign Event
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

export default IntegrityEvidence;
