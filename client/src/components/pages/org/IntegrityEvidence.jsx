import {
 ShieldCheck, AlertCircle, Clock, Activity, Eye, X,
  MessageSquare, CheckCircle2, Camera, Download,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, RiskBadge, Button, ProgressRing,
  ProgressBar, PageHeader,
} from '@/components/ui';






export function IntegrityEvidence({ onNavigate }) {
  const flag = {
    title: 'Potential Unauthorized Activity',
    timestamp: '00:26:18',
    source: 'Session Monitoring',
    confidence: 'High',
    context: 'Multiple focus changes and tab switches detected during assessment session, suggesting possible reference to external materials.',
    riskLevel: 'High' ,
    participant: 'Fatima Zahra',
    session: 'Aviation Safety Assessment',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrity Evidence"
        subtitle="Detailed review of integrity signals"
        icon={<ShieldCheck size={22} />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Integrity', onClick: () => onNavigate('org-integrity') },
          { label: 'Evidence' },
        ]}
        actions={<Button variant="outline" size="sm" icon={<Download size={16} />}>Export Evidence</Button>}
      />

      {/* Signal header */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="text-lg font-bold font-display text-accent-900">{flag.title}</h2>
                <RiskBadge level={flag.riskLevel} />
                <Badge variant="neutral">Confidence: {flag.confidence}</Badge>
              </div>
              <p className="text-sm text-accent-600">{flag.context}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-accent-500 flex-wrap">
                <span className="flex items-center gap-1.5"><Clock size={14} /> {flag.timestamp}</span>
                <span className="flex items-center gap-1.5"><Activity size={14} /> {flag.source}</span>
                <span className="flex items-center gap-1.5"><AlertCircle size={14} /> {flag.participant}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evidence preview */}
        <Card>
          <CardHeader title="Evidence Preview" subtitle="Captured during session" icon={<Camera size={18} />} />
          <CardBody>
            <div className="aspect-video bg-accent-900 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden">
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-danger-600 text-white text-xs font-mono">{flag.timestamp}</div>
              <Camera size={40} className="text-accent-600" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-accent-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent-200 transition-colors">
                  <Camera size={16} className="text-accent-400" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Signal details */}
        <Card>
          <CardHeader title="Signal Details" icon={<Activity size={18} />} />
          <CardBody className="space-y-4">
            <div className="flex items-center justify-around mb-2">
              <ProgressRing value={68} label="68" sublabel="Risk Score" color="#ef4444" size={100} />
              <div className="space-y-2 flex-1 ml-4">
                {[
                  { label: 'Focus Changes', value: 12, max: 15 },
                  { label: 'Tab Changes', value: 8, max: 15 },
                  { label: 'Fullscreen Exits', value: 3, max: 5 },
                  { label: 'Gaze Anomalies', value: 5, max: 10 },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-accent-600">{s.label}</span>
                      <span className="font-semibold text-accent-800">{s.value}</span>
                    </div>
                    <ProgressBar value={s.value} max={s.max} color="danger" size="sm" />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-accent-100 space-y-2">
              {[
                { label: 'Signal Type', value: flag.title },
                { label: 'Source', value: flag.source },
                { label: 'Confidence', value: flag.confidence },
                { label: 'Timestamp', value: flag.timestamp },
                { label: 'Participant', value: flag.participant },
                { label: 'Session', value: flag.session },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-accent-500">{item.label}</span>
                  <span className="font-medium text-accent-800">{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Context */}
      <Card>
        <CardHeader title="Context" icon={<Eye size={18} />} />
        <CardBody>
          <p className="text-sm text-accent-600 leading-relaxed">
            {flag.context} The system detected a pattern of {12} focus changes and {8} tab switches within a 5-minute window during the assessment. The participant exited fullscreen mode {3} times, which triggered automatic session pauses. Gaze analysis indicated {5} instances where the participant's gaze direction shifted away from the screen for extended periods.
          </p>
          <div className="mt-4 p-4 bg-accent-50 rounded-lg">
            <p className="text-sm text-accent-600 italic">
              "Integrity signals are indicators for review and do not independently determine misconduct."
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader title="Review Actions" icon={<MessageSquare size={18} />} />
        <CardBody className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-accent-700 mb-2">Reviewer Note</label>
            <textarea
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-accent-300 bg-white text-accent-800 placeholder:text-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-y"
              rows={3}
              placeholder="Add your review notes..."
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="primary" icon={<CheckCircle2 size={16} />}>Mark as Reviewed</Button>
            <Button variant="outline" icon={<Eye size={16} />} onClick={() => onNavigate('org-session-review')}>View Full Session</Button>
            <Button variant="ghost" icon={<X size={16} />}>Dismiss Flag</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
