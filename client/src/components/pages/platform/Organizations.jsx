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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    tenantIndustry: 'academic',
    type: 'UNIVERSITY',
    email: '',
    phone: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
  });
  const [creating, setCreating] = useState(false);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.ownerEmail || !createForm.ownerFirstName) {
      setToastMessage({ type: 'error', text: 'Organization name, owner name, and owner email are required.' });
      return;
    }

    setCreating(true);
    try {
      await organizationService.createOrganization({
        name: createForm.name.trim(),
        tenantIndustry: createForm.tenantIndustry,
        type: createForm.type,
        contact: {
          email: createForm.email || createForm.ownerEmail,
          phone: createForm.phone,
        },
        owner: {
          firstName: createForm.ownerFirstName.trim(),
          lastName: createForm.ownerLastName?.trim() || '',
          email: createForm.ownerEmail.trim(),
        },
      });

      setToastMessage({ type: 'success', text: `Created organization '${createForm.name}' successfully!` });
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        tenantIndustry: 'academic',
        type: 'UNIVERSITY',
        email: '',
        phone: '',
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: '',
      });
      fetchOrgs();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to create organization' });
    } finally {
      setCreating(false);
    }
  };

  const filtered = organizationsList.filter((o) => {
    const name = (o.name || '').toLowerCase();
    const industry = (o.tenantIndustry || o.industry || o.type || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || industry.includes(search.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || (o.tenantIndustry || '').toLowerCase() === industryFilter.toLowerCase();
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
        subtitle="Manage subscribed B2B customers, industry niches, and workspace provisioning."
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
              onClick={() => setIsCreateModalOpen(true)}
            >
              Provision Tenant
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search organizations..." className="flex-1" />
        <Select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Industries' },
            { value: 'academic', label: 'Academic' },
            { value: 'corporate', label: 'Corporate' },
            { value: 'aviation', label: 'Aviation' },
            { value: 'recruitment', label: 'Recruitment' },
          ]}
          className="w-40"
        />
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
                  <th className="py-3 px-4">Industry / Niche</th>
                  <th className="py-3 px-4">Org Code</th>
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
                      <Badge
                        variant={
                          org.tenantIndustry === 'aviation'
                            ? 'warning'
                            : org.tenantIndustry === 'corporate'
                            ? 'secondary'
                            : org.tenantIndustry === 'recruitment'
                            ? 'accent'
                            : 'primary'
                        }
                        className="capitalize font-semibold text-[11px]"
                      >
                        {org.tenantIndustry || 'academic'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-accent-700 dark:text-accent-300 font-bold">{org.code || 'TENANT'}</span>
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

      {/* Provision Tenant Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-accent-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-accent-200 dark:border-accent-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-accent-100 dark:border-accent-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-accent-900 dark:text-white">Provision New Tenant</h3>
                  <p className="text-[11px] text-accent-400">Configure tenant industry and initial administrator.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-accent-400 hover:text-accent-600 dark:hover:text-accent-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oxford Institute of Technology"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Industry / Niche *
                </label>
                <select
                  value={createForm.tenantIndustry}
                  onChange={(e) => {
                    const ind = e.target.value;
                    const typeMap = { academic: 'UNIVERSITY', corporate: 'CORPORATE', aviation: 'TRAINING_INSTITUTE', recruitment: 'CORPORATE' };
                    setCreateForm({ ...createForm, tenantIndustry: ind, type: typeMap[ind] || 'CORPORATE' });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                >
                  <option value="academic">Academic & Higher Education (Students, Courses, Departments)</option>
                  <option value="corporate">Corporate & Enterprise (Employees, Modules, Divisions)</option>
                  <option value="aviation">Aviation & Defense (Trainees, Flight Modules, Units)</option>
                  <option value="recruitment">Recruitment & Hiring (Applicants, Skill Assessments, Pipelines)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                    Owner First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={createForm.ownerFirstName}
                    onChange={(e) => setCreateForm({ ...createForm, ownerFirstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                    Owner Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={createForm.ownerLastName}
                    onChange={(e) => setCreateForm({ ...createForm, ownerLastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Owner Business Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@institution.edu"
                  value={createForm.ownerEmail}
                  onChange={(e) => setCreateForm({ ...createForm, ownerEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-accent-100 dark:border-accent-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={creating}>
                  Create Tenant
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organizations;
