import React from 'react';
import {
  LayoutDashboard, FileText, Users, Calendar, ClipboardList,
  ShieldCheck, TrendingUp, ChevronRight, Plus, Download, AlertCircle,
  CheckCircle2, Video, Activity, BarChart3
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, StatusBadge, RiskBadge,
  Button, Avatar, ProgressRing, PageHeader, LineChart, BarChart,
} from '@/components/ui';
import { participants, sessions } from '@/data';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

export function OrgDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

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
          trend={{ value: '124 new', up: true }}
          color="secondary"
        />
        <MetricCard
          label="Scheduled Upcoming Tests"
          value="5"
          icon={<Calendar size={20} />}
          color="info"
        />
        <MetricCard
          label="Completed Submissions"
          value="1,240"
          icon={<CheckCircle2 size={20} />}
          trend={{ value: '8% pass rate', up: true }}
          color="success"
        />
      </div>

      {/* Live Exam Integrity & Review Queue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Pending Manual Grading"
          value="38"
          icon={<ClipboardList size={20} />}
          color="warning"
        />
        <MetricCard
          label="Proctoring Anomaly Flags"
          value="7"
          icon={<AlertCircle size={20} />}
          color="danger"
        />
        <MetricCard
          label="Concurrent Live Sessions"
          value="3"
          icon={<Activity size={20} />}
          color="info"
        />
      </div>

      {/* Throughput Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Candidate Assessment Activity"
            subtitle="Weekly completed candidate attempts"
            icon={<TrendingUp size={18} />}
          />
          <CardBody>
            <LineChart
              data={[
                { label: 'W1', value: 120 }, { label: 'W2', value: 180 }, { label: 'W3', value: 150 },
                { label: 'W4', value: 220 }, { label: 'W5', value: 190 }, { label: 'W6', value: 280 },
                { label: 'W7', value: 240 }, { label: 'W8', value: 310 },
              ]}
              color="#2563eb"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Assessment Volume by Format"
            subtitle="Question formats tested across active exams"
            icon={<BarChart3 size={18} />}
          />
          <CardBody>
            <BarChart
              data={[
                { label: 'MCQ Test', value: 420 },
                { label: 'Coding Lab', value: 680 },
                { label: 'Theory Essay', value: 320 },
                { label: 'Skill Matrix', value: 180 },
                { label: 'Scenario Q', value: 90 },
                { label: 'Interview', value: 60 },
              ]}
              color="#0d9488"
            />
          </CardBody>
        </Card>
      </div>

      {/* Upcoming Exam Schedules & Integrity Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Upcoming Scheduled Assessments"
            subtitle="Scheduled cohorts and testing windows"
            icon={<Calendar size={18} />}
            action={
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ChevronRight size={15} />}
                onClick={() => onNavigate('org-sessions')}
              >
                View Roster
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {[
              { name: 'Data Structures Midterm Examination', time: 'Today, 2:00 PM', count: 45, type: 'Academic Exam' },
              { name: 'Full-Stack JavaScript Screening', time: 'Tomorrow, 9:00 AM', count: 120, type: 'Technical Hiring' },
              { name: 'Algorithm Optimization Lab', time: 'Aug 28, 10:00 AM', count: 28, type: 'Coding Lab' },
              { name: 'System Design Architecture Evaluation', time: 'Aug 29, 2:00 PM', count: 85, type: 'Subjective Assessment' },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-50 dark:hover:bg-accent-800/40 border border-transparent hover:border-accent-200 dark:hover:border-accent-700 transition-all cursor-pointer"
                onClick={() => onNavigate('org-sessions')}
              >
                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                  <FileText size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{s.name}</p>
                  <p className="text-[11px] text-accent-500 dark:text-accent-400">{s.time} · {s.type}</p>
                </div>
                <Badge variant="neutral">{s.count} Candidates</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Live Anomaly Review Queue */}
        <Card>
          <CardHeader
            title="Integrity Anomaly Queue"
            subtitle="Flagged sessions requiring examiner inspection"
            icon={<ShieldCheck size={18} />}
            action={
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ChevronRight size={15} />}
                onClick={() => onNavigate('org-proctoring')}
              >
                Review All
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {reviewQueue.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-50 dark:hover:bg-accent-800/40 border border-transparent hover:border-accent-200 dark:hover:border-accent-700 transition-all cursor-pointer"
                onClick={() => onNavigate('org-proctoring')}
              >
                <Avatar name={s.participantName} color={s.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{s.participantName}</p>
                    <RiskBadge level={s.riskScore > 50 ? 'High' : 'Medium'} />
                  </div>
                  <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{s.assessmentTitle}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onNavigate('org-proctoring')}>
                  Review
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default OrgDashboard;
