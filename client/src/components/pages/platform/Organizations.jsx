import { useState } from 'react';
import {
  Building2, Plus, Filter, Download, MoreHorizontal,
  ChevronRight, X, Mail, Globe, MapPin, Calendar, Users,
  FileText, MonitorPlay, Shield,
} from 'lucide-react';
import {
  Card, CardBody, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select, ProgressRing, ProgressBar,
} from '@/components/ui';
import { organizations } from '@/data';






export function Organizations({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        subtitle="Manage all customer organizations on the platform"
        icon={<Building2 size={22} />}
        breadcrumbs={[{ label: 'Platform', onClick: () => onNavigate('platform-dashboard') }, { label: 'Organizations' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Download size={16} />}>Export</Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => onNavigate('platform-onboarding')}>Add Organization</Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search organizations..." className="flex-1" />
        <div className="flex gap-2">
          <Select
            options={[
              { value: 'all', label: 'All Industries' },
              { value: 'education', label: 'Education' },
              { value: 'aviation', label: 'Aviation' },
              { value: 'technology', label: 'Technology' },
              { value: 'healthcare', label: 'Healthcare' },
              { value: 'finance', label: 'Finance' },
            ]}
            className="w-40"
          />
          <Select
            options={[
              { value: 'all', label: 'All Plans' },
              { value: 'starter', label: 'Starter' },
              { value: 'professional', label: 'Professional' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            className="w-40"
          />
          <Button variant="outline" size="md" icon={<Filter size={16} />} className="shrink-0">More</Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 bg-accent-50/50">
                  <th className="text-left text-xs font-semibold text-accent-600 px-5 py-3">Organization</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden md:table-cell">Industry</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Plan</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden xl:table-cell">Users</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden xl:table-cell">Assessments</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Sessions</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Usage</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden xl:table-cell">Created</th>
                  <th className="text-right text-xs font-semibold text-accent-600 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b border-accent-50 hover:bg-accent-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(org)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={org.name} color={org.brandColor} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-accent-800">{org.name}</p>
                          <p className="text-xs text-accent-500">{org.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell"><Badge variant="neutral">{org.industry}</Badge></td>
                    <td className="px-3 py-3 hidden lg:table-cell"><Badge variant={org.plan === 'Enterprise' ? 'primary' : org.plan === 'Professional' ? 'secondary' : 'neutral'}>{org.plan}</Badge></td>
                    <td className="px-3 py-3 hidden xl:table-cell text-sm text-accent-700">{org.users.toLocaleString()}</td>
                    <td className="px-3 py-3 hidden xl:table-cell text-sm text-accent-700">{org.assessments.toLocaleString()}</td>
                    <td className="px-3 py-3 hidden lg:table-cell text-sm text-accent-700">{org.sessions.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <div className="w-20">
                        <ProgressBar value={org.usage} size="sm" color={org.usage > 70 ? 'danger' : org.usage > 50 ? 'warning' : 'success'} />
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={org.status} /></td>
                    <td className="px-3 py-3 hidden xl:table-cell text-sm text-accent-500">{new Date(org.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight size={16} className="text-accent-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Organization detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-accent-950/40 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-strong z-50 overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-accent-200 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-accent-900">Organization Overview</h2>
              <button onClick={() => setSelected(null)} className="text-accent-400 hover:text-accent-700 hover:bg-accent-100 rounded-lg p-1.5 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Org header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: selected.brandColor }}>
                  {selected.logoText}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-accent-900">{selected.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selected.status} />
                    <Badge variant={selected.plan === 'Enterprise' ? 'primary' : 'secondary'}>{selected.plan}</Badge>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-accent-600"><MapPin size={16} className="text-accent-400" /> {selected.country}</div>
                <div className="flex items-center gap-2.5 text-sm text-accent-600"><Globe size={16} className="text-accent-400" /> {selected.website}</div>
                <div className="flex items-center gap-2.5 text-sm text-accent-600"><Users size={16} className="text-accent-400" /> {selected.contactName}</div>
                <div className="flex items-center gap-2.5 text-sm text-accent-600"><Mail size={16} className="text-accent-400" /> {selected.contactEmail}</div>
                <div className="flex items-center gap-2.5 text-sm text-accent-600"><Calendar size={16} className="text-accent-400" /> Created {new Date(selected.createdAt).toLocaleDateString()}</div>
              </div>

              {/* Usage stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-accent-50 rounded-lg">
                  <Users size={18} className="text-primary-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-accent-900">{selected.users.toLocaleString()}</p>
                  <p className="text-xs text-accent-500">Users</p>
                </div>
                <div className="text-center p-3 bg-accent-50 rounded-lg">
                  <FileText size={18} className="text-secondary-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-accent-900">{selected.assessments.toLocaleString()}</p>
                  <p className="text-xs text-accent-500">Assessments</p>
                </div>
                <div className="text-center p-3 bg-accent-50 rounded-lg">
                  <MonitorPlay size={18} className="text-info-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-accent-900">{selected.sessions.toLocaleString()}</p>
                  <p className="text-xs text-accent-500">Sessions</p>
                </div>
              </div>

              {/* Usage ring */}
              <div className="flex flex-col items-center p-4 bg-accent-50 rounded-xl">
                <ProgressRing value={selected.usage} label={`${selected.usage}%`} sublabel="Plan Usage" color={selected.brandColor} size={100} />
                <p className="text-sm text-accent-600 mt-2">Platform resource utilization</p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button variant="primary" fullWidth icon={<Shield size={16} />} onClick={() => { onNavigate('org-dashboard'); }}>
                  Open Workspace
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" icon={<Mail size={14} />}>Contact</Button>
                  <Button variant="outline" size="sm" icon={<MoreHorizontal size={14} />}>Manage</Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
