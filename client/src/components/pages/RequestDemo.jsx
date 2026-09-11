import React, { useState } from 'react';
import {
  Shield,
  ArrowLeft,
  Check,
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  Sun,
  Moon,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

const industryOptions = [
  { value: 'education', label: 'Higher Education & Universities' },
  { value: 'corporate', label: 'Corporate Talent & Tech Hiring' },
  { value: 'aviation', label: 'Aviation & Pilot Certification' },
  { value: 'healthcare', label: 'Healthcare & Medical Licensing' },
  { value: 'finance', label: 'Banking & Financial Certification' },
  { value: 'certification', label: 'Professional Certification Agency' },
  { value: 'government', label: 'Government & Public Sector' },
  { value: 'other', label: 'Other' },
];

const orgSizeOptions = [
  { value: '1-50', label: '1 - 50 Candidates / month' },
  { value: '51-250', label: '51 - 250 Candidates / month' },
  { value: '251-1000', label: '251 - 1,000 Candidates / month' },
  { value: '1000+', label: '1,000+ Candidates / month (Enterprise)' },
];

const timelineOptions = [
  { value: 'immediately', label: 'Immediately (Active Project)' },
  { value: '1month', label: 'Within 1 month' },
  { value: '3months', label: 'Within 1 - 3 months' },
  { value: 'exploring', label: 'Just exploring options' },
];

export function RequestDemo({ onNavigate }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    orgName: '',
    industry: '',
    orgSize: '',
    website: '',
    timeline: '',
    fullName: '',
    email: '',
    phone: '',
    role: '',
    notes: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleStep1Next = (e) => {
    if (e) e.preventDefault();
    if (!formData.orgName.trim()) {
      setError('Please provide your organization name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Please provide your full name and work email.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white flex items-center justify-center p-4 transition-colors">
        <Card className="max-w-lg w-full p-8 text-center animate-scale-in border border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-900 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-soft">
            <Check size={32} />
          </div>
          <h1 className="text-2xl font-bold font-display text-accent-900 dark:text-white mb-2">
            Demo Request Confirmed
          </h1>
          <p className="text-sm text-accent-600 dark:text-accent-400 mb-6 leading-relaxed">
            Thank you, <span className="font-semibold text-accent-900 dark:text-white">{formData.fullName}</span>. Our enterprise solutions team will reach out at <span className="font-mono text-primary-600 dark:text-primary-400">{formData.email}</span> within 24 hours to coordinate your personalized platform demo.
          </p>

          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => onNavigate('landing')}
              className="font-bold text-xs"
            >
              Return to SecureAssess Home
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => onNavigate('login')}
              className="text-xs"
            >
              Sign In to Existing Workspace
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white flex flex-col justify-between transition-colors duration-200 font-sans">
      {/* Header */}
      <header className="bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Shield size={18} />
            </div>
            <span className="font-bold text-lg font-display tracking-tight text-accent-900 dark:text-white">
              Secure<span className="text-primary-600 dark:text-primary-400">Assess</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-accent-500 hover:text-accent-800 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-accent-200 dark:border-accent-700 hover:bg-accent-100 dark:hover:bg-accent-800 text-accent-700 dark:text-accent-300 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left side - Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailored Demonstration</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-accent-900 dark:text-white tracking-tight leading-tight">
              Experience SecureAssess in Action
            </h1>

            <p className="text-sm text-accent-600 dark:text-accent-400 leading-relaxed">
              Discover how SecureAssess powers end-to-end assessment authoring, AI-assisted proctoring, live technical interviews, and automated rubric evaluations.
            </p>

            <div className="space-y-3.5 pt-2">
              {[
                {
                  icon: <Building2 size={18} />,
                  title: 'Multi-Tenant Architecture',
                  desc: 'Dedicated tenant boundaries and custom branding for universities and enterprise corporations.',
                },
                {
                  icon: <Shield size={18} />,
                  title: 'Zero-Trust AI Proctoring',
                  desc: 'Lockdown environments with tamper-evident audio and webcam evidence recording.',
                },
                {
                  icon: <Users size={18} />,
                  title: 'Integrated Live Interview Rooms',
                  desc: 'Conduct high-stakes technical coding and subjective interview evaluations in one suite.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-accent-900/60 border border-accent-200 dark:border-accent-800 shadow-soft"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-accent-900 dark:text-white text-xs">{item.title}</h3>
                    <p className="text-[11px] text-accent-600 dark:text-accent-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200/60 dark:border-primary-800/60">
              <p className="text-xs text-primary-800 dark:text-primary-300 font-semibold mb-0.5">Need immediate assistance?</p>
              <p className="text-xs text-primary-600 dark:text-primary-400">
                Contact sales directly at <span className="font-mono font-medium">sales@secureassess.io</span>
              </p>
            </div>
          </div>

          {/* Right side - Multi-Step Interactive Form */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-strong rounded-3xl">
              {/* Progress Indicator */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-accent-100 dark:border-accent-800">
                {[
                  { stepNum: 1, label: 'Organization Details' },
                  { stepNum: 2, label: 'Contact Information' },
                ].map((s) => (
                  <div key={s.stepNum} className="flex items-center gap-2.5 flex-1">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        step >= s.stepNum
                          ? 'bg-primary-600 text-white shadow-soft'
                          : 'bg-accent-100 dark:bg-accent-800 text-accent-500'
                      }`}
                    >
                      {s.stepNum}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        step >= s.stepNum
                          ? 'text-accent-900 dark:text-white'
                          : 'text-accent-400'
                      }`}
                    >
                      {s.label}
                    </span>
                    {s.stepNum === 1 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full ${
                          step >= 2 ? 'bg-primary-600' : 'bg-accent-200 dark:bg-accent-800'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 mb-5 rounded-xl bg-danger-50 dark:bg-danger-950/60 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                      Organization / Institution Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.orgName}
                      onChange={(e) => handleChange('orgName', e.target.value)}
                      placeholder="e.g. Stanford School of Engineering"
                      className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                        Industry / Sector
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select industry...</option>
                        {industryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                        Testing Volume
                      </label>
                      <select
                        value={formData.orgSize}
                        onChange={(e) => handleChange('orgSize', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select candidate volume...</option>
                        {orgSizeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                        Website (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://institution.edu"
                        className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                        Deployment Timeline
                      </label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => handleChange('timeline', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select timeline...</option>
                        {timelineOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleStep1Next}
                      className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-soft transition-all cursor-pointer"
                    >
                      Continue to Contact Details
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        placeholder="e.g. Dr. Jane Reynolds"
                        className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="jane.reynolds@institution.edu"
                        className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                        Role / Title
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => handleChange('role', e.target.value)}
                        placeholder="Dean of Examinations / Lead Recruiter"
                        className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-1.5">
                      Specific Areas of Interest (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      rows={3}
                      placeholder="Tell us about your examination formats, proctoring needs, or integrations..."
                      className="w-full px-3.5 py-2.5 bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 rounded-xl text-xs text-accent-900 dark:text-white placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3 rounded-xl border border-accent-200 dark:border-accent-700 text-xs font-bold text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-soft transition-all cursor-pointer"
                    >
                      Schedule Personalized Demo
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-accent-200 dark:border-accent-800 py-6 text-center text-xs text-accent-500 dark:text-accent-400">
        <p>© {new Date().getFullYear()} SecureAssess Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default RequestDemo;
