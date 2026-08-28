import React, { useState } from 'react';
import {
  Building2, ArrowRight, ArrowLeft, Check, Shield, Palette, Users,
  FileText, ShieldCheck, Sparkles, Upload, Plus, X
} from 'lucide-react';
import { Button, Card, CardBody, Input, Select, Badge } from '@/components/ui';

const steps = [
  { num: 1, label: 'Identity' },
  { num: 2, label: 'Domain' },
  { num: 3, label: 'Branding' },
  { num: 4, label: 'Roles' },
  { num: 5, label: 'Exam Policies' },
  { num: 6, label: 'Integrity' },
  { num: 7, label: 'Complete' },
];

const industries = [
  { value: 'education', label: 'Higher Education & Universities', desc: 'Examinations, semester tests, admissions, proctored grading' },
  { value: 'corporate', label: 'Corporate & Engineering Hiring', desc: 'Coding labs, technical interviews, pre-employment screening' },
  { value: 'aviation', label: 'Aviation, Defense & Compliance', desc: 'Type rating checks, flight regulation exams, secure certifications' },
  { value: 'healthcare', label: 'Healthcare & Medical Boards', desc: 'Clinical licensing, nursing certifications, board exams' },
];

const colorOptions = ['#2563eb', '#0d9488', '#7c3aed', '#059669', '#1e3a8a', '#d97706', '#dc2626', '#475569'];

