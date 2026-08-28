import React, { useState } from 'react';
import {
  ShieldCheck, AlertCircle, Download, ChevronRight,
  Activity, Eye, Clock,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, RiskBadge, Button,
  SearchBar, PageHeader, Select, DonutChart, BarChart,
} from '@/components/ui';
import { integrityFlags } from '@/data';

export function IntegrityCenter({ onNavigate }) {
  const [search, setSearch] = useState('');
  const filtered = integrityFlags.filter((f) =>
    f.participant.toLowerCase().includes(search.toLowerCase()) ||
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proctoring & Integrity Center"
        subtitle="Telemetry signals, automated anti-cheat detections, and invigilator review queues."
        icon={<ShieldCheck size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Integrity' }]}
        actions={
          <Button variant="outline" size="sm" icon={<Download size={15} />}>
            Export Audit Logs
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Sessions Analyzed" value="182" icon={<Activity size={20} />} color="primary" />
        <MetricCard label="Clean / Low Risk" value="149" icon={<ShieldCheck size={20} />} color="success" />
        <MetricCard label="Medium Flags" value="26" icon={<AlertCircle size={20} />} color="warning" />
        <MetricCard label="High Risk Incidents" value="7" icon={<AlertCircle size={20} />} color="danger" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Risk Profile Breakdown" icon={<ShieldCheck size={18} />} />
          <CardBody>
            <DonutChart
              centerValue="182"
              centerLabel="Sessions"
              data={[
                { label: 'Low Risk', value: 149, color: '#22c55e' },
                { label: 'Medium Risk', value: 26, color: '#f59e0b' },
                { label: 'High Risk', value: 7, color: '#ef4444' },
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
                    <p className="text-xs font-bold text-accent-900 dark:text-white">{flag.title}</p>
                    <RiskBadge level={flag.riskLevel} />
                    <Badge variant="neutral">Confidence: {flag.confidence}</Badge>
                  </div>
                  <p className="text-[11px] text-accent-500 dark:text-accent-400 mb-1">
                    {flag.participant} · {flag.session}
                  </p>
                  <p className="text-xs text-accent-700 dark:text-accent-300 line-clamp-1">{flag.context}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-accent-400 font-mono">
                    <span className="flex items-center gap-1"><Clock size={11} /> {flag.timestamp}</span>
                    <span className="flex items-center gap-1"><Activity size={11} /> {flag.source}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Eye size={13} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('org-integrity-evidence');
                    }}
                  >
                    Evidence
                  </Button>
                  <ChevronRight size={15} className="text-accent-400" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Governance Disclaimer */}
      <div className="p-4 bg-accent-50 dark:bg-accent-900/40 rounded-2xl border border-accent-200 dark:border-accent-800">
        <p className="text-xs text-accent-600 dark:text-accent-400 italic leading-relaxed">
          "Proctoring anomaly events serve as objective audit trails. Automated flags do not independently penalize examinees without human faculty review and verification."
        </p>
      </div>
    </div>
  );
}

export default IntegrityCenter;
