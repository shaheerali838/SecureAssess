import React, { useState, useEffect } from 'react';
import {
  Shield, Camera, Mic, Wifi, Monitor, CheckCircle2, XCircle, Loader,
  ArrowRight, HelpCircle, Lock, Volume2
} from 'lucide-react';
import { Button, Card, CardBody, Badge } from '@/components/ui';

export function SystemCheck({ onNavigate }) {
  const [checks, setChecks] = useState([
    { label: 'Camera Hardware & Resolution', icon: <Camera size={18} />, status: 'pending' },
    { label: 'Microphone Audio Input', icon: <Mic size={18} />, status: 'pending' },
    { label: 'Internet Latency & Bandwidth', icon: <Wifi size={18} />, status: 'pending' },
    { label: 'Browser Engine Compatibility', icon: <Monitor size={18} />, status: 'pending' },
    { label: 'Fullscreen & Window Focus Lock', icon: <Monitor size={18} />, status: 'pending' },
    { label: 'Media Device Permissions', icon: <Lock size={18} />, status: 'pending' },
    { label: 'Encrypted Proctoring Tunnel', icon: <Shield size={18} />, status: 'pending' },
  ]);

  useEffect(() => {
    let mounted = true;
    const runChecks = async () => {
      for (let i = 0; i < checks.length; i++) {
        if (!mounted) break;
        setChecks((prev) => prev.map((c, idx) => (idx === i ? { ...c, status: 'checking' } : c)));
        await new Promise((r) => setTimeout(r, 600));
        if (!mounted) break;
        setChecks((prev) => prev.map((c, idx) => (idx === i ? { ...c, status: 'passed' } : c)));
      }
    };
    runChecks();
    return () => {
      mounted = false;
    };
  }, []);

  const allPassed = checks.every((c) => c.status === 'passed');

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white flex flex-col transition-colors duration-200 font-sans">
      {/* Header */}
      <header className="bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900 dark:text-white tracking-tight">SecureAssess</span>
          </div>
          <Badge variant="success" dot>Environment Check</Badge>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl font-bold font-display text-accent-900 dark:text-white">Hardware & Network Readiness</h1>
            <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">
              Verifying your camera, microphone, and browser environment before beginning your examination.
            </p>
          </div>

          <Card>
            <CardBody className="p-4 sm:p-5 space-y-2.5">
              {checks.map((check, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                    check.status === 'passed'
                      ? 'bg-success-50/50 dark:bg-success-950/30 border-success-200 dark:border-success-800/40 text-success-900 dark:text-success-200'
                      : check.status === 'checking'
                      ? 'bg-warning-50/50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-800/40 text-warning-900 dark:text-warning-200'
                      : check.status === 'failed'
                      ? 'bg-danger-50/50 dark:bg-danger-950/30 border-danger-200 dark:border-danger-800/40 text-danger-900 dark:text-danger-200'
                      : 'bg-accent-50 dark:bg-accent-800/40 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      check.status === 'passed'
                        ? 'bg-success-100 dark:bg-success-900/60 text-success-600 dark:text-success-400'
                        : check.status === 'checking'
                        ? 'bg-warning-100 dark:bg-warning-900/60 text-warning-600 dark:text-warning-400'
                        : check.status === 'failed'
                        ? 'bg-danger-100 dark:bg-danger-900/60 text-danger-600 dark:text-danger-400'
                        : 'bg-accent-100 dark:bg-accent-800 text-accent-400'
                    }`}
                  >
                    {check.icon}
                  </div>
                  <span className="flex-1 text-xs font-semibold text-accent-900 dark:text-white">{check.label}</span>
                  {check.status === 'pending' && <span className="text-[11px] text-accent-400">Waiting...</span>}
                  {check.status === 'checking' && <Loader size={16} className="text-warning-500 animate-spin" />}
                  {check.status === 'passed' && <CheckCircle2 size={18} className="text-success-500" />}
                  {check.status === 'failed' && <XCircle size={18} className="text-danger-500" />}
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Camera Feed Simulator */}
          <Card className="mt-4">
            <CardBody className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 size={16} className="text-accent-400" />
                <p className="text-xs font-bold text-accent-900 dark:text-white">Camera & Microphone Preview</p>
              </div>
              <div className="aspect-video bg-accent-900 dark:bg-accent-950 rounded-xl border border-accent-800 flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                  <Camera size={32} className="text-accent-600 mx-auto mb-2" />
                  <p className="text-xs text-accent-400 font-medium">Camera active · Optimal lighting detected</p>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-950/80 backdrop-blur-sm border border-accent-800 text-[10px] text-success-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" /> HD 1080p 30fps
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<ArrowRight size={18} />}
              disabled={!allPassed}
              onClick={() => onNavigate('participant-consent')}
            >
              Continue to Consent & Guidelines
            </Button>
            <Button variant="outline" size="lg" icon={<HelpCircle size={18} />}>
              Troubleshoot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemCheck;