export function Onboarding({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('education');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [roles, setRoles] = useState(['Organization Admin', 'Examiner', 'Candidate']);
  const [newRole, setNewRole] = useState('');

  const addRole = () => {
    if (newRole && !roles.includes(newRole)) {
      setRoles([...roles, newRole]);
      setNewRole('');
    }
  };

  const removeRole = (r) => setRoles(roles.filter((x) => x !== r));

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white transition-colors duration-200 font-sans">
      {/* Header */}
      <header className="bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900 dark:text-white tracking-tight">SecureAssess</span>
            <span className="text-accent-400">/</span>
            <span className="text-xs text-accent-500 dark:text-accent-400 font-semibold">Tenant Provisioning Wizard</span>
          </div>
          <button
            onClick={() => onNavigate('platform-dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent-500 dark:text-accent-400 hover:text-accent-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} /> Cancel Setup
          </button>
        </div>
      </header>

      {/* Stepper Progress */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold font-display text-accent-900 dark:text-white">Provision New Tenant Workspace</h1>
          <span className="text-xs text-accent-500 dark:text-accent-400 font-mono">Step {step} of {steps.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors ${
                  step === s.num
                    ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/50'
                    : step > s.num
                    ? 'bg-success-50 dark:bg-success-950/60 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800/50'
                    : 'bg-accent-100 dark:bg-accent-800/60 text-accent-400 border border-transparent'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step === s.num
                      ? 'bg-primary-600 text-white'
                      : step > s.num
                      ? 'bg-success-600 text-white'
                      : 'bg-accent-300 dark:bg-accent-700 text-white'
                  }`}
                >
                  {step > s.num ? <Check size={11} /> : s.num}
                </div>
                <span className="text-xs font-semibold hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded mx-1 ${step > s.num ? 'bg-success-400' : 'bg-accent-200 dark:bg-accent-800'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
                  <Building2 size={24} />
                </div>
                <h2 className="text-lg font-bold text-accent-900 dark:text-white">Organization Identity</h2>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">Tenant registration and contact points</p>
              </div>
              <Input label="Organization Name" placeholder="e.g. Stanford University" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Country / Jurisdiction" placeholder="United States" />
                <Input label="Website Domain" placeholder="https://stanford.edu" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Primary Administrator Name" placeholder="Dean of Engineering" />
                <Input label="Administrative Email" type="email" placeholder="admin@stanford.edu" />
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => setStep(2)}>Continue to Industry</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 dark:text-secondary-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-lg font-bold text-accent-900 dark:text-white">Accreditation & Domain</h2>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">Adapts rubric weights, security defaults, and terminology</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {industries.map((ind) => (
                  <button
                    key={ind.value}
                    onClick={() => setIndustry(ind.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      industry === ind.value
                        ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100'
                        : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 hover:border-accent-300 dark:hover:border-accent-600'
                    }`}
                  >
                    <p className="font-bold text-accent-900 dark:text-white text-xs">{ind.label}</p>
                    <p className="text-[11px] text-accent-500 dark:text-accent-400 mt-1 leading-relaxed">{ind.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
                  <Palette size={24} />
                </div>
                <h2 className="text-lg font-bold text-accent-900 dark:text-white">Workspace Branding</h2>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">Personalize colors and monograms for student examinees</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-2">Theme Accent Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrandColor(c)}
                      className={`w-9 h-9 rounded-xl transition-all cursor-pointer ${
                        brandColor === c ? 'ring-2 ring-offset-2 ring-accent-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-2">Portal Preview</label>
                <div className="flex items-center gap-3 p-4 bg-accent-50 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700/60 rounded-xl">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-soft" style={{ backgroundColor: brandColor }}>
                    {(orgName || 'Stanford').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-accent-900 dark:text-white text-xs">{orgName || 'Stanford University'}</p>
                    <p className="text-[11px] text-accent-500 dark:text-accent-400">Powered by SecureAssess Multi-Tenant Engine</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => setStep(2)}>Back</Button>
                <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => setStep(4)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 dark:text-secondary-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
                  <Users size={24} />
                </div>
                <h2 className="text-lg font-bold text-accent-900 dark:text-white">Role Hierarchy</h2>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">Tenant permissions and invigilator classifications</p>
              </div>

              <div className="space-y-2">
                {roles.map((r) => (
                  <div key={r} className="flex items-center justify-between p-3 bg-accent-50 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700/60 rounded-xl">
                    <span className="text-xs font-semibold text-accent-800 dark:text-accent-200">{r}</span>
                    <button onClick={() => removeRole(r)} className="text-accent-400 hover:text-danger-500 transition-colors p-1 cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input placeholder="Add custom role (e.g. External Auditor)..." value={newRole} onChange={(e) => setNewRole(e.target.value)} className="flex-1" />
                <Button variant="outline" icon={<Plus size={15} />} onClick={addRole}>Add</Button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => setStep(3)}>Back</Button>
                <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => setStep(5)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
                  <FileText size={24} />
                </div>
                <h2 className="text-lg font-bold text-accent-900 dark:text-white">Default Examination Policies</h2>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">Baseline presets for new assessment creation</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="Default Security Level" options={[{ value: 'standard', label: 'Standard' }, { value: 'monitored', label: 'Monitored' }, { value: 'secure', label: 'Secure Lock' }]} />
                <Select label="Default Assessment Type" options={[{ value: 'mcq', label: 'MCQ Assessment' }, { value: 'exam', label: 'University Exam' }, { value: 'skill', label: 'Coding Lab' }]} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Default Time Limit (Minutes)" type="number" defaultValue={90} />
                <Input label="Passing Score Threshold (%)" type="number" defaultValue={60} />
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => setStep(4)}>Back</Button>
                <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => setStep(6)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-lg font-bold text-accent-900 dark:text-white">Proctoring Telemetry Defaults</h2>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">Anti-cheat signals and enforcement policies</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Mandatory Webcam Video Stream', desc: 'Examinees must maintain active video throughout testing.', defaultChecked: true },
                  { label: 'Enforce Fullscreen Kiosk Mode', desc: 'Alerts examiners when candidate exits examination window.', defaultChecked: true },
                  { label: 'Browser Tab & Focus Switch Detection', desc: 'Time-stamps every instance the candidate shifts active applications.', defaultChecked: true },
                  { label: 'AI Multi-Person & Speech Flagging', desc: 'Detects secondary voices or unauthorized persons in frame.', defaultChecked: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-start justify-between p-3.5 bg-accent-50/60 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700/60 rounded-xl">
                    <div className="flex-1 mr-4">
                      <p className="text-xs font-bold text-accent-900 dark:text-white">{s.label}</p>
                      <p className="text-[11px] text-accent-500 dark:text-accent-400 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input type="checkbox" defaultChecked={s.defaultChecked} className="sr-only peer" />
                      <div className="w-10 h-5 bg-accent-300 dark:bg-accent-700 rounded-full peer peer-checked:bg-success-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => setStep(5)}>Back</Button>
                <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => setStep(7)}>Finalize Provisioning</Button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5 animate-fade-in max-w-lg mx-auto text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 flex items-center justify-center mx-auto mb-4 animate-scale-in shadow-soft">
                <Check size={32} />
              </div>
              <h2 className="text-xl font-bold font-display text-accent-900 dark:text-white">Tenant Workspace Provisioned!</h2>
              <p className="text-xs text-accent-500 dark:text-accent-400 leading-relaxed">
                The organization has been provisioned on the SecureAssess multi-tenant cluster. Faculty accounts can now log in and author assessments.
              </p>

              <div className="bg-accent-50 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700/60 rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-accent-500 dark:text-accent-400">Organization:</span><span className="font-bold text-accent-900 dark:text-white">{orgName || 'Stanford University'}</span></div>
                <div className="flex justify-between"><span className="text-accent-500 dark:text-accent-400">Domain:</span><span className="font-bold text-accent-900 dark:text-white capitalize">{industry}</span></div>
                <div className="flex justify-between"><span className="text-accent-500 dark:text-accent-400">Roles Configured:</span><span className="font-bold text-accent-900 dark:text-white">{roles.length} roles</span></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <Button variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => onNavigate('org-dashboard')}>
                  Enter Organization Workspace
                </Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate('platform-organizations')}>
                  View All Organizations
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Onboarding;
