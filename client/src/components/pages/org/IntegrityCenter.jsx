import {
  ShieldCheck, AlertCircle, Download, ChevronRight,
  Activity, Eye, Clock,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, RiskBadge, Button,
  SearchBar, PageHeader, Select, DonutChart, BarChart,
} from '@/components/ui';
import { useState } from 'react';
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
        title="Assessment Integrity"
        subtitle="Evidence-based session review and integrity monitoring"
        icon={<ShieldCheck size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Integrity' }]}
        actions={<Button variant="outline" size="sm" icon={<Download size={16} />}>Export Report</Button>}
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Sessions Analyzed" value="182" icon={<Activity size={22} />} color="primary" />
        <MetricCard label="Low Risk" value="149" icon={<ShieldCheck size={22} />} color="success" />
        <MetricCard label="Medium Risk" value="26" icon={<AlertCircle size={22} />} color="warning" />
        <MetricCard label="High Risk" value="7" icon={<AlertCircle size={22} />} color="danger" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Risk Distribution" icon={<ShieldCheck size={18} />} />
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
          <CardHeader title="Integrity Events" subtitle="Signals detected over time" icon={<Activity size={18} />} />
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

      {/* Review queue */}
      <Card>
        <CardHeader
          title="Review Queue"
          subtitle="Integrity signals requiring attention"
          icon={<AlertCircle size={18} />}
        />
        <CardBody className="p-0">
          <div className="px-5 pt-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar value={search} onChange={setSearch} placeholder="Search signals..." className="flex-1" />
              <Select options={[
                { value: 'all', label: 'All Risk Levels' },
                { value: 'low', label: 'Low Risk' },
                { value: 'medium', label: 'Medium Risk' },
                { value: 'high', label: 'High Risk' },
              ]} className="w-40" />
            </div>
          </div>
          <div className="mt-3 divide-y divide-accent-50">
            {filtered.map((flag) => (
              <div key={flag.id} className="flex items-start gap-3 px-5 py-4 hover:bg-accent-50/50 transition-colors cursor-pointer" onClick={() => onNavigate('org-integrity-evidence')}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${flag.riskLevel === 'High' ? 'bg-danger-50 text-danger-600' : flag.riskLevel === 'Medium' ? 'bg-warning-50 text-warning-600' : 'bg-success-50 text-success-600'}`}>
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-accent-800">{flag.title}</p>
                    <RiskBadge level={flag.riskLevel} />
                    <Badge variant="neutral">Confidence: {flag.confidence}</Badge>
                  </div>
                  <p className="text-xs text-accent-500 mb-1">{flag.participant} · {flag.session}</p>
                  <p className="text-sm text-accent-600 line-clamp-1">{flag.context}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-accent-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {flag.timestamp}</span>
                    <span className="flex items-center gap-1"><Activity size={12} /> {flag.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); onNavigate('org-integrity-evidence'); }}>Review</Button>
                  <ChevronRight size={16} className="text-accent-400" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 bg-accent-50 rounded-xl border border-accent-200">
        <p className="text-sm text-accent-600 italic">
          "Integrity signals are indicators for review and do not independently determine misconduct. All signals should be evaluated in context by authorized reviewers."
        </p>
      </div>
    </div>
  );
}
