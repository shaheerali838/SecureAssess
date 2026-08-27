import {
  UsersRound, Plus, MoreHorizontal, Shield,
} from 'lucide-react';
import {
  Card, CardBody, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select,
} from '@/components/ui';
import { platformUsers } from '@/data';
import { useState } from 'react';






export function OrgUsers({ onNavigate }) {
  const [search, setSearch] = useState('');
  const filtered = platformUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage staff and team members in your organization"
        icon={<UsersRound size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Users' }]}
        actions={<Button variant="primary" size="sm" icon={<Plus size={16} />}>Invite User</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users..." className="flex-1" />
        <Select options={[
          { value: 'all', label: 'All Roles' },
          { value: 'admin', label: 'Organization Admin' },
          { value: 'examiner', label: 'Examiner' },
          { value: 'teacher', label: 'Teacher' },
        ]} className="w-40" />
        <Select options={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'invited', label: 'Invited' },
        ]} className="w-36" />
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 bg-accent-50/50">
                  <th className="text-left text-xs font-semibold text-accent-600 px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden sm:table-cell">Role</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden md:table-cell">Last Active</th>
                  <th className="text-right text-xs font-semibold text-accent-600 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-accent-50 hover:bg-accent-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.avatarColor} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-accent-800">{u.name}</p>
                          <p className="text-xs text-accent-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <Badge variant={u.role === 'Organization Admin' ? 'primary' : 'neutral'} icon={<Shield size={12} />}>{u.role}</Badge>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-3 py-3 hidden md:table-cell text-sm text-accent-500">{u.lastActive}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="p-1.5 text-accent-400 hover:text-accent-700 hover:bg-accent-100 rounded transition-colors"><MoreHorizontal size={16} /></button>
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
