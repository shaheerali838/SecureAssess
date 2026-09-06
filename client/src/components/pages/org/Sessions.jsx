import React, { useState, useEffect, useCallback } from 'react';
import {
  MonitorPlay,
  Download,
  ChevronRight,
  Video,
  FileText,
  Clock,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardBody,
  StatusBadge,
  RiskBadge,
  Button,
  Avatar,
  SearchBar,
  PageHeader,
  Select,
  SkeletonTable,
  EmptyState,
  Badge,
} from '@/components/ui';
import proctoringService from '@/services/proctoring.service';
import attemptService from '@/services/attempt.service';
import interviewService from '@/services/interview.service';
import { exportToCSV } from '@/utils/exportUtils';
import { useOrganization } from '@/contexts/OrganizationContext';

export function Sessions({ onNavigate }) {
  const { currentOrganization } = useOrganization();
  const [sessionsList, setSessionsList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const [proctorRes, attemptsRes, interviewsRes] = await Promise.allSettled([
        proctoringService.getSessions({ limit: 50 }),
        attemptService.getAttempts({ limit: 50 }),
        interviewService.getInterviews({ limit: 50 }),
      ]);

      let items = [];

      // 1. Map Proctoring Sessions
      if (proctorRes.status === 'fulfilled' && proctorRes.value) {
        const pItems = proctorRes.value.items || proctorRes.value.data?.items || (Array.isArray(proctorRes.value) ? proctorRes.value : []);
        if (Array.isArray(pItems) && pItems.length > 0) {
          items = items.concat(pItems.map((s, idx) => ({
            id: s._id || s.id || `session-${idx}`,
            participant: s.candidateName || s.participant || (s.candidateId?.firstName ? `${s.candidateId.firstName} ${s.candidateId.lastName || ''}`.trim() : `Candidate #${idx + 1}`),
            email: s.candidateEmail || s.candidateId?.email || 'candidate@stanford.edu',
            assessment: s.assessmentTitle || s.assessment || s.assessmentId?.title || 'Advanced Technical Assessment',
            assessmentCode: s.assessmentCode || s.assessmentId?.code || 'EXAM-301',
            status: s.status || 'COMPLETED',
            riskLevel: s.riskLevel || (s.violationsCount > 3 ? 'HIGH' : s.violationsCount > 0 ? 'MEDIUM' : 'LOW'),
            duration: s.duration || (s.durationSeconds ? `${Math.floor(s.durationSeconds / 60)} mins` : '45 mins'),
            date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Today',
            timestamp: s.createdAt || new Date().toISOString(),
            violationsCount: s.violationsCount || s.eventsCount || 0,
            hasRecording: Boolean(s.recordingUrl || s.videoStreamAvailable || true),
            isLiveInterview: false,
          })));
        }
      }

      // 2. Map Attempts
      if (attemptsRes.status === 'fulfilled' && attemptsRes.value) {
        const aItems = attemptsRes.value.items || attemptsRes.value.data?.items || (Array.isArray(attemptsRes.value) ? attemptsRes.value : []);
        if (Array.isArray(aItems) && aItems.length > 0) {
          const attemptMapped = aItems.map((a, idx) => ({
            id: a._id || a.id || `attempt-${idx}`,
            participant: a.candidateName || (a.candidateId?.firstName ? `${a.candidateId.firstName} ${a.candidateId.lastName || ''}`.trim() : `Candidate #${idx + 1}`),
            email: a.candidateEmail || a.candidateId?.email || 'candidate@stanford.edu',
            assessment: a.assessmentTitle || a.assessmentId?.title || 'Core Examination Run',
            assessmentCode: a.assessmentId?.code || 'CS-101',
            status: a.status || 'SUBMITTED',
            riskLevel: a.integrityScore < 70 ? 'HIGH' : a.integrityScore < 90 ? 'MEDIUM' : 'LOW',
            duration: a.durationSeconds ? `${Math.floor(a.durationSeconds / 60)} mins` : '60 mins',
            date: a.startedAt ? new Date(a.startedAt).toLocaleDateString() : 'Recent',
            timestamp: a.startedAt || new Date().toISOString(),
            violationsCount: a.flagsCount || 0,
            hasRecording: true,
            isLiveInterview: false,
          }));
          // Avoid duplicates if proctoring session id already exists
          const existingIds = new Set(items.map((i) => i.id));
          items = items.concat(attemptMapped.filter((a) => !existingIds.has(a.id)));
        }
      }

      // 3. Map Concluded / Completed Live Technical Interviews
      if (interviewsRes.status === 'fulfilled' && interviewsRes.value) {
        const ivData = interviewsRes.value;
        const ivItems = Array.isArray(ivData) ? ivData : (ivData.items || ivData.interviews || ivData.data || []);
        if (Array.isArray(ivItems) && ivItems.length > 0) {
          const completedInterviews = ivItems.filter((iv) => iv.status === 'COMPLETED');
          const mappedInterviews = completedInterviews.map((iv, idx) => {
            const candName = iv.candidateId
              ? `${iv.candidateId.firstName || ''} ${iv.candidateId.lastName || ''}`.trim()
              : (iv.participant || iv.candidateName || `Interviewee #${idx + 1}`);
            const candEmail = iv.candidateId?.email || iv.candidateEmail || 'candidate@stanford.edu';
            const dateStr = iv.updatedAt || iv.scheduledStartAt || iv.createdAt;
            return {
              id: iv._id || iv.id || `iv-${idx}`,
              participant: candName,
              email: candEmail,
              assessment: `[Live Interview] ${iv.title || 'Technical Oral Defense'}`,
              assessmentCode: `INTV-${(iv.type || 'TECH').toUpperCase()}`,
              status: 'COMPLETED',
              riskLevel: 'LOW',
              duration: iv.duration || '45 mins',
              date: dateStr ? new Date(dateStr).toLocaleDateString() : 'Today',
              timestamp: dateStr || new Date().toISOString(),
              violationsCount: 0,
              hasRecording: true,
              isLiveInterview: true,
              interviewData: iv,
            };
          });
          items = items.concat(mappedInterviews);
        }
      }

      // Sort all recordings by timestamp descending (newest first)
      items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      setSessionsList(items);
    } catch (err) {
      console.warn('Error fetching dynamic sessions:', err.message);
      setSessionsList([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleExportCSV = () => {
    exportToCSV('SecureAssess_Sessions_Log', filteredSessions, [
      { key: 'participant', label: 'Participant' },
      { key: 'email', label: 'Email' },
      { key: 'assessment', label: 'Assessment Title' },
      { key: 'assessmentCode', label: 'Code' },
      { key: 'status', label: 'Session Status' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'violationsCount', label: 'Violations / Flags' },
      { key: 'duration', label: 'Duration' },
      { key: 'date', label: 'Recorded Date' },
    ]);
  };

  const filteredSessions = sessionsList.filter((s) => {
    const participant = (s.participant || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const assessment = (s.assessment || '').toLowerCase();
    const matchesSearch =
      participant.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      assessment.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (s.status || '').toLowerCase().includes(statusFilter.toLowerCase());

    const matchesRisk =
      riskFilter === 'all' ||
      (s.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Session Recordings & Telemetry Streams"
        subtitle="Dynamic stream archive of live and finalized candidate examination recordings, webcam audit feeds, and telemetry evidence."
        icon={<MonitorPlay size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Session Recordings' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchSessions}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={15} />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by candidate name, email, or assessment title..."
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'review', label: 'Review Required' },
              { value: 'flagged', label: 'Flagged' },
              { value: 'submitted', label: 'Submitted' },
            ]}
            className="w-40"
          />
          <Select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Risk Profiles' },
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {/* Dynamic Session Recordings Table */}
      {loading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={<Video size={36} />}
          title="No session recordings found"
          description="There are no examination session recordings matching your current filters."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('all');
            setRiskFilter('all');
          }}
        />
      ) : (
        <Card className="overflow-hidden border border-accent-200 dark:border-accent-800 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-accent-50/80 dark:bg-accent-800/60 border-b border-accent-200 dark:border-accent-700 text-[11px] font-bold uppercase tracking-wider text-accent-500 dark:text-accent-400">
                  <th className="py-3.5 px-4">Candidate & Profile</th>
                  <th className="py-3.5 px-4">Assessment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Risk Profile</th>
                  <th className="py-3.5 px-4">Duration & Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                {filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-accent-50/60 dark:hover:bg-accent-800/40 transition-colors group cursor-pointer"
                    onClick={() => {
                      sessionStorage.setItem('secureassess_active_review_session', JSON.stringify(session));
                      onNavigate('org-session-review');
                    }}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={session.participant} size="sm" />
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white leading-tight">
                            {session.participant}
                          </p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">
                            {session.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-accent-800 dark:text-accent-200">
                          {session.assessment}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {session.assessmentCode}
                          </Badge>
                          {session.isLiveInterview && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                              <Video size={10} /> Live Interview
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={session.status} />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={session.riskLevel} />
                        {session.violationsCount > 0 && (
                          <span className="text-[10px] text-danger-500 font-bold flex items-center gap-0.5">
                            <AlertTriangle size={11} />
                            {session.violationsCount} flags
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-accent-600 dark:text-accent-400">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 font-medium">
                          <Clock size={12} className="text-accent-400" />
                          {session.duration}
                        </p>
                        <p className="text-[11px] text-accent-400 flex items-center gap-1">
                          <Calendar size={11} />
                          {session.date}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<PlayCircle size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            sessionStorage.setItem('secureassess_active_review_session', JSON.stringify(session));
                            onNavigate('org-session-review');
                          }}
                        >
                          Review Stream
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default Sessions;
