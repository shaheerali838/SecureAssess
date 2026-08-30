import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, ChevronRight,
  Mail, Send, Upload, RefreshCw, Check
} from 'lucide-react';
import {
  Card, CardBody, StatusBadge, RiskBadge, Button, Avatar,
  SearchBar, PageHeader, Select, EmptyState, Modal, Input, Toast, SkeletonTable
} from '@/components/ui';
import { participants as defaultParticipants } from '@/data';
import candidateService from '@/services/candidate.service';

export function ParticipantManagement({ onNavigate }) {
  const [candidatesList, setCandidatesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cohort, setCohort] = useState('Computer Science 101');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await candidateService.getCandidates();
      const items = Array.isArray(data) ? data : (data?.items || data?.users || data?.data || []);
      if (items && items.length > 0) {
        setCandidatesList(items);
      } else {
        setCandidatesList(defaultParticipants);
      }
    } catch (err) {
      console.warn('Candidates API fallback triggered:', err.message);
      setCandidatesList(defaultParticipants);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleCreateCandidate = async () => {
    if (!name.trim() || !email.trim()) return;
    setIsSubmitting(true);
    try {
      const parts = name.trim().split(' ');
      const firstName = parts[0] || 'Candidate';
      const lastName = parts.slice(1).join(' ') || 'Student';
      const candidateCode = `CAND-${Math.floor(100000 + Math.random() * 900000)}`;

      const payload = {
        firstName,
        lastName,
        candidateCode,
        email: email.trim().toLowerCase(),
        status: 'ACTIVE',
      };

      try {
        const created = await candidateService.createCandidate(payload);
        const item = created?.data || created || { id: Date.now(), name, email, candidateCode, status: 'ACTIVE' };
        setCandidatesList((prev) => [item, ...prev]);
        setToastMessage({ type: 'success', text: `Candidate ${candidateCode} created successfully!` });
      } catch (err) {
        setToastMessage({ type: 'error', text: 'Failed to create candidate: ' + err.message });
      }

      setModalOpen(false);
      setName('');
      setEmail('');
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to add candidate: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = candidatesList.filter((p) => {
    const candidateName = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
    const candidateEmail = (p.email || '').toLowerCase();
    const assessment = (p.assessment || '').toLowerCase();
    const matchesSearch = candidateName.includes(search.toLowerCase()) || candidateEmail.includes(search.toLowerCase()) || assessment.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (p.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesRisk = riskFilter === 'all' || (p.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();
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
        title="Candidate Roster"
        subtitle="Manage enrolled candidates, review stage statuses, and invite examinee cohorts."
        icon={<Users size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Candidates' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchCandidates}
            >
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
              Add Candidate
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or assessment..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'in progress', label: 'In Progress' },
              { value: 'invited', label: 'Invited' },
            ]}
            className="w-36"
          />
          <Select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Integrity Tiers' },
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Candidates Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="No candidates found"
            description="Invite candidates or import a roster to schedule assessments."
            action={<Button variant="primary" icon={<Send size={15} />} onClick={() => setModalOpen(true)}>Invite Candidates</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Candidate</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Cohort / Context</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Assessment</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Score</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Integrity</th>
                    <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                  {filtered.map((p, idx) => {
                    const id = p._id || p.id || idx;
                    const candidateName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Candidate';
                    const candidateEmail = p.email || 'candidate@stanford.edu';
                    const candidateCohort = p.cohort || 'CS101 Fall 2026';
                    const assessmentTitle = p.assessment || 'General Assessment';
                    const status = p.status || 'Invited';
                    const score = p.score != null ? `${p.score}%` : '—';
                    const riskLevel = p.riskLevel || (p.riskScore > 50 ? 'High' : 'Low');

                    return (
                      <tr
                        key={id}
                        onClick={() => onNavigate('org-participant-profile')}
                        className="hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={candidateName} color={p.avatarColor || '#2563eb'} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{candidateName}</p>
                              <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{candidateEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-accent-600 dark:text-accent-300 hidden md:table-cell">
                          {candidateCohort}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-accent-700 dark:text-accent-200 hidden lg:table-cell font-medium">
                          {assessmentTitle}
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-3 py-3.5 text-xs font-mono font-bold text-accent-900 dark:text-white hidden sm:table-cell">
                          {score}
                        </td>
                        <td className="px-3 py-3.5 hidden lg:table-cell">
                          <RiskBadge level={riskLevel} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>
                            View Dossier
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Add Candidate Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enroll & Invite Candidate"
        subtitle="Provision a candidate account and dispatch examination instructions."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={isSubmitting} icon={<Check size={14} />} onClick={handleCreateCandidate}>
              Invite Candidate
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="alex.morgan@stanford.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select
            label="Cohort Assignment"
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            options={[
              { value: 'Computer Science 101', label: 'Computer Science 101' },
              { value: 'Technical Hiring 2026', label: 'Technical Hiring 2026' },
              { value: 'Executive MBA Evaluation', label: 'Executive MBA Evaluation' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

export default ParticipantManagement;
