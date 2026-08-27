import {
  Building2, Users, FileText, MonitorPlay, Activity, TrendingUp,
  CreditCard, Package, Plus,
 Download, ChevronRight, Shield, Globe,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, StatusBadge, Button,
  BarChart, LineChart, DonutChart, Avatar, PageHeader,
} from '@/components/ui';
import { organizations } from '@/data';






export function PlatformDashboard({ onNavigate }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Dashboard"
        subtitle="Overview of SecureAssess platform activity and growth"
        icon={<Shield size={22} />}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Download size={16} />}>Export</Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => onNavigate('platform-onboarding')}>Add Organization</Button>
          </>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Organizations" value="42" icon={<Building2 size={22} />} trend={{ value: '12%', up: true }} color="primary" />
        <MetricCard label="Total Users" value="18,420" icon={<Users size={22} />} trend={{ value: '8%', up: true }} color="secondary" />
        <MetricCard label="Assessments" value="6,284" icon={<FileText size={22} />} trend={{ value: '15%', up: true }} color="info" />
        <MetricCard label="Sessions This Month" value="12,481" icon={<MonitorPlay size={22} />} trend={{ value: '23%', up: true }} color="success" />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Active Organizations" value="38" icon={<Activity size={22} />} color="success" />
        <MetricCard label="Live Sessions" value="37" icon={<Activity size={22} />} color="warning" />
        <MetricCard label="Monthly Revenue" value="$48,200" icon={<CreditCard size={22} />} trend={{ value: '18%', up: true }} color="primary" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Organization Growth" subtitle="New organizations per month" icon={<TrendingUp size={18} />} />
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
          <CardHeader title="Assessment Volume" subtitle="Sessions per month" icon={<BarChart3 size={18} />} />
          <CardBody>
            <BarChart
              data={[
                { label: 'Jan', value: 4200 }, { label: 'Feb', value: 5100 }, { label: 'Mar', value: 6800 },
                { label: 'Apr', value: 7200 }, { label: 'May', value: 8900 }, { label: 'Jun', value: 9500 },
                { label: 'Jul', value: 10800 }, { label: 'Aug', value: 12481 },
              ]}
              color="#14b8a6"
              formatValue={(v) => v.toLocaleString()}
            />
          </CardBody>
        </Card>
      </div>

      {/* Plan distribution & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Subscription Distribution" icon={<Package size={18} />} />
          <CardBody>
            <DonutChart
              centerValue="42"
              centerLabel="Organizations"
              data={[
                { label: 'Enterprise', value: 18, color: '#1d4ed8' },
                { label: 'Professional', value: 16, color: '#14b8a6' },
                { label: 'Starter', value: 8, color: '#f59e0b' },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Usage by Organization" subtitle="Top organizations by session volume" icon={<Building2 size={18} />} />
          <CardBody>
            <div className="space-y-3">
              {organizations.slice(0, 5).map((org, i) => (
                <div key={org.id} className="flex items-center gap-3">
                  <span className="text-xs text-accent-400 w-4">{i + 1}</span>
                  <Avatar name={org.name} color={org.brandColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-accent-800 truncate">{org.name}</p>
                    <p className="text-xs text-accent-500">{org.industry}</p>
                  </div>
                  <div className="w-32 hidden sm:block">
                    <div className="h-2 bg-accent-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${org.usage}%`, backgroundColor: org.brandColor }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-accent-700 w-12 text-right">{org.usage}%</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent organizations */}
      <Card>
        <CardHeader
          title="Recent Organizations"
          subtitle="Latest organizations on the platform"
          icon={<Globe size={18} />}
          action={<Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} />} onClick={() => onNavigate('platform-organizations')}>View All</Button>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 bg-accent-50/50">
                  <th className="text-left text-xs font-semibold text-accent-600 px-5 py-3">Organization</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden md:table-cell">Industry</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Plan</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden sm:table-cell">Users</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-accent-600 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {organizations.slice(0, 5).map((org) => (
                  <tr key={org.id} className="border-b border-accent-50 hover:bg-accent-50/50 transition-colors cursor-pointer" onClick={() => onNavigate('platform-organizations')}>
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
                    <td className="px-3 py-3 hidden sm:table-cell text-sm text-accent-700">{org.users.toLocaleString()}</td>
                    <td className="px-3 py-3"><StatusBadge status={org.status} /></td>
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

import { BarChart3 } from 'lucide-react';
