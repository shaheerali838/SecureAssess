import { useState } from 'react';
import {
  Shield, ArrowLeft, ArrowRight, Check, Building2, Palette,
  Users, FileText, ShieldCheck, Sparkles, Upload, Plus, X,
} from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui';






const steps = [
  { num: 1, label: 'Organization', icon: <Building2 size={18} /> },
  { num: 2, label: 'Industry', icon: <Sparkles size={18} /> },
  { num: 3, label: 'Branding', icon: <Palette size={18} /> },
  { num: 4, label: 'Users & Roles', icon: <Users size={18} /> },
  { num: 5, label: 'Assessment', icon: <FileText size={18} /> },
  { num: 6, label: 'Security', icon: <ShieldCheck size={18} /> },
  { num: 7, label: 'Complete', icon: <Check size={18} /> },
];

const industries = [
  { value: 'education', label: 'Education', desc: 'Universities, schools, training institutes' },
  { value: 'corporate', label: 'Corporate / Hiring', desc: 'Companies, recruitment agencies, HR' },
  { value: 'aviation', label: 'Aviation', desc: 'Airlines, flight academies' },
  { value: 'healthcare', label: 'Healthcare', desc: 'Hospitals, medical institutions' },
  { value: 'finance', label: 'Finance', desc: 'Banks, financial institutions' },
  { value: 'certification', label: 'Professional Certification', desc: 'Certification authorities' },
  { value: 'government', label: 'Government / Institutions', desc: 'Government organizations' },
];

const colorOptions = ['#1d4ed8', '#0d9488', '#7c3aed', '#0f766e', '#1e3a8a', '#b45309', '#dc2626', '#475569'];

const terminologySets = {
  education: [{ participants: 'Students', assessments: 'Examinations', programs: 'Courses', results: 'Results' }],
  corporate: [{ participants: 'Candidates', assessments: 'Assessments', programs: 'Jobs', results: 'Hiring Decisions' }],
  aviation: [{ participants: 'Applicants', assessments: 'Pilot Assessments', programs: 'Programs', results: 'Evaluator Reviews' }],
};

