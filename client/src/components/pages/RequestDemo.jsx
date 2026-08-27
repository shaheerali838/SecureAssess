import { useState } from 'react';
import {
  Shield, ArrowLeft, Check, Building2, Mail, Phone, Globe,
 Users,
} from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui';






const industryOptions = [
  { value: 'education', label: 'Education' },
  { value: 'corporate', label: 'Corporate / Hiring' },
  { value: 'aviation', label: 'Aviation' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'certification', label: 'Professional Certification' },
  { value: 'government', label: 'Government / Institutions' },
  { value: 'other', label: 'Other' },
];

const orgSizeOptions = [
  { value: '1-50', label: '1 - 50 users' },
  { value: '51-250', label: '51 - 250 users' },
  { value: '251-1000', label: '251 - 1,000 users' },
  { value: '1000+', label: '1,000+ users' },
];

const timelineOptions = [
  { value: 'immediately', label: 'Immediately' },
  { value: '1month', label: 'Within 1 month' },
  { value: '3months', label: 'Within 3 months' },
  { value: 'exploring', label: 'Just exploring' },
];

export function RequestDemo({ onNavigate }) {
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);

  if (submitted) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success-100 text-success-600 flex items-center justify-center mx-auto mb-4">
            <Check size={32} />
          </div>
          <h1 className="text-2xl font-bold font-display text-accent-900 mb-2">Thank you for your interest!</h1>
          <p className="text-accent-600 mb-6">
            Our team will reach out within 24 hours to schedule your personalized demo. We'll show you how SecureAssess can serve as your organization's assessment platform.
          </p>
          <div className="space-y-3">
            <Button variant="primary" fullWidth size="lg" onClick={() => onNavigate('org-dashboard')}>
              Explore the Platform
            </Button>
            <Button variant="outline" fullWidth onClick={() => onNavigate('landing')}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50">
      {/* Header */}
      <header className="bg-white border-b border-accent-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900">SecureAssess</span>
          </button>
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-1.5 text-sm text-accent-500 hover:text-accent-800 transition-colors">
            <ArrowLeft size={16} /> Back to home
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left side - Info */}
          <div>
            <h1 className="text-3xl font-bold font-display text-accent-900 mb-3">Request a Demo</h1>
            <p className="text-accent-600 mb-8">
              See how SecureAssess can serve as your organization's complete assessment platform — from examinations to interviews to integrity review.
            </p>

            <div className="space-y-4">
              {[
                { icon: <Building2 size={20} />, title: 'For Organizations', desc: 'Universities, companies, airlines, hospitals, banks, and institutions.' },
                { icon: <Users size={20} />, title: 'Multi-Tenant Ready', desc: 'Each organization gets its own isolated, branded workspace.' },
                { icon: <Check size={20} />, title: 'Full Workflow Demo', desc: 'See the complete assessment-to-decision workflow in action.' },
                { icon: <Shield size={20} />, title: 'Integrity Review', desc: 'Explore evidence-based session review and integrity controls.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-accent-900 text-sm">{item.title}</h3>
                    <p className="text-sm text-accent-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <p className="text-sm text-primary-800 font-medium mb-1">Prefer to talk to sales?</p>
              <p className="text-sm text-primary-600">Email us at sales@secureassess.com or call +1 (555) 010-2025</p>
            </div>
          </div>

          {/* Right side - Form */}
          <Card className="p-6">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-primary-600 text-white' : 'bg-accent-200 text-accent-500'}`}>
                    {s}
                  </div>
                  <span className={`text-sm font-medium ${step >= s ? 'text-accent-800' : 'text-accent-400'}`}>
                    {s === 1 ? 'Organization' : 'Contact'}
                  </span>
                  {s === 1 && <div className={`flex-1 h-0.5 rounded ${step >= 2 ? 'bg-primary-500' : 'bg-accent-200'}`} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <Input label="Organization Name" placeholder="e.g. Virtual University" />
                <Select label="Industry" options={[{ value: '', label: 'Select industry...' }, ...industryOptions]} />
                <Select label="Organization Size" options={[{ value: '', label: 'Select size...' }, ...orgSizeOptions]} />
                <Input label="Website" placeholder="https://yourorganization.com" icon={<Globe size={16} />} />
                <Select label="Timeline" options={[{ value: '', label: 'When do you need this?' }, ...timelineOptions]} />
                <Button variant="primary" fullWidth onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <Input label="Full Name" placeholder="Your name" />
                <Input label="Work Email" type="email" placeholder="you@organization.com" icon={<Mail size={16} />} />
                <Input label="Phone Number" placeholder="+1 (555) 000-0000" icon={<Phone size={16} />} />
                <Input label="Role / Title" placeholder="e.g. Dean of Examinations" />
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-1.5">What would you like to see in the demo?</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-accent-300 bg-white text-accent-800 placeholder:text-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-y"
                    rows={3}
                    placeholder="Tell us about your assessment needs..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" fullWidth onClick={() => setSubmitted(true)}>
                    Request Demo
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
