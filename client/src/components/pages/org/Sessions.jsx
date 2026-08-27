import { useState } from 'react';
import {
  MonitorPlay, Download, ChevronRight, Video, FileText,
  Clock, Calendar,
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
        title="Sessions"
        subtitle="All assessment and interview sessions"
        icon={<MonitorPlay size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Sessions' }]}
        actions={<Button variant="outline" size="sm" icon={<Download size={16} />}>Export</Button>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search sessions..." className="flex-1" />
        <div className="flex gap-2">
          <Select options={[
            { value: 'all', label: 'All Status' },
            { value: 'completed', label: 'Completed' },
            { value: 'review', label: 'Review Required' },
            { value: 'flagged', label: 'Flagged' },
          ]} className="w-36" />
          <Select options={[
            { value: 'all', label: 'All Risk' },
            { value: 'low', label: 'Low Risk' },
            { value: 'medium', label: 'Medium Risk' },
            { value: 'high', label: 'High Risk' },
          ]} className="w-36" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 bg-accent-50/50">
                  <th className="text-left text-xs font-semibold text-accent-600 px-5 py-3">Participant</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden md:table-cell">Assessment</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden sm:table-cell">Score</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Integrity</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Duration</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Date</th>
                  <th className="text-right text-xs font-semibold text-accent-600 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-accent-50 hover:bg-accent-50/50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('org-session-review')}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.participant} color="#475569" size="sm" />
                        <span className="text-sm font-medium text-accent-800">{s.participant}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {s.interviewScore !== null ? <Video size={14} className="text-info-500" /> : <FileText size={14} className="text-primary-500" />}
                        <span className="text-sm text-accent-600">{s.assessment}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-3 py-3 hidden sm:table-cell"><span className="text-sm font-bold text-accent-900">{s.overallScore}%</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={s.integrityRisk} />
                        <span className="text-xs text-accent-400 hidden xl:inline">{s.integrityScore}/100</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-sm text-accent-500"><Clock size={12} /> {s.duration}</span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-sm text-accent-500"><Calendar size={12} /> {s.date}</span>
                    </td>
                    <td className="px-5 py-3 text-right"><ChevronRight size={16} className="text-accent-400" /></td>
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
