import React, { useState } from 'react';
import {
  Users, Plus, ChevronRight,
  Mail, Send, Upload
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
        title="Candidate Roster"
        subtitle="Manage enrolled candidates, review stage statuses, and invite examinee cohorts."
        icon={<Users size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Candidates' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Upload size={15} />}>
              Import CSV
            </Button>
            <Button variant="outline" size="sm" icon={<Mail size={15} />}>
              Batch Invite
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />}>
              Add Candidate
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or assessment..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            options={[
              { value: 'all', label: 'All Cohorts' },
              { value: 'cs101', label: 'Computer Science 101' },
              { value: 'pilot', label: 'Technical Hiring 2026' },
            ]}
            className="w-40"
          />
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'progress', label: 'In Progress' },
              { value: 'invited', label: 'Invited' },
            ]}
            className="w-36"
          />
          <Select
            options={[
              { value: 'all', label: 'Integrity Level' },
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Candidates Table */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="No candidates found"
            description="Invite candidates or import a roster to schedule assessments."
            action={<Button variant="primary" icon={<Send size={15} />}>Invite Candidates</Button>}
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
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Cohort / Context</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Assessment</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Score</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Integrity</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden xl:table-cell">Stage</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden xl:table-cell">Activity</th>
                    <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                      onClick={() => onNavigate('org-participant-profile')}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} color={p.avatarColor} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{p.name}</p>
                            <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-accent-700 dark:text-accent-300">{p.context}</span>
                      </td>
                      <td className="px-3 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-accent-700 dark:text-accent-300 font-medium">{p.assessment}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell font-mono">
                        {p.score !== null ? (
                          <span className="text-xs font-bold text-accent-900 dark:text-white">{p.score}%</span>
                        ) : (
                          <span className="text-xs text-accent-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 hidden lg:table-cell">
                        {p.integrityRisk ? <RiskBadge level={p.integrityRisk} /> : <span className="text-xs text-accent-400">—</span>}
                      </td>
                      <td className="px-3 py-3.5 hidden xl:table-cell">
                        <span className="text-xs text-accent-500 dark:text-accent-400">{p.stage}</span>
                      </td>
                      <td className="px-3 py-3.5 hidden xl:table-cell font-mono text-[11px] text-accent-400">
                        {p.lastActivity}
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
      )}
    </div>
  );
}

export default ParticipantManagement;
