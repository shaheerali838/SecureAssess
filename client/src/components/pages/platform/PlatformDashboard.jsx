import React, { useState, useEffect } from 'react';
import {
  Building2, Users, FileText, MonitorPlay, Activity, TrendingUp,
  CreditCard, Package, Plus, Download, ChevronRight, Shield, Globe, Server, CheckCircle2
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, StatusBadge, Button,
  BarChart, LineChart, DonutChart, Avatar, PageHeader, SkeletonDashboard
} from '@/components/ui';
import { organizations } from '@/data';
import { useAuth } from '@/contexts/AuthContext';

export function PlatformDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Administration Console"
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

      {loading ? (
        <SkeletonDashboard />
      ) : (
        <>
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
              label="Live Examination Sessions"
              value="312"
              icon={<MonitorPlay size={20} />}
              trend={{ value: 'Peak load', up: true }}
              color="success"
            />
          </div>

          {/* Revenue & Growth Visuals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Global Subscription ARR Progression"
                subtitle="Annual Recurring Revenue across all institutional tiers"
                icon={<TrendingUp size={18} />}
              />
              <CardBody>
                <LineChart
                  data={[
                    { label: 'Jan', value: 820 },
                    { label: 'Feb', value: 940 },
                    { label: 'Mar', value: 1100 },
                    { label: 'Apr', value: 1280 },
                    { label: 'May', value: 1420 },
                    { label: 'Jun', value: 1680 },
                    { label: 'Jul', value: 1890 },
                    { label: 'Aug', value: 2150 },
                  ]}
                  color="#2563eb"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Tenant Plan Distribution"
                subtitle="Active tiers by institutional size"
                icon={<Package size={18} />}
              />
              <CardBody>
                <DonutChart
                  centerValue="42"
                  centerLabel="Tenants"
                  data={[
                    { label: 'Enterprise', value: 14, color: '#2563eb' },
                    { label: 'Professional', value: 18, color: '#0d9488' },
                    { label: 'Growth', value: 10, color: '#f59e0b' },
                  ]}
                />
              </CardBody>
            </Card>
          </div>

          {/* Tenant Roster & Infrastructure Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Recent Tenant Provisions"
                subtitle="Latest onboarded universities and certification bodies"
                icon={<Building2 size={18} />}
                action={
                  <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} onClick={() => onNavigate('platform-organizations')}>
                    View All Tenants
                  </Button>
                }
              />
              <CardBody className="p-0 divide-y divide-accent-100 dark:divide-accent-800">
                {organizations.slice(0, 4).map((org) => (
                  <div
                    key={org.id}
                    className="p-4 flex items-center justify-between hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    onClick={() => onNavigate('platform-organizations')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-soft">
                        {org.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-accent-900 dark:text-white">{org.name}</p>
                        <p className="text-[11px] text-accent-500 dark:text-accent-400">{org.domain} · {org.members} active users</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={org.tier === 'Enterprise' ? 'primary' : 'neutral'}>{org.tier}</Badge>
                      <StatusBadge status={org.status} />
                      <ChevronRight size={14} className="text-accent-400" />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Infrastructure Health"
                subtitle="Core microservice uptime & load"
                icon={<Server size={18} />}
              />
              <CardBody className="space-y-4 p-5">
                {[
                  { name: 'API Gateway & Scopers', status: 'Optimal', latency: '24ms', health: 'bg-success-500' },
                  { name: 'WebRTC Signaling Relay', status: 'Operational', latency: '42ms', health: 'bg-success-500' },
                  { name: 'AI Proctoring Inference', status: 'Healthy', latency: '110ms', health: 'bg-success-500' },
                  { name: 'MongoDB Replica Set', status: 'Synchronized', latency: '6ms', health: 'bg-success-500' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-accent-50/50 dark:bg-accent-950/40 border border-accent-100 dark:border-accent-800 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.health} animate-pulse`} />
                      <span className="text-xs font-semibold text-accent-800 dark:text-accent-200">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-accent-900 dark:text-white">{s.status}</p>
                      <p className="text-[10px] text-accent-400 font-mono">{s.latency}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default PlatformDashboard;
