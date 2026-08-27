import {
  LayoutDashboard, FileText, Users, Calendar, ClipboardList,
  ShieldCheck, TrendingUp, ChevronRight, Plus, Download, AlertCircle,
  CheckCircle2, Video, Activity, BarChart3,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, StatusBadge, RiskBadge,
  Button, Avatar, ProgressRing, PageHeader, LineChart, BarChart,
} from '@/components/ui';
import { participants, sessions, } from '@/data';






export function OrgDashboard({ onNavigate }) {
  const upcomingSessions = sessions.filter((s) => s.status === 'Completed' || s.status === 'Review Required').slice(0, 4);
  const reviewQueue = sessions.filter((s) => s.status === 'Review Required' || s.status === 'Flagged');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Sarah"
        subtitle="Here's an overview of your organization's assessment activity."
        icon={<LayoutDashboard size={22} />}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Download size={16} />}>Export Report</Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => onNavigate('org-assessment-builder')}>Create Assessment</Button>
          </>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Examinations" value="12" icon={<FileText size={22} />} trend={{ value: '2 new', up: true }} color="primary" />
        <MetricCard label="Students" value="8,420" icon={<Users size={22} />} trend={{ value: '124 new', up: true }} color="secondary" />
        <MetricCard label="Upcoming Exams" value="5" icon={<Calendar size={22} />} color="info" />
        <MetricCard label="Completed Assessments" value="1,240" icon={<CheckCircle2 size={22} />} trend={{ value: '8%', up: true }} color="success" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Pending Results" value="38" icon={<ClipboardList size={22} />} color="warning" />
        <MetricCard label="Sessions Requiring Review" value="7" icon={<AlertCircle size={22} />} color="danger" />
        <MetricCard label="Live Sessions" value="3" icon={<Activity size={22} />} color="info" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Assessment Activity" subtitle="Sessions over the last 8 weeks" icon={<TrendingUp size={18} />} />
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
          <CardHeader title="Assessment Volume" subtitle="By type this month" icon={<BarChart3 size={18} />} />
          <CardBody>
            <BarChart
              data={[
                { label: 'Exam', value: 420 }, { label: 'Quiz', value: 680 }, { label: 'MCQ', value: 320 },
                { label: 'Skill', value: 180 }, { label: 'Scen.', value: 90 }, { label: 'Intrv', value: 60 },
              ]}
              color="#14b8a6"
            />
          </CardBody>
        </Card>
      </div>

      {/* Upcoming sessions + Recent results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Upcoming Sessions"
            subtitle="Scheduled assessments and interviews"
            icon={<Calendar size={18} />}
            action={<Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} />} onClick={() => onNavigate('org-sessions')}>View All</Button>}
          />
          <CardBody className="space-y-3">
            {[
              { name: 'Data Structures Final Exam', time: 'Today, 2:00 PM', count: 45, type: 'Examination' },
              { name: 'University Admission Test', time: 'Tomorrow, 9:00 AM', count: 120, type: 'MCQ Test' },
              { name: 'React Developer Screening', time: 'Aug 28, 10:00 AM', count: 28, type: 'Skills Assessment' },
              { name: 'Online Midterm Examination', time: 'Aug 29, 2:00 PM', count: 85, type: 'Examination' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent-50 transition-colors cursor-pointer" onClick={() => onNavigate('org-sessions')}>
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-accent-800 truncate">{s.name}</p>
                  <p className="text-xs text-accent-500">{s.time} · {s.count} participants</p>
                </div>
                <Badge variant="neutral">{s.type}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent Results"
            subtitle="Latest completed assessments"
            icon={<CheckCircle2 size={18} />}
            action={<Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} />} onClick={() => onNavigate('org-participants')}>View All</Button>}
          />
          <CardBody className="space-y-3">
            {participants.filter((p) => p.status === 'Completed').slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent-50 transition-colors cursor-pointer" onClick={() => onNavigate('org-participant-profile')}>
                <Avatar name={p.name} color={p.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-accent-800 truncate">{p.name}</p>
                  <p className="text-xs text-accent-500 truncate">{p.assessment}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent-900">{p.score}%</p>
                  {p.integrityRisk && <RiskBadge level={p.integrityRisk} />}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Review queue + Integrity overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Review Queue"
            subtitle="Sessions requiring attention"
            icon={<AlertCircle size={18} />}
            action={<Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} />} onClick={() => onNavigate('org-sessions')}>View All</Button>}
          />
          <CardBody className="p-0">
            {reviewQueue.length > 0 ? (
              <div className="divide-y divide-accent-50">
                {reviewQueue.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent-50/50 transition-colors cursor-pointer" onClick={() => onNavigate('org-session-review')}>
                    <Avatar name={s.participant} color="#475569" size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-accent-800 truncate">{s.participant}</p>
                      <p className="text-xs text-accent-500 truncate">{s.assessment}</p>
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-accent-500">Integrity Score</p>
                      <p className="text-sm font-bold text-accent-900">{s.integrityScore}/100</p>
                    </div>
                    <RiskBadge level={s.integrityRisk} />
                    <StatusBadge status={s.status} />
                    <ChevronRight size={16} className="text-accent-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle2 size={32} className="text-success-500 mx-auto mb-2" />
                <p className="text-sm text-accent-600">No sessions require review</p>
                <p className="text-xs text-accent-400 mt-1">All current sessions are clear.</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Integrity Overview" subtitle="This month" icon={<ShieldCheck size={18} />} />
          <CardBody>
            <div className="flex flex-col items-center mb-4">
              <ProgressRing value={75} label="75%" sublabel="Low Risk" color="#22c55e" size={120} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-success-500" /> Low Risk</span>
                <span className="font-semibold text-accent-800">149</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-warning-500" /> Medium Risk</span>
                <span className="font-semibold text-accent-800">26</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-danger-500" /> High Risk</span>
                <span className="font-semibold text-accent-800">7</span>
              </div>
              <div className="pt-2 border-t border-accent-100 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent-600">Total Sessions Analyzed</span>
                  <span className="font-bold text-accent-900">182</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader title="Recent Activity" subtitle="Latest events in your organization" icon={<Activity size={18} />} />
        <CardBody className="p-0">
          <div className="divide-y divide-accent-50">
            {[
              { icon: <CheckCircle2 size={16} />, color: 'text-success-600 bg-success-50', text: 'Ahmed Khan completed Online Midterm Examination', time: '2 minutes ago' },
              { icon: <FileText size={16} />, color: 'text-primary-600 bg-primary-50', text: 'New assessment "Data Structures Final Exam" was published', time: '1 hour ago' },
              { icon: <Video size={16} />, color: 'text-info-600 bg-info-50', text: 'Interview completed with Sarah Williams for Pilot Training Program', time: '3 hours ago' },
              { icon: <AlertCircle size={16} />, color: 'text-danger-600 bg-danger-50', text: 'Integrity flag raised for Fatima Zahra — Aviation Safety Assessment', time: '5 hours ago' },
              { icon: <Users size={16} />, color: 'text-secondary-600 bg-secondary-50', text: '12 new students invited to University Admission Test', time: 'Yesterday' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center shrink-0`}>{a.icon}</div>
                <p className="text-sm text-accent-700 flex-1">{a.text}</p>
                <span className="text-xs text-accent-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
