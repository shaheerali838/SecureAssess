import { useState, useEffect } from 'react';
import {
  Shield, Camera, Mic, Wifi, Monitor, CheckCircle2, XCircle, Loader,
  ArrowRight, HelpCircle, Lock, Volume2,
} from 'lucide-react';
import { Button, Card, CardBody, Badge } from '@/components/ui';








export function SystemCheck({ onNavigate }) {
  const [checks, setChecks] = useState([
    { label: 'Camera', icon: <Camera size={20} />, status: 'pending' },
    { label: 'Microphone', icon: <Mic size={20} />, status: 'pending' },
    { label: 'Internet Connection', icon: <Wifi size={20} />, status: 'pending' },
    { label: 'Browser Compatibility', icon: <Monitor size={20} />, status: 'pending' },
    { label: 'Fullscreen Mode', icon: <Monitor size={20} />, status: 'pending' },
    { label: 'Permissions', icon: <Lock size={20} />, status: 'pending' },
    { label: 'Secure Session', icon: <Shield size={20} />, status: 'pending' },
  ]);

  useEffect(() => {
    const runChecks = async () => {
      for (let i = 0; i < checks.length; i++) {
        setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'checking' } : c));
        await new Promise(r => setTimeout(r, 800));
        setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'passed' } : c));
      }
    };
    runChecks();
  }, []);

  const allPassed = checks.every(c => c.status === 'passed');

  return (
    <div className="min-h-screen bg-accent-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-accent-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900">SecureAssess</span>
          </div>
          <Badge variant="success" dot>Secure Session</Badge>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-bold font-display text-accent-900">Prepare for your assessment</h1>
            <p className="text-accent-500 mt-2">We'll verify your system is ready to begin.</p>
          </div>

          <Card>
            <CardBody className="space-y-3">
              {checks.map((check, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                  check.status === 'passed' ? 'bg-success-50' :
                  check.status === 'checking' ? 'bg-warning-50' :
                  check.status === 'failed' ? 'bg-danger-50' : 'bg-accent-50'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    check.status === 'passed' ? 'bg-success-100 text-success-600' :
                    check.status === 'checking' ? 'bg-warning-100 text-warning-600' :
                    check.status === 'failed' ? 'bg-danger-100 text-danger-600' : 'bg-accent-100 text-accent-400'
                  }`}>
                    {check.icon}
                  </div>
                  <span className="flex-1 text-sm font-medium text-accent-700">{check.label}</span>
                  {check.status === 'pending' && <span className="text-xs text-accent-400">Waiting</span>}
                  {check.status === 'checking' && <Loader size={18} className="text-warning-500 animate-spin" />}
                  {check.status === 'passed' && <CheckCircle2 size={20} className="text-success-500" />}
                  {check.status === 'failed' && <XCircle size={20} className="text-danger-500" />}
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Camera preview */}
          <Card className="mt-4">
            <CardBody>
              <div className="flex items-center gap-3 mb-3">
                <Volume2 size={18} className="text-accent-400" />
                <p className="text-sm font-medium text-accent-700">Camera & Microphone Preview</p>
              </div>
              <div className="aspect-video bg-accent-900 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Camera size={32} className="text-accent-600 mx-auto mb-2" />
                  <p className="text-xs text-accent-500">Camera preview will appear here</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button variant="primary" size="lg" fullWidth icon={<ArrowRight size={18} />} disabled={!allPassed} onClick={() => onNavigate('participant-consent')}>
              Continue
            </Button>
            <Button variant="outline" size="lg" icon={<HelpCircle size={18} />}>Need Help?</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
