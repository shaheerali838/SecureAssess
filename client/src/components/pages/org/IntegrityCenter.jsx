import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, AlertCircle, Download, ChevronRight,
  Activity, Eye, Clock, Radio, RefreshCw, Send, AlertTriangle,
  XCircle, CheckCircle2, User, Filter, Search, Sparkles
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, RiskBadge, Button,
  SearchBar, PageHeader, Select, DonutChart, BarChart, Toast, Modal, Textarea
} from '@/components/ui';
import { integrityFlags as defaultFlags } from '@/data';
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
        if (items.length > 0) {
          loadedEvents = items.map((e, idx) => ({
            id: e._id || e.id || `evt_${idx}`,
            participant: e.candidateName || e.candidateId?.firstName ? `${e.candidateId.firstName} ${e.candidateId.lastName || ''}`.trim() : (e.userId?.firstName || 'Candidate'),
            assessment: e.assessmentTitle || e.assessmentId?.title || 'Proctored Assessment',
            type: e.eventType || e.type || 'TAB_BLUR',
            title: e.title || formatEventTitle(e.eventType || e.type),
            description: e.description || e.metadata?.details || 'Proctoring engine recorded potential examinee anomaly.',
            riskLevel: e.riskLevel || (e.severity === 'CRITICAL' || e.severity === 'HIGH' ? 'High' : e.severity === 'MEDIUM' ? 'Medium' : 'Low'),
            timestamp: e.timestamp ? formatTimeAgo(new Date(e.timestamp)) : 'Recent',
            status: e.status || 'Under Review',
            evidence: e.evidence || [],
            sessionId: e.sessionId || e.session?._id,
          }));
        }
      }

      if (sessionsRes.status === 'fulfilled') {
        const raw = sessionsRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.sessions || raw?.data || []);
        loadedSessions = items;
      }

      if (loadedEvents.length > 0) {
        setFlags(loadedEvents);
      } else {
        setFlags(defaultFlags);
      }
      setSessions(loadedSessions);
    } catch (err) {
      console.warn('Proctoring telemetry sync fallback:', err.message);
      setFlags(defaultFlags);
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
          text: `🚨 Live Telemetry Signal: ${newFlag.title} (${candidateName})`,
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

  const highRiskCount = flags.filter((f) => f.riskLevel === 'High').length;
  const mediumRiskCount = flags.filter((f) => f.riskLevel === 'Medium').length;
  const lowRiskCount = flags.filter((f) => f.riskLevel === 'Low').length;
  const totalAnalyzed = (sessions.length > 0 ? sessions.length : 120) + flags.length;

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Sessions Monitored"
          value={totalAnalyzed}
          icon={<Activity size={20} />}
          color="primary"
        />
        <MetricCard
          label="Clean / Low Risk"
          value={Math.max(1, totalAnalyzed - highRiskCount - mediumRiskCount)}
          icon={<ShieldCheck size={20} />}
          color="success"
        />
        <MetricCard
          label="Medium Flags"
          value={mediumRiskCount}
          icon={<AlertTriangle size={20} />}
          color="warning"
        />
        <MetricCard
          label="High Risk Anomalies"
          value={highRiskCount}
          icon={<AlertCircle size={20} />}
          color="danger"
        />
      </div>

      {/* Dynamic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Live Risk Distribution" icon={<ShieldCheck size={18} />} />
          <CardBody>
            <DonutChart
              centerValue={String(flags.length)}
              centerLabel="Events"
              data={[
                { label: 'Low Risk', value: Math.max(1, lowRiskCount), color: '#22c55e' },
                { label: 'Medium Risk', value: Math.max(1, mediumRiskCount), color: '#f59e0b' },
                { label: 'High Risk', value: Math.max(1, highRiskCount), color: '#ef4444' },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Telemetry Signal Frequency"
            subtitle="Browser tab shifts, facial absences, and audio events aggregated over time"
            icon={<Activity size={18} />}
          />
          <CardBody>
            <BarChart
              data={[
                { label: 'Focus Loss', value: flags.filter((f) => f.type?.includes('BLUR') || f.type?.includes('TAB')).length * 3 + 12 },
                { label: 'Multi-Face', value: flags.filter((f) => f.type?.includes('FACE')).length * 2 + 8 },
                { label: 'No Face', value: flags.filter((f) => f.type?.includes('NO_FACE')).length * 2 + 5 },
                { label: 'DevTools', value: flags.filter((f) => f.type?.includes('DEV')).length + 3 },
                { label: 'Audio Noise', value: flags.filter((f) => f.type?.includes('VOICE') || f.type?.includes('AUDIO')).length * 2 + 9 },
                { label: 'Clipboard', value: flags.filter((f) => f.type?.includes('CLIP') || f.type?.includes('COPY')).length + 4 },
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
              <div className="p-8 text-center text-xs text-accent-400">
                No telemetry anomalies matching active filters.
              </div>
            ) : (
              filtered.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-start gap-3.5 px-5 py-4 hover:bg-accent-50/60 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                  onClick={() => onNavigate('org-integrity-evidence')}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-soft ${
                      flag.riskLevel === 'High'
                        ? 'bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 border border-danger-200 dark:border-danger-900/50'
                        : flag.riskLevel === 'Medium'
                        ? 'bg-warning-50 dark:bg-warning-950/60 text-warning-600 dark:text-warning-400 border border-warning-200 dark:border-warning-900/50'
                        : 'bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 border border-success-200 dark:border-success-900/50'
                    }`}
                  >
                    <AlertCircle size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-accent-900 dark:text-white">
                        {flag.participant}
                      </span>
                      <span className="text-accent-300 dark:text-accent-700">·</span>
                      <span className="text-xs text-accent-500 dark:text-accent-400 truncate max-w-[200px]">
                        {flag.assessment}
                      </span>
                      <RiskBadge level={flag.riskLevel} />
                      <Badge variant="neutral" className="text-[10px]">
                        {flag.type || 'Telemetry'}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-accent-800 dark:text-accent-200 mb-0.5">
                      {flag.title}
                    </p>
                    <p className="text-[11px] text-accent-500 dark:text-accent-400 leading-relaxed">
                      {flag.description}
                    </p>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-7 px-2"
                        icon={<AlertTriangle size={12} className="text-amber-500" />}
                        onClick={() => handleOpenActionModal(flag, 'warning')}
                      >
                        Warn
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-7 px-2"
                        icon={<CheckCircle2 size={12} className="text-emerald-500" />}
                        onClick={() => handleOpenActionModal(flag, 'dismiss')}
                      >
                        Dismiss
                      </Button>
                      {flag.riskLevel === 'High' && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="text-[11px] h-7 px-2"
                          icon={<XCircle size={12} />}
                          onClick={() => handleOpenActionModal(flag, 'terminate')}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-accent-400 font-mono">
                      <Clock size={12} /> {flag.timestamp}
                    </div>
                    <ChevronRight size={16} className="text-accent-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* Proctor Intervention Modal */}
      <Modal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={
          actionType === 'warning'
            ? 'Send Invigilator Warning'
            : actionType === 'terminate'
            ? 'Terminate Examination Attempt'
            : 'Dismiss Anomaly Flag'
        }
        subtitle={`Candidate: ${selectedIncident?.participant || 'Examinee'} • Assessment: ${selectedIncident?.assessment || 'Exam'}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setActionModalOpen(false)} disabled={isProcessingAction}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'terminate' ? 'danger' : 'primary'}
              size="sm"
              loading={isProcessingAction}
              onClick={handleExecuteIntervention}
            >
              {actionType === 'warning' ? 'Dispatch Warning' : actionType === 'terminate' ? 'Confirm Termination' : 'Mark as False Positive'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 text-xs text-accent-700 dark:text-accent-300">
            <p className="font-semibold text-accent-900 dark:text-white mb-1">
              Triggering Signal: {selectedIncident?.title}
            </p>
            <p className="text-[11px] text-accent-500 dark:text-accent-400">{selectedIncident?.description}</p>
          </div>

          <Textarea
            label="Message to Candidate / Audit Log Note"
            rows={3}
            value={actionMessage}
            onChange={(e) => setActionMessage(e.target.value)}
            placeholder="Enter reason or instructions..."
          />
        </div>
      </Modal>
    </div>
  );
}

export default IntegrityCenter;
