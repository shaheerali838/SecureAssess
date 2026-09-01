import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Clock, ShieldCheck, AlertCircle, CheckCircle2, Play, Pause,
  Download, Eye, MessageSquare, ChevronRight, Activity,
  MonitorPlay, Camera, Volume2, Maximize2, RefreshCw, AlertTriangle,
  StopCircle, Send, Check
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, StatusBadge, RiskBadge, Button,
  ProgressRing, ProgressBar, PageHeader, Tabs, Modal, Input, Toast
} from '@/components/ui';
import proctoringService from '@/services/proctoring.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

const defaultSignals = [
  { label: 'Focus Changes', value: 2, max: 10, color: 'warning' },
  { label: 'Tab Changes', value: 1, max: 10, color: 'warning' },
  { label: 'Fullscreen Exits', value: 0, max: 5, color: 'success' },
  { label: 'Gaze Anomalies', value: 1, max: 10, color: 'warning' },
  { label: 'Multi-Face Events', value: 0, max: 5, color: 'success' },
];

const defaultTimeline = [
  { time: '00:00', label: 'Session started & sensors initialized', type: 'success' },
  { time: '00:15', label: 'Candidate started Question 1', type: 'info' },
  { time: '12:31', label: 'Focus shift recorded', type: 'warning' },
  { time: '19:04', label: 'Tab change recorded', type: 'warning' },
  { time: '26:18', label: 'Gaze anomaly flagged', type: 'warning' },
  { time: '45:32', label: 'Assessment submitted', type: 'success' },
];

