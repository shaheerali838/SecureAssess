import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertCircle, Download, ChevronRight,
  Activity, Eye, Clock, Radio, RefreshCw
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, RiskBadge, Button,
  SearchBar, PageHeader, Select, DonutChart, BarChart, Toast
} from '@/components/ui';
import { integrityFlags as defaultFlags } from '@/data';
import socketService from '@/services/socketService';

export function IntegrityCenter({ onNavigate }) {
  const [flags, setFlags] = useState(defaultFlags);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [liveIncidentToast, setLiveIncidentToast] = useState(null);
  const [liveSocketConnected, setLiveSocketConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();
    if (socket) {
      setLiveSocketConnected(true);
      socketService.joinRoom('org_proctoring_hub', 'examiner_01', 'proctor');

      const handleIncomingAnomaly = (data) => {
        const newFlag = {
          id: Date.now(),
          participant: data.metadata?.participant || 'Candidate',
          assessment: data.metadata?.assessment || 'Live Assessment',
          type: data.eventType || 'TAB_BLUR',
          title: data.eventType === 'TAB_BLUR' ? 'Browser Tab Focus Loss' : 'Suspicious Clipboard Activity',
          description: data.metadata?.details || 'Live telemetry detected abnormal examinee window focus.',
          riskLevel: data.metadata?.riskLevel || 'Medium',
          timestamp: 'Just now',
          status: 'Under Review',
        };

        setFlags((prev) => [newFlag, ...prev]);
        setLiveIncidentToast({
          type: 'warning',
          text: `🚨 Live Alert: ${newFlag.title} detected for ${newFlag.participant}`,
        });
      };

      socketService.on('candidate-anomaly', handleIncomingAnomaly);
      socketService.on('proctor-event', handleIncomingAnomaly);

      return () => {
        socketService.off('candidate-anomaly', handleIncomingAnomaly);
        socketService.off('proctor-event', handleIncomingAnomaly);
      };
    }
  }, []);

  const filtered = flags.filter((f) => {
    const participant = (f.participant || '').toLowerCase();
    const title = (f.title || '').toLowerCase();
    const matchesSearch = participant.includes(search.toLowerCase()) || title.includes(search.toLowerCase());
    const matchesRisk = riskFilter === 'all' || (f.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  const highRiskCount = flags.filter(f => f.riskLevel === 'High').length;
  const mediumRiskCount = flags.filter(f => f.riskLevel === 'Medium').length;
  const lowRiskCount = flags.filter(f => f.riskLevel === 'Low').length;

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
        title="Proctoring & Integrity Center"
        subtitle="Telemetry signals, automated anti-cheat detections, and invigilator review queues."
        icon={<ShieldCheck size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Integrity' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-50 dark:bg-success-950/60 border border-success-200 dark:border-success-800/40 text-xs font-semibold text-success-700 dark:text-success-300">
              <Radio size={14} className="animate-pulse text-success-500" />
              <span>Live Socket Stream</span>
            </div>
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
              Export Audit Logs
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Sessions Analyzed" value={180 + flags.length} icon={<Activity size={20} />} color="primary" />
        <MetricCard label="Clean / Low Risk" value={140 + lowRiskCount} icon={<ShieldCheck size={20} />} color="success" />
        <MetricCard label="Medium Flags" value={mediumRiskCount} icon={<AlertCircle size={20} />} color="warning" />
        <MetricCard label="High Risk Incidents" value={highRiskCount} icon={<AlertCircle size={20} />} color="danger" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Risk Profile Breakdown" icon={<ShieldCheck size={18} />} />
          <CardBody>
            <DonutChart
              centerValue={String(flags.length)}
              centerLabel="Flags"
              data={[
                { label: 'Low Risk', value: lowRiskCount || 1, color: '#22c55e' },
                { label: 'Medium Risk', value: mediumRiskCount || 1, color: '#f59e0b' },
                { label: 'High Risk', value: highRiskCount || 1, color: '#ef4444' },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Integrity Anomaly Telemetry"
            subtitle="Window blur, multi-face, and audio anomalies detected over time"
            icon={<Activity size={18} />}
          />
          <CardBody>
            <BarChart
              data={[
                { label: 'W1', value: 12 }, { label: 'W2', value: 18 }, { label: 'W3', value: 8 },
                { label: 'W4', value: 24 }, { label: 'W5', value: 15 }, { label: 'W6', value: 20 },
                { label: 'W7', value: 10 }, { label: 'W8', value: 28 },
              ]}
              color="#f59e0b"
            />
          </CardBody>
        </Card>
      </div>

      {/* Review Queue */}
      <Card>
        <CardHeader
          title="Flagged Incidents Review Queue"
          subtitle="Events requiring examiner validation and verification"
          icon={<AlertCircle size={18} />}
        />
        <CardBody className="p-0">
          <div className="px-5 pt-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar value={search} onChange={setSearch} placeholder="Search by candidate or signal..." className="flex-1" />
              <Select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Risk Levels' },
                  { value: 'low', label: 'Low Risk' },
                  { value: 'medium', label: 'Medium Risk' },
                  { value: 'high', label: 'High Risk' },
                ]}
                className="w-40"
              />
            </div>
          </div>

          <div className="mt-3 divide-y divide-accent-100 dark:divide-accent-800">
            {filtered.map((flag) => (
              <div
                key={flag.id}
                className="flex items-start gap-3 px-5 py-4 hover:bg-accent-50/60 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
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
                    <span className="text-xs font-bold text-accent-900 dark:text-white">{flag.participant}</span>
                    <span className="text-accent-300 dark:text-accent-700">·</span>
                    <span className="text-xs text-accent-500 dark:text-accent-400">{flag.assessment}</span>
                    <RiskBadge level={flag.riskLevel} />
                    <Badge variant="neutral">{flag.type || 'Telemetry'}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-accent-800 dark:text-accent-200 mb-0.5">{flag.title}</p>
                  <p className="text-[11px] text-accent-500 dark:text-accent-400 leading-relaxed">{flag.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-accent-400 font-mono">
                    <Clock size={12} /> {flag.timestamp}
                  </div>
                  <ChevronRight size={16} className="text-accent-400" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default IntegrityCenter;
