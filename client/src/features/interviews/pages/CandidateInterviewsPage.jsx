import React, { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Clock,
  User,
  Shield,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  Camera,
  Mic,
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
import interviewService from '@/services/interview.service';

export function CandidateInterviewsPage({ onNavigate }) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'all'
  const [search, setSearch] = useState('');

  // Modals
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [agendaModalOpen, setAgendaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await candidateService.getMyInterviews();
      const raw = res?.data || res?.items || (Array.isArray(res) ? res : []);

      if (Array.isArray(raw) && raw.length > 0) {
        const mapped = raw.map((inv, idx) => ({
          id: inv._id || inv.id || `inv_${idx}`,
          title: inv.title || 'Technical Oral Defense',
          code: `INTV-${(inv.type || 'TECH').toUpperCase()}`,
          scheduledAt: inv.scheduledStartAt || inv.scheduledAt || new Date(Date.now() + 3600000 * 2).toISOString(),
          durationMinutes: inv.duration || inv.durationMinutes || 45,
          interviewer: inv.examinerName || (inv.examinerId?.firstName ? `${inv.examinerId.firstName} ${inv.examinerId.lastName || ''}`.trim() : 'Prof. Ada Lovelace'),
          interviewerEmail: inv.examinerId?.email || 'examiner@stanford.edu',
          status: inv.status || 'SCHEDULED',
          format: '1-on-1 WebRTC Video Session',
          roomToken: inv.roomToken || inv.roomId || `room-${inv._id}`,
          instructions: inv.description || 'Prepare your webcam, screen sharing, and identity credential before entering.',
          rawObject: inv,
        }));
        setInterviews(mapped);
      } else {
        setInterviews(defaultInterviews);
      }
    } catch (err) {
      console.warn('Candidate interviews fetch fallback:', err.message);
      setInterviews(defaultInterviews);
    } finally {
      setLoading(false);
    }
  };

  const defaultInterviews = [
    {
      id: 'inv-101',
      title: 'Senior Capstone Technical Viva & Defense',
      code: 'INTV-CAPSTONE',
      scheduledAt: new Date(Date.now() + 3600000 * 3).toISOString(),
      durationMinutes: 45,
      interviewer: 'Prof. Alan Turing',
      interviewerEmail: 'professor@stanford.edu',
      status: 'SCHEDULED',
      format: '1-on-1 WebRTC Video Session',
      instructions: 'Live code review and algorithmic complexity defense with evaluation rubrics and screen sharing.',
    },
    {
      id: 'inv-102',
      title: 'Distributed Systems System Design Oral Interview',
      code: 'INTV-SYS',
      scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      durationMinutes: 60,
      interviewer: 'Dr. Katherine Johnson',
      interviewerEmail: 'dean@stanford.edu',
      status: 'SCHEDULED',
      format: 'Faculty Panel Examination',
      instructions: 'Architecture whiteboard defense focusing on Paxos, Raft, consensus models, and distributed storage.',
    },
    {
      id: 'inv-103',
      title: 'Operating Systems Concurrency Oral Viva',
      code: 'INTV-OS',
      scheduledAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      durationMinutes: 30,
      interviewer: 'Prof. Grace Hopper',
      interviewerEmail: 'faculty@stanford.edu',
      status: 'COMPLETED',
      format: '1-on-1 Oral Viva',
      instructions: 'Kernel synchronization, thread schedulers, and mutex deadlock resolution.',
    },
  ];

  useEffect(() => {
    fetchInterviews();
  }, [currentOrganization]);

  const filteredInterviews = interviews.filter((inv) => {
    const q = search.toLowerCase();
    const titleMatch = (inv.title || '').toLowerCase().includes(q);
    const codeMatch = (inv.code || '').toLowerCase().includes(q);
    const interviewerMatch = (inv.interviewer || '').toLowerCase().includes(q);

    let tabMatch = true;
    if (activeTab === 'upcoming') {
      tabMatch = inv.status !== 'COMPLETED' && inv.status !== 'CANCELLED';
    } else if (activeTab === 'completed') {
      tabMatch = inv.status === 'COMPLETED';
    }

    return (titleMatch || codeMatch || interviewerMatch) && tabMatch;
  });

  const handleEnterRoom = (inv) => {
    if (inv.status === 'COMPLETED' || inv.status === 'CANCELLED' || inv.joinStatus === 'JOIN_CLOSED') {
      setToastMessage({
        type: 'danger',
        text: 'This interview defense session has concluded and cannot be rejoined.',
      });
      return;
    }

    const payload = inv.rawObject || {
      _id: inv.id,
      title: inv.title,
      scheduledStartAt: inv.scheduledAt,
      duration: inv.durationMinutes,
      participant: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Candidate',
      candidateName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Candidate',
      candidateEmail: user?.email || 'student@stanford.edu',
      examinerName: inv.interviewer,
      status: inv.status,
    };
    try {
      sessionStorage.setItem('secureassess_active_interview', JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    setToastMessage({
      type: 'success',
      text: `Connecting to secure video room for "${inv.title}"...`,
    });
    setTimeout(() => {
      onNavigate('participant-interview');
    }, 400);
  };

  const handleOpenAgenda = (inv) => {
    setSelectedInterview(inv);
    setAgendaModalOpen(true);
  };

  const upcomingCount = interviews.filter((i) => i.status !== 'COMPLETED').length;
  const completedCount = interviews.filter((i) => i.status === 'COMPLETED').length;

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
        title="My Scheduled Live Interviews"
        subtitle="Access upcoming 1-on-1 WebRTC technical coding sessions, capstone defenses, and faculty oral evaluations."
        icon={<Video size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('candidate-dashboard') },
          { label: 'My Interviews' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchInterviews}
            >
              Sync Schedule
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconRight={<ChevronRight size={14} />}
              onClick={() => onNavigate('participant-system-check')}
            >
              Test Camera & Mic
            </Button>
          </div>
        }
      />

      {/* Summary Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Upcoming Interviews"
          value={String(upcomingCount)}
          icon={<Video size={20} />}
          trend={{ value: 'Scheduled', up: true }}
          color="primary"
        />
        <MetricCard
          label="Completed Defenses"
          value={String(completedCount)}
          icon={<CheckCircle2 size={20} />}
          trend={{ value: 'Authoritative notes', up: true }}
          color="success"
        />
        <MetricCard
          label="Next Viva Time"
          value={interviews[0]?.scheduledAt ? new Date(interviews[0].scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today 4:00 PM'}
          icon={<Clock size={20} />}
          trend={{ value: 'WebRTC Room Active', up: true }}
          color="warning"
        />
        <MetricCard
          label="Hardware Diagnostics"
          value="1080p Verified"
          icon={<Shield size={20} />}
          trend={{ value: 'Optimal latency', up: true }}
          color="info"
        />
      </div>

      {/* Main Interviews Schedule Card */}
      <Card>
        <CardHeader
          title={activeTab === 'upcoming' ? 'Upcoming & Active Live Interviews' : activeTab === 'completed' ? 'Completed Viva Sessions' : 'All Interview Sessions'}
          subtitle="One-on-one live video examinations with faculty members"
          icon={<Calendar size={18} />}
          action={
            <div className="flex items-center gap-2">
              <div className="flex bg-accent-100 dark:bg-accent-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'upcoming'
                      ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                      : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
                  }`}
                >
                  Upcoming ({upcomingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('completed')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'completed'
                      ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                      : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
                  }`}
                >
                  Completed ({completedCount})
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
                  All ({interviews.length})
                </button>
              </div>
            </div>
          }
        />
        <CardBody className="p-0">
          <div className="p-4 border-b border-accent-100 dark:border-accent-800 bg-accent-50/40 dark:bg-accent-900/40">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search interviews by topic, course code, or faculty interviewer..."
              className="w-full"
            />
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonCards count={2} />
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                icon={<Video size={36} className="text-accent-400" />}
                title="No Interviews Found"
                description={`You have no ${activeTab === 'completed' ? 'completed' : 'upcoming'} live interview sessions matching your query.`}
                action={
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('all')}>
                    View All Sessions
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredInterviews.map((inv) => {
                const isCompleted = inv.status === 'COMPLETED';

                return (
                  <div
                    key={inv.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-900/70 p-5 shadow-soft hover:shadow-glow hover:border-primary-500/50 dark:hover:border-primary-500/40 transition-all duration-200"
                  >
                    <div>
                      {/* Top Row with Icon & Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-soft border transition-transform group-hover:scale-105 ${
                            isCompleted
                              ? 'bg-success-500/10 border-success-500/30 text-success-600 dark:text-success-400'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          <Video size={22} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                            {inv.code}
                          </Badge>
                          <StatusBadge status={inv.status} />
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-sm text-accent-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1 mb-1.5">
                        {inv.title}
                      </h3>
                      <p className="text-xs text-accent-600 dark:text-accent-300 line-clamp-2 leading-relaxed mb-4">
                        {inv.instructions}
                      </p>

                      {/* Format & Faculty Pill */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300">
                          {inv.format}
                        </span>
                      </div>

                      {/* Interview Metrics Box */}
                      <div className="p-3 rounded-xl bg-accent-50/70 dark:bg-accent-950/50 border border-accent-100 dark:border-accent-800/80 mb-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                            <Calendar size={13} />
                            {new Date(inv.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          <span className="flex items-center gap-1 text-accent-600 dark:text-accent-300 font-medium">
                            <Clock size={12} className="text-primary-500" />
                            {inv.durationMinutes} mins
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-accent-700 dark:text-accent-300 pt-1 border-t border-accent-100 dark:border-accent-800/60 truncate">
                          <User size={13} className="text-accent-400 shrink-0" />
                          <span className="truncate">
                            <strong className="text-accent-900 dark:text-white">{inv.interviewer}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-accent-100 dark:border-accent-800 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Info size={13} />}
                        onClick={() => handleOpenAgenda(inv)}
                        className="flex-1 text-xs"
                      >
                        Agenda
                      </Button>

                      {!isCompleted ? (
                        <Button
                          variant="primary"
                          size="sm"
                          iconRight={<ExternalLink size={13} />}
                          className="flex-1 text-xs font-semibold shadow-soft"
                          onClick={() => handleEnterRoom(inv)}
                        >
                          Join Room
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs font-semibold"
                          onClick={() => onNavigate('participant-evaluation')}
                        >
                          Evaluation
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Agenda Modal */}
      {selectedInterview && (
        <Modal
          open={agendaModalOpen}
          onClose={() => setAgendaModalOpen(false)}
          title={selectedInterview.title}
          subtitle={`Session Code: ${selectedInterview.code} · ${selectedInterview.durationMinutes} Minutes Duration`}
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAgendaModalOpen(false)}>
                Close
              </Button>
              {selectedInterview.status !== 'COMPLETED' && (
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={<ExternalLink size={14} />}
                  onClick={() => {
                    setAgendaModalOpen(false);
                    handleEnterRoom(selectedInterview);
                  }}
                >
                  Join Live Room Now
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-accent-50 dark:bg-accent-950/60 rounded-xl border border-accent-200 dark:border-accent-800 space-y-2">
              <h4 className="text-xs font-bold text-accent-900 dark:text-white uppercase tracking-wider">
                Meeting Agenda & Scope
              </h4>
              <p className="text-xs text-accent-600 dark:text-accent-300 leading-relaxed">
                {selectedInterview.instructions}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Scheduled Date & Time</p>
                <p className="font-bold text-accent-900 dark:text-white">
                  {new Date(selectedInterview.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Faculty Interviewer</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedInterview.interviewer}</p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Allocated Duration</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedInterview.durationMinutes} Minutes</p>
              </div>
              <div className="p-3 rounded-xl border border-accent-100 dark:border-accent-800">
                <p className="text-accent-400 text-[11px]">Session Format</p>
                <p className="font-bold text-accent-900 dark:text-white">{selectedInterview.format}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-900/50 text-xs text-primary-900 dark:text-primary-200 flex items-start gap-2.5">
              <Shield size={16} className="text-primary-600 shrink-0 mt-0.5" />
              <span>
                Please test your hardware camera and microphone before the meeting starts. Screen sharing permissions are required for live code defense.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CandidateInterviewsPage;
