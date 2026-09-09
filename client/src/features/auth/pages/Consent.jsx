import React, { useState } from 'react';
import {
  Shield, ArrowRight, ArrowLeft, X, Eye, Lock, Database,
  UserCheck, Clock
} from 'lucide-react';
import { Button, Card, CardBody } from '@/components/ui';

export function Consent({ onNavigate }) {
  const [agreed, setAgreed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white flex flex-col transition-colors duration-200 font-sans">
      <header className="bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900 dark:text-white tracking-tight">SecureAssess</span>
          </div>
          <button
            onClick={() => onNavigate('landing')}
            className="text-accent-400 hover:text-accent-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl font-bold font-display text-accent-900 dark:text-white">Proctoring & Integrity Consent</h1>
            <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">
              Please review the examination code of conduct and automated proctoring telemetry scope.
            </p>
          </div>

          <Card>
            <CardBody className="p-5 space-y-4">
              {[
                { icon: <Eye size={18} />, title: 'Monitored Data Streams', desc: 'Webcam feed, ambient audio, window blur/tab switches, and active fullscreen status are recorded.' },
                { icon: <Lock size={18} />, title: 'Purpose of Verification', desc: 'Ensures equitable, tamper-resistant examination conditions for accredited certifications.' },
                { icon: <Database size={18} />, title: 'Collected Telemetry', desc: 'Time-stamped anomaly markers, facial presence bounding boxes, and encrypted response logs.' },
                { icon: <UserCheck size={18} />, title: 'Human Review Protocol', desc: 'Only authorized course instructors and credentialing examiners have access to flagged sessions.' },
                { icon: <Clock size={18} />, title: 'GDPR & Data Retention', desc: 'Session artifacts are encrypted in transit and at rest, and purged according to institutional retention limits.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 shadow-soft">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-accent-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-accent-600 dark:text-accent-300 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold cursor-pointer"
            >
              {showDetails ? 'Hide' : 'Review'} Data Privacy Policy
            </button>
            <button onClick={() => onNavigate('landing')} className="text-xs text-accent-400 hover:text-accent-600 dark:hover:text-accent-300 cursor-pointer">
              Cancel
            </button>
          </div>

          {showDetails && (
            <Card className="mt-3 animate-fade-in">
              <CardBody className="p-4 space-y-2 text-xs text-accent-600 dark:text-accent-300 leading-relaxed">
                <p><strong className="text-accent-900 dark:text-white">Telemetry Safeguards:</strong> SecureAssess does not scan personal files or install invasive background kernel drivers.</p>
                <p><strong className="text-accent-900 dark:text-white">Fair Human-in-the-Loop Review:</strong> Automated algorithms produce flags for human review, never automatic failure.</p>
              </CardBody>
            </Card>
          )}

          <div className="mt-5">
            <label className="flex items-start gap-3 p-4 bg-white dark:bg-accent-900 rounded-2xl border border-accent-200 dark:border-accent-800 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors shadow-soft">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-accent-300 dark:border-accent-700 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <span className="text-xs text-accent-700 dark:text-accent-200 leading-relaxed font-medium">
                I understand and agree to the monitoring protocols described above. I confirm I will adhere to the academic honesty code throughout this examination.
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-5">
            <Button variant="outline" size="lg" icon={<ArrowLeft size={16} />} onClick={() => onNavigate('participant-system-check')}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<ArrowRight size={16} />}
              disabled={!agreed}
              onClick={() => onNavigate('participant-assessment')}
            >
              Enter Examination Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Consent;
