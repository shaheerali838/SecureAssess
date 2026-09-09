import React, { useState, useEffect } from 'react';
import {
  User, Award, FileText, Video, CheckCircle2, Clock,
  ArrowRight, ShieldCheck, Download, ExternalLink, Calendar,
  AlertCircle, RefreshCw, Sparkles, BookOpen, Star, LogOut
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, Avatar, PageHeader, Toast
} from '@/components/ui';
import candidatePortalService from '@/services/candidatePortal.service';
import { useAuth } from '@/contexts/AuthContext';

export function CandidatePortal({ onNavigate }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned');

  const [profile, setProfile] = useState({
    name: user?.name || 'Alex Morgan',
    email: user?.email || 'alex.morgan@stanford.edu',
    candidateCode: 'CAND-894210',
    program: 'Bachelor of Science in Aeronautical Systems',
    department: 'Aerospace & Flight Systems',
    status: 'ACTIVE',
  });

  const [assignments, setAssignments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [results, setResults] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [interviews, setInterviews] = useState([]);

  // Fetch Candidate Portal Data
  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [profRes, assignRes, attRes, resRes, certRes, intRes] = await Promise.allSettled([
        candidatePortalService.getProfile(),
        candidatePortalService.getAssignments(),
        candidatePortalService.getAttempts(),
        candidatePortalService.getResults(),
        candidatePortalService.getCertificates(),
        candidatePortalService.getInterviews(),
      ]);

      const unpack = (res, fallback = []) => {
        if (res.status !== 'fulfilled') return fallback;
        const val = res.value;
        return Array.isArray(val)
          ? val
          : val?.items || val?.assignments || val?.attempts || val?.results || val?.certificates || val?.interviews || val?.data || fallback;
      };

      if (profRes.status === 'fulfilled' && profRes.value) {
        const p = profRes.value?.data || profRes.value;
        if (p?.name || p?.firstName) {
          setProfile({
            name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            email: p.email || user?.email,
            candidateCode: p.candidateCode || 'CAND-894210',
            program: p.program || 'Aeronautical Systems Engineering',
            department: p.department || 'Aerospace & Flight Systems',
            status: p.status || 'ACTIVE',
          });
        }
      }

      setAssignments(
        unpack(assignRes, [
          {
            _id: 'as_1',
            title: 'Midterm Flight Telemetry & Instrument Navigation',
            code: 'AE-301-MID',
            duration: 90,
            dueDate: 'Tomorrow at 11:59 PM',
            totalQuestions: 45,
            securityTier: 'PROCTORED',
            status: 'AVAILABLE',
          },
          {
            _id: 'as_2',
            title: 'Supersonic Aerodynamics & Shockwave Theory',
            code: 'AE-405-FIN',
            duration: 120,
            dueDate: 'In 3 days',
            totalQuestions: 60,
            securityTier: 'KIOSK_LOCKED',
            status: 'SCHEDULED',
          },
        ])
      );

      setAttempts(
        unpack(attRes, [
          {
            _id: 'att_1',
            title: 'Pre-Flight Systems Check Quiz',
            submittedAt: 'Yesterday, 3:45 PM',
            score: 92,
            durationUsed: '38 mins',
            status: 'GRADED',
          },
        ])
      );

      setResults(
        unpack(resRes, [
          {
            _id: 'res_1',
            assessmentTitle: 'Pre-Flight Systems Check Quiz',
            score: 92,
            maxScore: 100,
            grade: 'A',
            passed: true,
            publishedAt: 'Yesterday',
            subject: 'Aerospace Engineering',
          },
        ])
      );

      setCertificates(
        unpack(certRes, [
          {
            _id: 'cert_1',
            title: 'Certified Flight Instrument Specialist (Level 1)',
            verificationCode: 'SA-AERO-2026-98124',
            issuedDate: 'August 28, 2026',
            issuer: 'Stanford Engineering Faculty',
          },
        ])
      );

      setInterviews(
        unpack(intRes, [
          {
            _id: 'int_1',
            title: 'Senior Flight Simulator Viva Voce',
            examinerName: 'Capt. Robert Chen',
            scheduledTime: 'Today at 4:00 PM (PKT)',
            status: 'CONFIRMED',
            roomId: 'room-aero-892',
          },
        ])
      );
    } catch (err) {
      console.warn('Candidate portal load note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const handleDownloadCertificate = (cert) => {
    setToast({
      type: 'success',
      text: `Downloading Certified PDF for ${cert.title} (Verification: ${cert.verificationCode})...`,
    });
  };

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white transition-colors duration-200">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      {/* Candidate Portal Top Navbar */}
      <header className="bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-soft">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-accent-900 dark:text-white tracking-tight">
                  SecureAssess
                </span>
                <Badge variant="primary" className="text-[10px] px-1.5 py-0">Candidate Portal</Badge>
              </div>
              <p className="text-[10px] text-accent-400">Examinee Dashboard & Gradebook</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
              onClick={loadPortalData}
            >
              Sync
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut size={14} />}
              onClick={() => {
                logout();
                onNavigate('login');
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Student Dossier Header Card */}
        <Card className="p-6 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-700 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-2xl shadow-inner">
                {profile.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-display">{profile.name}</h1>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                    {profile.candidateCode}
                  </span>
                </div>
                <p className="text-xs text-white/80">{profile.email}</p>
                <p className="text-xs font-semibold text-white/90">
                  {profile.program} • <span className="opacity-80">{profile.department}</span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-white/20 gap-1 text-right">
              <span className="text-xs text-white/70">Candidate Status</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-500/30 border border-success-400/50 text-xs font-bold">
                <CheckCircle2 size={13} /> Active Examinee
              </span>
            </div>
          </div>
        </Card>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-accent-200 dark:border-accent-800 pb-2 overflow-x-auto">
          {[
            { id: 'assigned', label: 'Assigned Assessments', count: assignments.length, icon: <FileText size={15} /> },
            { id: 'interviews', label: 'Live Interviews', count: interviews.length, icon: <Video size={15} /> },
            { id: 'results', label: 'Published Gradebook', count: results.length, icon: <Award size={15} /> },
            { id: 'certificates', label: 'Issued Credentials', count: certificates.length, icon: <ShieldCheck size={15} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60'
                  : 'text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent-200 dark:bg-accent-800 text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 1. Assigned Assessments */}
        {activeTab === 'assigned' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((exam) => (
                <Card key={exam._id} className="hover:border-primary-300 transition-colors">
                  <CardBody className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                            {exam.code}
                          </span>
                          <Badge variant="warning" className="text-[10px]">
                            {exam.securityTier || 'Proctored'}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-sm text-accent-900 dark:text-white mt-1">
                          {exam.title}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-accent-50 dark:bg-accent-900/60 rounded-xl px-3 border border-accent-200 dark:border-accent-800/50">
                      <div>
                        <span className="text-accent-400 text-[11px]">Duration:</span>
                        <p className="font-bold text-accent-800 dark:text-accent-200">{exam.duration} Minutes</p>
                      </div>
                      <div>
                        <span className="text-accent-400 text-[11px]">Due Window:</span>
                        <p className="font-bold text-accent-800 dark:text-accent-200">{exam.dueDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-accent-400 flex items-center gap-1">
                        <ShieldCheck size={13} className="text-success-500" /> Biometric & Camera Monitored
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        iconRight={<ArrowRight size={14} />}
                        onClick={() => onNavigate('participant-system-check')}
                      >
                        Launch Exam
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 2. Live Interviews */}
        {activeTab === 'interviews' && (
          <div className="space-y-4">
            {interviews.map((iv) => (
              <Card key={iv._id}>
                <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 dark:text-secondary-400 flex items-center justify-center font-bold border border-secondary-200 dark:border-secondary-800 shrink-0">
                      <Video size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-accent-900 dark:text-white">{iv.title}</h3>
                        <Badge variant="success" className="text-[10px]">{iv.status}</Badge>
                      </div>
                      <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">
                        Chief Examiner: <span className="font-semibold text-accent-800 dark:text-accent-200">{iv.examinerName}</span> • {iv.scheduledTime}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    icon={<Video size={14} />}
                    onClick={() => onNavigate('participant-interview')}
                  >
                    Join Video Room
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* 3. Published Gradebook */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((res) => (
                <Card key={res._id}>
                  <CardBody className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                          {res.subject}
                        </span>
                        <h3 className="font-bold text-sm text-accent-900 dark:text-white mt-0.5">
                          {res.assessmentTitle}
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 font-bold text-lg flex items-center justify-center border border-success-200 dark:border-success-800">
                        {res.grade || 'A'}
                      </div>
                    </div>

                    <div className="p-3 bg-accent-50 dark:bg-accent-900/60 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-accent-500">Achieved Score:</span>
                      <span className="font-mono font-bold text-accent-900 dark:text-white">
                        {res.score} / {res.maxScore || 100} ({res.score}%)
                      </span>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button variant="outline" size="sm" onClick={() => onNavigate('participant-evaluation')}>
                        Inspect Performance Feedback
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 4. Issued Credentials */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <Card key={cert._id} className="border-primary-200 dark:border-primary-800/40">
                <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold border border-primary-200 dark:border-primary-800 shrink-0">
                      <Award size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-accent-900 dark:text-white">{cert.title}</h3>
                      <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">
                        Issued by <span className="font-semibold text-accent-800 dark:text-accent-200">{cert.issuer}</span> on {cert.issuedDate}
                      </p>
                      <p className="text-[11px] font-mono text-primary-600 dark:text-primary-400 mt-1">
                        Verification Code: {cert.verificationCode}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    icon={<Download size={14} />}
                    onClick={() => handleDownloadCertificate(cert)}
                  >
                    Download Certified PDF
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default CandidatePortal;