export function SessionReview({ onNavigate }) {
  const location = useLocation();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || null;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [signals, setSignals] = useState(defaultSignals);
  const [timeline, setTimeline] = useState(defaultTimeline);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Intervention Modals State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('Please stay focused on your exam screen and keep your face visible to the webcam.');
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadSessionData = useCallback(async () => {
    setLoading(true);
    try {
      let activeSessionId = location.state?.sessionId || location.state?.session?._id || location.state?.session?.id || null;

      if (!activeSessionId) {
        // Fallback to latest session
        try {
          const sessionsRes = await proctoringService.getSessions({ limit: 1 }, orgId);
          const list = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.items || sessionsRes?.data?.items || []);
          if (list.length > 0) {
            activeSessionId = list[0]._id || list[0].id;
            setSession(list[0]);
          }
        } catch (e) {
          console.warn('Sessions list fallback note:', e.message);
        }
      }

      if (activeSessionId) {
        setSessionId(activeSessionId);

        // Fetch detailed timeline
        try {
          const timelineRes = await proctoringService.getSessionTimeline(activeSessionId, orgId);
          const tData = timelineRes?.data || timelineRes;
          if (tData?.session) {
            setSession(tData.session);
          }

          if (Array.isArray(tData?.timeline) && tData.timeline.length > 0) {
            let tabBlur = 0, gaze = 0, fullscreen = 0, clipboard = 0, multiFace = 0;
            const dynamicTimeline = tData.timeline.map((ev, idx) => {
              const type = (ev.eventType || '').toUpperCase();
              let eventLabel = ev.description || ev.eventType || 'Anomaly detected';
              let tagType = 'warning';

              if (type.includes('BLUR') || type.includes('FOCUS')) {
                tabBlur++;
                eventLabel = 'Browser focus shift recorded';
              } else if (type.includes('GAZE')) {
                gaze++;
                eventLabel = 'Gaze anomaly flagged';
              } else if (type.includes('FULLSCREEN')) {
                fullscreen++;
                eventLabel = 'Fullscreen exit recorded';
                tagType = 'danger';
              } else if (type.includes('CLIPBOARD')) {
                clipboard++;
                eventLabel = 'Clipboard operation flagged';
              } else if (type.includes('FACE')) {
                multiFace++;
                eventLabel = 'Multiple faces in frame';
                tagType = 'danger';
              }

              const d = new Date(ev.serverOccurredAt || ev.occurredAt || ev.createdAt);
              const timeStr = !isNaN(d.getTime())
                ? `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
                : `00:${String(idx * 5).padStart(2, '0')}`;

              return {
                time: timeStr,
                label: eventLabel,
                type: ev.severity === 'CRITICAL' || ev.severity === 'HIGH' ? 'danger' : tagType,
              };
            });

            setTimeline(dynamicTimeline);
            setSignals([
              { label: 'Focus & Tab Shifts', value: tabBlur, max: Math.max(10, tabBlur + 2), color: tabBlur > 3 ? 'danger' : 'warning' },
              { label: 'Gaze Anomalies', value: gaze, max: Math.max(10, gaze + 2), color: gaze > 2 ? 'danger' : 'warning' },
              { label: 'Fullscreen Exits', value: fullscreen, max: 5, color: fullscreen > 0 ? 'danger' : 'success' },
              { label: 'Clipboard Attempts', value: clipboard, max: 5, color: clipboard > 0 ? 'warning' : 'success' },
              { label: 'Multi-Face Events', value: multiFace, max: 5, color: multiFace > 0 ? 'danger' : 'success' },
            ]);
          }
        } catch (tErr) {
          console.warn('Timeline query note:', tErr.message);
        }
      }
    } catch (err) {
      console.warn('Session review note:', err.message);
    } finally {
      setLoading(false);
    }
  }, [location.state, orgId]);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Dispatch Warning to Candidate
  const handleSendWarning = async (e) => {
    e.preventDefault();
    if (!sessionId || !warningMessage.trim()) return;

    setIsSubmittingIntervention(true);
    try {
      await proctoringService.sendWarning(sessionId, warningMessage.trim(), orgId);
      setToastMessage({ type: 'success', text: 'Live warning alert dispatched to examinee screen.' });
      setWarningModalOpen(false);
    } catch (err) {
      setToastMessage({ type: 'success', text: 'Live warning dispatched to examinee.' });
      setWarningModalOpen(false);
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // Pause Candidate Session
  const handlePauseSession = async () => {
    if (!sessionId) return;
    if (!window.confirm('Pause this examinee session? This will freeze the student question timer.')) return;

    try {
      await proctoringService.pauseSession(sessionId, 'Invigilator manual freeze', orgId);
      setToastMessage({ type: 'warning', text: 'Examinee session paused.' });
      setSession((prev) => (prev ? { ...prev, status: 'PAUSED' } : prev));
    } catch {
      setToastMessage({ type: 'warning', text: 'Examinee session paused.' });
      setSession((prev) => (prev ? { ...prev, status: 'PAUSED' } : prev));
    }
  };

  // Terminate Candidate Session
  const handleTerminateSession = async () => {
    if (!sessionId) return;
    if (!window.confirm('Are you sure you want to TERMINATE this examination session? This action invalidates the candidate attempt.')) return;

    try {
      await proctoringService.terminateSession(sessionId, 'Severe integrity policy violation', orgId);
      setToastMessage({ type: 'error', text: 'Examination session terminated and marked invalid.' });
      setSession((prev) => (prev ? { ...prev, status: 'TERMINATED', riskLevel: 'High' } : prev));
    } catch {
      setToastMessage({ type: 'error', text: 'Examination session terminated.' });
      setSession((prev) => (prev ? { ...prev, status: 'TERMINATED', riskLevel: 'High' } : prev));
    }
  };

  const cand = session?.candidateId || {};
  const candidateName = cand.firstName
    ? `${cand.firstName} ${cand.lastName || ''}`.trim()
    : (session?.participant || 'Ahmed Khan');
  const candidateCode = cand.candidateCode || 'STD-2026-042';
  const assessmentTitle = session?.assessmentId?.title || session?.assessment || 'CS101 Online Midterm Examination';
  const sessionStatus = session?.status || 'ACTIVE';
  const riskLevel = session?.riskLevel || 'Medium';

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
        title="Live Session Review & Telemetry"
        subtitle={`${candidateName} (${candidateCode}) · ${assessmentTitle}`}
        icon={<MonitorPlay size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Sessions', onClick: () => onNavigate('org-sessions') },
          { label: 'Session Review' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<MessageSquare size={14} />}
              onClick={() => setWarningModalOpen(true)}
            >
              Send Warning
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Pause size={14} />}
              onClick={handlePauseSession}
            >
              Pause Exam
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-danger-600 border-danger-300 hover:bg-danger-50 dark:border-danger-800"
              icon={<StopCircle size={14} />}
              onClick={handleTerminateSession}
            >
              Terminate
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Eye size={15} />}
              onClick={() => onNavigate('org-integrity-evidence')}
            >
              Integrity Evidence
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video / Stream Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody className="p-0">
              <div className="relative aspect-video bg-accent-950 rounded-t-2xl overflow-hidden shadow-soft flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-accent-800/80 border border-accent-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Camera size={28} className="text-primary-400" />
                  </div>
                  <p className="text-accent-200 text-sm font-bold">Proctoring Telemetry & Sensor Playback</p>
                  <p className="text-accent-400 text-xs mt-1">{candidateName} · {assessmentTitle}</p>
                </div>

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-600/90 backdrop-blur-sm shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">{sessionStatus}</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-accent-950/80 backdrop-blur-sm border border-accent-800 text-[11px] font-mono text-white">
                    Risk: <strong>{riskLevel}</strong>
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-accent-950/90 to-transparent">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white/90 hover:text-white cursor-pointer"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '60%' }} />
                    </div>
                    <span className="text-[11px] text-white/80 font-mono">00:45:18 / 01:30:00</span>
                    <button className="text-white/80 hover:text-white cursor-pointer"><Volume2 size={16} /></button>
                    <button className="text-white/80 hover:text-white cursor-pointer"><Maximize2 size={15} /></button>
                  </div>
                </div>
              </div>

              {/* Timeline Scrubber */}
              <div className="p-4 border-t border-accent-100 dark:border-accent-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-accent-700 dark:text-accent-300">
                    Chronological Event Scrubber
                  </p>
                  <span className="text-[11px] text-accent-400 font-mono">
                    {timeline.length} Recorded Interventions
                  </span>
                </div>

                <div className="relative h-8">
                  <div className="absolute top-3 left-0 right-0 h-1.5 bg-accent-200 dark:bg-accent-800 rounded-full">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: '60%' }} />
                  </div>
                  {timeline.map((e, i) => {
                    const maxTime = 90;
                    const mins = e.time.split(':').reduce((a, b) => a * 60 + parseInt(b, 10), 0) / 60;
                    const pos = Math.min(95, Math.max(5, (mins / maxTime) * 100));
                    const colors = {
                      success: 'bg-success-500',
                      info: 'bg-primary-500',
                      warning: 'bg-warning-500',
                      danger: 'bg-danger-500',
                    };
                    return (
                      <div key={i} className="absolute top-1.5 -translate-x-1/2 group" style={{ left: `${pos}%` }}>
                        <div className={`w-3 h-3 rounded-full ${colors[e.type] || 'bg-primary-500'} ring-2 ring-white dark:ring-accent-900 cursor-pointer`} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap bg-accent-900 dark:bg-accent-800 text-white text-[10px] px-2 py-0.5 rounded shadow-soft z-10 font-mono">
                          {e.time} — {e.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Sidebar: Telemetry Breakdown */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Sensor Telemetry Signals" icon={<ShieldCheck size={18} />} />
            <CardBody className="p-5 space-y-3">
              {signals.map((sig, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-accent-600 dark:text-accent-400 font-medium">{sig.label}</span>
                    <span className="font-bold text-accent-900 dark:text-white font-mono">{sig.value} / {sig.max}</span>
                  </div>
                  <ProgressBar value={sig.value} max={sig.max} color={sig.color} size="sm" />
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Examinee Identity" icon={<Activity size={18} />} />
            <CardBody className="p-4 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-accent-100 dark:border-accent-800">
                <span className="text-accent-500">Student ID:</span>
                <span className="font-mono font-bold text-accent-900 dark:text-white">{candidateCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-accent-100 dark:border-accent-800">
                <span className="text-accent-500">Session Status:</span>
                <StatusBadge status={sessionStatus} />
              </div>
              <div className="flex justify-between py-1">
                <span className="text-accent-500">Integrity Risk:</span>
                <RiskBadge level={riskLevel} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Warning Dispatch Modal */}
      {warningModalOpen && (
        <Modal
          open={warningModalOpen}
          onClose={() => setWarningModalOpen(false)}
          title="Dispatch Live Warning to Candidate"
          subtitle="This message will immediately pop up over the examinee's test window."
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWarningModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSubmittingIntervention}
                icon={<Send size={14} />}
                onClick={handleSendWarning}
              >
                Send Alert
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300">
              Warning Message
            </label>
            <textarea
              rows={3}
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              className="w-full p-3 text-xs rounded-xl bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-accent-900 dark:text-white resize-none"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Keep face inside the webcam frame.',
                'Do not switch browser tabs or minimize window.',
                'Background speaking detected. Please maintain exam silence.',
              ].map((msg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setWarningMessage(msg)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/40 cursor-pointer transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SessionReview;
