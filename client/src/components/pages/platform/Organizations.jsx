import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Filter, Download, MoreHorizontal,
  ChevronRight, X, Mail, Globe, MapPin, Calendar, Users,
  FileText, MonitorPlay, Shield, RefreshCw
} from 'lucide-react';
import {
  Card, CardBody, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select, ProgressRing, ProgressBar, SkeletonTable, EmptyState
} from '@/components/ui';
import { organizations } from '@/data';
import { exportToCSV } from '@/utils/exportUtils';

export function Organizations({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleExportCSV = () => {
    exportToCSV('SecureAssess_Tenants_Roster', organizations, [
      { key: 'name', label: 'Organization Name' },
      { key: 'industry', label: 'Industry Domain' },
      { key: 'tier', label: 'License Tier' },
      { key: 'status', label: 'Status' },
      { key: 'members', label: 'Active Users' },
      { key: 'tests', label: 'Assessments' },
      { key: 'domain', label: 'Domain Website' },
    ]);
  };

  const filtered = organizations.filter((o) => {
    const name = (o.name || '').toLowerCase();
    const industry = (o.industry || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || industry.includes(search.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || industry.includes(industryFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (o.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Organizations"
        subtitle="Manage subscribed B2B customers, tier allocations, and workspace provisioning."
        icon={<Building2 size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Platform', onClick: () => onNavigate('platform-dashboard') }, { label: 'Organizations' }]}
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
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'trial', label: 'In Trial' },
              { value: 'suspended', label: 'Suspended' },
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
            icon={<Building2 size={28} />}
            title="No organizations found"
            description="Provision a new tenant organization to grant workspace access."
            action={
              <Button variant="primary" icon={<Plus size={15} />} onClick={() => onNavigate('platform-onboarding')}>
                Provision Organization
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Organization</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Industry</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">License Tier</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Users</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Assessments</th>
                    <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org) => (
                    <tr
                      key={org.id}
                      onClick={() => setSelected(org)}
                      className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-soft">
                            {org.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-accent-900 dark:text-white">{org.name}</p>
                            <p className="text-[11px] text-accent-500 dark:text-accent-400">{org.domain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell text-xs text-accent-600 dark:text-accent-300">
                        {org.industry}
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell">
                        <Badge variant={org.tier === 'Enterprise' ? 'primary' : 'neutral'}>{org.tier}</Badge>
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="px-3 py-3.5 hidden lg:table-cell text-xs font-mono text-accent-700 dark:text-accent-300">
                        {org.members}
                      </td>
                      <td className="px-3 py-3.5 hidden lg:table-cell text-xs font-mono text-accent-700 dark:text-accent-300">
                        {org.tests}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>
                          Details
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

      {/* Slide-over Drawer for Organization Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-accent-950/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-accent-900 h-full shadow-strong border-l border-accent-200 dark:border-accent-800 p-6 overflow-y-auto z-10 animate-slide-in-right space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-base shadow-soft">
                  {selected.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-accent-900 dark:text-white">{selected.name}</h3>
                  <p className="text-xs text-accent-500 dark:text-accent-400">{selected.domain}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-accent-400 hover:text-accent-700 dark:hover:text-white rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-accent-100 dark:border-accent-800">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-accent-50/60 dark:bg-accent-800/40 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-accent-400">License Tier</p>
                  <p className="text-xs font-bold text-accent-900 dark:text-white mt-0.5">{selected.tier}</p>
                </div>
                <div className="p-3 bg-accent-50/60 dark:bg-accent-800/40 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-accent-400">Status</p>
                  <p className="text-xs font-bold text-accent-900 dark:text-white mt-0.5">{selected.status}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">Quota Usage</p>
                <ProgressBar value={selected.members} max={2500} color="primary" size="sm" showLabel />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organizations;
