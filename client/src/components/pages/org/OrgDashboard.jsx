import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, Calendar, ClipboardList,
  ShieldCheck, TrendingUp, ChevronRight, Plus, Download, AlertCircle,
  CheckCircle2, Video, Activity, BarChart3
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, StatusBadge, RiskBadge,
  Button, Avatar, ProgressRing, PageHeader, LineChart, BarChart, SkeletonDashboard
} from '@/components/ui';
import { participants, sessions } from '@/data';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

export function OrgDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const orgName = currentOrganization?.name || 'Stanford Engineering';
  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : 'Organization Workspace';

  const upcomingSessions = sessions.filter((s) => s.status === 'Completed' || s.status === 'Review Required').slice(0, 4);
  const reviewQueue = sessions.filter((s) => s.status === 'Review Required' || s.status === 'Flagged');

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        subtitle={`${orgName} · Examination Operations, Candidate Telemetry, and Proctoring Center`}
        icon={<LayoutDashboard size={22} className="text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
              Export Analytics
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => onNavigate('org-assessment-builder')}
            >
              Create Assessment
            </Button>
          </div>
        }
      />

      {loading ? (
        <SkeletonDashboard />
      ) : (
        <>
          {/* Core Assessment Operation Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Active Assessments"
              value="12"
              icon={<FileText size={20} />}
              trend={{ value: '2 published', up: true }}
              color="primary"
            />
            <MetricCard
              label="Enrolled Candidates"
              value="8,420"
              icon={<Users size={20} />}
              trend={{ value: '+14% this month', up: true }}
              color="secondary"
            />
            <MetricCard
              label="Completed Attempts"
              value="14,280"
              icon={<ClipboardList size={20} />}
              trend={{ value: '98.4% completion rate', up: true }}
              color="info"
            />
            <MetricCard
              label="Flagged Sessions"
              value="33"
              icon={<ShieldCheck size={20} />}
              trend={{ value: '0.23% anomaly rate', up: false }}
              color="warning"
            />
          </div>

          {/* Activity Charts & Throughput */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Weekly Attempt Volume"
                subtitle="Daily distribution of candidate exam completions"
                icon={<BarChart3 size={18} />}
              />
              <CardBody>
                <BarChart
                  data={[
                    { label: 'Mon', value: 420 },
                    { label: 'Tue', value: 680 },
                    { label: 'Wed', value: 950 },
                    { label: 'Thu', value: 810 },
                    { label: 'Fri', value: 1120 },
                    { label: 'Sat', value: 340 },
                    { label: 'Sun', value: 190 },
                  ]}
                  color="#2563eb"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Integrity Health Index"
                subtitle="Aggregated session risk profile"
                icon={<ShieldCheck size={18} />}
              />
              <CardBody className="flex flex-col items-center justify-center p-6">
                <ProgressRing progress={96} size={110} strokeWidth={8} color="#16a34a" label="Clean Telemetry" />
                <div className="mt-6 w-full space-y-2 text-xs">
                  <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                    <span>Verified Submissions</span>
                    <span className="font-bold text-accent-900 dark:text-white">99.7%</span>
                  </div>
                  <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                    <span>Webcam Compliance</span>
                    <span className="font-bold text-accent-900 dark:text-white">98.2%</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Quick Review Queue & Candidate Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader
                title="Priority Review Queue"
                subtitle="Sessions with telemetry anomaly flags requiring manual review"
                icon={<AlertCircle size={18} />}
                action={
                  <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} onClick={() => onNavigate('org-integrity')}>
                    View All
                  </Button>
                }
              />
              <CardBody className="p-0 divide-y divide-accent-100 dark:divide-accent-800">
                {reviewQueue.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="p-4 flex items-center justify-between hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    onClick={() => onNavigate('org-integrity-evidence')}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={s.participant} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-accent-900 dark:text-white">{s.participant}</p>
                        <p className="text-[11px] text-accent-500 dark:text-accent-400">{s.assessment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={s.riskLevel} />
                      <ChevronRight size={14} className="text-accent-400" />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Recent Candidate Attempts"
                subtitle="Live stream of finalized examination sessions"
                icon={<CheckCircle2 size={18} />}
                action={
                  <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} onClick={() => onNavigate('org-participants')}>
                    Roster
                  </Button>
                }
              />
              <CardBody className="p-0 divide-y divide-accent-100 dark:divide-accent-800">
                {participants.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-4 flex items-center justify-between hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    onClick={() => onNavigate('org-participant-profile')}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} color={p.avatarColor} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-accent-900 dark:text-white">{p.name}</p>
                        <p className="text-[11px] text-accent-500 dark:text-accent-400">{p.assessment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.score !== null && (
                        <span className="text-xs font-mono font-bold text-accent-900 dark:text-white">{p.score}%</span>
                      )}
                      <StatusBadge status={p.status} />
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

export default OrgDashboard;
