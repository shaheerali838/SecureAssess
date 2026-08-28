import React from 'react';
import {
  Building2, Users, FileText, MonitorPlay, Activity, TrendingUp,
  CreditCard, Package, Plus, Download, ChevronRight, Shield, Globe, Server, CheckCircle2
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, StatusBadge, Button,
  BarChart, LineChart, DonutChart, Avatar, PageHeader,
} from '@/components/ui';
import { organizations } from '@/data';
import { useAuth } from '@/contexts/AuthContext';

export function PlatformDashboard({ onNavigate }) {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Platform Administration Console`}
        subtitle="Global oversight of multi-tenant workspaces, subscription tiers, and system health."
        icon={<Shield size={22} className="text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
              Platform Report
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

      {/* Global Multi-Tenant Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Tenant Organizations"
          value="42"
          icon={<Building2 size={20} />}
          trend={{ value: '12% MoM', up: true }}
          color="primary"
        />
        <MetricCard
          label="Total Managed Accounts"
          value="18,420"
          icon={<Users size={20} />}
          trend={{ value: '8%', up: true }}
          color="secondary"
        />
        <MetricCard
          label="Active Assessments"
          value="6,284"
          icon={<FileText size={20} />}
          trend={{ value: '15%', up: true }}
          color="info"
        />
        <MetricCard
          label="Conducted Sessions (MTD)"
          value="12,481"
          icon={<MonitorPlay size={20} />}
          trend={{ value: '23%', up: true }}
          color="success"
        />
      </div>

      {/* Infrastructure Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Active Healthy Tenants"
          value="38 / 42"
          icon={<Activity size={20} />}
          color="success"
        />
        <MetricCard
          label="Concurrent Live Examinees"
          value="142"
          icon={<Server size={20} />}
          color="warning"
        />
        <MetricCard
          label="Monthly Platform ARR"
          value="$48,200"
          icon={<CreditCard size={20} />}
          trend={{ value: '18%', up: true }}
          color="primary"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Tenant Onboarding Growth"
            subtitle="New enterprise organizations provisioned per month"
            icon={<TrendingUp size={18} />}
          />
          <CardBody>
            <LineChart
              data={[
                { label: 'Jan', value: 3 }, { label: 'Feb', value: 5 }, { label: 'Mar', value: 4 },
                { label: 'Apr', value: 7 }, { label: 'May', value: 6 }, { label: 'Jun', value: 9 },
                { label: 'Jul', value: 8 }, { label: 'Aug', value: 12 },
              ]}
              color="#2563eb"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Assessment Throughput Volume"
            subtitle="Total candidate examination sessions per month"
            icon={<Activity size={18} />}
          />
          <CardBody>
            <BarChart
              data={[
                { label: 'Jan', value: 4200 }, { label: 'Feb', value: 5100 }, { label: 'Mar', value: 6800 },
                { label: 'Apr', value: 7200 }, { label: 'May', value: 8900 }, { label: 'Jun', value: 9500 },
                { label: 'Jul', value: 10800 }, { label: 'Aug', value: 12481 },
              ]}
              color="#0d9488"
              formatValue={(v) => v.toLocaleString()}
            />
          </CardBody>
        </Card>
      </div>

      {/* Subscription Breakdown & Top Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader
            title="Subscription Tier Distribution"
            subtitle="Active license plan allocations"
            icon={<Package size={18} />}
          />
          <CardBody>
            <DonutChart
              centerValue="42"
              centerLabel="Tenants"
              data={[
                { label: 'Enterprise', value: 18, color: '#2563eb' },
                { label: 'Professional', value: 16, color: '#0d9488' },
                { label: 'Starter / Trial', value: 8, color: '#f59e0b' },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Tenant Resource Quota Usage"
            subtitle="Highest volume organizations by examination load"
            icon={<Building2 size={18} />}
          />
          <CardBody>
            <div className="space-y-3">
              {organizations.slice(0, 5).map((org, i) => (
                <div key={org.id} className="flex items-center gap-3">
                  <span className="text-xs text-accent-400 font-mono w-4">{i + 1}</span>
                  <Avatar name={org.name} color={org.brandColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{org.name}</p>
                    <p className="text-[11px] text-accent-500 dark:text-accent-400">{org.industry} · {org.plan} Plan</p>
                  </div>
                  <div className="w-32 hidden sm:block">
                    <div className="h-2 bg-accent-100 dark:bg-accent-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${org.usage}%`, backgroundColor: org.brandColor }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-700 dark:text-accent-300 w-12 text-right">{org.usage}%</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tenant Directory Table */}
      <Card>
        <CardHeader
          title="Tenant Organizations Directory"
          subtitle="Real-time multi-tenant roster"
          icon={<Globe size={18} />}
          action={
            <Button
              variant="ghost"
              size="sm"
              iconRight={<ChevronRight size={15} />}
              onClick={() => onNavigate('platform-organizations')}
            >
              Manage All Tenants
            </Button>
          }
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Organization</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Plan</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Users</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {organizations.slice(0, 5).map((org) => (
                  <tr
                    key={org.id}
                    className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/30 transition-colors cursor-pointer"
                    onClick={() => onNavigate('platform-organizations')}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={org.name} color={org.brandColor} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-accent-900 dark:text-white">{org.name}</p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">{org.website}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <Badge variant="neutral">{org.industry}</Badge>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <Badge variant={org.plan === 'Enterprise' ? 'primary' : 'secondary'}>{org.plan}</Badge>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs text-accent-700 dark:text-accent-300 font-mono">
                      {org.users.toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={org.status} />
                    </td>
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
    </div>
  );
}

export default PlatformDashboard;
