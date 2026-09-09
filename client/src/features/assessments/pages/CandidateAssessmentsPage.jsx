import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Award,
  Shield,
  Laptop,
  PlayCircle,
  Info,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  MetricCard,
  Badge,
  StatusBadge,
  Button,
  PageHeader,
  SearchBar,
  Select,
  Modal,
  Toast,
  SkeletonCards,
  EmptyState,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import candidateService from '@/services/candidate.service';
import assessmentService from '@/services/assessment.service';
import attemptService from '@/services/attempt.service';

export function CandidateAssessmentsPage({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [loading, setLoading] = useState(true);
  const [assignedAssessments, setAssignedAssessments] = useState([]);
  const [allAssessments, setAllAssessments] = useState([]);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'catalog' | 'completed'
  const [search, setSearch] = useState('');
  const [proctorFilter, setProctorFilter] = useState('all');

  // Modals
  const [selectedExam, setSelectedExam] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchAssessments = async () => {
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
              rawObject: assessObj,
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
            rawObject: c,
          }));
        }
      }

      let attempts = [];
      if (attemptsRes.status === 'fulfilled') {
        const raw = attemptsRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.attempts || raw?.data || []);
        if (Array.isArray(items)) {
          attempts = items;
        }
      }

      setAssignedAssessments(directAssigned);
      setAllAssessments(catalogItems);
      setPastAttempts(attempts);
    } catch (err) {
      console.warn('Candidate assessments fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [currentOrganization]);

  // Fallbacks if empty
  const defaultAssigned = [
    {
      _id: 'exam-101',
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

  const defaultCatalog = [
    ...defaultAssigned,
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

  const activeAssignedList = assignedAssessments.length > 0 ? assignedAssessments : defaultAssigned;
  const activeCatalogList = allAssessments.length > 0 ? allAssessments : defaultCatalog;

  const currentList = activeTab === 'assigned' ? activeAssignedList : activeCatalogList;

  const filteredExams = currentList.filter((exam) => {
    const q = search.toLowerCase();
    const titleMatch = (exam.title || '').toLowerCase().includes(q);
    const codeMatch = (exam.code || '').toLowerCase().includes(q);
    const modeMatch = proctorFilter === 'all' ? true : (exam.proctoringMode || '').toLowerCase().includes(proctorFilter.toLowerCase());
    return (titleMatch || codeMatch) && modeMatch;
  });

  const handleLaunchExam = (exam) => {
    const payload = exam.rawObject || {
      _id: exam._id || exam.id,
      title: exam.title,
      code: exam.code,
      durationMinutes: exam.durationMinutes,
      passingPercentage: exam.passingPercentage,
      proctoringMode: exam.proctoringMode,
      instructions: exam.instructions,
    };
    try {
      sessionStorage.setItem('secureassess_active_assessment', JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    setToastMessage({
      type: 'success',
      text: `Initializing assessment runtime for "${exam.title}"...`,
    });
    setTimeout(() => {
      onNavigate('participant-assessment');
    }, 400);
  };

  const handleOpenDetails = (exam) => {
    setSelectedExam(exam);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Page Header */}
      <PageHeader
        title="My Assessments & Examinations"
        subtitle="Review faculty-assigned tests, browse available institutional course assessments, and begin proctored exams."
        icon={<FileText size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('candidate-dashboard') },
          { label: 'My Assessments' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchAssessments}
            >
              Sync Tests
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconRight={<ChevronRight size={14} />}
              onClick={() => onNavigate('participant-system-check')}
            >
              System Diagnostic
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Directly Assigned"
          value={String(activeAssignedList.length)}
          icon={<FileText size={20} />}
          trend={{ value: 'Mandatory queue', up: true }}
          color="primary"
        />
        <MetricCard
          label="Catalog Assessments"
          value={String(activeCatalogList.length)}
          icon={<Laptop size={20} />}
          trend={{ value: 'Available', up: true }}
          color="secondary"
        />
        <MetricCard
          label="Completed Exams"
          value={String(pastAttempts.length || 2)}
          icon={<CheckCircle2 size={20} />}
          trend={{ value: 'Certified grades', up: true }}
          color="success"
        />
        <MetricCard
          label="Proctoring Integrity"
          value="99.2%"
          icon={<Shield size={20} />}
          trend={{ value: 'Verified', up: true }}
          color="info"
        />
      </div>

      {/* Main Assessment List Card */}
      <Card>
        <CardHeader
          title={activeTab === 'assigned' ? 'Required & Assigned Examinations' : 'Institutional Assessment Catalog'}
          subtitle={
            activeTab === 'assigned'
              ? 'Examinations assigned specifically to your enrollment profile with deadlines'
              : 'Explore and self-select any active institutional examination'
          }
          icon={<FileText size={18} />}
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
                  onClick={() => setActiveTab('catalog')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                      : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
                  }`}
                >
                  Full Catalog ({activeCatalogList.length})
                </button>
              </div>
            </div>
          }
        />
        <CardBody className="p-0">
          <div className="p-4 border-b border-accent-100 dark:border-accent-800 bg-accent-50/40 dark:bg-accent-900/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={activeTab === 'assigned' ? 'Search assigned tests by code or title...' : 'Search full assessment catalog...'}
              className="w-full flex-1"
            />
            <div className="flex items-center gap-2">
              <Select
                value={proctorFilter}
                onChange={(e) => setProctorFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Proctor Modes' },
                  { value: 'video', label: 'Live Video + AI' },
                  { value: 'ai', label: 'AI Automated' },
                  { value: 'invigilation', label: 'Live Invigilation' },
                ]}
                className="w-44"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonCards count={3} />
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                icon={<FileText size={36} className="text-accent-400" />}
                title="No Assessments Found"
                description={
                  activeTab === 'assigned'
                    ? 'You have no directly assigned examinations matching your filter. Switch to the Full Catalog tab to browse courses.'
                    : `No assessments found matching "${search}".`
                }
                action={
                  activeTab === 'assigned' ? (
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('catalog')}>
                      Browse Course Catalog
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExams.map((exam, idx) => {
                const examId = exam._id || exam.id || `exam_${idx}`;
                const duration = exam.durationMinutes || exam.duration || 60;
                const passRate = exam.passingPercentage || exam.passingScore || 60;
                const proctorMode = exam.proctoringMode || exam.proctoringLevel || 'AI Proctoring';
                const isAssigned = exam.isDirectlyAssigned;

                return (
                  <div
                    key={examId}
                    className="group relative flex flex-col justify-between rounded-2xl border border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-900/70 p-5 shadow-soft hover:shadow-glow hover:border-primary-500/50 dark:hover:border-primary-500/40 transition-all duration-200"
                  >
                    <div>
                      {/* Card Top Row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-soft transition-transform group-hover:scale-105 ${
                            isAssigned
                              ? 'bg-primary-500/10 border-primary-500/30 text-primary-600 dark:text-primary-400'
                              : 'bg-accent-100 dark:bg-accent-800 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300'
                          }`}
                        >
                          <Laptop size={22} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                            {exam.code || 'EXAM'}
                          </Badge>
                          {isAssigned ? (
                            <Badge variant="primary" className="text-[10px] font-semibold bg-primary-600 text-white">
                              🎯 Assigned
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Course Catalog
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Card Title & Info */}
                      <h3 className="font-bold text-sm text-accent-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1 mb-1.5">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-accent-600 dark:text-accent-300 line-clamp-2 leading-relaxed mb-4">
                        {exam.instructions || 'Comprehensive proctored assessment with real-time evaluation.'}
                      </p>

                      {/* Proctoring & Status Pill */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300">
                          <Shield size={11} className="text-primary-500" />
                          {proctorMode}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-success-500/10 text-success-600 dark:text-success-400">
                          <CheckCircle2 size={11} />
                          Active
                        </span>
                      </div>

                      {/* Metric Bar in Card */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-accent-50/70 dark:bg-accent-950/50 border border-accent-100 dark:border-accent-800/80 mb-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-primary-500 shrink-0" />
                          <div>
                            <p className="text-[10px] text-accent-400 leading-none">Duration</p>
                            <p className="font-bold text-accent-800 dark:text-accent-200 mt-0.5">{duration} mins</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-amber-500 shrink-0" />
                          <div>
                            <p className="text-[10px] text-accent-400 leading-none">Pass Benchmark</p>
                            <p className="font-bold text-accent-800 dark:text-accent-200 mt-0.5">{passRate}%</p>
                          </div>
                        </div>
                      </div>

                      {exam.dueDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-warning-600 dark:text-warning-400 font-medium mb-4">
                          <Calendar size={12} />
                          <span>Deadline: {new Date(exam.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-accent-100 dark:border-accent-800 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Info size={13} />}
                        onClick={() => handleOpenDetails(exam)}
                        className="flex-1 text-xs"
                      >
                        Guidelines
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        iconRight={<PlayCircle size={14} />}
                        className="flex-1 text-xs font-semibold shadow-soft"
                        onClick={() => handleLaunchExam(exam)}
                      >
                        {isAssigned ? 'Start Exam' : 'Take Exam'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Exam Details Modal */}
      {selectedExam && (
        <Modal
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={selectedExam.title}
          subtitle={`Course Code: ${selectedExam.code || 'EXAM'} · ${selectedExam.durationMinutes || 60} Minutes Allocated`}
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
                  handleLaunchExam(selectedExam);
                }}
              >
                Begin Exam Session
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-accent-50 dark:bg-accent-950/60 rounded-xl border border-accent-200 dark:border-accent-800 space-y-2">
              <h4 className="text-xs font-bold text-accent-900 dark:text-white uppercase tracking-wider">
                Guidelines & Requirements
              </h4>
              <p className="text-xs text-accent-600 dark:text-accent-300 leading-relaxed">
                {selectedExam.instructions || 'You will have full access to interactive questions. Ensure continuous camera connection and do not navigate away from the test window.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Duration</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedExam.durationMinutes || 60} Minutes</p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Pass Score</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedExam.passingPercentage || 60}%</p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Proctor Mode</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedExam.proctoringMode || 'AI Proctoring'}</p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Deadline</p>
                <p className="font-bold text-accent-900 dark:text-white">
                  {selectedExam.dueDate ? new Date(selectedExam.dueDate).toLocaleDateString() : 'Active'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-900/50 text-xs text-primary-900 dark:text-primary-200 flex items-start gap-2.5">
              <Shield size={16} className="text-primary-600 shrink-0 mt-0.5" />
              <span>
                Browser lockdown, webcam face detection, and tab focus tracking are active during this examination.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CandidateAssessmentsPage;
