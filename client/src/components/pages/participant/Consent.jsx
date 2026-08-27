import {
  Shield, ArrowRight, ArrowLeft, X, Eye, Lock, Database,
  UserCheck, Clock,
} from 'lucide-react';
import { Button, Card, CardBody, } from '@/components/ui';
import { useState } from 'react';






export function Consent({ onNavigate }) {
  const [agreed, setAgreed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-accent-50 flex flex-col">
      <header className="bg-white border-b border-accent-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900">SecureAssess</span>
          </div>
          <button onClick={() => onNavigate('landing')} className="text-accent-400 hover:text-accent-700">
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-bold font-display text-accent-900">Before you begin</h1>
            <p className="text-accent-500 mt-2">Please review how your assessment session will be monitored.</p>
          </div>

          <Card>
            <CardBody className="space-y-4">
              {[
                { icon: <Eye size={18} />, title: 'What may be monitored', desc: 'Camera feed, microphone audio, browser tab focus, and fullscreen status may be recorded during your session.' },
                { icon: <Lock size={18} />, title: 'Why monitoring is required', desc: 'Monitoring helps ensure a fair and secure assessment environment for all participants.' },
                { icon: <Database size={18} />, title: 'What information may be collected', desc: 'Session video, integrity signals (focus changes, tab switches), and assessment responses.' },
                { icon: <UserCheck size={18} />, title: 'Who can access it', desc: 'Authorized reviewers in your organization can access session recordings and integrity reports.' },
                { icon: <Clock size={18} />, title: 'How information is retained', desc: 'Session data is retained according to your organization\'s data retention policy.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-accent-800">{item.title}</p>
                    <p className="text-sm text-accent-600 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => setShowDetails(!showDetails)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              {showDetails ? 'Hide' : 'Review'} Privacy Details
            </button>
            <button onClick={() => onNavigate('landing')} className="text-sm text-accent-400 hover:text-accent-700">Cancel</button>
          </div>

          {showDetails && (
            <Card className="mt-3 animate-fade-in">
              <CardBody>
                <div className="space-y-2 text-sm text-accent-600">
                  <p><strong className="text-accent-800">Data Collection:</strong> SecureAssess collects session video, audio, and behavioral signals during assessments to ensure integrity.</p>
                  <p><strong className="text-accent-800">Data Usage:</strong> Collected data is used solely for assessment integrity review by authorized personnel.</p>
                  <p><strong className="text-accent-800">Data Storage:</strong> Data is encrypted and stored securely. Access is restricted to authorized reviewers.</p>
                  <p><strong className="text-accent-800">Your Rights:</strong> You may request access to your session data or deletion according to your organization's policies.</p>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="mt-6">
            <label className="flex items-start gap-3 p-4 bg-white rounded-xl border border-accent-200 cursor-pointer hover:border-primary-300 transition-colors">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded border-accent-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-accent-700">
                I understand and consent to the monitoring described above. I agree to follow the assessment rules and integrity policies.
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" size="lg" icon={<ArrowLeft size={18} />} onClick={() => onNavigate('participant-system-check')}>Back</Button>
            <Button variant="primary" size="lg" fullWidth icon={<ArrowRight size={18} />} disabled={!agreed} onClick={() => onNavigate('participant-assessment')}>
              Continue to Assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
