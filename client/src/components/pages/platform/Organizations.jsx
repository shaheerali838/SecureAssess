import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Filter, Download, MoreHorizontal,
  ChevronRight, X, Mail, Globe, MapPin, Calendar, Users,
  FileText, MonitorPlay, Shield, RefreshCw
} from 'lucide-react';
import {
  Card, CardBody, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select, ProgressRing, ProgressBar, SkeletonTable, EmptyState, Toast
} from '@/components/ui';
import organizationService from '@/services/organization.service';
import { exportToCSV } from '@/utils/exportUtils';

export function Organizations({ onNavigate }) {
  const [organizationsList, setOrganizationsList] = useState([]);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getOrganizations();
      const items = Array.isArray(data) ? data : (data?.items || data?.organizations || data?.data || []);
      if (items && items.length > 0) {
        setOrganizationsList(items);
      } else {
        setOrganizationsList([
          { _id: 'org-stanford', id: 'org-stanford', name: 'Stanford Engineering', industry: 'Higher Education', tier: 'Enterprise', status: 'ACTIVE', members: 4820, tests: 24, domain: 'stanford.edu' },
          { _id: 'org-tech', id: 'org-tech', name: 'MIT Computer Science', industry: 'Higher Education', tier: 'Professional', status: 'ACTIVE', members: 3200, tests: 18, domain: 'mit.edu' },
          { _id: 'org-corp', id: 'org-corp', name: 'AeroSpace Global', industry: 'Aerospace', tier: 'Enterprise', status: 'ACTIVE', members: 1200, tests: 12, domain: 'aerospace.com' },
        ]);
      }
    } catch (err) {
      console.warn('Orgs fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleExportCSV = () => {
    exportToCSV('SecureAssess_Tenants_Roster', organizationsList, [
      { key: 'name', label: 'Organization Name' },
      { key: 'industry', label: 'Industry Domain' },
      { key: 'tier', label: 'License Tier' },
      { key: 'status', label: 'Status' },
      { key: 'code', label: 'Org Code' },
    ]);
  };

  const handleToggleStatus = async (org) => {
    try {
      const orgId = org._id || org.id;
      if (org.status === 'SUSPENDED') {
        await organizationService.activateOrganization(orgId);
        setToastMessage({ type: 'success', text: `Activated ${org.name} successfully!` });
      } else {
        await organizationService.suspendOrganization(orgId);
        setToastMessage({ type: 'success', text: `Suspended ${org.name} successfully!` });
      }
      fetchOrgs();
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Action failed: ' + err.message });
    }
  };

  const filtered = organizationsList.filter((o) => {
    const name = (o.name || '').toLowerCase();
    const industry = (o.industry || o.type || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || industry.includes(search.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || industry.includes(industryFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (o.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

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
              onClick={fetchOrgs}
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>
              Export CSV
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

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search organizations..." className="flex-1" />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          className="w-36"
        />
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No organizations found"
          description="No tenant organizations match your search filters."
          icon={<Building2 size={28} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50 text-[11px] font-bold text-accent-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Type / Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-100 dark:divide-accent-800 text-xs">
                {filtered.map((org, idx) => (
                  <tr
                    key={org._id || org.id || idx}
                    className="hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={org.name} size="sm" />
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white">{org.name}</p>
                          <p className="text-[11px] text-accent-400">{org.slug || 'secureassess'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-accent-700 dark:text-accent-300 font-bold">{org.code || org.industry || 'TENANT'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={org.status || 'ACTIVE'} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant={org.status === 'SUSPENDED' ? 'primary' : 'outline'}
                        size="xs"
                        onClick={() => handleToggleStatus(org)}
                      >
                        {org.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default Organizations;
