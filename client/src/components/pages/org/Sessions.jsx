import React, { useState } from 'react';
import {
  MonitorPlay, Download, ChevronRight, Video, FileText,
  Clock, Calendar
} from 'lucide-react';
import {
  Card, CardBody, StatusBadge, RiskBadge, Button, Avatar,
  SearchBar, PageHeader, Select,
} from '@/components/ui';
import { sessions } from '@/data';

export function Sessions({ onNavigate }) {
  const [search, setSearch] = useState('');
  const filtered = sessions.filter((s) =>
    s.participant.toLowerCase().includes(search.toLowerCase()) ||
    s.assessment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examination Sessions"
        subtitle="Live and historical candidate examination runs, audio/video streams, and logs."
        icon={<MonitorPlay size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Sessions' }]}
        actions={
          <Button variant="outline" size="sm" icon={<Download size={15} />}>
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search sessions..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'review', label: 'Review Required' },
              { value: 'flagged', label: 'Flagged' },
            ]}
            className="w-36"
          />
          <Select
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
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Candidate</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Assessment</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Score</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Integrity</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Duration</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Date</th>
                  <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    onClick={() => onNavigate('org-session-review')}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.participant} color="#475569" size="sm" />
                        <span className="text-xs font-semibold text-accent-900 dark:text-white truncate">{s.participant}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {s.interviewScore !== null ? <Video size={13} className="text-info-500 shrink-0" /> : <FileText size={13} className="text-primary-500 shrink-0" />}
                        <span className="text-xs text-accent-700 dark:text-accent-300 truncate">{s.assessment}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-3 py-3.5 hidden sm:table-cell font-mono">
                      <span className="text-xs font-bold text-accent-900 dark:text-white">{s.overallScore}%</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={s.integrityRisk} />
                        <span className="text-[11px] text-accent-400 font-mono hidden xl:inline">{s.integrityScore}/100</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-xs text-accent-500 dark:text-accent-400"><Clock size={11} /> {s.duration}</span>
                    </td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-xs text-accent-500 dark:text-accent-400"><Calendar size={11} /> {s.date}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight size={15} className="text-accent-400 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Sessions;
