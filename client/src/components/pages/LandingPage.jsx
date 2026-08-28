import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, GraduationCap, Briefcase, Award, Building2,
  Settings2, ShieldCheck, CheckCircle2, Menu, X, ArrowRight, Check,
  Lock, Users, Zap, Globe, BarChart3, Moon, Sun, ChevronRight,
  Server, Database, KeyRound, Video, Laptop, Sparkles
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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handlePortalEnter = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (isPlatformStaff) {
      navigate('/platform/dashboard');
    } else {
      navigate('/organization/dashboard');
    }
  };

  const b2bTenants = [
    { name: 'Virtual University', type: 'Higher Education', logo: 'VU', color: '#1d4ed8' },
    { name: 'TechCorp Engineering', type: 'Enterprise Tech', logo: 'TC', color: '#7c3aed' },
    { name: 'National Health Board', type: 'Medical Certification', logo: 'NH', color: '#0f766e' },
    { name: 'Apex Talent Recruitment', type: 'Corporate Hiring', logo: 'AR', color: '#b45309' },
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
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white shadow-soft">
                <Shield size={20} />
              </div>
              <span className="font-bold text-lg font-display tracking-tight text-accent-900 dark:text-white">
                Secure<span className="text-primary-600 dark:text-primary-400">Assess</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-accent-600 dark:text-accent-300">
              <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
              <a href="#multi-tenancy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Multi-Tenancy</a>
              <a href="#proctoring" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Proctoring</a>
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
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-accent-700 dark:text-accent-200">Pricing</a>
            <div className="pt-2 flex flex-col gap-2 border-t border-accent-200 dark:border-accent-800">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl border border-accent-300 dark:border-accent-700 text-xs font-bold text-accent-800 dark:text-white"
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
            SecureAssess empowers universities, recruitment agencies, and enterprise companies to conduct secure online examinations, live technical interviews, and automated evaluations on dedicated tenant environments.
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
            <div className="flex items-center gap-1.5"><Check size={16} className="text-success-500" /> Role-Based Dynamic Permissions</div>
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

      {/* Footer */}
      <footer className="bg-accent-900 text-white py-12 border-t border-accent-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <span className="font-bold text-sm font-display">SecureAssess</span>
            <span className="text-xs text-accent-400 ml-2">© 2026 SecureAssess. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-accent-400">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Sign In</button>
            <button onClick={() => navigate('/request-demo')} className="hover:text-white transition-colors">Request Demo</button>
            <a href="#multi-tenancy" className="hover:text-white transition-colors">Tenant Isolation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
