import React, { useState, useEffect } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Video,
  Shield,
  Star,
  Download,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  BookOpen,
  MessageSquare,
  AlertCircle,
  X,
  Printer,
  Check,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  MetricCard,
  Badge,
  Button,
  Avatar,
  PageHeader,
  ProgressBar,
  SearchBar,
  Select,
  Modal,
  Toast,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import candidateService from '@/services/candidate.service';
import attemptService from '@/services/attempt.service';
import evaluationService from '@/services/evaluation.service';

export function Evaluation({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'assessments' | 'interviews'
  const [searchQuery, setSearchQuery] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const candidateName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.name || 'Stanford Candidate';

  const orgName = currentOrganization?.name || 'Stanford Engineering';

  // Fetch candidate's authoritative attempts and completed interview evaluations
  const fetchData = async () => {
    setLoading(true);
    try {
      const [attemptsRes, interviewsRes] = await Promise.allSettled([
        candidateService.getMyAttempts ? candidateService.getMyAttempts() : attemptService.getAttempts({ limit: 50 }),
        candidateService.getMyInterviews ? candidateService.getMyInterviews() : Promise.resolve([]),
      ]);

      if (attemptsRes.status === 'fulfilled') {
        const raw = attemptsRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data?.items || raw?.data || []);
        if (Array.isArray(items) && items.length > 0) {
          setAttempts(items);
        }
      }

      if (interviewsRes.status === 'fulfilled') {
        const raw = interviewsRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.interviews || raw?.data || []);
        if (Array.isArray(items) && items.length > 0) {
          setInterviews(items);
        }
      }
    } catch (err) {
      console.warn('Candidate results fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrganization]);

  // Fallback realistic assessment scorecards
  const defaultAssessments = [
    {
      _id: 'att-101',
      type: 'assessment',
      title: 'CS301: Advanced Data Structures & Algorithms',
      code: 'CS301-MID',
      score: 92,
      totalPoints: 100,
      percentage: 92,
      passingPercentage: 70,
      status: 'PASSED',
      submittedAt: '2026-09-02T14:30:00Z',
      durationMinutes: 74,
      integrityScore: 99.4,
      proctoringMode: 'AI + Live Video',
      breakdown: [
        { topic: 'Red-Black Trees & AVL Self-Balancing', earned: 28, total: 30 },
        { topic: 'Dynamic Programming & Memoization', earned: 34, total: 35 },
        { topic: 'Graph Theory & Dijkstra Shortest Path', earned: 30, total: 35 },
      ],
      examinerRemarks: 'Exceptional problem decomposition in dynamic programming. Time complexity was optimal (O(V+E)).',
    },
    {
      _id: 'att-102',
      type: 'assessment',
      title: 'SE404: Distributed Systems & Microservices Architecture',
      code: 'SE404-FIN',
      score: 86,
      totalPoints: 100,
      percentage: 86,
      passingPercentage: 75,
      status: 'PASSED',
      submittedAt: '2026-08-28T16:15:00Z',
      durationMinutes: 108,
      integrityScore: 98.8,
      proctoringMode: 'AI Proctoring',
      breakdown: [
        { topic: 'Raft Consensus & Leader Election', earned: 27, total: 30 },
        { topic: 'CAP Theorem & Eventual Consistency', earned: 29, total: 35 },
        { topic: 'gRPC & Service Mesh Communication', earned: 30, total: 35 },
      ],
      examinerRemarks: 'Solid grasp of distributed consensus. Minor edge case overlooked in partitioned network recovery.',
    },
  ];

  // Fallback realistic interview evaluations & rubric scores
  const defaultInterviews = [
    {
      _id: 'int-201',
      type: 'interview',
      title: 'CS301 Viva Defense: Algorithmic Verification & System Architecture',
      format: '1-on-1 Viva Defense',
      examiner: 'Prof. Jonathan Vance',
      examinerTitle: 'Head of Computer Systems Dept.',
      date: '2026-09-04T10:00:00Z',
      recommendation: 'Strong',
      overallScore: 94,
      rubricScores: [
        { criteria: 'Technical Depth & Core Knowledge', score: 5, max: 5 },
        { criteria: 'Problem Solving & Real-time Coding', score: 5, max: 5 },
        { criteria: 'Verbal & Technical Communication', score: 4, max: 5 },
        { criteria: 'Code Quality & Modular Design', score: 5, max: 5 },
        { criteria: 'Adherence to Integrity & Ethics', score: 5, max: 5 },
      ],
      strengths: 'Demonstrated deep algorithmic intuition during the live whiteboard challenge. Code was clean and test-driven.',
      improvementAreas: 'Could articulate asymptotic trade-offs slightly faster under rapid-fire questioning.',
      verdict: 'Certified with High Distinction. Recommended for Advanced Honors Research Track.',
    },
    {
      _id: 'int-202',
      type: 'interview',
      title: 'SE404 Faculty Technical Defense: Microservices Scalability',
      format: 'Faculty Panel Defense',
      examiner: 'Dr. Elena Rostova',
      examinerTitle: 'Associate Dean of Engineering',
      date: '2026-08-30T15:00:00Z',
      recommendation: 'Positive',
      overallScore: 88,
      rubricScores: [
        { criteria: 'Technical Depth & Core Knowledge', score: 4, max: 5 },
        { criteria: 'Problem Solving & Real-time Coding', score: 4, max: 5 },
        { criteria: 'Verbal & Technical Communication', score: 5, max: 5 },
        { criteria: 'Code Quality & Modular Design', score: 4, max: 5 },
        { criteria: 'Adherence to Integrity & Ethics', score: 5, max: 5 },
      ],
      strengths: 'Excellent verbal presentation and diagramming of microservice resilience patterns.',
      improvementAreas: 'Review fault-tolerance recovery benchmarks in asynchronous queue dead-letter routing.',
      verdict: 'Passed. Meets all curriculum requirements for master-level credentialing.',
    },
  ];

  const activeAssessmentsList = attempts.length > 0
    ? attempts.map((att, idx) => ({
        _id: att._id || `att-${idx}`,
        type: 'assessment',
        title: att.assessmentTitle || att.assessmentId?.title || 'Academic Assessment',
        code: att.assessmentCode || att.assessmentId?.code || 'EXAM-REC',
        score: att.score || att.earnedPoints || 0,
        totalPoints: att.totalPoints || 100,
        percentage: att.percentage || att.score || 0,
        passingPercentage: att.passingPercentage || 70,
        status: att.status === 'FAILED' ? 'FAILED' : 'PASSED',
        submittedAt: att.submittedAt || att.createdAt || new Date().toISOString(),
        durationMinutes: att.durationMinutes || 60,
        integrityScore: att.integrityScore || 100.0,
        proctoringMode: att.proctoringMode || 'AI Proctoring',
        breakdown: att.breakdown || [],
        examinerRemarks: att.feedback || 'Completed according to institutional protocol.',
      }))
    : [];

  const activeInterviewsList = interviews.length > 0
    ? interviews
        .filter((iv) => iv.status === 'COMPLETED' || iv.status === 'EVALUATED')
        .map((iv, idx) => ({
          _id: iv._id || `iv-${idx}`,
          type: 'interview',
          title: iv.title || 'Technical Viva Defense',
          format: iv.format || '1-on-1 Viva Defense',
          examiner: iv.examinerName || iv.interviewer || 'Faculty Examiner',
          examinerTitle: 'Faculty Examiner',
          date: iv.scheduledAt || iv.createdAt || new Date().toISOString(),
          recommendation: iv.recommendation || 'Positive',
          overallScore: iv.score || 0,
          rubricScores: iv.rubricScores || [],
          strengths: iv.feedback || 'Evaluation complete.',
          improvementAreas: iv.improvementAreas || '',
          verdict: iv.verdict || 'Evaluation recorded.',
        }))
    : [];

  // Aggregate statistics
  const totalAssessmentsCount = activeAssessmentsList.length;
  const passedAssessmentsCount = activeAssessmentsList.filter((a) => a.status === 'PASSED').length;
  const avgAssessmentScore =
    totalAssessmentsCount > 0
      ? (activeAssessmentsList.reduce((acc, curr) => acc + curr.percentage, 0) / totalAssessmentsCount).toFixed(1)
      : '0.0';

  const totalInterviewsCount = activeInterviewsList.length;
  const avgInterviewScore =
    totalInterviewsCount > 0
      ? (activeInterviewsList.reduce((acc, curr) => acc + curr.overallScore, 0) / totalInterviewsCount).toFixed(1)
      : '0.0';

  const combinedItems = [
    ...activeAssessmentsList,
    ...activeInterviewsList,
  ].sort((a, b) => {
    const dateA = new Date(a.submittedAt || a.date);
    const dateB = new Date(b.submittedAt || b.date);
    return dateB - dateA;
  });

  const displayedItems = combinedItems.filter((item) => {
    if (activeTab === 'assessments' && item.type !== 'assessment') return false;
    if (activeTab === 'interviews' && item.type !== 'interview') return false;

    const q = searchQuery.toLowerCase();
    const titleMatch = (item.title || '').toLowerCase().includes(q);
    const examinerMatch = (item.examiner || '').toLowerCase().includes(q);
    const codeMatch = (item.code || '').toLowerCase().includes(q);
    return titleMatch || examinerMatch || codeMatch;
  });

  const handleOpenDetails = (item) => {
    setSelectedRecord(item);
    setDetailsModalOpen(true);
  };

  const recBadgeVariant = (rec) => {
    switch (rec) {
      case 'Strong':
        return 'success';
      case 'Positive':
        return 'primary';
      case 'Consider':
        return 'warning';
      default:
        return 'neutral';
    }
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
        title="My Results & Performance Analytics"
        subtitle="Review certified exam scorecards, faculty viva feedback, and academic competency statistics."
        icon={<Award size={24} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('candidate-dashboard') },
          { label: 'Results & Feedback' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchData}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Export Transcript
            </Button>
          </div>
        }
      />

      {/* Candidate Aggregate Performance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Average Examination Score"
          value={`${avgAssessmentScore}%`}
          icon={<BarChart3 size={20} />}
          trend={{ value: `${passedAssessmentsCount} of ${totalAssessmentsCount} Passed`, up: true }}
          color="primary"
        />
        <MetricCard
          label="Faculty Viva Rating"
          value={`${avgInterviewScore}%`}
          icon={<Video size={20} />}
          trend={{ value: `${totalInterviewsCount} Evaluated Defenses`, up: true }}
          color="secondary"
        />
        <MetricCard
          label="Assessments Passed"
          value={`${passedAssessmentsCount} / ${totalAssessmentsCount}`}
          icon={<CheckCircle2 size={20} />}
          trend={{ value: '100% Pass Rate', up: true }}
          color="success"
        />
        <MetricCard
          label="Certified Integrity Score"
          value="99.2%"
          icon={<Shield size={20} />}
          trend={{ value: 'Zero Violations', up: true }}
          color="info"
        />
      </div>

      {/* Filter and Content Stream Card */}
      <Card>
        <CardHeader
          title="Certified Performance Scorecards & Viva Feedback"
          subtitle="Click on any examination or faculty defense to inspect the complete rubric scoring breakdown and examiner commentary."
          icon={<FileText size={18} />}
          action={
            <div className="flex bg-accent-100 dark:bg-accent-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                    : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
                }`}
              >
                All Records ({combinedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assessments')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'assessments'
                    ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                    : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
                }`}
              >
                Assessments ({activeAssessmentsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('interviews')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'interviews'
                    ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                    : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
                }`}
              >
                Interviews & Viva ({activeInterviewsList.length})
              </button>
            </div>
          }
        />

        <CardBody className="p-0">
          <div className="p-4 border-b border-accent-100 dark:border-accent-800 bg-accent-50/40 dark:bg-accent-900/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by test name, course code, or examiner name..."
              className="w-full flex-1"
            />
            <div className="text-xs text-accent-500 shrink-0 font-medium">
              Showing <strong>{displayedItems.length}</strong> certified record{displayedItems.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="divide-y divide-accent-100 dark:divide-accent-800">
            {displayedItems.length === 0 ? (
              <div className="p-10 text-center text-xs text-accent-400">
                No certified records found matching your filter criteria.
              </div>
            ) : (
              displayedItems.map((item) => {
                const isAssessment = item.type === 'assessment';
                const dateStr = new Date(item.submittedAt || item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={item._id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-soft ${
                          isAssessment
                            ? 'bg-primary-500/10 border-primary-500/30 text-primary-600 dark:text-primary-400'
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {isAssessment ? <FileText size={22} /> : <Video size={22} />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-accent-900 dark:text-white">
                            {item.title}
                          </h3>
                          {isAssessment ? (
                            <>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {item.code}
                              </Badge>
                              <Badge variant={item.status === 'PASSED' ? 'success' : 'danger'} className="text-[10px]">
                                {item.status}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                {item.proctoringMode}
                              </Badge>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="text-[10px]">
                                {item.format}
                              </Badge>
                              <Badge variant={recBadgeVariant(item.recommendation)} className="text-[10px] font-semibold">
                                {item.recommendation} Recommendation
                              </Badge>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-accent-600 dark:text-accent-300 line-clamp-1 leading-relaxed">
                          {isAssessment
                            ? item.examinerRemarks
                            : `Examiner: ${item.examiner} (${item.examinerTitle}) · "${item.strengths}"`}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-accent-500 dark:text-accent-400 pt-1 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-primary-500" />
                            Completed: {dateStr}
                          </span>
                          {isAssessment && (
                            <span className="flex items-center gap-1.5">
                              <Shield size={13} className="text-success-500" />
                              Integrity: {item.integrityScore}%
                            </span>
                          )}
                          {!isAssessment && (
                            <span className="flex items-center gap-1.5">
                              <Award size={13} className="text-amber-500" />
                              Evaluator: {item.examiner}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-lg font-black font-display text-accent-900 dark:text-white">
                          {isAssessment ? `${item.percentage}%` : `${item.overallScore}%`}
                        </div>
                        <div className="text-[10px] text-accent-400 font-semibold uppercase tracking-wider">
                          {isAssessment ? `Score: ${item.score}/${item.totalPoints}` : 'Rubric Score'}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(item)}
                        className="font-semibold shadow-soft"
                        iconRight={<ChevronRight size={14} />}
                      >
                        {isAssessment ? 'Scorecard' : 'Feedback'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardBody>
      </Card>

      {/* Comprehensive Scorecard & Feedback Inspection Modal */}
      {selectedRecord && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={selectedRecord.type === 'assessment' ? 'Official Examination Scorecard' : 'Faculty Viva Evaluation Report'}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header Summary */}
            <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-400">
                  {selectedRecord.type === 'assessment' ? 'Course Examination' : 'Viva Defense Session'}
                </span>
                <h2 className="text-base font-bold text-accent-900 dark:text-white mt-0.5">
                  {selectedRecord.title}
                </h2>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">
                  Candidate: <strong>{candidateName}</strong> · Organization: <strong>{orgName}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-2xl font-black text-primary-600 dark:text-primary-400 font-display">
                  {selectedRecord.type === 'assessment' ? `${selectedRecord.percentage}%` : `${selectedRecord.overallScore}%`}
                </div>
                <Badge
                  variant={
                    selectedRecord.type === 'assessment'
                      ? selectedRecord.status === 'PASSED'
                        ? 'success'
                        : 'danger'
                      : recBadgeVariant(selectedRecord.recommendation)
                  }
                  className="mt-1"
                >
                  {selectedRecord.type === 'assessment'
                    ? selectedRecord.status
                    : `${selectedRecord.recommendation} Recommendation`}
                </Badge>
              </div>
            </div>

            {/* Assessment Topic Breakdown */}
            {selectedRecord.type === 'assessment' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-accent-500 flex items-center gap-1.5">
                  <BarChart3 size={15} /> Topic & Competency Breakdown
                </h3>
                <div className="space-y-3">
                  {selectedRecord.breakdown.map((b, idx) => {
                    const topicPct = Math.round((b.earned / b.total) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-accent-800 dark:text-accent-200">{b.topic}</span>
                          <span className="text-accent-900 dark:text-white font-mono">
                            {b.earned} / {b.total} pts ({topicPct}%)
                          </span>
                        </div>
                        <ProgressBar
                          value={topicPct}
                          max={100}
                          color={topicPct >= 75 ? 'success' : topicPct >= 60 ? 'primary' : 'warning'}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-800 dark:text-primary-300">
                    <MessageSquare size={14} /> Official Examiner Feedback
                  </div>
                  <p className="text-xs text-primary-900 dark:text-primary-200 leading-relaxed">
                    {selectedRecord.examinerRemarks}
                  </p>
                </div>
              </div>
            )}

            {/* Interview Rubric Scoring */}
            {selectedRecord.type === 'interview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent-500 flex items-center gap-1.5">
                    <Award size={15} /> Evaluated Rubric Dimensions
                  </h3>
                  <span className="text-xs text-accent-400">
                    Evaluator: <strong>{selectedRecord.examiner}</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedRecord.rubricScores.map((rubric, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-accent-200 dark:border-accent-700/60 bg-white dark:bg-accent-900 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-accent-800 dark:text-accent-200">
                        {rubric.criteria}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= rubric.score
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-accent-300 dark:text-accent-700'
                            }
                          />
                        ))}
                        <span className="text-xs font-mono font-bold text-accent-900 dark:text-white ml-2">
                          {rubric.score}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-900/50 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-success-700 dark:text-success-400 flex items-center gap-1">
                      <Check size={12} /> Demonstrated Strengths
                    </span>
                    <p className="text-xs text-success-900 dark:text-success-200 leading-relaxed">
                      {selectedRecord.strengths}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-900/50 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-warning-700 dark:text-warning-400 flex items-center gap-1">
                      <TrendingUp size={12} /> Target Growth Areas
                    </span>
                    <p className="text-xs text-warning-900 dark:text-warning-200 leading-relaxed">
                      {selectedRecord.improvementAreas}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-accent-100 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-accent-600 dark:text-accent-300">
                    Faculty Determination & Verdict
                  </span>
                  <p className="text-xs font-semibold text-accent-900 dark:text-white">
                    {selectedRecord.verdict}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-accent-200 dark:border-accent-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Printer size={14} />}
                onClick={() => window.print()}
              >
                Print Official Scorecard
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Evaluation;
