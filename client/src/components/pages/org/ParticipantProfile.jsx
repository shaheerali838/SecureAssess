import { useState } from 'react';
import {
 Mail, Calendar, Award, ShieldCheck, Video, FileText,
  Activity, TrendingUp, AlertCircle, CheckCircle2, Download,
  ChevronRight, Eye, MonitorPlay,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, StatusBadge, RiskBadge, Button,
  Avatar, ProgressRing, ProgressBar, Tabs, PageHeader,
} from '@/components/ui';






export function ParticipantProfile({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { label: 'Overview', key: 'overview' },
    { label: 'Assessment', key: 'assessment' },
    { label: 'Interview', key: 'interview' },
    { label: 'Evaluation', key: 'evaluation' },
    { label: 'Integrity', key: 'integrity' },
    { label: 'Sessions', key: 'sessions' },
    { label: 'Activity', key: 'activity' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ahmed Khan"
        subtitle="Computer Science 101 · Online Midterm Examination"
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Participants', onClick: () => onNavigate('org-participants') },
          { label: 'Ahmed Khan' },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Download size={16} />}>Export Report</Button>
            <Button variant="primary" size="sm" icon={<Video size={16} />} onClick={() => onNavigate('org-session-review')}>View Session</Button>
          </>
        }
      />

      {/* Profile header card */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar name="Ahmed Khan" color="#2563eb" size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold font-display text-accent-900">Ahmed Khan</h2>
              <StatusBadge status="Completed" />
              <RiskBadge level="Low" />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-accent-500 flex-wrap">
              <span className="flex items-center gap-1.5"><Mail size={14} /> ahmed.khan@student.edu</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> Aug 25, 2026</span>
              <span className="flex items-center gap-1.5"><FileText size={14} /> Online Midterm Examination</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Score metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><Award size={20} /></div>
            <p className="text-sm text-accent-500">Assessment Score</p>
          </div>
          <p className="text-2xl font-bold font-display text-accent-900">78%</p>
          <ProgressBar value={78} color="primary" size="sm" className="mt-2" />
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary-50 text-secondary-600 flex items-center justify-center"><Video size={20} /></div>
            <p className="text-sm text-accent-500">Interview Score</p>
          </div>
          <p className="text-2xl font-bold font-display text-accent-400">—</p>
          <p className="text-xs text-accent-400 mt-2">No interview conducted</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success-50 text-success-600 flex items-center justify-center"><TrendingUp size={20} /></div>
            <p className="text-sm text-accent-500">Overall Score</p>
          </div>
          <p className="text-2xl font-bold font-display text-accent-900">78%</p>
          <ProgressBar value={78} color="success" size="sm" className="mt-2" />
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success-50 text-success-600 flex items-center justify-center"><ShieldCheck size={20} /></div>
            <p className="text-sm text-accent-500">Integrity Risk</p>
          </div>
          <p className="text-2xl font-bold font-display text-success-600">18/100</p>
          <Badge variant="success" dot className="mt-1">Low Risk</Badge>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          <Card>
            <CardHeader title="Assessment Summary" icon={<FileText size={18} />} />
            <CardBody className="space-y-3">
              {[
                { label: 'Assessment', value: 'Online Midterm Examination' },
                { label: 'Type', value: 'Examination' },
                { label: 'Duration', value: '1h 52m' },
                { label: 'Questions', value: '45' },
                { label: 'Correct Answers', value: '35 / 45' },
                { label: 'Passing Score', value: '50%' },
                { label: 'Achieved Score', value: '78%' },
                { label: 'Status', value: 'Passed' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-accent-500">{item.label}</span>
                  <span className="font-medium text-accent-800">{item.value}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Integrity Summary" icon={<ShieldCheck size={18} />} action={<Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} />} onClick={() => onNavigate('org-integrity')}>Details</Button>} />
            <CardBody>
              <div className="flex items-center gap-6 mb-4">
                <ProgressRing value={18} label="18" sublabel="/ 100" color="#22c55e" size={100} />
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Focus Changes', value: 2 },
                    { label: 'Tab Changes', value: 1 },
                    { label: 'Fullscreen Exits', value: 0 },
                    { label: 'Gaze Anomalies', value: 1 },
                    { label: 'Connection Interruptions', value: 0 },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-accent-500">{s.label}</span>
                      <span className="font-semibold text-accent-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-accent-50 rounded-lg">
                <p className="text-xs text-accent-500 italic">"Integrity signals are indicators for review and do not independently determine misconduct."</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'assessment' && (
        <Card className="animate-fade-in">
          <CardHeader title="Assessment Results" subtitle="Question-by-question breakdown" icon={<FileText size={18} />} />
          <CardBody className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent-50">
                <span className="text-xs font-bold text-accent-400 w-6">Q{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm text-accent-700 truncate">Question {i + 1} content preview...</p>
                </div>
                {i % 7 !== 0 ? (
                  <Badge variant="success" icon={<CheckCircle2 size={12} />}>Correct</Badge>
                ) : (
                  <Badge variant="danger" icon={<AlertCircle size={12} />}>Incorrect</Badge>
                )}
                <span className="text-xs text-accent-400 hidden sm:inline">+{i % 7 !== 0 ? 2 : 0} pts</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {activeTab === 'interview' && (
        <Card className="animate-fade-in">
          <CardBody>
            <div className="text-center py-12">
              <Video size={32} className="text-accent-300 mx-auto mb-3" />
              <p className="text-sm text-accent-500">No interview was conducted for this participant.</p>
              <Button variant="outline" size="sm" className="mt-4" icon={<Video size={16} />}>Schedule Interview</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'evaluation' && (
        <Card className="animate-fade-in">
          <CardHeader title="Evaluation" subtitle="Reviewer scores and recommendation" icon={<Award size={18} />} />
          <CardBody className="space-y-4">
            {[
              { label: 'Communication', score: 4 },
              { label: 'Knowledge', score: 3 },
              { label: 'Problem Solving', score: 4 },
              { label: 'Decision Making', score: 3 },
              { label: 'Professionalism', score: 5 },
            ].map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-accent-600">{c.label}</span>
                  <span className="text-sm font-bold text-accent-800">{c.score}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className={`flex-1 h-2 rounded-full ${s <= c.score ? 'bg-primary-500' : 'bg-accent-200'}`} />
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-accent-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-accent-700">Recommendation</span>
                <Badge variant="success" dot>Positive</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'integrity' && (
        <Card className="animate-fade-in">
          <CardHeader title="Integrity Details" icon={<ShieldCheck size={18} />} />
          <CardBody className="space-y-3">
            {[
              { time: '00:12:31', label: 'Focus change detected', type: 'warning' },
              { time: '00:19:04', label: 'Tab change detected', type: 'warning' },
              { time: '00:26:18', label: 'Gaze anomaly recorded', type: 'warning' },
              { time: '00:45:32', label: 'Assessment submitted', type: 'success' },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent-50">
                <div className={`w-2 h-2 rounded-full ${e.type === 'success' ? 'bg-success-500' : 'bg-warning-500'}`} />
                <span className="text-xs font-mono text-accent-400">{e.time}</span>
                <span className="text-sm text-accent-700">{e.label}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {activeTab === 'sessions' && (
        <Card className="animate-fade-in">
          <CardHeader title="Sessions" subtitle="All assessment and interview sessions" icon={<MonitorPlay size={18} />} />
          <CardBody className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-50 cursor-pointer hover:bg-accent-100 transition-colors" onClick={() => onNavigate('org-session-review')}>
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><MonitorPlay size={18} /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-accent-800">Online Midterm Examination</p>
                <p className="text-xs text-accent-500">Aug 25, 2026 · 1h 52m</p>
              </div>
              <StatusBadge status="Completed" />
              <ChevronRight size={16} className="text-accent-400" />
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card className="animate-fade-in">
          <CardHeader title="Activity Timeline" icon={<Activity size={18} />} />
          <CardBody className="space-y-3">
            {[
              { icon: <CheckCircle2 size={14} />, color: 'text-success-600 bg-success-50', text: 'Assessment submitted — 78%', time: 'Aug 25, 2:32 PM' },
              { icon: <Eye size={14} />, color: 'text-primary-600 bg-primary-50', text: 'Started assessment session', time: 'Aug 25, 12:40 PM' },
              { icon: <ShieldCheck size={14} />, color: 'text-info-600 bg-info-50', text: 'System check completed', time: 'Aug 25, 12:30 PM' },
              { icon: <Mail size={14} />, color: 'text-secondary-600 bg-secondary-50', text: 'Invitation sent', time: 'Aug 23, 9:00 AM' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg ${a.color} flex items-center justify-center shrink-0`}>{a.icon}</div>
                <p className="text-sm text-accent-700 flex-1">{a.text}</p>
                <span className="text-xs text-accent-400">{a.time}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
