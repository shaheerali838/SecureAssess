import React, { useState } from 'react';
import {
  Clock, ShieldCheck, AlertCircle,
  CheckCircle2, Play, Download, Eye, MessageSquare, ChevronRight, Activity,
  MonitorPlay, Camera, Volume2, Maximize2
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, StatusBadge, RiskBadge, Button,
  ProgressRing, ProgressBar, PageHeader, Tabs
} from '@/components/ui';

export function SessionReview({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');

  const signals = [
    { label: 'Focus Changes', value: 2, max: 10, color: 'warning' },
    { label: 'Tab Changes', value: 1, max: 10, color: 'warning' },
    { label: 'Fullscreen Exits', value: 0, max: 5, color: 'success' },
    { label: 'Gaze Anomalies', value: 1, max: 10, color: 'warning' },
    { label: 'Connection Drops', value: 0, max: 5, color: 'success' },
  ];

  const timeline = [
    { time: '00:00', label: 'Session started', type: 'success' },
    { time: '00:15', label: 'Question 5 answered', type: 'info' },
    { time: '12:31', label: 'Focus shift recorded', type: 'warning' },
    { time: '19:04', label: 'Tab change recorded', type: 'warning' },
    { time: '26:18', label: 'Gaze anomaly flagged', type: 'warning' },
    { time: '45:32', label: 'Assessment submitted', type: 'success' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Session Review & Video Playback"
        subtitle="Ahmed Khan · CS101 Online Midterm Examination Full Recording"
        icon={<MonitorPlay size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Sessions', onClick: () => onNavigate('org-sessions') },
          { label: 'Session Review' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
              Export Stream
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Eye size={15} />}
              onClick={() => onNavigate('org-integrity-evidence')}
            >
              Examine Flags
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody className="p-0">
              <div className="relative aspect-video bg-accent-950 rounded-t-2xl overflow-hidden shadow-soft">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-accent-800 flex items-center justify-center mx-auto mb-3">
                      <Camera size={28} className="text-accent-500" />
                    </div>
                    <p className="text-accent-300 text-xs font-semibold">Proctoring Video Stream</p>
                    <p className="text-accent-500 text-[11px] mt-0.5">Ahmed Khan · Synchronized Audio & Webcam</p>
                  </div>
                </div>

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-600/90 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[11px] font-bold text-white">Recorded</span>
                </div>

                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent-950/80 backdrop-blur-sm border border-accent-800">
                  <span className="text-[11px] font-mono text-white">1:52:18</span>
                </div>

                <button className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Play size={24} className="text-white ml-1" />
                  </div>
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-accent-950/90 to-transparent">
                  <div className="flex items-center gap-3">
                    <button className="text-white/80 hover:text-white cursor-pointer"><Play size={16} /></button>
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '45%' }} />
                    </div>
                    <span className="text-[11px] text-white/80 font-mono">00:50:18 / 01:52:18</span>
                    <button className="text-white/80 hover:text-white cursor-pointer"><Volume2 size={16} /></button>
                    <button className="text-white/80 hover:text-white cursor-pointer"><Maximize2 size={15} /></button>
                  </div>
                </div>
              </div>

              {/* Timeline scrubber */}
              <div className="p-4 border-t border-accent-100 dark:border-accent-800">
                <p className="text-xs font-bold text-accent-700 dark:text-accent-300 mb-2">Event Scrubber</p>
                <div className="relative h-8">
                  <div className="absolute top-3 left-0 right-0 h-1.5 bg-accent-200 dark:bg-accent-800 rounded-full">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                  {timeline.map((e, i) => {
                    const maxTime = 112;
                    const mins = e.time.split(':').reduce((a, b) => a * 60 + parseInt(b), 0) / 60;
                    const pos = (mins / maxTime) * 100;
                    const colors = { success: 'bg-success-500', info: 'bg-primary-500', warning: 'bg-warning-500', danger: 'bg-danger-500' };
                    return (
                      <div key={i} className="absolute top-1.5 -translate-x-1/2 group" style={{ left: `${pos}%` }}>
                        <div className={`w-3 h-3 rounded-full ${colors[e.type]} ring-2 ring-white dark:ring-accent-900 cursor-pointer`} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap bg-accent-900 dark:bg-accent-800 text-white text-[10px] px-2 py-0.5 rounded shadow-soft z-10 font-mono">
                          {e.time} — {e.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-accent-400 font-mono mt-1">
                  <span>00:00</span>
                  <span>12:31</span>
                  <span>19:04</span>
                  <span>26:18</span>
                  <span>45:32</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Sidebar: Telemetry Breakdown */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Session Telemetry" icon={<ShieldCheck size={18} />} />
            <CardBody className="p-5 space-y-3">
              {signals.map((sig, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-accent-600 dark:text-accent-400">{sig.label}</span>
                    <span className="font-bold text-accent-900 dark:text-white font-mono">{sig.value} / {sig.max}</span>
                  </div>
                  <ProgressBar value={sig.value} max={sig.max} color={sig.color} size="sm" />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SessionReview;