export function Onboarding({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState('education');
  const [brandColor, setBrandColor] = useState('#1d4ed8');
  const [orgName, setOrgName] = useState('');
  const [roles, setRoles] = useState(['Organization Admin', 'Examiner', 'Teacher']);
  const [newRole, setNewRole] = useState('');

  const addRole = () => {
    if (newRole && !roles.includes(newRole)) {
      setRoles([...roles, newRole]);
      setNewRole('');
    }
  };

  const removeRole = (r) => setRoles(roles.filter((x) => x !== r));

  return (
    <div className="min-h-screen bg-accent-50">
      {/* Header */}
      <header className="bg-white border-b border-accent-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900">SecureAssess</span>
            <span className="text-accent-400">/</span>
            <span className="text-sm text-accent-600">Onboarding</span>
          </div>
          <button onClick={() => onNavigate('platform-dashboard')} className="flex items-center gap-1.5 text-sm text-accent-500 hover:text-accent-800 transition-colors">
            <ArrowLeft size={16} /> Cancel
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold font-display text-accent-900">Set up your organization</h1>
          <span className="text-sm text-accent-500">Step {step} of {steps.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${step === s.num ? 'bg-primary-50 text-primary-700' : step > s.num ? 'bg-success-50 text-success-700' : 'bg-accent-100 text-accent-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s.num ? 'bg-primary-600 text-white' : step > s.num ? 'bg-success-600 text-white' : 'bg-accent-300 text-white'}`}>
                  {step > s.num ? <Check size={12} /> : s.num}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded ${step > s.num ? 'bg-success-400' : 'bg-accent-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3"><Building2 size={28} /></div>
                <h2 className="text-xl font-bold text-accent-900">Organization Information</h2>
                <p className="text-sm text-accent-500 mt-1">Tell us about your organization</p>
              </div>
              <Input label="Organization Name" placeholder="e.g. Virtual University" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Country" placeholder="Pakistan" />
                <Input label="Website" placeholder="https://..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Contact Name" placeholder="Primary contact" />
                <Input label="Contact Email" type="email" placeholder="contact@org.com" />
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => setStep(2)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary-50 text-secondary-600 flex items-center justify-center mx-auto mb-3"><Sparkles size={28} /></div>
                <h2 className="text-xl font-bold text-accent-900">Choose Your Industry</h2>
                <p className="text-sm text-accent-500 mt-1">We'll adapt the platform terminology accordingly</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {industries.map((ind) => (
                  <button
                    key={ind.value}
                    onClick={() => setIndustry(ind.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${industry === ind.value ? 'border-primary-500 bg-primary-50' : 'border-accent-200 hover:border-accent-300'}`}
                  >
                    <p className="font-semibold text-accent-900 text-sm">{ind.label}</p>
                    <p className="text-xs text-accent-500 mt-0.5">{ind.desc}</p>
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
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3"><Palette size={28} /></div>
                <h2 className="text-xl font-bold text-accent-900">Branding</h2>
                <p className="text-sm text-accent-500 mt-1">Customize your workspace appearance</p>
              </div>

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1.5">Organization Logo</label>
                <div className="border-2 border-dashed border-accent-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                  <Upload size={24} className="text-accent-400 mx-auto mb-2" />
                  <p className="text-sm text-accent-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-accent-400 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>

              {/* Brand color */}
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1.5">Primary Brand Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrandColor(c)}
                      className={`w-10 h-10 rounded-lg transition-all ${brandColor === c ? 'ring-2 ring-offset-2 ring-accent-400 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1.5">Preview</label>
                <div className="flex items-center gap-3 p-4 bg-accent-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: brandColor }}>
                    {(orgName || 'Org').split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-accent-900">{orgName || 'Your Organization'}</p>
                    <p className="text-xs text-accent-500">Powered by SecureAssess</p>
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
                <div className="w-14 h-14 rounded-2xl bg-secondary-50 text-secondary-600 flex items-center justify-center mx-auto mb-3"><Users size={28} /></div>
                <h2 className="text-xl font-bold text-accent-900">Users & Roles</h2>
                <p className="text-sm text-accent-500 mt-1">Define roles for your organization</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">Organization Roles</label>
                <div className="space-y-2">
                  {roles.map((r) => (
                    <div key={r} className="flex items-center justify-between p-3 bg-accent-50 rounded-lg">
                      <span className="text-sm font-medium text-accent-700">{r}</span>
                      <button onClick={() => removeRole(r)} className="text-accent-400 hover:text-danger-600 transition-colors"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Input placeholder="Add custom role..." value={newRole} onChange={(e) => setNewRole(e.target.value)} className="flex-1" />
                  <Button variant="outline" icon={<Plus size={16} />} onClick={addRole}>Add</Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">Invite Team Members</label>
                <Input placeholder="email@organization.com" type="email" />
                <p className="text-xs text-accent-400 mt-1.5">You can invite users after setup is complete.</p>
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
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3"><FileText size={28} /></div>
                <h2 className="text-xl font-bold text-accent-900">Assessment Configuration</h2>
                <p className="text-sm text-accent-500 mt-1">Set default assessment preferences</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1.5">Default Terminology</label>
                <div className="grid grid-cols-2 gap-3">
                  {(terminologySets[industry] || terminologySets.education)[0] && Object.entries((terminologySets[industry] || terminologySets.education)[0]).map(([key, val]) => (
                    <div key={key}>
                      <Input label={key.charAt(0).toUpperCase() + key.slice(1)} defaultValue={val} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="Default Security Level" options={[{ value: 'standard', label: 'Standard' }, { value: 'monitored', label: 'Monitored' }, { value: 'secure', label: 'Secure' }]} />
                <Select label="Default Assessment Type" options={[{ value: 'mcq', label: 'MCQ Test' }, { value: 'exam', label: 'Examination' }, { value: 'quiz', label: 'Quiz' }]} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Default Duration (minutes)" type="number" defaultValue={60} />
                <Input label="Default Passing Score (%)" type="number" defaultValue={60} />
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
                <div className="w-14 h-14 rounded-2xl bg-success-50 text-success-600 flex items-center justify-center mx-auto mb-3"><ShieldCheck size={28} /></div>
                <h2 className="text-xl font-bold text-accent-900">Security & Integrity Policies</h2>
                <p className="text-sm text-accent-500 mt-1">Configure your assessment integrity settings</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Require camera during assessments', desc: 'Participants must have camera enabled', defaultChecked: true },
                  { label: 'Require fullscreen mode', desc: 'Assessments run in fullscreen only', defaultChecked: true },
                  { label: 'Tab change detection', desc: 'Detect when participant switches tabs', defaultChecked: true },
                  { label: 'Focus change tracking', desc: 'Track when participant leaves the assessment window', defaultChecked: true },
                  { label: 'Gaze analysis', desc: 'Analyze participant gaze direction (requires camera)', defaultChecked: false },
                  { label: 'Session recording', desc: 'Record assessment sessions for review', defaultChecked: false },
                  { label: 'Browser lockdown', desc: 'Prevent copy/paste and other browser actions', defaultChecked: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-start justify-between p-3.5 bg-accent-50 rounded-lg">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium text-accent-800">{s.label}</p>
                      <p className="text-xs text-accent-500 mt-0.5">{s.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" defaultChecked={s.defaultChecked} className="sr-only peer" />
                      <div className="w-11 h-6 bg-accent-300 rounded-full peer peer-checked:bg-success-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => setStep(5)}>Back</Button>
                <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => setStep(7)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5 animate-fade-in max-w-lg mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-success-100 text-success-600 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <Check size={40} />
              </div>
              <h2 className="text-2xl font-bold font-display text-accent-900">Setup Complete!</h2>
              <p className="text-accent-600">
                Your organization workspace is ready. You can now create assessments, invite participants, and conduct secure evaluation sessions.
              </p>

              <div className="bg-accent-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm"><span className="text-accent-500">Organization</span><span className="font-medium text-accent-800">{orgName || 'Virtual University'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-accent-500">Industry</span><span className="font-medium text-accent-800 capitalize">{industry}</span></div>
                <div className="flex justify-between text-sm"><span className="text-accent-500">Roles</span><span className="font-medium text-accent-800">{roles.length} configured</span></div>
                <div className="flex justify-between text-sm"><span className="text-accent-500">Brand Color</span><span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ backgroundColor: brandColor }} /><span className="font-medium text-accent-800">{brandColor}</span></span></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button variant="primary" size="lg" icon={<ArrowRight size={18} />} onClick={() => onNavigate('org-dashboard')}>
                  Go to Workspace
                </Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate('platform-organizations')}>
                  Back to Organizations
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
