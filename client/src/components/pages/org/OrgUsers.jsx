import React, { useState } from 'react';
import {
  UsersRound, Plus, MoreHorizontal, Shield
} from 'lucide-react';
import {
  Card, CardBody, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select,
} from '@/components/ui';
import { platformUsers } from '@/data';

export function OrgUsers({ onNavigate }) {
  const [search, setSearch] = useState('');
  const filtered = platformUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Faculty & Staff"
        subtitle="Manage faculty examiners, invigilators, and organization administrator access."
        icon={<UsersRound size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Staff' }]}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />}>
            Invite Staff Member
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search staff members..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'admin', label: 'Organization Admin' },
              { value: 'examiner', label: 'Examiner' },
              { value: 'proctor', label: 'Proctor' },
            ]}
            className="w-40"
          />
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'invited', label: 'Invited' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Member</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Role</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Last Active</th>
                  <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.avatarColor} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden sm:table-cell">
                      <Badge variant={u.role === 'Organization Admin' ? 'primary' : 'neutral'} icon={<Shield size={12} />}>{u.role}</Badge>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell text-xs text-accent-500 dark:text-accent-400 font-mono">
                      {u.lastActive}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="p-1.5 text-accent-400 hover:text-accent-700 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 rounded-lg transition-colors cursor-pointer">
                        <MoreHorizontal size={15} />
                      </button>
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

export default OrgUsers;
