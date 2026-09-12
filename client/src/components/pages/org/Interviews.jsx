import React, { useState, useEffect } from 'react';
import {
  Video, Plus, Calendar, Clock, Users, ChevronRight, RefreshCw,
  X, CheckCircle, AlertCircle, Trash2, PlayCircle, Shield, User, FileText, Check,
  MonitorPlay, ArrowRight, Edit3
} from 'lucide-react';
import {
  Card, CardBody, StatusBadge, Button, Avatar,
  SearchBar, PageHeader, Select, EmptyState, SkeletonCards, ConfirmModal
} from '@/components/ui';
import interviewService from '@/services/interview.service';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { EditInterviewModal } from './EditInterviewModal';

export function Interviews({ onNavigate }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Theme-Respected Confirm/Alert Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    type: 'confirm',
    loading: false,
    onConfirm: null,
  });

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const data = await interviewService.getInterviews();
      const items = Array.isArray(data) ? data : (data?.items || data?.interviews || data?.data || []);
      setInterviews(items);
    } catch (err) {
      console.warn('Interviews API fallback note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleOpenSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleEnterRoom = (interview) => {
    if (interview.status === 'COMPLETED') {
      const candName = interview.candidateId
        ? `${interview.candidateId.firstName || ''} ${interview.candidateId.lastName || ''}`.trim()
        : (interview.participant || interview.candidateName || 'Candidate');
      const sessionData = {
        id: interview._id || interview.id,
        participant: candName,
        email: interview.candidateId?.email || interview.candidateEmail || interview.metadata?.candidateEmail || '',
        assessment: `[Live Interview] ${interview.title || 'Technical Defense'}`,
        assessmentCode: `INTV-${(interview.type || 'TECH').toUpperCase()}`,
        status: 'COMPLETED',
        riskLevel: 'LOW',
        duration: interview.duration || '45 mins',
        date: interview.scheduledStartAt ? new Date(interview.scheduledStartAt).toLocaleDateString() : 'Recent',
        timestamp: interview.updatedAt || interview.createdAt || new Date().toISOString(),
        violationsCount: 0,
        hasRecording: true,
        isLiveInterview: true,
        interviewData: interview,
      };
      try {
        sessionStorage.setItem('secureassess_active_review_session', JSON.stringify(sessionData));
      } catch (e) {
        console.warn('Storage error:', e);
      }
      onNavigate('org-session-review');
      return;
    }

    // Persist full active interview state into session storage for LiveInterview component
    try {
      sessionStorage.setItem('secureassess_active_interview', JSON.stringify(interview));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    onNavigate('org-interview-room');
  };

  const handleCancelInterview = (interviewId, title, e) => {
    e?.stopPropagation?.();
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Scheduled Interview',
      message: `Are you sure you want to cancel the scheduled interview '${title}'? This action cannot be undone.`,
      confirmText: 'Cancel Interview',
      variant: 'danger',
      type: 'confirm',
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await interviewService.cancelInterview(interviewId, 'Cancelled by examiner');
          setConfirmDialog({ isOpen: false });
          fetchInterviews();
        } catch (err) {
          setConfirmDialog({
            isOpen: true,
            title: 'Action Failed',
            message: err?.response?.data?.message || err.message || 'Failed to cancel interview.',
            confirmText: 'Dismiss',
            variant: 'danger',
            type: 'alert',
            loading: false,
            onConfirm: () => setConfirmDialog({ isOpen: false }),
          });
        }
      },
    });
  };

  const filtered = interviews.filter((iv) => {
    const candName = (
      iv.metadata?.candidateName ||
      (typeof iv.candidateId === 'object' && iv.candidateId !== null
        ? `${iv.candidateId.firstName || ''} ${iv.candidateId.lastName || ''}`.trim() || iv.candidateId.name
        : null) ||
      iv.candidateName ||
      iv.participant ||
      ''
    ).toLowerCase();

    const candEmail = (
      iv.metadata?.candidateEmail ||
      (typeof iv.candidateId === 'object' && iv.candidateId !== null
        ? iv.candidateId.email
        : null) ||
      iv.candidateEmail ||
      ''
    ).toLowerCase();

    const title = (iv.title || '').toLowerCase();
    const matchesSearch = title.includes(search.toLowerCase()) || candName.includes(search.toLowerCase()) || candEmail.includes(search.toLowerCase());

    const isConcluded = iv.status === 'COMPLETED' || iv.status === 'CANCELLED';
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = !isConcluded;
    } else if (statusFilter !== 'all') {
      matchesStatus = (iv.status || '').toLowerCase() === statusFilter.toLowerCase();
    }

    const matchesType = typeFilter === 'all' || (iv.type || '').toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Technical Interviews"
        subtitle="Dynamic 1-on-1, technical defense, and panel interview sessions with live multi-stream video & collaborative evaluation."
        icon={<Video size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Interviews' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchInterviews}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={handleOpenSchedule}>
              Schedule Interview
            </Button>
          </div>
        }
      />

      {/* Info Notice Banner for Ended Interviews */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 rounded-2xl text-xs text-accent-700 dark:text-accent-300">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <MonitorPlay size={16} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">
            <strong>Concluded Sessions:</strong> Once an interview is ended, it is automatically archived to <strong>Session Recordings</strong> with multi-stream video playback and evaluation logs.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('org-sessions')}
          className="flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors self-start sm:self-auto shrink-0"
        >
          View Session Recordings <ArrowRight size={13} />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by interview title or candidate..." className="flex-1 w-full" />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Formats' },
            { value: 'technical', label: 'Technical' },
            { value: 'coding', label: 'Live Coding' },
            { value: 'panel', label: 'Panel Oral' },
            { value: 'behavioral', label: 'Behavioral' },
          ]}
          className="w-full sm:w-40"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'active', label: 'Active & Scheduled' },
            { value: 'live', label: 'Live / In Progress' },
            { value: 'scheduled', label: 'Scheduled Only' },
            { value: 'all', label: 'All (Incl. Archived)' },
            { value: 'completed', label: 'Completed (Archived)' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {loading ? (
        <SkeletonCards count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No live interviews found"
          description="Schedule a new live video interview to evaluate candidates in real time with synchronized questions & proctoring."
          icon={<Video size={32} />}
          action={
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={handleOpenSchedule}>
              Schedule New Interview
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((iv, idx) => {
            const candName = iv.metadata?.candidateName ||
              (typeof iv.candidateId === 'object' && iv.candidateId !== null
                ? `${iv.candidateId.firstName || ''} ${iv.candidateId.lastName || ''}`.trim() || iv.candidateId.name
                : null) ||
              iv.candidateName ||
              iv.participant ||
              'Candidate';

            const candEmail = iv.metadata?.candidateEmail ||
              (typeof iv.candidateId === 'object' && iv.candidateId !== null
                ? iv.candidateId.email
                : null) ||
              iv.candidateEmail ||
              '';
            const startDate = iv.scheduledStartAt ? new Date(iv.scheduledStartAt) : null;
            const isLive = iv.status === 'LIVE';
            const isCompleted = iv.status === 'COMPLETED';

            return (
              <Card
                key={iv._id || iv.id || idx}
                hover
                className={`transition-all ${isLive ? 'border-primary-500/50 shadow-md ring-1 ring-primary-500/20' : ''}`}
                onClick={() => handleEnterRoom(iv)}
              >
                <CardBody className="p-5 flex flex-col justify-between h-full">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={candName} color="#3b82f6" size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-accent-900 dark:text-white truncate">{iv.title || 'Technical Oral Defense'}</p>
                          <p className="text-xs text-accent-500 dark:text-accent-400 truncate">{candName} {candEmail ? `· ${candEmail}` : ''}</p>
                        </div>
                      </div>
                      <StatusBadge status={iv.status || 'SCHEDULED'} />
                    </div>

                    {/* Metadata Pill Box */}
                    <div className="space-y-1.5 text-xs text-accent-600 dark:text-accent-300 py-2.5 px-3 rounded-lg bg-accent-50 dark:bg-accent-900/40 border border-accent-100 dark:border-accent-800 my-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-accent-500">
                          <Calendar size={13} /> Date
                        </span>
                        <span className="font-medium text-accent-800 dark:text-accent-200">
                          {startDate ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-accent-500">
                          <Clock size={13} /> Time & Window
                        </span>
                        <span className="font-medium text-accent-800 dark:text-accent-200">
                          {startDate ? startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '45 mins'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-accent-500">
                          <Video size={13} /> Format
                        </span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400 uppercase text-[10px] tracking-wider">
                          {iv.type || 'TECHNICAL'}
                        </span>
                      </div>
                    </div>

                    {iv.description && (
                      <p className="text-xs text-accent-500 dark:text-accent-400 line-clamp-2 mb-3">
                        {iv.description}
                      </p>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-accent-100 dark:border-accent-800">
                    <button
                      type="button"
                      onClick={() => handleEnterRoom(iv)}
                      className={`text-xs font-semibold flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors ${
                        isLive
                          ? 'bg-danger-600 text-white hover:bg-danger-700 animate-pulse'
                          : isCompleted
                          ? 'text-accent-600 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-800'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {isLive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Join Active Room (Host)
                        </>
                      ) : isCompleted ? (
                        <>
                          <PlayCircle size={14} /> Review Evaluation
                        </>
                      ) : (
                        <>
                          <PlayCircle size={14} /> Launch Room (Host)
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {iv.status !== 'COMPLETED' && iv.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          title="Edit Scheduled Interview"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditingInterview(iv);
                            setShowEditModal(true);
                          }}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 py-1 px-2.5 rounded-lg bg-primary-50/80 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200 dark:border-primary-800/60 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      )}

                      {iv.status !== 'COMPLETED' && iv.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          title="Cancel Interview"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleCancelInterview(iv._id || iv.id, iv.title, e);
                          }}
                          className="text-xs text-danger-500 hover:text-danger-700 p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors cursor-pointer border border-transparent hover:border-danger-200 dark:hover:border-danger-800/60"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onScheduled={fetchInterviews}
        onLaunchRoom={handleEnterRoom}
      />

      {/* Edit Scheduled Interview Modal */}
      <EditInterviewModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingInterview(null);
        }}
        interview={editingInterview}
        onUpdated={fetchInterviews}
      />

      {/* Theme-Respected Confirmation & Alert Dialog */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        type={confirmDialog.type}
        loading={confirmDialog.loading}
      />
    </div>
  );
}

export default Interviews;

