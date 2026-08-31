import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, GraduationCap, Briefcase, Award, Building2,
  Settings2, ShieldCheck, CheckCircle2, Menu, X, ArrowRight, Check,
  Lock, Users, Zap, Globe, BarChart3, Moon, Sun, ChevronRight,
  Server, Database, KeyRound, Video, Laptop, Sparkles, Search,
  Eye, Activity, HelpCircle, HardDrive
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isAuthenticated, isPlatformStaff } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (verifyCode.trim()) {
      navigate(`/verify/${encodeURIComponent(verifyCode.trim().toUpperCase())}`);
    } else {
      navigate('/verify');
    }
  };

  const b2bTenants = [
    { name: 'Alpha Polytechnic', type: 'Higher Education', logo: 'AP', color: '#2563eb' },
    { name: 'Beta Defense Systems', type: 'Enterprise Tech & Security', logo: 'BD', color: '#7c3aed' },
    { name: 'National Medical Board', type: 'Medical Certification', logo: 'NM', color: '#059669' },
    { name: 'Apex Talent Recruitment', type: 'Corporate Hiring', logo: 'AR', color: '#d97706' },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$99',
      interval: '/month',
      description: 'Essential assessment infrastructure for growing academies and testing centers.',
      features: [
        'Up to 10 Assessments',
        '200 Enrolled Candidates',
        'Standard Question Bank',
        'Automated Objective Grading',
        'Email Notifications',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Growth',
      price: '$299',
      interval: '/month',
      description: 'Ideal for colleges and medium enterprises scaling their testing operations.',
      features: [
        'Up to 50 Assessments',
        '1,000 Enrolled Candidates',
        'AI Tab & Focus Proctoring',
        'Verifiable Cryptographic Certificates',
        'Custom Branding & Themes',
        'CSV/PDF Analytics Export',
      ],
      cta: 'Upgrade to Growth',
      popular: true,
    },
    {
      name: 'Professional',
      price: '$599',
      interval: '/month',
      description: 'Advanced proctoring and live interview tools for large institutions.',
      features: [
        'Up to 100 Assessments',
        '2,000 Enrolled Candidates',
        'WebRTC Live Video Interviews',
        'Full Webcam Evidence Recording',
        'Integrity Anomaly Telemetry',
        'Multi-Department Hierarchy',
      ],
      cta: 'Go Professional',
      popular: false,
    },
    {
      name: 'Enterprise',
      price: '$999',
      interval: '/month',
      description: 'Dedicated high-capacity cloud infrastructure with custom SLAs and audit logs.',
      features: [
        'Unlimited Assessments',
        'Unlimited Candidates',
        'Dedicated Background Workers',
        'Full Compliance Audit Trail',
        'Priority 24/7 SLA Support',
        'REST API & Webhook Access',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-accent-950 text-accent-900 dark:text-accent-100 transition-colors duration-200 font-sans">
      {/* Sticky Navigation Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 dark:bg-accent-900/90 backdrop-blur-md shadow-soft border-b border-accent-200 dark:border-accent-800'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white shadow-soft">
                <Shield size={20} />
              </div>
              <span className="font-bold text-lg font-display tracking-tight text-accent-900 dark:text-white">
                Secure<span className="text-primary-600 dark:text-primary-400">Assess</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-accent-600 dark:text-accent-300">
              <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
              <a href="#multi-tenancy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Multi-Tenancy</a>
              <a href="#proctoring" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Proctoring</a>
              <a href="#verify" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Verify Certificate</a>
              <a href="#pricing" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleTheme();
                }}
                className="p-2 rounded-lg text-accent-500 hover:text-accent-800 dark:hover:text-accent-200 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer"
                title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {isDark ? <Sun size={18} className="text-warning-400" /> : <Moon size={18} />}
              </button>

              <button
                type="button"
                onClick={() => navigate('/verify')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors"
              >
                Verify Credential
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-xs font-bold text-accent-700 dark:text-accent-200 hover:text-accent-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => navigate('/request-demo')}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-soft transition-all cursor-pointer"
              >
                Request a Demo
              </button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleTheme();
                }}
                className="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-800 cursor-pointer"
              >
                {isDark ? <Sun size={18} className="text-warning-400" /> : <Moon size={18} />}
              </button>

              <button
                className="p-2 text-accent-700 dark:text-accent-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-accent-900 border-b border-accent-200 dark:border-accent-800 px-4 py-4 space-y-3 animate-fade-in-down">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-accent-700 dark:text-accent-200">Features</a>
            <a href="#multi-tenancy" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-accent-700 dark:text-accent-200">Multi-Tenancy</a>
            <a href="#proctoring" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-accent-700 dark:text-accent-200">Proctoring</a>
            <a href="#verify" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-accent-700 dark:text-accent-200">Verify Credential</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-accent-700 dark:text-accent-200">Pricing</a>
            <div className="pt-2 flex flex-col gap-2 border-t border-accent-200 dark:border-accent-800">
              <button
                onClick={() => navigate('/verify')}
                className="w-full py-2.5 rounded-xl border border-accent-300 dark:border-accent-700 text-xs font-bold text-accent-800 dark:text-white"
              >
                Public Credential Verification
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl bg-accent-100 dark:bg-accent-800 text-xs font-bold text-accent-800 dark:text-white"
              >
                Sign In to Workspace
              </button>
              <button
                onClick={() => navigate('/request-demo')}
                className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold shadow-soft"
              >
                Request a Demo
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-950/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
              Enterprise Multi-Tenant Assessment Infrastructure
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-accent-900 dark:text-white max-w-4xl mx-auto leading-tight">
            High-Stakes Assessments.
            <br />
            <span className="gradient-text">Absolute Integrity.</span>{' '}
            <span>Total Tenant Isolation.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-accent-600 dark:text-accent-400 max-w-2xl mx-auto leading-relaxed">
            SecureAssess empowers universities, certification boards, and enterprise hiring teams to conduct secure online examinations, live technical interviews, and automated evaluations on dedicated tenant environments.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold shadow-glow flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Launch Workspace Portal</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/request-demo')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-700 hover:bg-accent-50 dark:hover:bg-accent-800 text-accent-800 dark:text-accent-200 text-sm font-bold shadow-soft transition-all cursor-pointer"
            >
              Schedule Enterprise Demo
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-accent-500 dark:text-accent-400 font-medium">
            <div className="flex items-center gap-1.5"><Check size={16} className="text-success-500" /> B2B Multi-Tenant Architecture</div>
            <div className="flex items-center gap-1.5"><Check size={16} className="text-success-500" /> WebRTC & AI Anti-Cheat Engine</div>
            <div className="flex items-center gap-1.5"><Check size={16} className="text-success-500" /> Cryptographic Verifiable Credentials</div>
          </div>
        </div>
      </section>

      {/* Multi-Tenant SaaS Section */}
      <section id="multi-tenancy" className="py-16 bg-accent-50/50 dark:bg-accent-900/30 border-y border-accent-200 dark:border-accent-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-accent-900 dark:text-white">
              Built Specifically for Multi-Tenant B2B SaaS
            </h2>
            <p className="text-sm text-accent-500 dark:text-accent-400 mt-2">
              Every subscribing institution receives an independent workspace partitioned by tenant boundary security rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {b2bTenants.map((t) => (
              <div
                key={t.name}
                className="p-5 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs mb-4 shadow-soft"
                  style={{ backgroundColor: t.color }}
                >
                  {t.logo}
                </div>
                <h3 className="text-base font-bold text-accent-900 dark:text-white">{t.name}</h3>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">{t.type}</p>
                <div className="mt-4 pt-3 border-t border-accent-100 dark:border-accent-800 flex items-center justify-between text-[11px] font-semibold text-accent-600 dark:text-accent-300">
                  <span>Isolated Tenant Data</span>
                  <ShieldCheck size={14} className="text-success-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold font-display text-accent-900 dark:text-white">
              End-to-End Assessment Infrastructure
            </h2>
            <p className="text-sm text-accent-500 dark:text-accent-400 mt-2">
              Complete examination governance from authoring through live proctoring and certification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 flex items-center justify-center mb-4">
                <Laptop size={20} />
              </div>
              <h3 className="text-lg font-bold text-accent-900 dark:text-white">1. Assessment Authoring</h3>
              <p className="text-xs text-accent-600 dark:text-accent-400 mt-2 leading-relaxed">
                Build rich multi-format questions (MCQ, Coding with test cases, Subjective Essays), organize reusable question banks, and randomize examination sets.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-950/50 text-secondary-600 flex items-center justify-center mb-4">
                <Video size={20} />
              </div>
              <h3 className="text-lg font-bold text-accent-900 dark:text-white">2. Multi-Tier Proctoring</h3>
              <p className="text-xs text-accent-600 dark:text-accent-400 mt-2 leading-relaxed">
                Full-screen exam lockdown, client-side event tracking (tab switch, window blur), WebRTC webcam/audio streaming, and instant invigilator anomaly alerts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-950/50 text-success-600 flex items-center justify-center mb-4">
                <Award size={20} />
              </div>
              <h3 className="text-lg font-bold text-accent-900 dark:text-white">3. Grading & Certificates</h3>
              <p className="text-xs text-accent-600 dark:text-accent-400 mt-2 leading-relaxed">
                Instant automated objective evaluation, examiner rubric queues for long-form answers, percentile analytics, and tamper-evident PDF certificates with QR verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proctoring & Integrity Telemetry Section */}
      <section id="proctoring" className="py-20 bg-accent-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/30 via-transparent to-secondary-950/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
                <Eye className="w-3.5 h-3.5" />
                <span>AI-Powered Integrity & Exam Lockdown</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white mb-4">
                Uncompromising Security for High-Stakes Assessments
              </h2>
              <p className="text-accent-300 text-sm leading-relaxed mb-6">
                Protect assessment integrity with continuous browser event tracking, webcam snapshot evidence signed via HMAC SHA-256 URLs, and automated anomaly flagging.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Full-Screen & Tab Switch Detection</h4>
                    <p className="text-xs text-accent-400">Instantly detects window blur, copy-paste attempts, and external application switches.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Encrypted Evidence Ledger</h4>
                    <p className="text-xs text-accent-400">Snapshots and audio signals are partitioned by organization and secured with tamper-proof signatures.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Real-Time Invigilator Anomaly Stream</h4>
                    <p className="text-xs text-accent-400">Live WebSockets provide real-time violation alerts to proctors without refreshing.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Glassmorphism Card */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold font-mono text-emerald-400">SESSION TELEMETRY · LIVE</span>
                </div>
                <Badge variant="primary" className="font-mono text-[10px]">CAND-9821-X</Badge>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Browser Focus State:</span>
                  <span className="text-emerald-400 font-bold">LOCKED · FULLSCREEN</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Webcam Stream:</span>
                  <span className="text-indigo-400 font-bold">HMAC SIGNED · 1080p</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Anomaly Index:</span>
                  <span className="text-emerald-400 font-bold">0.0 (LOW RISK)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Credential Verification Section */}
      <section id="verify" className="py-20 bg-accent-50/50 dark:bg-accent-900/40 border-b border-accent-200 dark:border-accent-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Public Credential Ledger</span>
          </div>

          <h2 className="text-3xl font-extrabold font-display text-accent-900 dark:text-white mb-3">
            Verify an Official Certificate
          </h2>
          <p className="text-accent-600 dark:text-accent-400 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Employers, academic registrars, and recruiters can instantly verify the authenticity of any credential issued by a SecureAssess tenant.
          </p>

          <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400" />
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Enter Code (e.g. SA-2026-000003)"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-700 rounded-xl text-accent-900 dark:text-white placeholder-accent-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-soft transition-all"
            >
              Verify Now
            </button>
          </form>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold font-display text-accent-900 dark:text-white">
              Transparent B2B SaaS Pricing
            </h2>
            <p className="text-sm text-accent-500 dark:text-accent-400 mt-2">
              Predictable cloud plans designed for academic departments, testing agencies, and enterprise enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-white dark:bg-accent-900 border transition-all flex flex-col justify-between ${
                  plan.popular
                    ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-glow relative'
                    : 'border-accent-200 dark:border-accent-800 shadow-soft'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-accent-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-accent-900 dark:text-white font-display">
                      {plan.price}
                    </span>
                    <span className="text-xs text-accent-500">{plan.interval}</span>
                  </div>
                  <p className="text-xs text-accent-500 dark:text-accent-400 mt-2 mb-6 min-h-[36px]">
                    {plan.description}
                  </p>

                  <ul className="space-y-2.5 mb-6 text-xs text-accent-600 dark:text-accent-300">
                    {plan.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check size={14} className="text-success-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    plan.popular
                      ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-soft'
                      : 'bg-accent-100 dark:bg-accent-800 text-accent-800 dark:text-white hover:bg-accent-200 dark:hover:bg-accent-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent-900 text-white py-12 border-t border-accent-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <span className="font-bold text-sm font-display">SecureAssess</span>
            <span className="text-xs text-accent-400 ml-2">© 2026 SecureAssess. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-accent-400">
            <Link to="/verify" className="hover:text-white transition-colors">Verify Certificate</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/request-demo" className="hover:text-white transition-colors">Request Demo</Link>
            <a href="#multi-tenancy" className="hover:text-white transition-colors">Tenant Isolation</a>
            <a href="#proctoring" className="hover:text-white transition-colors">AI Proctoring</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
