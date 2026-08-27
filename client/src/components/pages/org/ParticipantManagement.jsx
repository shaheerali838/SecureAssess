import { useState } from 'react';
import {
  Users, Plus, ChevronRight,
  Mail, Send, Upload,
} from 'lucide-react';
import {
  Card, CardBody, StatusBadge, RiskBadge, Button, Avatar,
  SearchBar, PageHeader, Select, EmptyState,
} from '@/components/ui';
import { participants } from '@/data';






export function ParticipantManagement({ onNavigate }) {
  const [search, setSearch] = useState('');
  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.assessment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participants"
        subtitle="Manage students, candidates, and applicants across assessments"
        icon={<Users size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Participants' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Upload size={16} />}>Import</Button>
            <Button variant="outline" size="sm" icon={<Mail size={16} />}>Invite</Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />}>Add Participant</Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search participants..." className="flex-1" />
        <div className="flex gap-2">
          <Select options={[
            { value: 'all', label: 'All Context' },
            { value: 'cs101', label: 'Computer Science 101' },
            { value: 'pilot', label: 'Pilot Training' },
          ]} className="w-40" />
          <Select options={[
            { value: 'all', label: 'All Status' },
            { value: 'completed', label: 'Completed' },
            { value: 'progress', label: 'In Progress' },
            { value: 'invited', label: 'Invited' },
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
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="No participants yet"
            description="Invite your first participant to begin."
            action={<Button variant="primary" icon={<Send size={16} />}>Invite Participant</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent-100 bg-accent-50/50">
                    <th className="text-left text-xs font-semibold text-accent-600 px-5 py-3">Participant</th>
                    <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden md:table-cell">Context</th>
                    <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Assessment</th>
                    <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden sm:table-cell">Score</th>
                    <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Integrity</th>
                    <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden xl:table-cell">Stage</th>
                    <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden xl:table-cell">Last Activity</th>
                    <th className="text-right text-xs font-semibold text-accent-600 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-accent-50 hover:bg-accent-50/50 transition-colors cursor-pointer"
                      onClick={() => onNavigate('org-participant-profile')}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} color={p.avatarColor} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-accent-800">{p.name}</p>
                            <p className="text-xs text-accent-500">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell"><span className="text-sm text-accent-600">{p.context}</span></td>
                      <td className="px-3 py-3 hidden lg:table-cell"><span className="text-sm text-accent-600">{p.assessment}</span></td>
                      <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        {p.score !== null ? <span className="text-sm font-bold text-accent-900">{p.score}%</span> : <span className="text-xs text-accent-400">—</span>}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        {p.integrityRisk ? <RiskBadge level={p.integrityRisk} /> : <span className="text-xs text-accent-400">—</span>}
                      </td>
                      <td className="px-3 py-3 hidden xl:table-cell"><span className="text-xs text-accent-500">{p.stage}</span></td>
                      <td className="px-3 py-3 hidden xl:table-cell"><span className="text-xs text-accent-500">{p.lastActivity}</span></td>
                      <td className="px-5 py-3 text-right"><ChevronRight size={16} className="text-accent-400" /></td>
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
