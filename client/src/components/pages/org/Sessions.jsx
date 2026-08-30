import React, { useState, useEffect } from 'react';
import {
  MonitorPlay, Download, ChevronRight, Video, FileText,
  Clock, Calendar, RefreshCw
} from 'lucide-react';
import {
  Card, CardBody, StatusBadge, RiskBadge, Button, Avatar,
  SearchBar, PageHeader, Select, SkeletonTable, EmptyState
} from '@/components/ui';
import { sessions } from '@/data';
import { exportToCSV } from '@/utils/exportUtils';

export function Sessions({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleExportCSV = () => {
    exportToCSV('SecureAssess_Sessions_Log', sessions, [
      { key: 'participant', label: 'Participant' },
      { key: 'assessment', label: 'Assessment' },
      { key: 'status', label: 'Session Status' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'duration', label: 'Duration' },
      { key: 'date', label: 'Date' },
    ]);
  };

  const filtered = sessions.filter((s) => {
    const participant = (s.participant || '').toLowerCase();
    const assessment = (s.assessment || '').toLowerCase();
    const matchesSearch = participant.includes(search.toLowerCase()) || assessment.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (s.status || '').toLowerCase().includes(statusFilter.toLowerCase());
    const matchesRisk = riskFilter === 'all' || (s.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examination Sessions"
        subtitle="Live and historical candidate examination runs, audio/video streams, and logs."
        icon={<MonitorPlay size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Sessions' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 300);
              }}
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={15} />} onClick={handleExportCSV}>
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search sessions..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'review', label: 'Review Required' },
              { value: 'flagged', label: 'Flagged' },
            ]}
            className="w-36"
          />
          <Select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Risk' },
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MonitorPlay size={28} />}
            title="No sessions found"
            description="Active candidate assessment sessions will appear here in real-time."
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Candidate</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Assessment</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Risk Level</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Duration</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden xl:table-cell">Timestamp</th>
                    <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => onNavigate('org-session-review')}
                      className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.participant} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{s.participant}</p>
                            <p className="text-[11px] text-accent-500 dark:text-accent-400 font-mono truncate">ID: {s.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell text-xs text-accent-700 dark:text-accent-300">
                        {s.assessment}
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell">
                        <RiskBadge level={s.riskLevel} />
                      </td>
                      <td className="px-3 py-3.5 hidden lg:table-cell text-xs text-accent-500 dark:text-accent-400 font-mono">
                        {typeof s.duration === 'object' && s.duration !== null ? `${s.duration.value || 0} ${s.duration.unit || 'm'}` : (s.duration || '—')}
                      </td>
                      <td className="px-3 py-3.5 hidden xl:table-cell text-xs text-accent-500 dark:text-accent-400 font-mono">
                        {s.date}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default Sessions;
