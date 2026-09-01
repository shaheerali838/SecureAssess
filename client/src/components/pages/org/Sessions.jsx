import React, { useState, useEffect, useCallback } from 'react';
import {
  MonitorPlay, Download, ChevronRight, Video, FileText,
  Clock, Calendar, RefreshCw, AlertTriangle, ShieldCheck
} from 'lucide-react';
import {
  Card, CardBody, StatusBadge, RiskBadge, Button, Avatar,
  SearchBar, PageHeader, Select, SkeletonTable, EmptyState, Toast
} from '@/components/ui';
import { sessions as defaultSessions } from '@/data';
import proctoringService from '@/services/proctoring.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportToCSV } from '@/utils/exportUtils';

export function Sessions({ onNavigate }) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || null;

  const [sessionList, setSessionList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await proctoringService.getSessions({ limit: 100 }, orgId);
      const items = Array.isArray(res) ? res : (res?.items || res?.data?.items || res?.sessions || []);

      if (Array.isArray(items) && items.length > 0) {
        const mapped = items.map((s, idx) => {
          const cand = s.candidateId || {};
          const asm = s.assessmentId || {};
          const candName = cand.firstName ? `${cand.firstName} ${cand.lastName || ''}`.trim() : (s.participant || `Examinee ${idx + 1}`);
          const asmTitle = asm.title || (typeof s.assessmentId === 'string' ? s.assessmentId : 'Proctored Assessment');
          
          let durText = '—';
          if (s.startedAt && s.endedAt) {
            const diffMins = Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 60000);
            durText = `${diffMins}m`;
          } else if (s.startedAt) {
            const diffMins = Math.round((new Date() - new Date(s.startedAt)) / 60000);
            durText = `${diffMins}m (Live)`;
          }

          const rawDate = s.startedAt || s.createdAt || new Date();
          const dateStr = new Date(rawDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

          return {
            id: s._id || s.id || `sess_${idx}`,
            _id: s._id || s.id,
            participant: candName,
            email: cand.email || '',
            candidateCode: cand.candidateCode || `STD-${idx + 1}`,
            assessment: asmTitle,
            status: s.status || 'ACTIVE',
            riskLevel: s.riskLevel || (s.riskScore > 60 ? 'High' : s.riskScore > 30 ? 'Medium' : 'Low'),
            riskScore: s.riskScore || 0,
            duration: durText,
            date: dateStr,
            rawSession: s,
          };
        });
        setSessionList(mapped);
      } else {
        setSessionList([]);
      }
    } catch (err) {
      console.warn('Sessions query fallback:', err.message);
      setSessionList([]);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleExportCSV = () => {
    exportToCSV('SecureAssess_Proctoring_Sessions_Log', sessionList, [
      { key: 'participant', label: 'Participant' },
      { key: 'candidateCode', label: 'Student Code' },
      { key: 'assessment', label: 'Assessment' },
      { key: 'status', label: 'Session Status' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'riskScore', label: 'Risk Score' },
      { key: 'duration', label: 'Duration' },
      { key: 'date', label: 'Date' },
    ]);
    setToastMessage({ type: 'success', text: 'Proctoring sessions log exported successfully.' });
  };

  const filtered = sessionList.filter((s) => {
    const participant = (s.participant || '').toLowerCase();
    const assessment = (s.assessment || '').toLowerCase();
    const code = (s.candidateCode || '').toLowerCase();
    const matchesSearch =
      participant.includes(search.toLowerCase()) ||
      assessment.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (s.status || '').toLowerCase().includes(statusFilter.toLowerCase());
    const matchesRisk = riskFilter === 'all' || (s.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <PageHeader
        title="Live & Historical Examination Sessions"
        subtitle="Real-time candidate telemetry feeds, WebRTC integrity streams, and chronological audit logs."
        icon={<MonitorPlay size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Sessions' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchSessions}
            >
              Sync Sessions
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={15} />} onClick={handleExportCSV}>
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search sessions by examinee, code, assessment..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Live / Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'paused', label: 'Paused' },
              { value: 'terminated', label: 'Terminated' },
            ]}
            className="w-36"
          />
          <Select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Risk' },
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MonitorPlay size={28} />}
            title="No sessions found"
            description="Active candidate assessment sessions and completed runs will appear here in real-time."
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Examinee Candidate</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Assessment</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Risk Level</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Duration</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden xl:table-cell">Date</th>
                    <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => onNavigate('org-session-review', { sessionId: s._id || s.id, session: s.rawSession || s })}
                      className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.participant} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{s.participant}</p>
                            <p className="text-[11px] text-accent-500 dark:text-accent-400 font-mono truncate">{s.candidateCode || `ID: ${s.id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell text-xs font-medium text-accent-700 dark:text-accent-300">
                        {s.assessment}
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell">
                        <RiskBadge level={s.riskLevel} />
                      </td>
                      <td className="px-3 py-3.5 hidden lg:table-cell text-xs text-accent-500 dark:text-accent-400 font-mono">
                        {s.duration}
                      </td>
                      <td className="px-3 py-3.5 hidden xl:table-cell text-xs text-accent-500 dark:text-accent-400 font-mono">
                        {s.date}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default Sessions;
