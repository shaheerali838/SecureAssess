import {
 Clock, ShieldCheck, AlertCircle,
  CheckCircle2, Play, Download, Eye, MessageSquare, ChevronRight, Activity,
  MonitorPlay, Camera, Volume2, Maximize2,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, StatusBadge, RiskBadge, Button,
 ProgressRing, ProgressBar, PageHeader, Tabs,
} from '@/components/ui';
import { useState } from 'react';






export function SessionReview({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');

  const signals = [
    { label: 'Focus Changes', value: 2, max: 10, color: 'warning'  },
    { label: 'Tab Changes', value: 1, max: 10, color: 'warning'  },
    { label: 'Fullscreen Exits', value: 0, max: 5, color: 'success'  },
    { label: 'Gaze Anomalies', value: 1, max: 10, color: 'warning'  },
    { label: 'Connection Interruptions', value: 0, max: 5, color: 'success'  },
  ];

  const timeline = [
    { time: '00:00', label: 'Session started', type: 'success' },
    { time: '00:15', label: 'Question 5 answered', type: 'info' },
    { time: '12:31', label: 'Focus change detected', type: 'warning' },
    { time: '19:04', label: 'Tab change detected', type: 'warning' },
    { time: '26:18', label: 'Gaze anomaly recorded', type: 'warning' },
    { time: '45:32', label: 'Assessment submitted', type: 'success' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Session Review"
        subtitle="Ahmed Khan · Online Midterm Examination"
        icon={<MonitorPlay size={22} />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Sessions', onClick: () => onNavigate('org-sessions') },
          { label: 'Session Review' },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Download size={16} />}>Export</Button>
            <Button variant="primary" size="sm" icon={<Eye size={16} />} onClick={() => onNavigate('org-integrity-evidence')}>View Evidence</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left/Center: Video preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody className="p-0">
              {/* Video player mock */}
              <div className="relative aspect-video bg-accent-900 rounded-t-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-accent-700 flex items-center justify-center mx-auto mb-3">
                      <Camera size={32} className="text-accent-400" />
                    </div>
                    <p className="text-accent-400 text-sm">Session Recording</p>
                    <p className="text-accent-500 text-xs mt-1">Ahmed Khan · Online Midterm Examination</p>
                  </div>
                </div>
                {/* Recording badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-danger-600/90 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-medium text-white">Recorded</span>
                </div>
                {/* Duration */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent-950/80 backdrop-blur-sm">
                  <span className="text-xs font-medium text-white">1:52:18</span>
                </div>
                {/* Play button */}
                <button className="absolute inset-0 flex items-center justify-center group">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Play size={28} className="text-white ml-1" />
                  </div>
                </button>
                {/* Controls bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-accent-950/80 to-transparent">
                  <div className="flex items-center gap-3">
                    <button className="text-white/80 hover:text-white"><Play size={18} /></button>
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '45%' }} />
                    </div>
                    <span className="text-xs text-white/80 font-mono">00:50:18 / 01:52:18</span>
                    <button className="text-white/80 hover:text-white"><Volume2 size={18} /></button>
                    <button className="text-white/80 hover:text-white"><Maximize2 size={16} /></button>
                  </div>
                </div>
              </div>
              {/* Timeline scrubber */}
              <div className="p-4 border-t border-accent-100">
                <p className="text-xs font-medium text-accent-600 mb-2">Session Timeline</p>
                <div className="relative h-12">
                  {/* Timeline bar */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-accent-200 rounded-full">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                  {/* Event markers */}
                  {timeline.map((e, i) => {
                    const times = ['00:00', '00:15', '12:31', '19:04', '26:18', '45:32'];
                    const maxTime = 112; // 1:52 in minutes
                    const mins = e.time.split(':').reduce((a, b) => a * 60 + parseInt(b), 0) / 60;
                    const pos = (mins / maxTime) * 100;
                    const colors = { success: 'bg-success-500', info: 'bg-primary-500', warning: 'bg-warning-500', danger: 'bg-danger-500' };
                    return (
                      <div key={i} className="absolute top-2 -translate-x-1/2 group" style={{ left: `${pos}%` }}>
                        <div className={`w-3 h-3 rounded-full ${colors[e.type ]} ring-2 ring-white cursor-pointer`} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-accent-900 text-white text-xs px-2 py-1 rounded-md z-10">
                          {e.time} — {e.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-accent-400 mt-1">
                  <span>00:00</span>
                  <span>12:31</span>
                  <span>19:04</span>
                  <span>26:18</span>
                  <span>45:32</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Tabs */}
          <Tabs
            tabs={[
              { label: 'Overview', key: 'overview' },
              { label: 'Timeline', key: 'timeline' },
              { label: 'Evidence', key: 'evidence' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'overview' && (
            <Card className="animate-fade-in">
              <CardHeader title="Session Events" icon={<Activity size={18} />} />
              <CardBody className="space-y-2">
                {timeline.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent-50">
                    <div className={`w-2 h-2 rounded-full ${e.type === 'success' ? 'bg-success-500' : e.type === 'warning' ? 'bg-warning-500' : 'bg-primary-500'}`} />
                    <span className="text-xs font-mono text-accent-400 w-16">{e.time}</span>
                    <span className="text-sm text-accent-700">{e.label}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {activeTab === 'timeline' && (
            <Card className="animate-fade-in">
              <CardHeader title="Detailed Timeline" icon={<Clock size={18} />} />
              <CardBody>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-accent-200" />
                  {timeline.map((e, i) => (
                    <div key={i} className="relative pb-4 last:pb-0">
                      <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full ring-2 ring-white ${e.type === 'success' ? 'bg-success-500' : e.type === 'warning' ? 'bg-warning-500' : 'bg-primary-500'}`} />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-accent-400">{e.time}</span>
                        <span className="text-sm text-accent-700">{e.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'evidence' && (
            <Card className="animate-fade-in">
              <CardHeader title="Evidence" icon={<ShieldCheck size={18} />} action={<Button variant="ghost" size="sm" iconRight={<ChevronRight size={16} />} onClick={() => onNavigate('org-integrity-evidence')}>View All</Button>} />
              <CardBody>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-video bg-accent-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent-200 transition-colors">
                      <Camera size={24} className="text-accent-400" />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right: Session analysis */}
        <div className="space-y-4">
          {/* Scores */}
          <Card>
            <CardHeader title="Session Analysis" icon={<Activity size={18} />} />
            <CardBody className="space-y-4">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <ProgressRing value={78} label="78%" sublabel="Assessment" color="#2563eb" size={90} />
                </div>
                <div className="text-center">
                  <ProgressRing value={18} label="18" sublabel="Integrity" color="#22c55e" size={90} />
                </div>
              </div>
              <div className="pt-3 border-t border-accent-100 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent-500">Participant</span>
                  <span className="font-medium text-accent-800">Ahmed Khan</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent-500">Assessment</span>
                  <span className="font-medium text-accent-800 text-right">Online Midterm</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent-500">Duration</span>
                  <span className="font-medium text-accent-800">1h 52m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent-500">Date</span>
                  <span className="font-medium text-accent-800">Aug 25, 2026</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent-500">Status</span>
                  <StatusBadge status="Completed" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Integrity signals */}
          <Card>
            <CardHeader title="Integrity Risk" icon={<ShieldCheck size={18} />} action={<RiskBadge level="Low" />} />
            <CardBody>
              <div className="flex items-center justify-center mb-4">
                <ProgressRing value={18} label="18" sublabel="/ 100" color="#22c55e" size={120} />
              </div>
              <div className="space-y-2">
                {signals.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-accent-600">{s.label}</span>
                      <span className="font-semibold text-accent-800">{s.value}</span>
                    </div>
                    <ProgressBar value={s.value} max={s.max} color={s.color} size="sm" />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <Card>
            <CardBody className="space-y-2">
              <Button variant="outline" fullWidth icon={<MessageSquare size={16} />}>Add Reviewer Note</Button>
              <Button variant="outline" fullWidth icon={<CheckCircle2 size={16} />}>Mark as Reviewed</Button>
              <Button variant="outline" fullWidth icon={<AlertCircle size={16} />}>Flag for Investigation</Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
