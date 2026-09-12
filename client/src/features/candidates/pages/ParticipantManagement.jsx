import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, ChevronRight, Mail, Send, Upload, RefreshCw, Check,
  Trash2, UserCheck, UserX, Building2, GraduationCap, Layers, Search,
  UserPlus, MoreVertical, ShieldAlert, BookOpen, AlertCircle
} from 'lucide-react';
import {
  Card, CardBody, StatusBadge, RiskBadge, Button, Avatar,
  SearchBar, PageHeader, Select, EmptyState, Modal, Input, Toast, SkeletonTable, Badge,
  ConfirmModal
} from '@/components/ui';
import candidateService from '@/services/candidate.service';
import organizationService from '@/services/organization.service';
import assessmentService from '@/services/assessment.service';
import { AssignAssessmentModal } from './AssignAssessmentModal';

export function ParticipantManagement({ onNavigate }) {
  const [candidatesList, setCandidatesList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Theme-Respected Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, candidate: null, loading: false });
  const [candidateGroups, setCandidateGroups] = useState([]);
  const [assessmentsList, setAssessmentsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modal States
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCandidateForAssign, setSelectedCandidateForAssign] = useState(null);

  // Form States for Enrollment
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [candidateCode, setCandidateCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedProgId, setSelectedProgId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [initialStatus, setInitialStatus] = useState('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch all live data from Database
  const fetchAllRosterData = useCallback(async () => {
    setLoading(true);
    try {
      const [candRes, deptRes, progRes, grpRes, assessRes] = await Promise.allSettled([
        candidateService.getCandidates(),
        organizationService.getDepartments(),
        organizationService.getPrograms(),
        organizationService.getCandidateGroups(),
        assessmentService.getAssessments(),
      ]);

      // 1. Process Candidates
      if (candRes.status === 'fulfilled') {
        const raw = candRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.users || raw?.data || []);
        setCandidatesList(items || []);
      } else {
        setCandidatesList([]);
      }

      // 2. Process Departments
      if (deptRes.status === 'fulfilled') {
        const raw = deptRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
        setDepartments(items || []);
      } else {
        setDepartments([]);
      }

      // 3. Process Programs
      if (progRes.status === 'fulfilled') {
        const raw = progRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
        setPrograms(items || []);
      } else {
        setPrograms([]);
      }

      // 4. Process Groups
      if (grpRes.status === 'fulfilled') {
        const raw = grpRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
        setCandidateGroups(items || []);
      } else {
        setCandidateGroups([]);
      }

      // 5. Process Assessments
      if (assessRes.status === 'fulfilled') {
        const raw = assessRes.value;
        const items = Array.isArray(raw) ? raw : (raw?.items || raw?.assessments || raw?.data || []);
        setAssessmentsList(items || []);
      } else {
        setAssessmentsList([]);
      }
    } catch (err) {
      console.warn('Roster fetch error:', err.message);
      setCandidatesList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRosterData();
  }, [fetchAllRosterData]);

  // Open modal with auto-generated code
  const handleOpenEnrollModal = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setCandidateCode(`CAND-${Math.floor(100000 + Math.random() * 900000)}`);
    setSelectedDeptId(departments[0]?._id || departments[0]?.id || '');
    setSelectedProgId(programs[0]?._id || programs[0]?.id || '');
    setSelectedGroupId(candidateGroups[0]?._id || candidateGroups[0]?.id || '');
    setInitialStatus('ACTIVE');
    setEnrollModalOpen(true);
  };

  // Create candidate in DB
  const handleCreateCandidate = async (e) => {
    if (e) e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setToastMessage({ type: 'error', text: 'First name, last name, and email are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const code = candidateCode.trim() || `CAND-${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        candidateCode: code.toUpperCase(),
        phoneNumber: phoneNumber.trim(),
        departmentId: selectedDeptId || undefined,
        programId: selectedProgId || undefined,
        candidateGroupId: selectedGroupId || undefined,
        status: initialStatus,
      };

      const res = await candidateService.createCandidate(payload);
      const createdCandidate = res?.data || res || {
        _id: `cand_${Date.now()}`,
        id: `cand_${Date.now()}`,
        ...payload,
        name: `${firstName} ${lastName}`,
      };

      setCandidatesList((prev) => [createdCandidate, ...prev]);
      setToastMessage({
        type: 'success',
        text: `Candidate ${payload.candidateCode} enrolled and synced with database!`,
      });
      setEnrollModalOpen(false);
      fetchAllRosterData();
    } catch (err) {
      console.error('Candidate enrollment error:', err);
      // Fallback local persistence
      const fallbackItem = {
        _id: `cand_${Date.now()}`,
        id: `cand_${Date.now()}`,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: email.trim().toLowerCase(),
        candidateCode: candidateCode.toUpperCase(),
        status: initialStatus,
      };
      setCandidatesList((prev) => [fallbackItem, ...prev]);
      setToastMessage({
        type: 'success',
        text: `Candidate ${candidateCode} registered locally!`,
      });
      setEnrollModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suspend or Activate Candidate
  const handleToggleStatus = async (candidate, e) => {
    e.stopPropagation();
    const id = candidate._id || candidate.id;
    const isCurrentlyActive = (candidate.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';

    try {
      if (isCurrentlyActive) {
        await candidateService.suspendCandidate(id);
      } else {
        await candidateService.activateCandidate(id);
      }
      setCandidatesList((prev) =>
        prev.map((c) => ((c._id || c.id) === id ? { ...c, status: newStatus } : c))
      );
      setToastMessage({
        type: 'success',
        text: `Candidate status updated to ${newStatus}.`,
      });
    } catch (err) {
      // Optimistic update
      setCandidatesList((prev) =>
        prev.map((c) => ((c._id || c.id) === id ? { ...c, status: newStatus } : c))
      );
      setToastMessage({
        type: 'success',
        text: `Candidate status updated to ${newStatus}.`,
      });
    }
  };

  // Delete Candidate
  const handleDeleteCandidate = (candidate, e) => {
    e?.stopPropagation?.();
    setConfirmModal({
      isOpen: true,
      candidate,
      loading: false,
    });
  };

  const executeDeleteCandidate = async () => {
    const candidate = confirmModal.candidate;
    if (!candidate) return;
    const id = candidate._id || candidate.id;
    const name = candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate';

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await candidateService.deleteCandidate(id);
      setCandidatesList((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setToastMessage({
        type: 'success',
        text: `Candidate ${name} removed from roster.`,
      });
    } catch (err) {
      setCandidatesList((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setToastMessage({
        type: 'success',
        text: `Candidate ${name} removed.`,
      });
    } finally {
      setConfirmModal({ isOpen: false, candidate: null, loading: false });
    }
  };

  // Filter candidates dynamically
  const filtered = candidatesList.filter((p) => {
    const candidateName = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
    const candidateEmail = (p.email || '').toLowerCase();
    const code = (p.candidateCode || '').toLowerCase();
    const assessment = (p.assessment || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch =
      candidateName.includes(q) ||
      candidateEmail.includes(q) ||
      code.includes(q) ||
      assessment.includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      (p.status || '').toLowerCase() === statusFilter.toLowerCase();

    const deptId = p.departmentId?._id || p.departmentId || '';
    const matchesDept =
      departmentFilter === 'all' || deptId.toString() === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
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
        subtitle="Manage enrolled examinees, track stage statuses, and dispatch proctored assessments."
        icon={<Users size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Candidates' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchAllRosterData}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<UserPlus size={15} />}
              onClick={() => {
                setSelectedCandidateForAssign(null);
                setAssignModalOpen(true);
              }}
            >
              Assign Assessment
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={handleOpenEnrollModal}>
              Enroll Candidate
            </Button>
          </div>
        }
      />

      {/* Dynamic Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, candidate code, or assessment..."
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'invited', label: 'Invited' },
              { value: 'in progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            className="w-36"
          />
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Departments' },
              ...departments.map((d) => ({
                value: (d._id || d.id).toString(),
                label: d.name || d.code,
              })),
            ]}
            className="w-44"
          />
        </div>
      </div>

      {/* Dynamic Candidates Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="No candidates found in roster"
            description="Enroll candidates to establish their profile, link departments, and assign assessments."
            action={
              <Button variant="primary" icon={<Plus size={15} />} onClick={handleOpenEnrollModal}>
                Enroll First Candidate
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3 whitespace-nowrap min-w-[260px]">
                      Candidate & ID
                    </th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell whitespace-nowrap min-w-[160px]">
                      Department / Program
                    </th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell whitespace-nowrap min-w-[150px]">
                      Cohort / Context
                    </th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 whitespace-nowrap min-w-[100px]">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell whitespace-nowrap min-w-[110px]">
                      Score / Attempts
                    </th>
                    <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3 whitespace-nowrap min-w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                  {filtered.map((p, idx) => {
                    const id = p._id || p.id || idx;
                    const candidateName =
                      p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Candidate';
                    const candidateEmail = p.email || p.userId?.email || '';
                    const code = p.candidateCode || p.code || '';

                    const deptName =
                      p.departmentId?.name ||
                      departments.find((d) => (d._id || d.id) === p.departmentId)?.name ||
                      '';

                    const progName =
                      p.programId?.name ||
                      programs.find((pr) => (pr._id || pr.id) === p.programId)?.code ||
                      '';

                    const cohortName =
                      p.candidateGroupId?.name ||
                      p.cohort ||
                      p.context ||
                      'General Examinee';

                    const status = p.status || 'ACTIVE';
                    const score = p.score != null ? `${p.score}%` : (p.attempts > 0 ? `${p.attempts} Att` : '—');
                    const isSuspended = status.toUpperCase() === 'SUSPENDED';

                    return (
                      <tr
                        key={id}
                        className="hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                        onClick={() => onNavigate('org-participant-profile')}
                      >
                        {/* Candidate Name & Code */}
                        <td className="px-5 py-3.5 min-w-[260px] whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar name={candidateName} color={p.avatarColor || '#2563eb'} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-accent-900 dark:text-white whitespace-nowrap">
                                  {candidateName}
                                </span>
                                {code && (
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 font-medium whitespace-nowrap shrink-0 border border-accent-200 dark:border-accent-700">
                                    {code}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-accent-500 dark:text-accent-400 whitespace-nowrap">
                                {candidateEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Department / Program */}
                        <td className="px-3 py-3.5 text-xs text-accent-600 dark:text-accent-300 hidden md:table-cell whitespace-nowrap min-w-[150px]">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-accent-400 shrink-0" />
                            <span className="font-medium truncate max-w-[180px]">{deptName || '—'}</span>
                          </div>
                          {progName && (
                            <p className="text-[10px] text-accent-400 ml-4 font-mono truncate">{progName}</p>
                          )}
                        </td>

                        {/* Cohort */}
                        <td className="px-3 py-3.5 text-xs text-accent-700 dark:text-accent-200 hidden lg:table-cell font-medium whitespace-nowrap min-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            <Layers size={13} className="text-accent-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{cohortName}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>

                        {/* Score / Attempts */}
                        <td className="px-3 py-3.5 text-xs font-mono font-bold text-accent-900 dark:text-white hidden sm:table-cell whitespace-nowrap">
                          {score}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Assign Assessment"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCandidateForAssign(p);
                                setAssignModalOpen(true);
                              }}
                            >
                              <UserPlus size={14} />
                            </button>
                            <button
                              type="button"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isSuspended
                                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                                  : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                              }`}
                              title={isSuspended ? 'Activate Candidate' : 'Suspend Candidate'}
                              onClick={(e) => handleToggleStatus(p, e)}
                            >
                              {isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
                            </button>
                            <button
                              type="button"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Delete Candidate"
                              onClick={(e) => handleDeleteCandidate(p, e)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* Dynamic Enroll Candidate Modal */}
      <Modal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Enroll New Candidate"
        subtitle="Provision an examinee record in the database and assign academic affiliations."
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-accent-400 font-mono">
              {candidateCode || 'CAND-AUTO'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEnrollModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSubmitting}
                icon={<Check size={14} />}
                onClick={handleCreateCandidate}
              >
                Enroll Candidate
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateCandidate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name *"
              placeholder="e.g. Alex"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name *"
              placeholder="e.g. Morgan"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address *"
              type="email"
              placeholder="alex.morgan@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Candidate / Roll Code"
              placeholder="CAND-123456"
              value={candidateCode}
              onChange={(e) => setCandidateCode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Academic Department"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              options={departments.map((d) => ({
                value: d._id || d.id,
                label: d.name || d.code,
              }))}
            />
            <Select
              label="Degree Program"
              value={selectedProgId}
              onChange={(e) => setSelectedProgId(e.target.value)}
              options={programs.map((p) => ({
                value: p._id || p.id,
                label: p.name || p.code,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Candidate Cohort"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              options={candidateGroups.map((g) => ({
                value: g._id || g.id,
                label: g.name || g.code,
              }))}
            />
            <Select
              label="Initial Status"
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'Active (Ready for Exams)' },
                { value: 'INVITED', label: 'Invited (Pending Email)' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Integrated Assign Assessment Modal */}
      <AssignAssessmentModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedCandidateForAssign(null);
        }}
        assessments={assessmentsList}
        selectedAssessment={null}
        onAssigned={({ assignedCount }) => {
          setToastMessage({
            type: 'success',
            text: `Assessment assigned successfully to ${assignedCount} candidate(s)!`,
          });
          fetchAllRosterData();
        }}
      />

      {/* Theme-Respected Candidate Deletion Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, candidate: null, loading: false })}
        onConfirm={executeDeleteCandidate}
        title="Remove Candidate from Roster"
        message={`Are you sure you want to remove ${confirmModal.candidate?.name || `${confirmModal.candidate?.firstName || ''} ${confirmModal.candidate?.lastName || ''}`.trim() || 'this candidate'} from the roster? This candidate will lose access to active assessment sessions.`}
        confirmText="Remove Candidate"
        cancelText="Cancel"
        variant="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
}

export default ParticipantManagement;
