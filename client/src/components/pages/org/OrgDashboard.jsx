import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Users, ClipboardList,
  ShieldCheck, TrendingUp, ChevronRight, Plus, AlertCircle,
  CheckCircle2, BarChart3, RefreshCw, Layers,
  Award, Clock, UserCheck, ShieldAlert
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, StatusBadge, RiskBadge,
  Button, Avatar, ProgressRing, PageHeader, BarChart, SkeletonDashboard
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import reportService from '@/services/report.service';
import assessmentService from '@/services/assessment.service';
import candidateService from '@/services/candidate.service';
import attemptService from '@/services/attempt.service';
import proctoringService from '@/services/proctoring.service';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.data?.items)) return res.data.items;
  if (Array.isArray(res.data?.attempts)) return res.data.attempts;
  if (Array.isArray(res.data?.sessions)) return res.data.sessions;
  if (Array.isArray(res.data?.candidates)) return res.data.candidates;
  if (Array.isArray(res.data?.assessments)) return res.data.assessments;
  if (Array.isArray(res.data)) return res.data;
  return [];
};

export function OrgDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    activeAssessments: 0,
    totalAssessments: 0,
    enrolledCandidates: 0,
    completedAttempts: 0,
    totalAttempts: 0,
    flaggedSessions: 0,
    averageScore: 0,
    passRate: 0,
    cleanTelemetryRate: 100,
    verifiedSubmissionsRate: 100,
    webcamComplianceRate: 100,
    pendingEvaluations: 0,
    weeklyVolume: [],
  });

  const [recentAttempts, setRecentAttempts] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [activeAssessmentsList, setActiveAssessmentsList] = useState([]);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch live report overview metrics from backend
      let overviewData = null;
      try {
        const overviewRes = await reportService.getOverviewMetrics();
        overviewData = overviewRes?.data || overviewRes;
      } catch (err) {
        console.warn('Overview metrics query note:', err.message);
      }

      // 2. Fetch parallel live entities for recent streams and spotlights
      const [assessmentsRes, candidatesRes, attemptsRes, proctorRes] = await Promise.allSettled([
        assessmentService.getAssessments({ limit: 10, sort: '-createdAt' }),
        candidateService.getCandidates({ limit: 10, sort: '-createdAt' }),
        attemptService.getAttempts({ limit: 10, sort: '-createdAt' }),
        proctoringService.getSessions({ limit: 10, sort: '-createdAt' }),
      ]);

      const assessments = assessmentsRes.status === 'fulfilled' ? extractArray(assessmentsRes.value) : [];
      const candidates = candidatesRes.status === 'fulfilled' ? extractArray(candidatesRes.value) : [];
      const attempts = attemptsRes.status === 'fulfilled' ? extractArray(attemptsRes.value) : [];
      const proctorSessions = proctorRes.status === 'fulfilled' ? extractArray(proctorRes.value) : [];

      // Calculate dynamic weekly volume fallback if not provided by backend
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let weeklyData = overviewData?.weeklyVolume;

      if (!Array.isArray(weeklyData) || weeklyData.length === 0) {
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const count = attempts.filter((a) => {
            const aDate = (a.startedAt || a.createdAt || '').split('T')[0];
            return aDate === dateStr;
          }).length;
          last7.push({
            label: dayNames[d.getDay()],
            value: count,
            date: dateStr,
          });
        }
        weeklyData = last7;
      }

      // Filter flagged sessions requiring review
      const flagged = proctorSessions.filter(
        (s) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL' || (s.violationCount && s.violationCount > 0)
      );

      const publishedAssessments = assessments.filter(
        (a) => a.status === 'PUBLISHED' || a.isPublished || a.status === 'ACTIVE'
      );

      // Compile finalized dynamic stats synced with database
      setStats({
        activeAssessments: overviewData?.activeAssessments ?? publishedAssessments.length ?? assessments.length,
        totalAssessments: overviewData?.totalAssessments ?? assessments.length,
        enrolledCandidates: overviewData?.totalCandidates ?? overviewData?.candidates ?? candidates.length,
        completedAttempts: overviewData?.completedAttempts ?? attempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'EVALUATED').length,
        totalAttempts: overviewData?.totalAttempts ?? overviewData?.attempts ?? attempts.length,
        flaggedSessions: overviewData?.flaggedSessions ?? flagged.length,
        averageScore: Number(overviewData?.averageScore ?? 0),
        passRate: Number(overviewData?.passRate ?? 0),
        cleanTelemetryRate: Number(overviewData?.cleanTelemetryRate ?? (proctorSessions.length > 0 ? Math.round(((proctorSessions.length - flagged.length) / proctorSessions.length) * 100) : 100)),
        verifiedSubmissionsRate: Number(overviewData?.verifiedSubmissionsRate ?? 100),
        webcamComplianceRate: Number(overviewData?.webcamComplianceRate ?? 100),
        pendingEvaluations: overviewData?.pendingEvaluations ?? 0,
        weeklyVolume: weeklyData,
      });

      setRecentAttempts(attempts);
      setReviewQueue(flagged.length > 0 ? flagged : proctorSessions);
      setActiveAssessmentsList(assessments);
    } catch (err) {
      console.warn('Dashboard data fetch note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, currentOrganization]);

  const orgName = currentOrganization?.name || 'Organization Workspace';
  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : 'Organization Workspace';

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Page Header with Live Context & Primary Actions */}
      <PageHeader
        title={greeting}
        subtitle={`${orgName} · Examination Operations, Candidate Telemetry, and Proctoring Center`}
        icon={<LayoutDashboard size={22} className="text-primary-600 dark:text-primary-400 shrink-0" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />}
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<UserCheck size={15} />}
              onClick={() => onNavigate('org-participants')}
            >
              Manage Candidates
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
          {/* Core Dynamic KPI Metrics - Fully Responsive Breakpoints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <MetricCard
              label="Active Assessments"
              value={String(stats.activeAssessments)}
              icon={<FileText size={20} />}
              trend={{ value: `${stats.totalAssessments} Total`, up: true }}
              color="primary"
              onClick={() => onNavigate('org-assessments')}
            />
            <MetricCard
              label="Enrolled Candidates"
              value={String(stats.enrolledCandidates)}
              icon={<Users size={20} />}
              trend={{ value: 'Roster active', up: true }}
              color="secondary"
              onClick={() => onNavigate('org-participants')}
            />
            <MetricCard
              label="Exam Attempts"
              value={String(stats.totalAttempts)}
              icon={<ClipboardList size={20} />}
              trend={{ value: `${stats.completedAttempts} Finalized`, up: true }}
              color="info"
              onClick={() => onNavigate('org-sessions')}
            />
            <MetricCard
              label="Flagged Sessions"
              value={String(stats.flaggedSessions)}
              icon={<ShieldAlert size={20} />}
              trend={{
                value: stats.flaggedSessions > 0 ? 'Action Needed' : 'All Clear',
                up: stats.flaggedSessions === 0,
              }}
              color={stats.flaggedSessions > 0 ? 'danger' : 'warning'}
              onClick={() => onNavigate('org-integrity')}
            />
            <MetricCard
              label="Avg Score"
              value={`${stats.averageScore}%`}
              icon={<TrendingUp size={20} />}
              trend={{ value: 'Cohort mean', up: stats.averageScore >= 50 }}
              color="success"
              onClick={() => onNavigate('org-reports')}
            />
            <MetricCard
              label="Passing Rate"
              value={`${stats.passRate}%`}
              icon={<Award size={20} />}
              trend={{ value: 'Certified pass', up: stats.passRate >= 60 }}
              color="primary"
              onClick={() => onNavigate('org-reports')}
            />
          </div>

          {/* Activity Charts & Throughput */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Weekly Examination Throughput"
                subtitle="Daily candidate test submissions and session volume"
                icon={<BarChart3 size={18} />}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ChevronRight size={14} />}
                    onClick={() => onNavigate('org-reports')}
                  >
                    View Analytics
                  </Button>
                }
              />
              <CardBody>
                <div className="overflow-x-auto min-w-0">
                  <BarChart
                    data={stats.weeklyVolume}
                    color="#2563eb"
                    formatValue={(v) => `${v} exams`}
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-accent-100 dark:border-accent-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-accent-500 dark:text-accent-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0"></span>
                    <span>Total Session Records: <strong className="text-accent-900 dark:text-white">{stats.totalAttempts}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success-500 shrink-0"></span>
                    <span>Submission Rate: <strong className="text-accent-900 dark:text-white">{stats.verifiedSubmissionsRate}%</strong></span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Integrity Health Index"
                subtitle="Aggregated session risk and compliance"
                icon={<ShieldCheck size={18} />}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ChevronRight size={14} />}
                    onClick={() => onNavigate('org-integrity')}
                  >
                    Details
                  </Button>
                }
              />
              <CardBody className="flex flex-col items-center justify-center p-4 sm:p-6">
                <ProgressRing
                  progress={Math.min(stats.cleanTelemetryRate, 100)}
                  size={110}
                  strokeWidth={8}
                  color={stats.cleanTelemetryRate >= 90 ? '#16a34a' : stats.cleanTelemetryRate >= 75 ? '#d97706' : '#dc2626'}
                  label="Clean Telemetry"
                />
                <div className="mt-5 w-full space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                    <span>Verified Submissions</span>
                    <span className="font-bold text-accent-900 dark:text-white">{stats.verifiedSubmissionsRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                    <span>Telemetry Compliance</span>
                    <span className="font-bold text-accent-900 dark:text-white">{stats.cleanTelemetryRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-accent-600 dark:text-accent-400">
                    <span>Flagged Integrity Alerts</span>
                    <span className={`font-bold ${stats.flaggedSessions > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600'}`}>
                      {stats.flaggedSessions} Sessions
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  icon={<ShieldCheck size={14} />}
                  onClick={() => onNavigate('org-integrity')}
                >
                  Open Integrity Center
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Quick Review Queue & Candidate Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Priority Review Queue */}
            <Card>
              <CardHeader
                title="Priority Review Queue"
                subtitle="Sessions with telemetry anomaly flags requiring manual review"
                icon={<AlertCircle size={18} />}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ChevronRight size={14} />}
                    onClick={() => onNavigate('org-integrity')}
                  >
                    View All
                  </Button>
                }
              />
              <CardBody className="p-0 divide-y divide-accent-100 dark:divide-accent-800">
                {reviewQueue.length > 0 ? (
                  reviewQueue.slice(0, 4).map((s, idx) => {
                    const candidateName = s.candidateName || s.participant || (s.candidateId?.firstName ? `${s.candidateId?.firstName || ''} ${s.candidateId?.lastName || ''}`.trim() : `Candidate #${idx + 1}`);
                    const examTitle = s.assessmentTitle || s.assessment || s.assessmentId?.title || 'Examination Session';
                    const riskLevel = s.riskLevel || (s.violationCount > 2 ? 'HIGH' : s.violationCount > 0 ? 'MEDIUM' : 'LOW');

                    return (
                      <div
                        key={s._id || s.id || idx}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-2 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer group"
                        onClick={() => onNavigate('org-integrity-evidence')}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={candidateName} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-accent-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                              {candidateName}
                            </p>
                            <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{examTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          {s.violationCount > 0 && (
                            <span className="text-[10px] font-semibold text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-950/60 px-1.5 py-0.5 rounded border border-danger-200 dark:border-danger-800/40">
                              {s.violationCount} flag{s.violationCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          <RiskBadge level={riskLevel} />
                          <ChevronRight size={14} className="text-accent-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-success-50 dark:bg-success-950/60 text-success-600 mx-auto flex items-center justify-center mb-2">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-xs font-medium text-accent-700 dark:text-accent-300">All Clear</p>
                    <p className="text-[11px] text-accent-500 mt-0.5">No flagged sessions in review queue</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Candidate Attempts */}
            <Card>
              <CardHeader
                title="Recent Candidate Attempts"
                subtitle="Live stream of finalized examination sessions"
                icon={<CheckCircle2 size={18} />}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ChevronRight size={14} />}
                    onClick={() => onNavigate('org-sessions')}
                  >
                    All Sessions
                  </Button>
                }
              />
              <CardBody className="p-0 divide-y divide-accent-100 dark:divide-accent-800">
                {recentAttempts.length > 0 ? (
                  recentAttempts.slice(0, 4).map((a, idx) => {
                    const cName = a.candidateName || (a.candidateId?.firstName ? `${a.candidateId.firstName} ${a.candidateId.lastName || ''}`.trim() : `Candidate #${idx + 1}`);
                    const aTitle = a.assessmentTitle || a.assessmentId?.title || 'Standard Assessment';
                    const timeLabel = formatRelativeTime(a.submittedAt || a.startedAt || a.createdAt);

                    return (
                      <div
                        key={a._id || a.id || idx}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-2 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer group"
                        onClick={() => onNavigate('org-sessions')}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={cName} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-accent-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                {cName}
                              </p>
                              <span className="text-[10px] text-accent-400 shrink-0">· {timeLabel}</span>
                            </div>
                            <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">
                              {aTitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          {a.percentage !== undefined && a.percentage !== null && (
                            <span className="text-xs font-bold text-accent-900 dark:text-white">
                              {a.percentage}%
                            </span>
                          )}
                          <StatusBadge status={a.status || 'SUBMITTED'} />
                          <ChevronRight size={14} className="text-accent-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-800 text-accent-500 mx-auto flex items-center justify-center mb-2">
                      <ClipboardList size={20} />
                    </div>
                    <p className="text-xs font-medium text-accent-700 dark:text-accent-300">No Exam Attempts Yet</p>
                    <p className="text-[11px] text-accent-500 mt-0.5">Assigned candidate sessions will appear here in real-time</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => onNavigate('org-assessments')}
                    >
                      Assign Assessment
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Active Assessments Spotlight */}
          {activeAssessmentsList.length > 0 && (
            <Card>
              <CardHeader
                title="Active Assessments Spotlight"
                subtitle="High-priority examination suites currently scheduled or in circulation"
                icon={<Layers size={18} />}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ChevronRight size={14} />}
                    onClick={() => onNavigate('org-assessments')}
                  >
                    View All ({activeAssessmentsList.length})
                  </Button>
                }
              />
              <CardBody className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-accent-100 dark:divide-accent-800">
                  {activeAssessmentsList.slice(0, 3).map((assessment, idx) => (
                    <div
                      key={assessment._id || assessment.id || idx}
                      className="p-4 sm:p-5 flex flex-col justify-between hover:bg-accent-50/50 dark:hover:bg-accent-800/30 transition-colors cursor-pointer group min-w-0"
                      onClick={() => onNavigate('org-assessments')}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={assessment.status || 'PUBLISHED'} />
                          <span className="text-[11px] text-accent-400 font-medium">
                            {assessment.code || `ASSESS-${idx + 1}`}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-accent-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                          {assessment.title || 'Untitled Assessment'}
                        </h4>
                        <p className="text-xs text-accent-500 dark:text-accent-400 line-clamp-2 mt-1">
                          {assessment.description || 'Proctored assessment session with automated scoring and live verification.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-accent-100 dark:border-accent-800/60 flex items-center justify-between text-xs text-accent-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} />
                          <span>{assessment.durationMinutes || assessment.durationSeconds ? Math.round((assessment.durationSeconds || assessment.durationMinutes * 60) / 60) : 60}m limit</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Manage</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default OrgDashboard;
