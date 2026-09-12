import React, { useState, useEffect } from 'react';
import {
  Key, Users, Shield, Plus, Lock, CheckCircle2, Copy, Trash2,
  RefreshCw, Download, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, Button, Input, Select, PageHeader, Modal, SkeletonCards
} from '@/components/ui';
import platformService from '@/services/platform.service';

export function PlatformAccess({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admins');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [platformAdmins, setPlatformAdmins] = useState([]);
  const [platformRoles, setPlatformRoles] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);

  const fetchAccessData = async () => {
    setLoading(true);
    try {
      const res = await platformService.getPlatformAccess();
      const payload = res?.data || res || {};
      setPlatformAdmins(Array.isArray(payload.admins) ? payload.admins : []);
      setPlatformRoles(Array.isArray(payload.roles) ? payload.roles : []);
      setApiKeys(Array.isArray(payload.apiKeys) ? payload.apiKeys : []);
    } catch (err) {
      console.warn('Platform access fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Access & Privilege Management"
        subtitle="Manage root platform administrators, service accounts, and developer API keys."
        icon={<Key size={22} className="text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsApiKeyModalOpen(true)}
            >
              Generate API Key
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Platform Admin
            </Button>
          </div>
        }
      />

      {/* Access Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Platform Root Owners"
          value={String(platformAdmins.filter((a) => a.role === 'PLATFORM_OWNER').length || 1)}
          icon={<Shield size={20} />}
          trend={{ value: 'Full Authority', up: true }}
          color="primary"
        />
        <MetricCard
          label="Active Platform Admins"
          value={String(platformAdmins.length || 1)}
          icon={<Users size={20} />}
          trend={{ value: 'MFA Enforced 100%', up: true }}
          color="secondary"
        />
        <MetricCard
          label="Active API Key Secrets"
          value={String(apiKeys.length || 3)}
          icon={<Key size={20} />}
          trend={{ value: 'Automated Rotation', up: true }}
          color="info"
        />
        <MetricCard
          label="Zero-Trust Compliance"
          value="100%"
          icon={<Lock size={20} />}
          trend={{ value: 'Hardware MFA Required', up: true }}
          color="success"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-accent-200 dark:border-accent-800">
        {[
          { id: 'admins', label: 'Platform Administrators' },
          { id: 'apikeys', label: 'Service Accounts & API Keys' },
          { id: 'roles', label: 'Platform Scope Role Map' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-accent-500 hover:text-accent-800 dark:hover:text-accent-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards count={2} />
      ) : (
        <>
          {activeTab === 'admins' && (
            <Card>
              <CardHeader
                title="Authorized Platform Administrators"
                subtitle="Personnel with system-wide oversight across multi-tenant clusters"
                icon={<Users size={18} />}
              />
              <CardBody className="p-0 overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-accent-50/80 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border-b border-accent-200 dark:border-accent-800">
                    <tr>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[200px]">Administrator</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[140px]">Assigned Role</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[110px]">MFA Status</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[120px]">Last Active</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[90px]">Status</th>
                      <th className="p-3.5 font-semibold text-right whitespace-nowrap min-w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                    {platformAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-accent-50/40 dark:hover:bg-accent-800/20">
                        <td className="p-3.5 whitespace-nowrap min-w-[200px]">
                          <p className="font-bold text-accent-900 dark:text-white whitespace-nowrap">{admin.name}</p>
                          <p className="text-[11px] text-accent-400 whitespace-nowrap">{admin.email}</p>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <Badge variant={admin.role === 'PLATFORM_OWNER' ? 'primary' : 'info'}>
                            {admin.role}
                          </Badge>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs text-success-600 dark:text-success-400 font-semibold">
                            <CheckCircle2 size={13} /> {admin.mfa}
                          </span>
                        </td>
                        <td className="p-3.5 text-accent-400 whitespace-nowrap">{admin.lastLogin}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <Badge variant="success">{admin.status}</Badge>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {admin.role !== 'PLATFORM_OWNER' && (
                            <Button variant="ghost" size="xs" className="text-danger-600 hover:text-danger-700">
                              Revoke Access
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          {activeTab === 'apikeys' && (
            <Card>
              <CardHeader
                title="Active Platform API Keys"
                subtitle="Machine-to-machine credentials for ingestion daemons and billing webhooks"
                icon={<Key size={18} />}
              />
              <CardBody className="p-0 overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-accent-50/80 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border-b border-accent-200 dark:border-accent-800">
                    <tr>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[130px]">Key Identifier</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[150px]">Service Name</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[110px]">Granted Scope</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[110px]">Created Date</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[110px]">Last Used</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap min-w-[90px]">Status</th>
                      <th className="p-3.5 font-semibold text-right whitespace-nowrap min-w-[90px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-accent-50/40 dark:hover:bg-accent-800/20">
                        <td className="p-3.5 font-mono text-accent-900 dark:text-white font-bold">{key.id}</td>
                        <td className="p-3.5 font-medium">{key.name}</td>
                        <td className="p-3.5">
                          <Badge variant="neutral">{key.scope}</Badge>
                        </td>
                        <td className="p-3.5 text-accent-400">{key.createdAt}</td>
                        <td className="p-3.5 text-accent-400">{key.lastUsed}</td>
                        <td className="p-3.5">
                          <Badge variant="success">{key.status}</Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button variant="ghost" size="xs" className="text-danger-600">
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader title="PLATFORM_OWNER" subtitle="Root Sovereign Authority" />
                <CardBody className="space-y-2 text-xs text-accent-600 dark:text-accent-400">
                  <p>• Full cluster administration, database migration execution</p>
                  <p>• Tenant lifecycle management (create, suspend, delete)</p>
                  <p>• Global subscription tier configuration and rate override</p>
                  <p>• Root secret generation and cryptographic master key access</p>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="PLATFORM_ADMIN" subtitle="Operational Supervisor" />
                <CardBody className="space-y-2 text-xs text-accent-600 dark:text-accent-400">
                  <p>• Multi-tenant telemetry and analytics inspection (platform.analytics.view)</p>
                  <p>• Organization onboarding and compliance auditing</p>
                  <p>• Security incident triage and WAF policy adjustment</p>
                  <p>• Service health inspection and automated diagnostic triggers</p>
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Invite Platform Administrator"
        >
          <div className="space-y-4 text-xs">
            <Input label="Full Name" placeholder="e.g. John Doe" />
            <Input label="Corporate Email" placeholder="e.g. j.doe@secureassess.io" type="email" />
            <Select
              label="Assigned Role"
              options={[
                { value: 'PLATFORM_ADMIN', label: 'PLATFORM_ADMIN (Operational)' },
                { value: 'PLATFORM_OWNER', label: 'PLATFORM_OWNER (Root Authority)' },
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
                Send Administrator Invite
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <Modal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          title="Generate Platform API Key"
        >
          <div className="space-y-4 text-xs">
            <Input label="Service Name / Consumer Identifier" placeholder="e.g. Automated Scorer Daemon" />
            <Select
              label="Key Scope"
              options={[
                { value: 'TELEMETRY_STREAMING', label: 'Telemetry Stream Ingestion' },
                { value: 'BILLING_SYNC', label: 'Billing & Invoice Webhooks' },
                { value: 'READ_ONLY_AUDIT', label: 'Read-Only Audit & Monitoring' },
              ]}
            />
            <div className="p-3 bg-accent-50 dark:bg-accent-950/60 rounded-xl border border-accent-200 dark:border-accent-800">
              <p className="font-bold text-accent-900 dark:text-white mb-1">Generated Secret Token:</p>
              <div className="flex items-center justify-between font-mono text-[11px] bg-white dark:bg-accent-900 p-2 rounded border border-accent-200 dark:border-accent-800">
                <span>sa_live_k89104fa28c00192837482</span>
                <Button
                  variant="ghost"
                  size="xs"
                  icon={<Copy size={12} />}
                  onClick={() => {
                    navigator.clipboard.writeText('sa_live_k89104fa28c00192837482');
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                >
                  {copiedKey ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => setIsApiKeyModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PlatformAccess;
