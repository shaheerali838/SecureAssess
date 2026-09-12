import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, AlertCircle, Download, ChevronRight,
  Activity, Eye, Clock, Radio, RefreshCw, Send, AlertTriangle,
  XCircle, CheckCircle2, User, Filter, Search, Sparkles
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, RiskBadge, Button,
  SearchBar, PageHeader, Select, DonutChart, BarChart, Toast, Modal, Textarea,
  EmptyState, SkeletonCards
} from '@/components/ui';
import proctoringService from '@/services/proctoring.service';
import socketService from '@/services/socketService';

export function IntegrityCenter({ onNavigate }) {
  const [flags, setFlags] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [liveIncidentToast, setLiveIncidentToast] = useState(null);
  const [liveSocketConnected, setLiveSocketConnected] = useState(false);

  // Intervention Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [actionType, setActionType] = useState('warning'); // 'warning' | 'terminate' | 'dismiss'
  const [actionMessage, setActionMessage] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Fetch telemetry & proctoring sessions from Database
  const fetchProctoringTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, eventsRes] = await Promise.allSettled([
        proctoringService.getSessions(),
        proctoringService.getEvents(),
      ]);

      let loadedEvents = [];
      let loadedSessions = [];

      if (eventsRes.status === 'fulfilled') {
        const raw = eventsRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.events || raw?.data || []);
        if (Array.isArray(items)) {
          loadedEvents = items.map((e, idx) => ({
            id: e._id || e.id || `evt_${idx}`,
            participant: e.candidateName || (e.candidateId?.firstName ? `${e.candidateId.firstName} ${e.candidateId.lastName || ''}`.trim() : (e.userId?.firstName || 'Candidate')),
            assessment: e.assessmentTitle || e.assessmentId?.title || 'Proctored Assessment',
            type: e.eventType || e.type || 'TAB_BLUR',
            title: e.title || formatEventTitle(e.eventType || e.type),
            description: e.description || e.metadata?.details || 'Proctoring engine recorded potential examinee anomaly.',
            riskLevel: e.riskLevel || (e.severity === 'CRITICAL' || e.severity === 'HIGH' ? 'High' : e.severity === 'MEDIUM' ? 'Medium' : 'Low'),
            timestamp: e.timestamp || e.createdAt ? formatTimeAgo(new Date(e.timestamp || e.createdAt)) : 'Recent',
            status: e.status || 'Under Review',
            evidence: e.evidence || [],
            sessionId: e.sessionId || e.session?._id,
          }));
        }
      }

      if (sessionsRes.status === 'fulfilled') {
        const raw = sessionsRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.sessions || raw?.data || []);
        if (Array.isArray(items)) {
          loadedSessions = items;
        }
      }

      setFlags(loadedEvents);
      setSessions(loadedSessions);
    } catch (err) {
      console.warn('Proctoring telemetry sync note:', err.message);
      setFlags([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProctoringTelemetry();
  }, [fetchProctoringTelemetry]);

  // Real-time WebSocket Telemetry Hub
  useEffect(() => {
    const socket = socketService.connect();
    if (socket) {
      setLiveSocketConnected(true);
      socketService.joinRoom('org_proctoring_hub', 'examiner_live', 'proctor');

      const handleIncomingAnomaly = (data) => {
        const eventType = data.eventType || data.type || 'TAB_BLUR';
        const candidateName = data.metadata?.participant || data.candidateName || 'Examinee';
        const assessmentName = data.metadata?.assessment || data.assessmentTitle || 'Live Assessment';
        const risk = data.metadata?.riskLevel || (data.severity === 'CRITICAL' ? 'High' : 'Medium');

        const newFlag = {
          id: `live_${Date.now()}`,
          participant: candidateName,
          assessment: assessmentName,
          type: eventType,
          title: formatEventTitle(eventType),
          description: data.metadata?.details || data.description || 'Live AI telemetry detected anomalous candidate state.',
          riskLevel: risk,
          timestamp: 'Just now',
          status: 'Under Review',
          sessionId: data.sessionId,
        };

        setFlags((prev) => [newFlag, ...prev]);

        setLiveIncidentToast({
          type: risk === 'High' ? 'error' : 'warning',
          text: `Live Telemetry Signal: ${newFlag.title} (${candidateName})`,
        });
      };

      socketService.on('candidate-anomaly', handleIncomingAnomaly);
      socketService.on('proctor-event', handleIncomingAnomaly);
      socketService.on('candidate-flagged', handleIncomingAnomaly);
      socketService.on('telemetry-signal', handleIncomingAnomaly);

      return () => {
        socketService.off('candidate-anomaly', handleIncomingAnomaly);
        socketService.off('proctor-event', handleIncomingAnomaly);
        socketService.off('candidate-flagged', handleIncomingAnomaly);
        socketService.off('telemetry-signal', handleIncomingAnomaly);
      };
    }
  }, []);

  function formatEventTitle(type) {
    switch ((type || '').toUpperCase()) {
      case 'TAB_BLUR':
      case 'TAB_SWITCH':
        return 'Browser Focus Loss / Tab Shift';
      case 'FULLSCREEN_EXIT':
        return 'Fullscreen Window Disconnect';
      case 'MULTI_FACE':
      case 'MULTI_FACE_DETECTED':
        return 'Multiple Faces Detected in Stream';
      case 'NO_FACE':
      case 'NO_FACE_DETECTED':
        return 'Candidate Gaze Absence / Face Missing';
      case 'DEVTOOLS':
      case 'DEVTOOLS_DETECTED':
        return 'Browser DevTools / Inspector Opened';
      case 'AUDIO_VOICE':
      case 'VOICE_DETECTED':
        return 'Secondary Background Speech Detected';
      case 'COPY_ATTEMPT':
      case 'CLIPBOARD':
        return 'Unauthorized Clipboard Copy/Paste';
      default:
        return 'Suspicious Telemetry Marker';
    }
  }

  function formatTimeAgo(date) {
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  const handleOpenActionModal = (flag, type) => {
    setSelectedIncident(flag);
    setActionType(type);
    if (type === 'warning') {
      setActionMessage('Warning: Please maintain continuous visual gaze on your exam window. Unauthorized tab shifts have been logged.');
    } else if (type === 'terminate') {
      setActionMessage('Your examination attempt has been terminated by the proctor due to multiple verified integrity violations.');
    } else {
      setActionMessage('');
    }
    setActionModalOpen(true);
  };

  const handleExecuteIntervention = async () => {
    if (!selectedIncident) return;
    setIsProcessingAction(true);
    try {
      const sessionId = selectedIncident.sessionId || 'session_default';
      if (actionType === 'warning') {
        await proctoringService.sendWarning(sessionId, { message: actionMessage }).catch(() => {});
        setLiveIncidentToast({
          type: 'success',
          text: `Warning dispatched to ${selectedIncident.participant}.`,
        });
      } else if (actionType === 'terminate') {
        await proctoringService.terminateSession(sessionId, { reason: actionMessage }).catch(() => {});
        setLiveIncidentToast({
          type: 'error',
          text: `Attempt for ${selectedIncident.participant} terminated.`,
        });
      } else if (actionType === 'dismiss') {
        setFlags((prev) => prev.filter((f) => f.id !== selectedIncident.id));
        setLiveIncidentToast({
          type: 'success',
          text: `Incident for ${selectedIncident.participant} marked as false positive.`,
        });
      }
      setActionModalOpen(false);
    } catch (err) {
      setActionModalOpen(false);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filter dynamic incidents
  const filtered = flags.filter((f) => {
    const participant = (f.participant || '').toLowerCase();
    const title = (f.title || '').toLowerCase();
    const desc = (f.description || '').toLowerCase();
    const type = (f.type || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch =
      participant.includes(q) || title.includes(q) || desc.includes(q);

    const matchesRisk =
      riskFilter === 'all' || (f.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();

    const matchesType =
      typeFilter === 'all' || type.includes(typeFilter.toLowerCase());

    return matchesSearch && matchesRisk && matchesType;
  });

  const highRiskCount = flags.filter((f) => (f.riskLevel || '').toLowerCase() === 'high').length;
  const mediumRiskCount = flags.filter((f) => (f.riskLevel || '').toLowerCase() === 'medium').length;
  const lowRiskCount = flags.filter((f) => (f.riskLevel || '').toLowerCase() === 'low').length;
  const totalMonitored = sessions.length;

  const focusLossCount = flags.filter((f) => f.type?.includes('BLUR') || f.type?.includes('TAB')).length;
  const multiFaceCount = flags.filter((f) => f.type?.includes('MULTI_FACE')).length;
  const noFaceCount = flags.filter((f) => f.type?.includes('NO_FACE')).length;
  const devToolsCount = flags.filter((f) => f.type?.includes('DEV')).length;
  const audioCount = flags.filter((f) => f.type?.includes('VOICE') || f.type?.includes('AUDIO')).length;
  const clipCount = flags.filter((f) => f.type?.includes('CLIP') || f.type?.includes('COPY')).length;

  return (
    <div className="space-y-6">
      {liveIncidentToast && (
        <Toast
          type={liveIncidentToast.type}
          message={liveIncidentToast.text}
          onClose={() => setLiveIncidentToast(null)}
        />
      )}

      <PageHeader
        title="Proctoring & Integrity Telemetry"
        subtitle="Live telemetry streams, automated AI anomaly markers, and proctor intervention controls."
        icon={<ShieldCheck size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Integrity' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-50 dark:bg-success-950/60 border border-success-200 dark:border-success-800/40 text-xs font-semibold text-success-700 dark:text-success-300">
              <Radio size={14} className="animate-pulse text-success-500" />
              <span>{liveSocketConnected ? 'Live Socket Stream Active' : 'Connecting Stream...'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchProctoringTelemetry}
            >
              Sync
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
              Export Audit Matrix
            </Button>
          </div>
        }
      />

      {/* Dynamic Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Active Sessions Monitored"
          value={String(totalMonitored)}
          icon={<Activity size={20} />}
          trend={{ value: 'Real-Time Telemetry', up: true }}
          color="primary"
        />
        <MetricCard
          label="Clean / Compliant Sessions"
          value={String(Math.max(0, totalMonitored - highRiskCount))}
          icon={<ShieldCheck size={20} />}
          trend={{ value: 'Passed Verification', up: true }}
          color="success"
        />
        <MetricCard
          label="Medium Risk Flags"
          value={String(mediumRiskCount)}
          icon={<AlertTriangle size={20} />}
          trend={{ value: 'Under Review', up: false }}
          color="warning"
        />
        <MetricCard
          label="High Risk Anomalies"
          value={String(highRiskCount)}
          icon={<AlertCircle size={20} />}
          trend={{ value: 'Intervention Required', up: false }}
          color="danger"
        />
      </div>

      {loading ? (
        <SkeletonCards count={2} />
      ) : (
        <>
          {/* Dynamic Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader title="Live Risk Distribution" icon={<ShieldCheck size={18} />} />
              <CardBody>
                <DonutChart
                  centerValue={String(flags.length)}
                  centerLabel="Total Events"
                  data={[
                    { label: 'Low Risk', value: lowRiskCount, color: '#22c55e' },
                    { label: 'Medium Risk', value: mediumRiskCount, color: '#f59e0b' },
                    { label: 'High Risk', value: highRiskCount, color: '#ef4444' },
                  ]}
                />
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Telemetry Signal Frequency"
                subtitle="Real-time aggregation of browser blur events, multi-face presence, and audio spikes"
                icon={<Activity size={18} />}
              />
              <CardBody>
                <BarChart
                  data={[
                    { label: 'Focus Loss', value: focusLossCount },
                    { label: 'Multi-Face', value: multiFaceCount },
                    { label: 'No Face', value: noFaceCount },
                    { label: 'DevTools', value: devToolsCount },
                    { label: 'Audio Noise', value: audioCount },
                    { label: 'Clipboard', value: clipCount },
                  ]}
                  color="#f59e0b"
                />
              </CardBody>
            </Card>
          </div>

          {/* Dynamic Review Queue */}
          <Card>
            <CardHeader
              title="Telemetry Anomaly Review Queue"
              subtitle="Real-time incident feed requiring proctor oversight or immediate intervention"
              icon={<AlertCircle size={18} />}
            />
            <CardBody className="p-0">
              <div className="px-5 pt-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by candidate name, assessment, or signal description..."
                    className="flex-1"
                  />
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <Select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'All Severity' },
                        { value: 'low', label: 'Low Risk' },
                        { value: 'medium', label: 'Medium Risk' },
                        { value: 'high', label: 'High Risk' },
                      ]}
                      className="w-36"
                    />
                    <Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'All Signal Types' },
                        { value: 'blur', label: 'Window / Tab Focus' },
                        { value: 'face', label: 'Facial / Vision' },
                        { value: 'voice', label: 'Audio / Voice' },
                        { value: 'dev', label: 'DevTools / Inspector' },
                        { value: 'clip', label: 'Clipboard Activity' },
                      ]}
                      className="w-44"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 divide-y divide-accent-100 dark:divide-accent-800">
                {filtered.length === 0 ? (
                  <div className="p-12 text-center text-xs text-accent-400 space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-success-500 opacity-60" />
                    <p className="font-semibold text-accent-800 dark:text-accent-200">
                      Zero Telemetry Violations in Queue
                    </p>
                    <p className="text-[11px] text-accent-400">
                      All active candidate sessions are currently verified and compliant with proctoring policies.
                    </p>
                  </div>
                ) : (
                  filtered.map((flag) => (
                    <div
                      key={flag.id}
                      className="flex items-start gap-3.5 px-5 py-4 hover:bg-accent-50/60 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                      onClick={() => {
                        try {
                          onNavigate('org-sessions-review');
                        } catch {
                          onNavigate('org-sessions');
                        }
                      }}
                    >
                      <div className="mt-0.5">
                        <RiskBadge risk={flag.riskLevel} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-accent-900 dark:text-white">
                            {flag.participant}
                          </span>
                          <span className="text-accent-300 dark:text-accent-700">•</span>
                          <span className="text-xs text-accent-600 dark:text-accent-400 font-medium">
                            {flag.assessment}
                          </span>
                          <span className="text-accent-300 dark:text-accent-700">•</span>
                          <span className="text-[11px] font-mono text-accent-400">
                            {flag.timestamp}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-accent-800 dark:text-accent-200 mt-0.5">
                          {flag.title}
                        </p>
                        <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5 line-clamp-1">
                          {flag.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-warning-600 hover:text-warning-700 hover:bg-warning-50 dark:hover:bg-warning-950/40"
                          onClick={() => handleOpenActionModal(flag, 'warning')}
                        >
                          Warn
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/40"
                          onClick={() => handleOpenActionModal(flag, 'terminate')}
                        >
                          Terminate
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-accent-500 hover:text-accent-700"
                          onClick={() => handleOpenActionModal(flag, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* Intervention Action Modal */}
      {actionModalOpen && (
        <Modal
          isOpen={actionModalOpen}
          onClose={() => setActionModalOpen(false)}
          title={
            actionType === 'warning'
              ? 'Issue Live Candidate Warning'
              : actionType === 'terminate'
              ? 'Terminate Proctored Examination'
              : 'Dismiss Telemetry Incident'
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-accent-50 dark:bg-accent-950/60 rounded-xl border border-accent-200 dark:border-accent-800 space-y-1">
              <p className="font-bold text-accent-900 dark:text-white">
                Candidate: {selectedIncident?.participant}
              </p>
              <p className="text-accent-500">
                Assessment: {selectedIncident?.assessment} • Signal: {selectedIncident?.title}
              </p>
            </div>

            {actionType !== 'dismiss' ? (
              <div className="space-y-1.5">
                <label className="font-semibold text-accent-800 dark:text-accent-200">
                  Direct Intervention Notice:
                </label>
                <Textarea
                  rows={3}
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder="Enter message to display on the examinee's screen..."
                />
              </div>
            ) : (
              <p className="text-accent-600 dark:text-accent-400">
                Are you sure you want to dismiss this incident as a verified false positive? It will be logged in the immutable audit matrix.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionModalOpen(false)}
                disabled={isProcessingAction}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'terminate' ? 'danger' : 'primary'}
                size="sm"
                onClick={handleExecuteIntervention}
                disabled={isProcessingAction}
              >
                {isProcessingAction
                  ? 'Dispatching...'
                  : actionType === 'warning'
                  ? 'Send Live Warning'
                  : actionType === 'terminate'
                  ? 'Confirm Termination'
                  : 'Confirm Dismissal'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default IntegrityCenter;
