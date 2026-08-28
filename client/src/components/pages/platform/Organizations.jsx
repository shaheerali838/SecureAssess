import React, { useState } from 'react';
import {
  Building2, Plus, Filter, Download, MoreHorizontal,
  ChevronRight, X, Mail, Globe, MapPin, Calendar, Users,
  FileText, MonitorPlay, Shield
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
        title="Tenant Organizations"
        subtitle="Manage subscribed B2B customers, tier allocations, and workspace provisioning."
        icon={<Building2 size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Platform', onClick: () => onNavigate('platform-dashboard') }, { label: 'Organizations' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
              Export Tenants
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => onNavigate('platform-onboarding')}
            >
              Provision Organization
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search organizations..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            options={[
              { value: 'all', label: 'All Industries' },
              { value: 'education', label: 'Higher Education' },
              { value: 'aviation', label: 'Aviation & Defense' },
              { value: 'technology', label: 'Technology / Hiring' },
              { value: 'healthcare', label: 'Healthcare Boards' },
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
            className="w-36"
          />
          <Button variant="outline" size="md" icon={<Filter size={15} />} className="shrink-0">
            More Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Organization</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">License Plan</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden xl:table-cell">Examinees</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden xl:table-cell">Assessments</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Sessions</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Quota</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden xl:table-cell">Created</th>
                  <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(org)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={org.name} color={org.brandColor} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{org.name}</p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">{org.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell"><Badge variant="neutral">{org.industry}</Badge></td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <Badge variant={org.plan === 'Enterprise' ? 'primary' : org.plan === 'Professional' ? 'secondary' : 'neutral'}>
                        {org.plan}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 hidden xl:table-cell text-xs text-accent-700 dark:text-accent-300 font-mono">{org.users.toLocaleString()}</td>
                    <td className="px-3 py-3.5 hidden xl:table-cell text-xs text-accent-700 dark:text-accent-300 font-mono">{org.assessments.toLocaleString()}</td>
                    <td className="px-3 py-3.5 hidden lg:table-cell text-xs text-accent-700 dark:text-accent-300 font-mono">{org.sessions.toLocaleString()}</td>
                    <td className="px-3 py-3.5">
                      <div className="w-20">
                        <ProgressBar value={org.usage} size="sm" color={org.usage > 70 ? 'danger' : org.usage > 50 ? 'warning' : 'success'} />
                      </div>
                    </td>
                    <td className="px-3 py-3.5"><StatusBadge status={org.status} /></td>
                    <td className="px-3 py-3.5 hidden xl:table-cell text-[11px] text-accent-400 font-mono">
                      {new Date(org.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

      {/* Organization detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-accent-950/60 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-accent-900 border-l border-accent-200 dark:border-accent-800 shadow-strong z-50 overflow-y-auto animate-slide-in-right text-accent-900 dark:text-white">
            <div className="sticky top-0 bg-white dark:bg-accent-900 border-b border-accent-200 dark:border-accent-800 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-sm font-bold text-accent-900 dark:text-white">Tenant Workspace Overview</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-accent-400 hover:text-accent-700 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 rounded-lg p-1.5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <Avatar name={selected.name} color={selected.brandColor} size="lg" />
                <div>
                  <h3 className="text-base font-bold text-accent-900 dark:text-white">{selected.name}</h3>
                  <p className="text-xs text-accent-500 dark:text-accent-400">{selected.industry} · {selected.country}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant="primary">{selected.plan}</Badge>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-accent-600 dark:text-accent-300">
                <div className="flex items-center gap-2"><Globe size={14} className="text-accent-400" /> {selected.website}</div>
                <div className="flex items-center gap-2"><Mail size={14} className="text-accent-400" /> {selected.contactEmail}</div>
                <div className="flex items-center gap-2"><Users size={14} className="text-accent-400" /> {selected.contactName}</div>
              </div>

              <div className="pt-4 border-t border-accent-100 dark:border-accent-800 flex gap-2">
                <Button variant="primary" fullWidth size="sm">Enter Tenant Portal</Button>
                <Button variant="outline" fullWidth size="sm" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Organizations;
