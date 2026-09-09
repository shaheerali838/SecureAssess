import React, { useState, useEffect } from 'react';
import {
  Building2, Users, FileText, MonitorPlay, Activity, TrendingUp,
  CreditCard, Package, Plus, Download, ChevronRight, Shield, Globe, Server, CheckCircle2
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, StatusBadge, Button,
  BarChart, LineChart, DonutChart, Avatar, PageHeader, SkeletonDashboard
} from '@/components/ui';
import { organizations as fallbackOrgs } from '@/data';
import { useAuth } from '@/contexts/AuthContext';
import organizationService from '@/services/organization.service';
import reportService from '@/services/report.service';

export function PlatformDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orgList, setOrgList] = useState([]);
  const [platformMetrics, setPlatformMetrics] = useState({
    totalOrganizations: 0,
    totalUsers: 0,
    activeAssessments: 0,
    liveSessions: 0,
    arrProgression: [],
    planDistribution: [],
  });

  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      const [orgsRes, reportRes] = await Promise.allSettled([
        organizationService.getOrganizations(),
        reportService.getPlatformDashboard(),
      ]);

      if (orgsRes.status === 'fulfilled') {
        const items = orgsRes.value?.items || orgsRes.value?.organizations || orgsRes.value?.data || orgsRes.value || [];
        if (Array.isArray(items)) {
          setOrgList(items);
        }
      }

      if (reportRes.status === 'fulfilled') {
        const resVal = reportRes.value;
        const data = resVal?.data?.data || resVal?.data || resVal || {};
        setPlatformMetrics({
          totalOrganizations: data.totalOrganizations ?? (orgList.length || 1),
          totalUsers: data.totalUsers ?? 0,
          activeAssessments: data.totalAssessments ?? data.activeAssessments ?? 0,
          liveSessions: data.liveSessions ?? 0,
          arrProgression: Array.isArray(data.arrProgression) ? data.arrProgression : [],
          planDistribution: Array.isArray(data.planDistribution) ? data.planDistribution : [],
        });
      }
    } catch (err) {
      console.warn('Platform dashboard live sync note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
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
              value={String(platformMetrics.totalOrganizations || orgList.length || 0)}
              icon={<Building2 size={20} />}
              trend={{ value: 'Live', up: true }}
              color="primary"
            />
            <MetricCard
              label="Total Managed Accounts"
              value={String(platformMetrics.totalUsers || 0)}
              icon={<Users size={20} />}
              trend={{ value: 'Active', up: true }}
              color="secondary"
            />
            <MetricCard
              label="Active Assessments"
              value={String(platformMetrics.activeAssessments || 0)}
              icon={<FileText size={20} />}
              trend={{ value: 'Synced', up: true }}
              color="info"
            />
            <MetricCard
              label="Live Examination Sessions"
              value={String(platformMetrics.liveSessions || 0)}
              icon={<MonitorPlay size={20} />}
              trend={{ value: 'Operational', up: true }}
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
                  data={platformMetrics.arrProgression}
                  color="#3b82f6"
                  formatValue={(v) => `$${v}k`}
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
                  centerValue={String(platformMetrics.totalOrganizations || orgList.length || 0)}
                  centerLabel="Tenants"
                  data={
                    platformMetrics.planDistribution && platformMetrics.planDistribution.length > 0
                      ? platformMetrics.planDistribution
                      : [
                          { label: 'Enterprise', value: Math.max(orgList.length, 1), color: '#2563eb' },
                          { label: 'Professional', value: 0, color: '#0d9488' },
                          { label: 'Growth', value: 0, color: '#f59e0b' },
                        ]
                  }
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
                {(orgList.length > 0 ? orgList : fallbackOrgs).slice(0, 4).map((org) => {
                  const orgId = org._id || org.id;
                  const orgName = org.name || 'Organization';
                  const orgDomain = org.domain || `${(org.code || org.slug || 'org').toLowerCase()}.secureassess.edu`;
                  const memberCount = org.memberCount || org.members || 'Staff & Students';
                  const tier = org.tier || org.plan || 'Enterprise';
                  const status = org.status || 'ACTIVE';

                  return (
                    <div
                      key={orgId}
                      className="p-4 flex items-center justify-between hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                      onClick={() => onNavigate('platform-organizations')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-soft">
                          {orgName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-accent-900 dark:text-white">{orgName}</p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">{orgDomain} · {memberCount} active users</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={tier === 'Enterprise' ? 'primary' : 'neutral'}>{tier}</Badge>
                        <StatusBadge status={status} />
                        <ChevronRight size={14} className="text-accent-400" />
                      </div>
                    </div>
                  );
                })}
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
