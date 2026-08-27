import { useState, useEffect } from 'react';
import {
  Shield, GraduationCap, Briefcase, Plane, Stethoscope, Landmark, Award, Building2,
  FilePlus2, Settings2, Send, ShieldCheck, ClipboardCheck, Video, Search,
  ClipboardList, CheckCircle2, Menu, X, ArrowRight, Check, Lock, Eye, FileText,
  Users, MonitorPlay, Zap, Globe, BarChart3, Star, Quote, ChevronRight,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { industries, workflowSteps, plans, landingNav, organizations } from '@/data';


const industryIcons = {
  GraduationCap: <GraduationCap size={24} />,
  Briefcase: <Briefcase size={24} />,
  Plane: <Plane size={24} />,
  Stethoscope: <Stethoscope size={24} />,
  Landmark: <Landmark size={24} />,
  Award: <Award size={24} />,
  Building2: <Building2 size={24} />,
};

const workflowIcons = {
  FilePlus2: <FilePlus2 size={20} />,
  Settings2: <Settings2 size={20} />,
  Send: <Send size={20} />,
  ShieldCheck: <ShieldCheck size={20} />,
  ClipboardCheck: <ClipboardCheck size={20} />,
  Video: <Video size={20} />,
  Search: <Search size={20} />,
  ClipboardList: <ClipboardList size={20} />,
  CheckCircle2: <CheckCircle2 size={20} />,
};





export function LandingPage({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-soft' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg font-display text-accent-900">SecureAssess</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {landingNav.map((item) => (
                <a key={item.label} href={item.href} className="px-3 py-2 text-sm font-medium text-accent-600 hover:text-primary-700 transition-colors">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('platform-dashboard')}>
                Platform Admin
              </Button>
              <Button variant="primary" size="sm" onClick={() => onNavigate('request-demo')}>
                Request a Demo
              </Button>
            </div>

            <button className="md:hidden text-accent-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-accent-200 animate-fade-in-down">
            <div className="px-4 py-3 space-y-1">
              {landingNav.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-accent-600 hover:bg-accent-50 rounded-lg">
                  {item.label}
                </a>
              ))}
              <div className="pt-2 space-y-2">
                <Button variant="outline" size="sm" fullWidth onClick={() => onNavigate('platform-dashboard')}>
                  Platform Admin
                </Button>
                <Button variant="primary" size="sm" fullWidth onClick={() => onNavigate('request-demo')}>
                  Request a Demo
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-30" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 mb-6 animate-fade-in-down">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse-soft" />
              <span className="text-xs font-medium text-primary-700">Assessment infrastructure as a service</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-accent-900 leading-tight text-balance animate-fade-in-up">
              Trusted Assessments.
              <br />
              <span className="gradient-text">Better Interviews.</span>{' '}
              <span className="text-accent-900">Confident Decisions.</span>
            </h1>

            <p className="mt-6 text-lg text-accent-600 max-w-2xl mx-auto animate-fade-in-up text-balance">
              SecureAssess gives organizations one platform to create assessments, conduct examinations, run live interviews, evaluate participants, and review assessment integrity.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
              <Button variant="primary" size="lg" icon={<Zap size={18} />} onClick={() => onNavigate('request-demo')}>
                Request a Demo
              </Button>
              <Button variant="outline" size="lg" iconRight={<ArrowRight size={18} />} onClick={() => onNavigate('org-dashboard')}>
                Explore Platform
              </Button>
            </div>

            <div className="mt-4">
              <Button variant="ghost" size="md" onClick={() => onNavigate('org-dashboard')}>
                Get Started
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-accent-500">
              <div className="flex items-center gap-1.5"><Check size={16} className="text-success-500" /> No credit card required</div>
              <div className="flex items-center gap-1.5"><Check size={16} className="text-success-500" /> 14-day free trial</div>
              <div className="flex items-center gap-1.5"><Check size={16} className="text-success-500" /> Cancel anytime</div>
            </div>
          </div>

          {/* Hero preview card */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-in-up">
            <div className="rounded-2xl shadow-strong border border-accent-200 overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-4 h-10 bg-accent-50 border-b border-accent-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger-400" />
                  <div className="w-3 h-3 rounded-full bg-warning-400" />
                  <div className="w-3 h-3 rounded-full bg-success-400" />
                </div>
                <span className="text-xs text-accent-400 ml-2">SecureAssess — Organization Dashboard</span>
              </div>
              <div className="p-6 bg-gradient-to-br from-accent-50 to-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Active Examinations', value: '12', icon: <FileText size={18} />, color: 'bg-primary-50 text-primary-600' },
                    { label: 'Students', value: '8,420', icon: <Users size={18} />, color: 'bg-secondary-50 text-secondary-600' },
                    { label: 'Upcoming Exams', value: '5', icon: <Calendar size={18} />, color: 'bg-info-50 text-info-600' },
                    { label: 'Pending Reviews', value: '7', icon: <ClipboardList size={18} />, color: 'bg-warning-50 text-warning-600' },
                  ].map((m, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-accent-200">
                      <div className={`w-9 h-9 rounded-lg ${m.color} flex items-center justify-center mb-2`}>{m.icon}</div>
                      <p className="text-xl font-bold text-accent-900">{m.value}</p>
                      <p className="text-xs text-accent-500">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-accent-200">
                    <p className="text-sm font-medium text-accent-700 mb-3">Assessment Activity</p>
                    <div className="flex items-end gap-1.5 h-24">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary-200 rounded-t-sm hover:bg-primary-400 transition-colors" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-accent-200">
                    <p className="text-sm font-medium text-accent-700 mb-3">Integrity Overview</p>
                    <div className="flex items-center justify-center h-24">
                      <div className="relative w-20 h-20">
                        <svg className="-rotate-90" width="80" height="80">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                          <circle cx="40" cy="40" r="32" fill="none" stroke="#22c55e" strokeWidth="8" strokeDasharray="201" strokeDashoffset="50" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-accent-900">75%</span>
                        </div>
                      </div>
                      <div className="ml-4 space-y-1">
                        <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-success-500" /> <span className="text-accent-600">Low Risk</span></div>
                        <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-warning-500" /> <span className="text-accent-600">Medium</span></div>
                        <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-danger-500" /> <span className="text-accent-600">High</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="py-12 bg-white border-y border-accent-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-accent-400 mb-6">Trusted by organizations across industries</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {organizations.slice(0, 5).map((org) => (
              <div key={org.id} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: org.brandColor }}>
                  {org.logoText}
                </div>
                <span className="font-semibold text-accent-700 text-sm">{org.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="py-20 bg-accent-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="primary" className="mb-3">Industries</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-accent-900 text-balance">
              Built for every organization that needs trusted assessment.
            </h2>
            <p className="mt-4 text-accent-600">
              One configurable platform serves universities, companies, airlines, hospitals, banks, and government institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {industries.map((ind, i) => (
              <Card key={i} hover className="p-6 group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${ind.color}15`, color: ind.color }}>
                  {industryIcons[ind.icon]}
                </div>
                <h3 className="font-semibold text-accent-900 mb-1">{ind.name}</h3>
                <p className="text-sm text-accent-500 mb-4">{ind.description}</p>
                <ul className="space-y-1.5">
                  {ind.useCases.map((uc, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-accent-600">
                      <Check size={14} className="text-success-500 shrink-0" />
                      {uc}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-3">Platform</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-accent-900">
              Everything your organization needs to conduct trusted assessments.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <FileText size={22} />, title: 'Assessment Builder', desc: 'Create quizzes, examinations, MCQ tests, skills assessments, and scenario-based evaluations with an intuitive builder.', color: 'bg-primary-50 text-primary-600' },
              { icon: <Library size={22} />, title: 'Question Bank', desc: 'Build reusable question libraries with multiple question types, tagging, and difficulty levels.', color: 'bg-secondary-50 text-secondary-600' },
              { icon: <Video size={22} />, title: 'Live Interviews', desc: 'Conduct enterprise-grade live video interviews with built-in evaluation guides and recording.', color: 'bg-info-50 text-info-600' },
              { icon: <ShieldCheck size={22} />, title: 'Integrity Monitoring', desc: 'Evidence-based session review with focus tracking, tab change detection, and gaze analysis.', color: 'bg-success-50 text-success-600' },
              { icon: <MonitorPlay size={22} />, title: 'Session Management', desc: 'Every assessment and interview is a unified session connecting participant, score, integrity, and timeline.', color: 'bg-warning-50 text-warning-600' },
              { icon: <ClipboardList size={22} />, title: 'Evaluation & Scoring', desc: 'Multi-criteria evaluation with configurable rubrics, private notes, and recommendations.', color: 'bg-danger-50 text-danger-600' },
              { icon: <BarChart3 size={22} />, title: 'Reports & Analytics', desc: 'Generate detailed performance reports, integrity trends, and organization-wide analytics.', color: 'bg-primary-50 text-primary-600' },
              { icon: <Users size={22} />, title: 'Participant Management', desc: 'Invite and manage students, candidates, or applicants with flexible terminology for your organization.', color: 'bg-secondary-50 text-secondary-600' },
              { icon: <Globe size={22} />, title: 'Multi-Tenant Ready', desc: 'Each organization gets an isolated workspace with custom branding, roles, and policies.', color: 'bg-accent-100 text-accent-700' },
            ].map((f, i) => (
              <Card key={i} hover className="p-6">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>{f.icon}</div>
                <h3 className="font-semibold text-accent-900 mb-2">{f.title}</h3>
                <p className="text-sm text-accent-600 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-accent-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="primary" className="mb-3 bg-primary-500/20 text-primary-300 border-primary-500/30">Workflow</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-balance">
              From assessment creation to confident decisions.
            </h2>
            <p className="mt-4 text-accent-400">
              A complete workflow that connects every step of the evaluation process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workflowSteps.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-accent-800 rounded-xl p-5 border border-accent-700 hover:border-primary-500 transition-colors h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white shrink-0">
                      {workflowIcons[step.icon]}
                    </div>
                    <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">{step.step}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-accent-400 leading-relaxed">{step.description}</p>
                </div>
                {i < workflowSteps.length - 1 && i % 3 !== 2 && (
                  <ChevronRight size={20} className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-accent-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security / Integrity */}
      <section id="security" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="success" className="mb-3">Security & Integrity</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-accent-900 text-balance">
                Designed for secure assessment environments.
              </h2>
              <p className="mt-4 text-accent-600">
                SecureAssess provides evidence-based session review and transparent assessment integrity controls — without exaggerated claims or intrusive surveillance.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: <Lock size={20} />, title: 'Secure Sessions', desc: 'Encrypted assessment environments with browser lockdown and fullscreen enforcement.' },
                  { icon: <Eye size={20} />, title: 'Evidence-Based Monitoring', desc: 'Focus tracking, tab change detection, and gaze analysis — presented as signals for review, not definitive judgments.' },
                  { icon: <FileText size={20} />, title: 'Transparent Reporting', desc: 'Every integrity signal is documented with timestamp, source, confidence level, and context.' },
                  { icon: <ShieldCheck size={20} />, title: 'Privacy First', desc: 'Clear consent flow, data retention policies, and participant transparency built in.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success-50 text-success-600 flex items-center justify-center shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="font-semibold text-accent-900 text-sm">{item.title}</h3>
                      <p className="text-sm text-accent-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Card className="p-6 shadow-medium">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-accent-900">Integrity Risk Assessment</h3>
                  <Badge variant="success" dot>Low Risk</Badge>
                </div>
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="-rotate-90" width="128" height="128">
                      <circle cx="64" cy="64" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle cx="64" cy="64" r="52" fill="none" stroke="#22c55e" strokeWidth="10" strokeDasharray="327" strokeDashoffset="268" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-accent-900">18</span>
                      <span className="text-xs text-accent-500">/ 100</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[
                      { label: 'Focus Changes', value: 2, max: 10 },
                      { label: 'Tab Changes', value: 1, max: 10 },
                      { label: 'Fullscreen Exits', value: 0, max: 5 },
                      { label: 'Gaze Anomalies', value: 1, max: 10 },
                    ].map((s, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-accent-600">{s.label}</span>
                          <span className="font-medium text-accent-800">{s.value}</span>
                        </div>
                        <div className="h-1.5 bg-accent-200 rounded-full">
                          <div className="h-full bg-success-500 rounded-full" style={{ width: `${(s.value / s.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-accent-50 rounded-lg p-3 text-xs text-accent-500 italic">
                  "Integrity signals are indicators for review and do not independently determine misconduct."
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-accent-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="primary" className="mb-3">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-accent-900">
              Plans that scale with your organization.
            </h2>
            <p className="mt-4 text-accent-600">
              Start with a free trial. Upgrade as your assessment needs grow. Custom pricing for enterprise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <Card key={i} className={`p-6 relative ${plan.highlighted ? 'ring-2 ring-primary-500 shadow-medium' : ''}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary" className="shadow-soft">Most Popular</Badge>
                  </div>
                )}
                <h3 className="font-bold text-accent-900 text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold font-display text-accent-900 mt-2">{plan.price}</p>
                <p className="text-sm text-accent-500 mt-1">{plan.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-accent-600">
                      <Check size={16} className="text-success-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  fullWidth
                  className="mt-6"
                  onClick={() => onNavigate('request-demo')}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-3">Customer Stories</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-accent-900">
              Organizations trust SecureAssess for their assessments.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { quote: "SecureAssess replaced our entire examination infrastructure. We now conduct midterms and finals with confidence in the integrity of every session.", name: "Dr. Imran Saleem", role: "Dean of Examinations, Virtual University", color: "#1d4ed8" },
              { quote: "Our pilot assessments and interviews are now fully digital. The integrity review gives us evidence to make confident hiring decisions.", name: "Captain Lara Hassan", role: "Head of Training, SkyWings Aviation", color: "#0d9488" },
              { quote: "We use SecureAssess for clinical competency assessments. The scenario-based question types are exactly what we needed.", name: "Dr. Farah Siddiqui", role: "Director, National Healthcare Institute", color: "#0f766e" },
            ].map((t, i) => (
              <Card key={i} className="p-6">
                <Quote size={28} className="text-primary-200 mb-3" />
                <p className="text-sm text-accent-700 leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: t.color }}>
                    {t.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-accent-900">{t.name}</p>
                    <p className="text-xs text-accent-500">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mt-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={14} className="text-warning-400 fill-warning-400" />)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white text-balance">
            Ready to adopt SecureAssess as your assessment platform?
          </h2>
          <p className="mt-4 text-primary-100 text-lg">
            Join universities, companies, and institutions using SecureAssess for trusted evaluations.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="secondary" size="lg" icon={<Zap size={18} />} onClick={() => onNavigate('request-demo')}>
              Request a Demo
            </Button>
            <Button variant="ghost" size="lg" className="text-white hover:bg-white/10" onClick={() => onNavigate('org-dashboard')}>
              Explore Platform
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent-950 text-accent-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Shield size={18} className="text-white" />
                </div>
                <span className="font-bold text-white">SecureAssess</span>
              </div>
              <p className="text-sm">Assessment infrastructure as a service for organizations worldwide.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Industries</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><button onClick={() => onNavigate('request-demo')} className="hover:text-white transition-colors">Request Demo</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => onNavigate('platform-dashboard')} className="hover:text-white transition-colors">Platform Admin</button></li>
                <li><button onClick={() => onNavigate('org-dashboard')} className="hover:text-white transition-colors">Organization Workspace</button></li>
                <li><button onClick={() => onNavigate('participant-system-check')} className="hover:text-white transition-colors">Participant Experience</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Sales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-accent-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">© 2026 SecureAssess. All rights reserved.</p>
            <p className="text-xs">Trusted Assessments. Better Interviews. Confident Decisions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Calendar, Library } from 'lucide-react';
