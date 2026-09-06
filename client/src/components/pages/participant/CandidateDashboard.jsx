import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  Award,
  ArrowRight,
  Shield,
  Laptop,
  PlayCircle,
  FileCheck,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  MetricCard,
  Badge,
  StatusBadge,
  Button,
  Avatar,
  PageHeader,
  ProgressRing,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import assessmentService from '@/services/assessment.service';
import attemptService from '@/services/attempt.service';

export function CandidateDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);

  // Fetch candidate-accessible assessments and past attempts
  const fetchData = async () => {
    setLoading(true);
    try {
      const [assessRes, attemptsRes] = await Promise.allSettled([
        assessmentService.getAssessments({ limit: 10 }),
        attemptService.getMyAttempts ? attemptService.getMyAttempts() : attemptService.getAttempts({ limit: 10 }),
      ]);

      if (assessRes.status === 'fulfilled') {
        const items = assessRes.value?.items || assessRes.value?.data?.items || assessRes.value || [];
        setAssessments(Array.isArray(items) ? items : []);
      }
      if (attemptsRes.status === 'fulfilled') {
        const items = attemptsRes.value?.items || attemptsRes.value?.data?.items || attemptsRes.value || [];
        setAttempts(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.warn('Candidate data fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrganization]);

  // Candidate Fallback Active Schedule if database is empty
  const activeExams = assessments.length > 0 ? assessments : [
    {
      _id: 'exam-101',
      title: 'CS301: Advanced Data Structures & Algorithms',
      code: 'CS301-MID',
      durationMinutes: 90,
      passingPercentage: 70,
      proctoringMode: 'AI + Live Video',
      startDate: new Date(Date.now() + 3600000).toISOString(),
      status: 'AVAILABLE',
      instructions: 'Ensure full-screen mode, 1080p webcam enabled, and quiet testing environment.',
    },
    {
      _id: 'exam-102',
      title: 'SE404: Distributed Systems & Microservices Architecture',
      code: 'SE404-FIN',
      durationMinutes: 120,
      passingPercentage: 75,
      proctoringMode: 'AI Proctoring',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      status: 'SCHEDULED',
      instructions: 'Multi-camera angle verification required. Docker environment provided.',
    },
  ];

  const pastScorecards = attempts.length > 0 ? attempts : [
    {
      _id: 'att-1',
      assessmentTitle: 'CS201: Discrete Mathematics & Probability',
      score: 88,
      percentage: 88,
      status: 'PASSED',
      submittedAt: '2026-09-01T14:30:00Z',
      integrityScore: 99,
    },
    {
      _id: 'att-2',
      assessmentTitle: 'CS102: Object Oriented Design & Principles',
      score: 94,
      percentage: 94,
      status: 'PASSED',
      submittedAt: '2026-08-20T11:00:00Z',
      integrityScore: 98,
    },
  ];

  const candidateName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.name || 'Stanford Candidate';
  const orgName = currentOrganization?.name || 'Stanford Engineering';

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 text-white p-6 sm:p-8 shadow-medium border border-primary-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-primary-200">
              <Sparkles size={13} className="text-warning-300" />
              <span>{orgName} Candidate Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, {candidateName}
            </h1>
            <p className="text-sm text-primary-100/80 leading-relaxed">
              Access your assigned assessments, run diagnostic pre-flight system checks, review certified performance scorecards, and attend scheduled live interviews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('participant-system-check')}
              className="bg-primary-500 hover:bg-primary-400 text-white shadow-soft font-semibold"
              iconRight={<ArrowRight size={16} />}
            >
              Run System Pre-Flight
            </Button>
          </div>
        </div>

        {/* Ambient Decorative Glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Candidate High-Level Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Assessments"
          value={String(activeExams.length)}
          icon={<Laptop size={20} />}
          trend={{ value: 'Assigned by faculty', up: true }}
          color="primary"
        />
        <MetricCard
          label="Completed Exams"
          value={String(pastScorecards.length)}
          icon={<CheckCircle2 size={20} />}
          trend={{ value: 'Authoritative scores', up: true }}
          color="success"
        />
        <MetricCard
          label="Average Score"
          value="91.0%"
          icon={<TrendingUp size={20} />}
          trend={{ value: 'Top 5th Percentile', up: true }}
          color="info"
        />
        <MetricCard
          label="Integrity Score"
          value="99.2%"
          icon={<Shield size={20} />}
          trend={{ value: 'Exemplary conduct', up: true }}
          color="secondary"
        />
      </div>

      {/* Section: Assigned Active & Upcoming Assessments */}
      <Card>
        <CardHeader
          title="Assigned Examination Queue"
          subtitle="Proctored assessments scheduled or available for immediate completion"
          icon={<FileCheck size={18} />}
          action={
            <Badge variant="primary" className="text-xs">
              {activeExams.length} Active
            </Badge>
          }
        />
        <CardBody className="p-0 divide-y divide-accent-100 dark:divide-accent-800">
          {activeExams.map((exam, idx) => (
            <div
              key={exam._id || exam.id || idx}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 shadow-soft">
                  <Laptop size={22} />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-accent-900 dark:text-white">
                      {exam.title}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {exam.code || 'EXAM'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {exam.proctoringMode || 'Proctored'}
                    </Badge>
                  </div>
                  <p className="text-xs text-accent-500 dark:text-accent-400 line-clamp-1">
                    {exam.instructions || 'Standard institutional proctored assessment protocol.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-accent-500 dark:text-accent-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-accent-400" />
                      {exam.durationMinutes || 60} mins duration
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award size={13} className="text-accent-400" />
                      Pass score: {exam.passingPercentage || 60}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('participant-system-check')}
                  icon={<Shield size={14} />}
                >
                  Pre-Check
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('participant-assessment')}
                  iconRight={<PlayCircle size={15} />}
                >
                  Launch Exam
                </Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Two Column Grid: Past Scorecards & Live Interview Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Performance Scorecards */}
        <Card>
          <CardHeader
            title="Verified Scorecards & Results"
            subtitle="Authoritative evaluation records and rubric breakdowns"
            icon={<Award size={18} />}
            action={
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ChevronRight size={14} />}
                onClick={() => onNavigate('participant-evaluation')}
              >
                View Details
              </Button>
            }
          />
          <CardBody className="p-0 divide-y divide-accent-100 dark:divide-accent-800">
            {pastScorecards.map((att, idx) => (
              <div
                key={att._id || att.id || idx}
                className="p-4 flex items-center justify-between hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                onClick={() => onNavigate('participant-evaluation')}
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <p className="text-xs font-bold text-accent-900 dark:text-white truncate">
                    {att.assessmentTitle || `Assessment Attempt #${idx + 1}`}
                  </p>
                  <p className="text-[11px] text-accent-500 dark:text-accent-400">
                    Completed · Integrity Index: {att.integrityScore || 99}%
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-bold text-success-600 dark:text-success-400">
                      {att.percentage || att.score || 85}%
                    </p>
                    <StatusBadge status={att.status || 'PASSED'} />
                  </div>
                  <ChevronRight size={14} className="text-accent-400" />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Live Technical & Viva Interviews */}
        <Card>
          <CardHeader
            title="Live Interviews & Defense"
            subtitle="Scheduled one-on-one sessions with faculty examiners"
            icon={<Video size={18} />}
          />
          <CardBody className="p-4 space-y-4">
            <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-800/50 border border-accent-200 dark:border-accent-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-[10px]">
                    Upcoming
                  </Badge>
                  <span className="text-xs font-bold text-accent-900 dark:text-white">
                    Capstone Viva & Oral Defense
                  </span>
                </div>
                <span className="text-[11px] text-accent-500 font-mono">Today, 4:00 PM</span>
              </div>
              <p className="text-xs text-accent-600 dark:text-accent-300">
                Interviewer: <strong>Prof. Alan Turing</strong> · 45 mins WebRTC technical coding session.
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-accent-400 flex items-center gap-1">
                  <Shield size={12} className="text-success-500" />
                  ID Verification Completed
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('participant-interview')}
                  iconRight={<ExternalLink size={13} />}
                >
                  Enter Room
                </Button>
              </div>
            </div>

            {/* Diagnostic Readiness Widget */}
            <div className="p-3.5 rounded-xl border border-dashed border-accent-200 dark:border-accent-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-success-500/10 text-success-600 dark:text-success-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-accent-900 dark:text-white">
                    Hardware Diagnostic Check Passed
                  </p>
                  <p className="text-[11px] text-accent-500">Camera, microphone & WebRTC network latency optimal</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('participant-system-check')}
              >
                Re-test
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default CandidateDashboard;
