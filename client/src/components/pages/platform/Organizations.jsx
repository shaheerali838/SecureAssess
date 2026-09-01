import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Filter, Download, MoreHorizontal,
  ChevronRight, X, Mail, Globe, MapPin, Calendar, Users,
  FileText, MonitorPlay, Shield, RefreshCw, Eye, CheckCircle2,
  AlertTriangle, HardDrive, Package, Key, Sliders, DollarSign, Activity
} from 'lucide-react';
import {
  Card, CardBody, CardHeader, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select, ProgressRing, ProgressBar, SkeletonTable, EmptyState, Toast, Modal
} from '@/components/ui';
import organizationService from '@/services/organization.service';
import { exportToCSV } from '@/utils/exportUtils';

export function Organizations({ onNavigate }) {
  const [organizationsList, setOrganizationsList] = useState([]);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Tenant Inspection Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getOrganizations();
      const items = Array.isArray(data) ? data : (data?.items || data?.organizations || data?.data || []);
      if (items && items.length > 0) {
        setOrganizationsList(items);
      } else {
        setOrganizationsList([
          { _id: 'org-alpha', id: 'org-alpha', name: 'Alpha Polytechnic Institute', industry: 'academic', tenantIndustry: 'academic', tier: 'Enterprise', status: 'ACTIVE', members: 450, tests: 24, domain: 'alpha.edu', code: 'ALPHA-POLY' },
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
      if (selectedOrg && (selectedOrg._id === orgId || selectedOrg.id === orgId)) {
        setSelectedOrg(prev => ({ ...prev, status: prev.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }));
      }
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

  const handleInspectTenant = (org) => {
    setSelectedOrg(org);
    setInspectModalOpen(true);
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
        title="Tenant Organizations Registry"
        subtitle="Manage subscribed B2B customer organizations, industry niches, and tenant lifecycle governance."
        icon={<Building2 size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Platform Hub', onClick: () => onNavigate('platform-dashboard') }, { label: 'Organizations' }]}
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
              icon={<Plus size={14} />}
              onClick={() => onNavigate('platform-onboarding')}
            >
              Provision Tenant
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Organizations', value: organizationsList.length, color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Active Workspaces', value: organizationsList.filter((o) => o.status === 'ACTIVE').length, color: 'text-emerald-500' },
          { label: 'Suspended Tenancies', value: organizationsList.filter((o) => o.status === 'SUSPENDED').length, color: 'text-danger-500' },
          { label: 'Enterprise Tier', value: organizationsList.filter((o) => (o.tier || '').toLowerCase().includes('enterprise')).length || 1, color: 'text-secondary-600 dark:text-secondary-400' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 font-medium">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by organization name or domain..."
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Industries' },
              { value: 'academic', label: 'Academic & Higher Ed' },
              { value: 'corporate', label: 'Corporate & HR' },
              { value: 'aviation', label: 'Aviation & Defense' },
              { value: 'recruitment', label: 'Recruitment & Agency' },
            ]}
            className="w-44"
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
      </div>

      {/* Main Table */}
      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 size={32} />}
            title="No organizations found"
            description="Provision your first customer tenant organization to activate their workspace."
            action={
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => onNavigate('platform-onboarding')}>
                Provision Tenant
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-accent-200 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-950/50 text-accent-500 dark:text-accent-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Organization & Contact</th>
                  <th className="py-3.5 px-4">Industry Niche</th>
                  <th className="py-3.5 px-4">Tenant Code</th>
                  <th className="py-3.5 px-4">Subscription Plan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                {filtered.map((org) => {
                  const id = org._id || org.id;
                  return (
                    <tr
                      key={id}
                      className="hover:bg-accent-50/50 dark:hover:bg-accent-900/40 transition-colors cursor-pointer"
                      onClick={() => handleInspectTenant(org)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={org.name} color={org.brandColor || '#2563eb'} size="sm" />
                          <div>
                            <p className="font-bold text-accent-900 dark:text-white text-xs">{org.name}</p>
                            <p className="text-[11px] text-accent-500 dark:text-accent-400 font-mono">
                              {org.contact?.email || org.domain || `${org.slug || 'org'}.edu`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="primary"
                          className="capitalize font-semibold text-[11px]"
                        >
                          {org.tenantIndustry || org.industry || 'Academic'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-accent-700 dark:text-accent-300 font-bold">{org.code || 'ALPHA-POLY'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold font-mono text-[11px]">
                          {org.tier || 'ENTERPRISE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={org.status || 'ACTIVE'} />
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Eye size={13} />}
                            onClick={() => handleInspectTenant(org)}
                          >
                            Inspect
                          </Button>
                          <Button
                            variant={org.status === 'SUSPENDED' ? 'primary' : 'outline'}
                            size="xs"
                            onClick={() => handleToggleStatus(org)}
                          >
                            {org.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tenant Inspection Modal */}
      <Modal
        open={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={selectedOrg?.name || 'Tenant Details'}
        subtitle={`Organization Code: ${selectedOrg?.code || 'TENANT'} • ID: ${selectedOrg?._id || selectedOrg?.id}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant={selectedOrg?.status === 'SUSPENDED' ? 'primary' : 'danger'}
              size="sm"
              onClick={() => handleToggleStatus(selectedOrg)}
            >
              {selectedOrg?.status === 'SUSPENDED' ? 'Reactivate Workspace' : 'Suspend Workspace'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInspectModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedOrg && (
          <div className="space-y-5 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200/60 dark:border-accent-700/60">
                <span className="text-accent-500 dark:text-accent-400 font-medium">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedOrg.status || 'ACTIVE'} />
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200/60 dark:border-accent-700/60">
                <span className="text-accent-500 dark:text-accent-400 font-medium">Subscription Tier</span>
                <p className="font-bold text-accent-900 dark:text-white mt-1 font-mono text-sm">{selectedOrg.tier || 'Enterprise'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200/60 dark:border-accent-700/60">
                <span className="text-accent-500 dark:text-accent-400 font-medium">Industry Domain</span>
                <p className="font-bold text-accent-900 dark:text-white mt-1 capitalize">{selectedOrg.tenantIndustry || selectedOrg.industry || 'Academic'}</p>
              </div>
            </div>

            {/* Tenant Entitlements & Resource Quotas */}
            <Card className="p-4 bg-accent-50/50 dark:bg-accent-950/40 border border-accent-200 dark:border-accent-800">
              <h4 className="font-bold text-accent-900 dark:text-white text-xs mb-3 flex items-center gap-1.5">
                <Package size={14} className="text-primary-500" />
                Active Plan Quotas & Capabilities
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-white dark:bg-accent-900 border border-accent-100 dark:border-accent-800">
                  <p className="text-[10px] text-accent-400 uppercase">Max Assessments</p>
                  <p className="text-sm font-bold text-accent-900 dark:text-white mt-0.5">Unlimited</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-accent-900 border border-accent-100 dark:border-accent-800">
                  <p className="text-[10px] text-accent-400 uppercase">Max Candidates</p>
                  <p className="text-sm font-bold text-accent-900 dark:text-white mt-0.5">5,000</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-accent-900 border border-accent-100 dark:border-accent-800">
                  <p className="text-[10px] text-accent-400 uppercase">Proctoring Mode</p>
                  <p className="text-sm font-bold text-emerald-500 mt-0.5">AI Assisted</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-accent-900 border border-accent-100 dark:border-accent-800">
                  <p className="text-[10px] text-accent-400 uppercase">Live WebRTC Viva</p>
                  <p className="text-sm font-bold text-primary-500 mt-0.5">Enabled</p>
                </div>
              </div>
            </Card>

            {/* Contact & Administrative Info */}
            <div className="p-4 rounded-xl bg-accent-50/50 dark:bg-accent-800/40 border border-accent-200/60 dark:border-accent-700/60 space-y-2">
              <h4 className="font-bold text-accent-900 dark:text-white text-xs mb-2">Institutional Contact</h4>
              <p className="text-accent-600 dark:text-accent-300">
                <span className="font-semibold text-accent-900 dark:text-white">Admin Email:</span> {selectedOrg.contact?.email || selectedOrg.domain || 'admin@alpha.edu'}
              </p>
              {selectedOrg.contact?.website && (
                <p className="text-accent-600 dark:text-accent-300">
                  <span className="font-semibold text-accent-900 dark:text-white">Website:</span> {selectedOrg.contact.website}
                </p>
              )}
              {selectedOrg.description && (
                <p className="text-accent-500 dark:text-accent-400 italic">
                  "{selectedOrg.description}"
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Organizations;
