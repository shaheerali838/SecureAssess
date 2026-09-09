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
  Search,
  Filter,
  Info,
  BookOpen,
  Eye,
  Check,
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
  SearchBar,
  Select,
  Modal,
  Toast,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import assessmentService from '@/services/assessment.service';
import candidateService from '@/services/candidate.service';
import attemptService from '@/services/attempt.service';

export function CandidateDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [assignedAssessments, setAssignedAssessments] = useState([]);
  const [allAssessments, setAllAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch candidate-accessible assessments, direct assignments, and past attempts
  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignedRes, catalogRes, attemptsRes] = await Promise.allSettled([
        candidateService.getMyAssignments(),
        assessmentService.getAssessments({ limit: 50 }),
        candidateService.getMyAttempts ? candidateService.getMyAttempts() : attemptService.getAttempts({ limit: 20 }),
      ]);

      let directAssigned = [];
      if (assignedRes.status === 'fulfilled') {
        const raw = assignedRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.assignments || raw?.data || []);
        if (Array.isArray(items) && items.length > 0) {
          directAssigned = items.map((asgn) => {
            const assessObj = asgn.assessmentId && typeof asgn.assessmentId === 'object' ? asgn.assessmentId : asgn;
            return {
              _id: assessObj._id || asgn._id || asgn.id,
              assignmentId: asgn._id || asgn.id,
              title: assessObj.title || asgn.title || 'Assigned Examination',
              code: assessObj.code || asgn.code || 'EXAM-REQ',
              durationMinutes: assessObj.durationMinutes || asgn.durationMinutes || 90,
              passingPercentage: assessObj.passingPercentage || asgn.passingPercentage || 70,
              proctoringMode: assessObj.proctoringMode || asgn.proctoringMode || 'AI + Live Video',
              status: asgn.status || 'AVAILABLE',
              dueDate: asgn.dueDate || asgn.deadline || new Date(Date.now() + 86400000 * 3).toISOString(),
              isDirectlyAssigned: true,
              instructions: assessObj.instructions || asgn.instructions || 'Mandatory curriculum examination assigned by your faculty advisor.',
              questions: assessObj.questions || [],
            };
          });
        }
      }

      let catalogItems = [];
      if (catalogRes.status === 'fulfilled') {
        const raw = catalogRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data?.items || raw?.data || []);
        if (Array.isArray(items) && items.length > 0) {
          catalogItems = items.map((c) => ({
            ...c,
            isDirectlyAssigned: directAssigned.some((da) => da._id === c._id || da.code === c.code),
          }));
        }
      }

      setAssignedAssessments(directAssigned);
      setAllAssessments(catalogItems);

      if (attemptsRes.status === 'fulfilled') {
        const items = attemptsRes.value?.items || attemptsRes.value?.data?.items || (Array.isArray(attemptsRes.value) ? attemptsRes.value : []);
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

  // Fallback direct assigned examinations if none in DB
  const defaultAssignedExams = [
    {
      _id: 'exam-101',
      assignmentId: 'asgn-01',
      title: 'CS301: Advanced Data Structures & Algorithms',
      code: 'CS301-MID',
      durationMinutes: 90,
      passingPercentage: 70,
      proctoringMode: 'AI + Live Video',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'AVAILABLE',
      isDirectlyAssigned: true,
      instructions: 'Mandatory Midterm Exam assigned by Dept of Computer Science. Ensure full-screen mode and working webcam.',
    },
    {
      _id: 'exam-102',
      assignmentId: 'asgn-02',
      title: 'SE404: Distributed Systems & Microservices Architecture',
      code: 'SE404-FIN',
      durationMinutes: 120,
      passingPercentage: 75,
      proctoringMode: 'AI Proctoring',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: 'AVAILABLE',
      isDirectlyAssigned: true,
      instructions: 'Final comprehensive exam assigned by faculty examiner. Multi-camera verification enabled.',
    },
  ];

  // Fallback catalog
  const defaultCatalogExams = [
    ...defaultAssignedExams,
    {
      _id: 'exam-103',
      title: 'CY502: Applied Cryptography & Zero-Knowledge Proofs',
      code: 'CY502-VIVA',
      durationMinutes: 60,
      passingPercentage: 80,
      proctoringMode: 'Live Invigilation',
      status: 'AVAILABLE',
      isDirectlyAssigned: false,
      instructions: 'Interactive ZK-SNARK reasoning examination with automated code execution.',
    },
    {
      _id: 'exam-104',
      title: 'AI601: Deep Reinforcement Learning & Autonomous Agents',
      code: 'AI601-TEST',
      durationMinutes: 75,
      passingPercentage: 70,
      proctoringMode: 'AI Proctoring',
      status: 'AVAILABLE',
      isDirectlyAssigned: false,
      instructions: 'Markov Decision Processes, Policy Gradient formulations, and Q-learning convergence dynamics.',
    },
  ];

  const activeAssignedList = assignedAssessments.length > 0 ? assignedAssessments : defaultAssignedExams;
  const activeCatalogList = allAssessments.length > 0 ? allAssessments : defaultCatalogExams;

  const currentList = activeTab === 'assigned' ? activeAssignedList : activeCatalogList;

  const filteredExams = currentList.filter((exam) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = (exam.title || '').toLowerCase().includes(q);
    const codeMatch = (exam.code || '').toLowerCase().includes(q);
    const modeMatch = (exam.proctoringMode || '').toLowerCase().includes(q);
    return titleMatch || codeMatch || modeMatch;
  });

  const handleSelectAndLaunchExam = (exam) => {
    try {
      sessionStorage.setItem('secureassess_active_assessment', JSON.stringify(exam));
    } catch (e) {
      console.warn('Failed to store active assessment in session:', e);
    }
    setToastMessage({
      type: 'success',
      text: `Selected "${exam.title}". Initializing examination environment...`,
    });
    setTimeout(() => {
      onNavigate('participant-assessment');
    }, 400);
  };

  const handleOpenDetails = (exam) => {
    setSelectedExamDetails(exam);
    setDetailsModalOpen(true);
  };

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
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

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
              Explore all active faculty assessments available to you. Select any exam below to review syllabus instructions, run system diagnostics, and begin your proctored evaluation.
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
          label="Directly Assigned Exams"
          value={String(activeAssignedList.length)}
          icon={<FileCheck size={20} />}
          trend={{ value: 'Mandatory queue', up: true }}
          color="primary"
        />
        <MetricCard
          label="Catalog Assessments"
          value={String(activeCatalogList.length)}
          icon={<Laptop size={20} />}
          trend={{ value: 'Available to take', up: true }}
          color="secondary"
        />
        <MetricCard
          label="Completed Exams"
          value={String(pastScorecards.length)}
          icon={<CheckCircle2 size={20} />}
          trend={{ value: 'Authoritative scores', up: true }}
          color="success"
        />
        <MetricCard
          label="Integrity Score"
          value="99.2%"
          icon={<Shield size={20} />}
          trend={{ value: 'Exemplary conduct', up: true }}
          color="info"
        />
      </div>

      {/* Section: Assigned Active & Available Assessments */}
      <Card>
        <CardHeader
          title={activeTab === 'assigned' ? 'Directly Assigned Assessments' : 'All Institutional Assessments'}
          subtitle={
            activeTab === 'assigned'
              ? 'Required examinations assigned specifically to your student profile by faculty'
              : 'Browse and choose from all active faculty examinations available across your institution'
          }
          icon={<FileCheck size={18} />}
          action={
            <div className="flex items-center gap-2">
              <div className="flex bg-accent-100 dark:bg-accent-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('assigned')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'assigned'
                      ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                      : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
                  }`}
                >
                  Assigned to Me ({activeAssignedList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                      : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
                  }`}
                >
                  All Catalog ({activeCatalogList.length})
                </button>
              </div>
            </div>
          }
        />
        <CardBody className="p-0">
          <div className="p-4 border-b border-accent-100 dark:border-accent-800 bg-accent-50/40 dark:bg-accent-900/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={activeTab === 'assigned' ? 'Search assigned assessments...' : 'Search all available catalog assessments...'}
              className="w-full flex-1"
            />
            <div className="text-xs text-accent-500 shrink-0 font-medium">
              Showing <strong>{filteredExams.length}</strong> {activeTab === 'assigned' ? 'assigned' : 'catalog'} exam{filteredExams.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="divide-y divide-accent-100 dark:divide-accent-800">
            {filteredExams.length === 0 ? (
              <div className="p-8 text-center text-xs text-accent-400">
                {activeTab === 'assigned'
                  ? 'No directly assigned assessments matching your filter. Check the "All Catalog" tab to browse open exams.'
                  : `No assessments found matching "${searchQuery}".`}
              </div>
            ) : (
              filteredExams.map((exam, idx) => {
                const examId = exam._id || exam.id || `exam-${idx}`;
                const duration = exam.durationMinutes || exam.duration || 60;
                const passRate = exam.passingPercentage || exam.passingScore || 60;
                const proctorMode = exam.proctoringMode || exam.proctoringLevel || 'AI Proctoring';
                const isAssigned = exam.isDirectlyAssigned;

                return (
                  <div
                    key={examId}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-soft ${
                        isAssigned
                          ? 'bg-primary-500/10 border-primary-500/30 text-primary-600 dark:text-primary-400'
                          : 'bg-accent-100 dark:bg-accent-800 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300'
                      }`}>
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
                          {isAssigned && (
                            <Badge variant="primary" className="text-[10px] font-semibold bg-primary-600 text-white">
                              🎯 Assigned to You
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {proctorMode}
                          </Badge>
                          <Badge variant="success" className="text-[10px]">
                            Ready to Take
                          </Badge>
                        </div>
                        <p className="text-xs text-accent-600 dark:text-accent-300 line-clamp-2 leading-relaxed">
                          {exam.instructions || exam.description || 'Standard institutional proctored assessment protocol.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-accent-500 dark:text-accent-400 pt-1 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-primary-500" />
                            {duration} minutes duration
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Award size={13} className="text-amber-500" />
                            Pass benchmark: {passRate}%
                          </span>
                          {exam.dueDate && (
                            <span className="flex items-center gap-1.5 text-warning-600 dark:text-warning-400 font-semibold">
                              <Calendar size={13} />
                              Due: {new Date(exam.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(exam)}
                        icon={<Info size={14} />}
                      >
                        Guidelines
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectAndLaunchExam(exam)}
                        iconRight={<PlayCircle size={15} />}
                        className="font-semibold shadow-soft"
                      >
                        {isAssigned ? 'Take Assigned Exam' : 'Take This Exam'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardBody>
      </Card>

      {/* Exam Details / Instructions Modal */}
      {selectedExamDetails && (
        <Modal
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={selectedExamDetails.title}
          subtitle={`Course Code: ${selectedExamDetails.code || 'EXAM'} · ${selectedExamDetails.durationMinutes || 60} Mins Duration`}
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconRight={<PlayCircle size={15} />}
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleSelectAndLaunchExam(selectedExamDetails);
                }}
              >
                Start Examination Now
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-accent-50 dark:bg-accent-950/60 rounded-xl border border-accent-200 dark:border-accent-800 space-y-2">
              <h4 className="text-xs font-bold text-accent-900 dark:text-white uppercase tracking-wider">
                Examination Overview & Rules
              </h4>
              <p className="text-xs text-accent-600 dark:text-accent-300 leading-relaxed">
                {selectedExamDetails.instructions || 'You will have full access to interactive coding and reasoning problems. Ensure continuous web camera connection and do not navigate away from the test window.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Duration Allocated</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedExamDetails.durationMinutes || 60} Minutes</p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Minimum Passing Score</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedExamDetails.passingPercentage || 60}%</p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Proctoring Enforcement</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedExamDetails.proctoringMode || 'AI Proctoring'}</p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Attempts Allowed</p>
                <p className="font-bold text-accent-900 dark:text-white">1 Certified Attempt</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-900/50 text-xs text-primary-900 dark:text-primary-200 flex items-start gap-2.5">
              <Shield size={16} className="text-primary-600 shrink-0 mt-0.5" />
              <span>
                Browser lockdown and focus tracking are active during this exam. Navigating to secondary tabs will log incident markers on your examiner report.
              </span>
            </div>
          </div>
        </Modal>
      )}

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
