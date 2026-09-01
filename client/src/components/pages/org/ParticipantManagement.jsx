import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, ChevronRight, Mail, Send, Upload, RefreshCw, Check,
  UserPlus, Trash2, Edit2, BookOpen, CheckCircle2,
  X, UserCheck, GraduationCap, Building2, Phone, Search, Filter, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import {
  Card, CardBody, CardHeader, StatusBadge, Button, Avatar,
  SearchBar, PageHeader, Select, EmptyState, Modal, Input, Toast, SkeletonTable, Badge
} from '@/components/ui';
import { participants as defaultParticipants } from '@/data';
import candidateService from '@/services/candidate.service';
import departmentService from '@/services/department.service';
import programService from '@/services/program.service';
import subjectService from '@/services/subject.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

const extractArray = (res) => {
  if (!res) return [];
  const val = res.status === 'fulfilled' ? res.value : res;
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.items)) return val.items;
  if (Array.isArray(val?.candidates)) return val.candidates;
  if (Array.isArray(val?.departments)) return val.departments;
  if (Array.isArray(val?.programs)) return val.programs;
  if (Array.isArray(val?.data?.items)) return val.data.items;
  if (Array.isArray(val?.data)) return val.data;
  return [];
};

export function ParticipantManagement({ onNavigate }) {
  const { currentOrganization, t } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || null;

  const [candidatesList, setCandidatesList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const [selectedProgId, setSelectedProgId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Terminology
  const candSingular = t('candidate') || 'Candidate';
  const candPlural = t('candidate', true) || 'Candidates';
  const rosterLabel = t('roster') || 'Examinees Roster';

  // Candidate Create/Edit Modal State
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candForm, setCandForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    candidateCode: '',
    departmentId: '',
    programId: '',
    status: 'ACTIVE',
  });

  // Bulk Import Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkDeptId, setBulkDeptId] = useState('');
  const [bulkProgId, setBulkProgId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Candidates and Academic Structure
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [candRes, deptRes, progRes, subjRes] = await Promise.allSettled([
        candidateService.getCandidates({ limit: 200 }, orgId),
        departmentService.getDepartments({}, orgId),
        programService.getPrograms({}, orgId),
        subjectService.getSubjects({}, orgId),
      ]);

      const loadedCandidates = extractArray(candRes);
      const loadedDepts = extractArray(deptRes);
      const loadedProgs = extractArray(progRes);
      const loadedSubjs = extractArray(subjRes);

      setCandidatesList(loadedCandidates.length > 0 ? loadedCandidates : defaultParticipants);
      setDepartments(loadedDepts);
      setPrograms(loadedProgs);
      setSubjects(loadedSubjs);
    } catch (err) {
      console.warn('Participant data fetch note:', err.message);
      setCandidatesList(defaultParticipants);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter cascaded programs based on selected Department
  const filteredProgramsForFilter = programs.filter((p) =>
    selectedDeptId === 'all' ? true : p.departmentId === selectedDeptId || p.departmentId?._id === selectedDeptId
  );

  // Modal cascaded programs based on form department
  const formPrograms = programs.filter((p) =>
    !candForm.departmentId ? true : p.departmentId === candForm.departmentId || p.departmentId?._id === candForm.departmentId
  );

  // Open Create Candidate Modal
  const handleOpenCreateModal = () => {
    setEditingCandidate(null);
    const defaultDept = selectedDeptId !== 'all' ? selectedDeptId : departments[0]?._id || '';
    const availProgs = programs.filter((p) => !defaultDept || p.departmentId === defaultDept || p.departmentId?._id === defaultDept);
    const defaultProg = selectedProgId !== 'all' ? selectedProgId : availProgs[0]?._id || '';

    setCandForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      candidateCode: `STD-${Date.now().toString().slice(-5)}`,
      departmentId: defaultDept,
      programId: defaultProg,
      status: 'ACTIVE',
    });
    setCandidateModalOpen(true);
  };

  // Open Edit Candidate Modal
  const handleOpenEditModal = (c) => {
    setEditingCandidate(c);
    setCandForm({
      firstName: c.firstName || (c.name ? c.name.split(' ')[0] : ''),
      lastName: c.lastName || (c.name ? c.name.split(' ').slice(1).join(' ') : ''),
      email: c.email || '',
      phone: c.phone || c.phoneNumber || '',
      candidateCode: c.candidateCode || c.code || `STD-${Date.now().toString().slice(-4)}`,
      departmentId: c.departmentId?._id || c.departmentId || '',
      programId: c.programId?._id || c.programId || '',
      status: c.status || 'ACTIVE',
    });
    setCandidateModalOpen(true);
  };

  // Save or Update Candidate
  const handleSaveCandidate = async (e) => {
    e.preventDefault();
    if (!candForm.firstName.trim() || !candForm.email.trim()) {
      setToastMessage({ type: 'error', text: 'First name and email are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: candForm.firstName.trim(),
        lastName: candForm.lastName.trim() || candForm.firstName.trim(),
        email: candForm.email.trim().toLowerCase(),
        phone: candForm.phone.trim(),
        phoneNumber: candForm.phone.trim(),
        candidateCode: candForm.candidateCode.trim().toUpperCase(),
        departmentId: candForm.departmentId || null,
        programId: candForm.programId || null,
        status: candForm.status || 'ACTIVE',
      };

      if (editingCandidate) {
        const cId = editingCandidate._id || editingCandidate.id;
        await candidateService.updateCandidate(cId, payload, orgId);
        setToastMessage({ type: 'success', text: `Updated details for ${payload.firstName} ${payload.lastName}.` });
      } else {
        await candidateService.createCandidate(payload, orgId);
        setToastMessage({ type: 'success', text: `Successfully enrolled ${payload.firstName} ${payload.lastName} (${payload.candidateCode}).` });
      }

      setCandidateModalOpen(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save candidate.';
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Suspend / Active status
  const handleToggleCandidateStatus = async (e, candidate) => {
    e.stopPropagation();
    const cId = candidate._id || candidate.id;
    const isCurrentlyActive = candidate.status === 'ACTIVE';

    try {
      if (isCurrentlyActive) {
        await candidateService.suspendCandidate(cId, orgId);
        setToastMessage({ type: 'info', text: `Candidate account suspended.` });
      } else {
        await candidateService.activateCandidate(cId, orgId);
        setToastMessage({ type: 'success', text: `Candidate account activated.` });
      }
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update candidate status.';
      setToastMessage({ type: 'error', text: msg });
    }
  };

  // Delete Candidate
  const handleDeleteCandidate = async (e, candidate) => {
    e.stopPropagation();
    const cName = candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate';
    if (!window.confirm(`Are you sure you want to deactivate and remove ${cName}?`)) return;

    try {
      const cId = candidate._id || candidate.id;
      await candidateService.deleteCandidate(cId, orgId);
      setToastMessage({ type: 'info', text: `Removed ${cName} from roster.` });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove candidate.';
      setToastMessage({ type: 'error', text: msg });
    }
  };

  // Bulk Import Candidates
  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setIsSubmitting(true);
    try {
      const lines = bulkText.trim().split('\n').filter(Boolean);
      const items = lines.map((line, idx) => {
        const parts = line.split(',').map((p) => p.trim());
        const fullName = parts[0] || `Candidate ${idx + 1}`;
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'Candidate';
        const lastName = nameParts.slice(1).join(' ') || firstName;
        const email = parts[1] || `${firstName.toLowerCase()}.${Date.now().toString().slice(-4)}@institution.edu`;
        const code = parts[2] || `STD-${Date.now().toString().slice(-4)}${idx}`;

        return {
          firstName,
          lastName,
          email,
          candidateCode: code.toUpperCase(),
          departmentId: bulkDeptId || null,
          programId: bulkProgId || null,
          status: 'ACTIVE',
        };
      });

      await candidateService.bulkImportCandidates(items, orgId);
      setToastMessage({ type: 'success', text: `Successfully imported ${items.length} examinees.` });
      setBulkModalOpen(false);
      setBulkText('');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to process bulk import.';
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter candidates by search and Academic Hierarchy
  const filtered = candidatesList.filter((p) => {
    const candidateName = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
    const candidateEmail = (p.email || '').toLowerCase();
    const candidateCode = (p.candidateCode || p.code || '').toLowerCase();
    const phone = (p.phone || p.phoneNumber || '').toLowerCase();

    const matchesSearch =
      !search ||
      candidateName.includes(search.toLowerCase()) ||
      candidateEmail.includes(search.toLowerCase()) ||
      candidateCode.includes(search.toLowerCase()) ||
      phone.includes(search.toLowerCase());

    const matchesDept =
      selectedDeptId === 'all' ||
      p.departmentId === selectedDeptId ||
      p.departmentId?._id === selectedDeptId;

    const matchesProg =
      selectedProgId === 'all' ||
      p.programId === selectedProgId ||
      p.programId?._id === selectedProgId;

    const matchesStatus =
      statusFilter === 'all' ||
      (p.status || 'ACTIVE').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesDept && matchesProg && matchesStatus;
  });

  const activeCandidatesCount = candidatesList.filter((c) => (c.status || 'ACTIVE') === 'ACTIVE').length;

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Page Header */}
      <PageHeader
        title={rosterLabel}
        subtitle="Manage enrolled students, filter by academic department and degree program, and dispatch examinations."
        icon={<Users size={22} className="text-primary-600 dark:text-primary-400 shrink-0" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Academic Structure', onClick: () => onNavigate('org-academic-structure') },
          { label: candPlural }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchData}
            >
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Upload size={14} />}
              onClick={() => {
                setBulkDeptId(selectedDeptId !== 'all' ? selectedDeptId : (departments[0]?._id || ''));
                setBulkProgId(selectedProgId !== 'all' ? selectedProgId : (programs[0]?._id || ''));
                setBulkModalOpen(true);
              }}
            >
              Import CSV
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={handleOpenCreateModal}>
              Enroll {candSingular}
            </Button>
          </div>
        }
      />

      {/* Academic Structure Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-primary-50/20 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Total Examinees
              </p>
              <h3 className="text-xl font-bold text-accent-900 dark:text-white mt-0.5">
                {candidatesList.length}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/60 text-primary-600 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-success-50/20 dark:bg-success-950/20 border-success-200 dark:border-success-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-success-600 dark:text-success-400">
                Active & Enrolled
              </p>
              <h3 className="text-xl font-bold text-accent-900 dark:text-white mt-0.5">
                {activeCandidatesCount}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-success-100 dark:bg-success-900/60 text-success-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-purple-50/20 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Academic Depts
              </p>
              <h3 className="text-xl font-bold text-accent-900 dark:text-white mt-0.5">
                {departments.length}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 flex items-center justify-center shrink-0">
              <Building2 size={16} />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Degree Programs
              </p>
              <h3 className="text-xl font-bold text-accent-900 dark:text-white mt-0.5">
                {programs.length}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center shrink-0">
              <GraduationCap size={16} />
            </div>
          </div>
        </Card>
      </div>

      {/* Academic Structure Filter Bar */}
      <Card className="p-4 space-y-3 bg-white dark:bg-accent-900/80 border-accent-200 dark:border-accent-800">
        <div className="flex items-center gap-2 pb-2 border-b border-accent-100 dark:border-accent-800">
          <GraduationCap size={16} className="text-primary-600 dark:text-primary-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent-700 dark:text-accent-300">
            Academic Curriculum Filters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Department Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-accent-600 dark:text-accent-400 mb-1">
              Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedProgId('all');
              }}
              className="w-full h-8 px-2.5 rounded-lg bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-xs text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Degree Program Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-accent-600 dark:text-accent-400 mb-1">
              Degree Program
            </label>
            <select
              value={selectedProgId}
              onChange={(e) => setSelectedProgId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-xs text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Programs ({filteredProgramsForFilter.length})</option>
              {filteredProgramsForFilter.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-accent-600 dark:text-accent-400 mb-1">
              Enrollment Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-xs text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active / Enrolled</option>
              <option value="INVITED">Invited</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Search and Clear Filters */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-2.5 text-accent-400" />
            <input
              type="text"
              placeholder="Search examinee by name, roll no, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end">
            {(selectedDeptId !== 'all' || selectedProgId !== 'all' || statusFilter !== 'all' || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDeptId('all');
                  setSelectedProgId('all');
                  setStatusFilter('all');
                  setSearch('');
                }}
              >
                Clear Filters
              </Button>
            )}
            <span className="text-xs text-accent-500 font-medium">
              Showing <strong>{filtered.length}</strong> of {candidatesList.length} examinees
            </span>
          </div>
        </div>
      </Card>

      {/* Candidates Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="No examinees match academic filters"
            description="Try clearing your department/program filters, or enroll new candidates into this academic branch."
            action={
              <Button variant="primary" icon={<Plus size={15} />} onClick={handleOpenCreateModal}>
                Enroll Candidate
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50 text-[11px] uppercase tracking-wider font-semibold text-accent-600 dark:text-accent-400">
                    <th className="text-left px-5 py-3">Examinee Candidate</th>
                    <th className="text-left px-3 py-3">Academic Department</th>
                    <th className="text-left px-3 py-3">Degree Program</th>
                    <th className="text-left px-3 py-3 hidden md:table-cell">Roll / Student Code</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                  {filtered.map((p, idx) => {
                    const id = p._id || p.id || idx;
                    const candidateName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Candidate';
                    const candidateEmail = p.email || 'examinee@stanford.edu';
                    const candidateCode = p.candidateCode || p.code || `STD-${idx + 1}`;

                    const deptObj = departments.find(
                      (d) => d._id === p.departmentId || d._id === p.departmentId?._id
                    );
                    const progObj = programs.find(
                      (pr) => pr._id === p.programId || pr._id === p.programId?._id
                    );

                    const deptTitle = deptObj ? deptObj.name : (p.departmentName || 'Engineering');
                    const progTitle = progObj ? progObj.name : (p.programName || 'Core Curriculum');

                    const status = p.status || 'ACTIVE';
                    const isSuspended = status === 'SUSPENDED';

                    return (
                      <tr
                        key={id}
                        onClick={() => onNavigate('org-participant-profile')}
                        className="hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                      >
                        {/* Candidate Details */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={candidateName} color={p.avatarColor || '#2563eb'} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">
                                {candidateName}
                              </p>
                              <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">
                                {candidateEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Academic Department */}
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                            <Building2 size={11} />
                            <span className="truncate max-w-[140px]">{deptTitle}</span>
                          </span>
                        </td>

                        {/* Degree Program */}
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent-700 dark:text-accent-300">
                            <GraduationCap size={12} className="text-accent-400" />
                            <span className="truncate max-w-[140px]">{progTitle}</span>
                          </span>
                        </td>

                        {/* Roll Number / Candidate Code */}
                        <td className="px-3 py-3.5 hidden md:table-cell">
                          <span className="font-mono text-[11px] font-bold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-800 px-1.5 py-0.5 rounded">
                            {candidateCode}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5">
                          <StatusBadge status={status} />
                        </td>

                        {/* Action Buttons */}
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => handleToggleCandidateStatus(e, p)}
                              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                                isSuspended
                                  ? 'text-success-600 bg-success-50 dark:bg-success-950/50 border-success-200 dark:border-success-800'
                                  : 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                              }`}
                              title={isSuspended ? 'Activate Account' : 'Suspend Account'}
                            >
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-accent-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800 cursor-pointer"
                              title="Edit examinee details"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteCandidate(e, p)}
                              className="p-1.5 text-accent-400 hover:text-danger-600 dark:hover:text-danger-400 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/40 cursor-pointer"
                              title="Remove examinee"
                            >
                              <Trash2 size={13} />
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

      {/* Add / Edit Candidate Modal */}
      {candidateModalOpen && (
        <Modal
          open={candidateModalOpen}
          onClose={() => setCandidateModalOpen(false)}
          title={editingCandidate ? "Edit Examinee Details" : "Enroll New Examinee"}
          subtitle="Associate student identity with academic department and degree program."
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCandidateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSubmitting}
                icon={<Check size={14} />}
                onClick={handleSaveCandidate}
              >
                {editingCandidate ? "Save Changes" : "Enroll Examinee"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                placeholder="e.g. Alex"
                value={candForm.firstName}
                onChange={(e) => setCandForm({ ...candForm, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                placeholder="e.g. Morgan"
                value={candForm.lastName}
                onChange={(e) => setCandForm({ ...candForm, lastName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Email Address *"
                type="email"
                placeholder="alex.morgan@stanford.edu"
                value={candForm.email}
                onChange={(e) => setCandForm({ ...candForm, email: e.target.value })}
              />
              <Input
                label="Roll No / Student ID *"
                placeholder="e.g. CS-2026-0042"
                value={candForm.candidateCode}
                onChange={(e) => setCandForm({ ...candForm, candidateCode: e.target.value })}
              />
            </div>

            {/* Academic Department & Cascaded Program Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Academic Department
                </label>
                <select
                  value={candForm.departmentId}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    const availProgs = programs.filter((p) => !newDept || p.departmentId === newDept || p.departmentId?._id === newDept);
                    setCandForm({
                      ...candForm,
                      departmentId: newDept,
                      programId: availProgs[0]?._id || '',
                    });
                  }}
                  className="w-full h-9 px-2.5 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Degree Program
                </label>
                <select
                  value={candForm.programId}
                  onChange={(e) => setCandForm({ ...candForm, programId: e.target.value })}
                  className="w-full h-9 px-2.5 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs"
                >
                  <option value="">Select Program...</option>
                  {formPrograms.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Input
                label="Phone Number (Optional)"
                placeholder="+1 (555) 234-5678"
                value={candForm.phone}
                onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk CSV Import Modal */}
      {bulkModalOpen && (
        <Modal
          open={bulkModalOpen}
          onClose={() => setBulkModalOpen(false)}
          title="Bulk Import Examinees"
          subtitle="Paste CSV rows to enroll multiple students directly into an academic department."
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setBulkModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSubmitting}
                icon={<Upload size={14} />}
                onClick={handleBulkImport}
              >
                Import Examinees
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Target Department
                </label>
                <select
                  value={bulkDeptId}
                  onChange={(e) => {
                    setBulkDeptId(e.target.value);
                    const avail = programs.filter((p) => !e.target.value || p.departmentId === e.target.value);
                    setBulkProgId(avail[0]?._id || '');
                  }}
                  className="w-full h-9 px-2.5 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Target Degree Program
                </label>
                <select
                  value={bulkProgId}
                  onChange={(e) => setBulkProgId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs"
                >
                  <option value="">Select Program...</option>
                  {programs
                    .filter((p) => !bulkDeptId || p.departmentId === bulkDeptId || p.departmentId?._id === bulkDeptId)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300">
                  CSV Data (One student per line: Name, Email, StudentID)
                </label>
              </div>
              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Alex Morgan, alex.morgan@stanford.edu, CS-2026-001&#10;Sophia Chen, sophia.c@stanford.edu, CS-2026-002&#10;David Kim, david.kim@stanford.edu, CS-2026-003"
                className="w-full p-3 font-mono text-xs rounded-xl bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-accent-900 dark:text-white resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ParticipantManagement;
