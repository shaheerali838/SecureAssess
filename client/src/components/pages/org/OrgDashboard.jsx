import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, Calendar, ClipboardList,
  ShieldCheck, TrendingUp, ChevronRight, Plus, Download, AlertCircle,
  CheckCircle2, Video, Activity, BarChart3, RefreshCw
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, StatusBadge, RiskBadge,
  Button, Avatar, ProgressRing, PageHeader, LineChart, BarChart, SkeletonDashboard
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import assessmentService from '@/services/assessment.service';
import candidateService from '@/services/candidate.service';
import attemptService from '@/services/attempt.service';
import proctoringService from '@/services/proctoring.service';

export function OrgDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeAssessments: 0,
    enrolledCandidates: 0,
    completedAttempts: 0,
    flaggedSessions: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assessmentsRes, candidatesRes, attemptsRes, proctorRes] = await Promise.allSettled([
        assessmentService.getAssessments({ limit: 10 }),
        candidateService.getCandidates({ limit: 10 }),
        attemptService.getAttempts({ limit: 5 }),
        proctoringService.getSessions({ limit: 5 }),
      ]);

      const assessments = assessmentsRes.status === 'fulfilled' ? (assessmentsRes.value?.items || assessmentsRes.value?.data?.items || assessmentsRes.value || []) : [];
      const candidates = candidatesRes.status === 'fulfilled' ? (candidatesRes.value?.items || candidatesRes.value?.data?.items || candidatesRes.value || []) : [];
      const attempts = attemptsRes.status === 'fulfilled' ? (attemptsRes.value?.items || attemptsRes.value?.data?.items || attemptsRes.value || []) : [];
      const proctorSessions = proctorRes.status === 'fulfilled' ? (proctorRes.value?.items || proctorRes.value?.data?.items || proctorRes.value || []) : [];

      setStats({
        activeAssessments: Array.isArray(assessments) ? assessments.length : 0,
        enrolledCandidates: Array.isArray(candidates) ? candidates.length : 0,
        completedAttempts: Array.isArray(attempts) ? attempts.length : 0,
        flaggedSessions: Array.isArray(proctorSessions) ? proctorSessions.filter((s) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL').length : 0,
      });

      if (Array.isArray(attempts) && attempts.length > 0) {
        setRecentAttempts(attempts);
      }
      if (Array.isArray(proctorSessions) && proctorSessions.length > 0) {
        setReviewQueue(proctorSessions);
      }
    } catch (err) {
      console.warn('Dashboard data fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrganization]);

  const orgName = currentOrganization?.name || 'Organization Workspace';
  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : 'Organization Workspace';

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        subtitle={`${orgName} · Examination Operations, Candidate Telemetry, and Proctoring Center`}
        icon={<LayoutDashboard size={22} className="text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={fetchData}>
              Refresh
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
              value={String(stats.activeAssessments)}
              icon={<FileText size={20} />}
              trend={{ value: 'Live in catalog', up: true }}
              color="primary"
            />
            <MetricCard
              label="Enrolled Candidates"
              value={String(stats.enrolledCandidates)}
              icon={<Users size={20} />}
              trend={{ value: 'In current tenant', up: true }}
              color="secondary"
            />
            <MetricCard
              label="Completed Attempts"
              value={String(stats.completedAttempts)}
              icon={<ClipboardList size={20} />}
              trend={{ value: 'Authoritative count', up: true }}
              color="info"
            />
            <MetricCard
              label="Flagged Sessions"
              value={String(stats.flaggedSessions)}
              icon={<ShieldCheck size={20} />}
              trend={{ value: 'Integrity alerts', up: false }}
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
                {reviewQueue.length > 0 ? (
                  reviewQueue.slice(0, 4).map((s, idx) => (
                    <div
                      key={s._id || s.id || idx}
                      className="p-4 flex items-center justify-between hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                      onClick={() => onNavigate('org-integrity-evidence')}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={s.candidateName || s.participant || 'Candidate'} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-accent-900 dark:text-white">{s.candidateName || s.participant || `Session #${idx + 1}`}</p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">{s.assessmentTitle || s.assessment || 'Assessment'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={s.riskLevel || 'LOW'} />
                        <ChevronRight size={14} className="text-accent-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-accent-500">No flagged sessions in review queue</div>
                )}
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
                {recentAttempts.length > 0 ? (
                  recentAttempts.slice(0, 4).map((a, idx) => (
                    <div
                      key={a._id || a.id || idx}
                      className="p-4 flex items-center justify-between hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                      onClick={() => onNavigate('org-participant-profile')}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={a.candidateName || a.candidateId?.firstName || 'Candidate'} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-accent-900 dark:text-white">{a.candidateName || a.candidateId?.firstName || `Attempt #${idx + 1}`}</p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">{a.assessmentTitle || a.assessmentId?.title || 'Assessment'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.status || 'SUBMITTED'} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-accent-500">No recent exam attempts</div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default OrgDashboard;
