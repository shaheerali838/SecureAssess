import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Filter, Download,
  Clock, Users, Star, Pencil, Copy, Trash2, Eye, RefreshCw,
  CheckCircle2, AlertCircle, ShieldCheck, GraduationCap, BookOpen,
  Archive, Check, ExternalLink, SlidersHorizontal, UserPlus, PlayCircle,
  Building2, Award, Link, Calendar, CheckSquare, Search, Globe
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, StatusBadge, SecurityBadge, Button, SearchBar,
  PageHeader, Select, EmptyState, SkeletonCards, Toast, Modal
} from '@/components/ui';
import assessmentService from '@/services/assessment.service';
import departmentService from '@/services/department.service';
import programService from '@/services/program.service';
import subjectService from '@/services/subject.service';
import candidateService from '@/services/candidate.service';
import candidateGroupService from '@/services/candidateGroup.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

const extractArray = (res) => {
  if (!res) return [];
  const val = res.status === 'fulfilled' ? res.value : res;
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.items)) return val.items;
  if (Array.isArray(val?.data?.items)) return val.data.items;
  if (Array.isArray(val?.assessments)) return val.assessments;
  if (Array.isArray(val?.data?.assessments)) return val.data.assessments;
  if (Array.isArray(val?.departments)) return val.departments;
  if (Array.isArray(val?.data?.departments)) return val.data.departments;
  if (Array.isArray(val?.programs)) return val.programs;
  if (Array.isArray(val?.data?.programs)) return val.data.programs;
  if (Array.isArray(val?.subjects)) return val.subjects;
  if (Array.isArray(val?.data?.subjects)) return val.data.subjects;
  if (Array.isArray(val?.candidates)) return val.candidates;
  if (Array.isArray(val?.data?.candidates)) return val.data.candidates;
  if (Array.isArray(val?.groups)) return val.groups;
  if (Array.isArray(val?.data?.groups)) return val.data.groups;
  if (Array.isArray(val?.data)) return val.data;
  return [];
};

export function AssessmentLibrary({ onNavigate }) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || null;

  const [assessmentsList, setAssessmentsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Assign Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningAssessment, setAssigningAssessment] = useState(null);
  const [assignScope, setAssignScope] = useState('individual'); // 'individual', 'department', 'program', 'subject', 'group', 'open_entry'
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [selectedProgIds, setSelectedProgIds] = useState([]);
  const [selectedSubjIds, setSelectedSubjIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [entryCodeInput, setEntryCodeInput] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');

  // Fetch Assessments & Academic Context from Database
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const getGroupsFn =
        candidateGroupService?.getCandidateGroups?.bind(candidateGroupService) ||
        candidateGroupService?.getGroups?.bind(candidateGroupService) ||
        (() => Promise.resolve([]));

      const [assessRes, deptRes, progRes, subjRes, candRes, grpRes] = await Promise.allSettled([
        assessmentService.getAssessments({}, orgId),
        departmentService.getDepartments({}, orgId),
        programService.getPrograms({}, orgId),
        subjectService.getSubjects({}, orgId),
        candidateService.getCandidates({ limit: 100 }, orgId),
        getGroupsFn({}, orgId),
      ]);

      const loadedAssessments = extractArray(assessRes);
      const loadedDepts = extractArray(deptRes);
      const loadedProgs = extractArray(progRes);
      const loadedSubjs = extractArray(subjRes);
      const loadedCandidates = extractArray(candRes);
      const loadedGroups = extractArray(grpRes);

      setAssessmentsList(loadedAssessments);
      setDepartments(loadedDepts);
      setPrograms(loadedProgs);
      setSubjects(loadedSubjs);
      setCandidates(loadedCandidates);
      setGroups(loadedGroups);
    } catch (err) {
      console.warn('Assessments database fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Clone Assessment in Database
  const handleClone = async (e, assessment) => {
    e.stopPropagation();
    try {
      const title = assessment.title || assessment.name || 'Assessment';
      const cleanCode = `CLONE-${Date.now().toString(36).toUpperCase()}`;
      const payload = {
        title: `Copy of ${title}`,
        code: cleanCode,
        type: assessment.type || 'EXAMINATION',
        departmentId: assessment.departmentId?._id || assessment.departmentId || null,
        programId: assessment.programId?._id || assessment.programId || null,
        subjectId: assessment.subjectId?._id || assessment.subjectId || null,
        duration: assessment.duration || { value: 60, unit: 'MINUTES' },
        durationSeconds: assessment.durationSeconds || 3600,
        passingScore: assessment.passingScore || 60,
        securitySettings: assessment.securitySettings || { proctoringEnabled: true },
        status: 'DRAFT',
      };

      await assessmentService.createAssessment(payload, orgId);
      setToastMessage({ type: 'success', text: `Cloned "${title}" into a new draft assessment!` });
      await fetchAssessments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to duplicate assessment.';
      setToastMessage({ type: 'error', text: msg });
    }
  };

  // Publish / Unpublish Assessment
  const handleToggleStatus = async (e, assessment) => {
    e.stopPropagation();
    const isCurrentlyPublished = assessment.status === 'PUBLISHED' || assessment.isPublished;
    const id = assessment._id || assessment.id;

    try {
      if (isCurrentlyPublished) {
        await assessmentService.archiveAssessment(id, orgId);
        setToastMessage({ type: 'info', text: `Assessment "${assessment.title}" changed to Draft.` });
      } else {
        await assessmentService.publishAssessment(id, orgId);
        setToastMessage({ type: 'success', text: `Assessment "${assessment.title}" is now Published & Active!` });
      }
      await fetchAssessments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update status.';
      setToastMessage({ type: 'error', text: msg });
    }
  };

  // Confirm and Delete Assessment
  const handleDelete = async () => {
    if (!selectedAssessment) return;
    setDeleting(true);
    try {
      const id = selectedAssessment._id || selectedAssessment.id;
      await assessmentService.deleteAssessment(id, orgId);
      setToastMessage({ type: 'info', text: `Assessment "${selectedAssessment.title}" removed.` });
      setDeleteModalOpen(false);
      setSelectedAssessment(null);
      await fetchAssessments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete assessment.';
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setDeleting(false);
    }
  };

  // Open Assign Modal
  const handleOpenAssignModal = (e, assessment) => {
    e.stopPropagation();
    setAssigningAssessment(assessment);
    setAssignScope('individual');
    setSelectedCandidateIds([]);
    setSelectedDeptIds(assessment.departmentId?._id ? [assessment.departmentId._id] : []);
    setSelectedProgIds(assessment.programId?._id ? [assessment.programId._id] : []);
    setSelectedSubjIds(assessment.subjectId?._id ? [assessment.subjectId._id] : []);
    setSelectedGroupIds([]);
    setEntryCodeInput(assessment.code || `ENTRY-${Date.now().toString(36).toUpperCase()}`);
    setAvailableFrom('');
    setAvailableUntil('');
    setAttemptsAllowed(1);
    setAssignModalOpen(true);
  };

  // Execute Assessment Assignment
  const handleExecuteAssignment = async (e) => {
    e.preventDefault();
    if (!assigningAssessment) return;

    setIsAssigning(true);
    try {
      const assessmentId = assigningAssessment._id || assigningAssessment.id;
      const isOpen = assignScope === 'open_entry';

      const payload = {
        isOpenEntry: isOpen,
        entryCode: isOpen ? entryCodeInput : undefined,
        candidateIds: assignScope === 'individual' ? selectedCandidateIds : [],
        departmentIds: assignScope === 'department' ? selectedDeptIds : [],
        programIds: assignScope === 'program' ? selectedProgIds : [],
        subjectIds: assignScope === 'subject' ? selectedSubjIds : [],
        groupIds: assignScope === 'group' ? selectedGroupIds : [],
        availableFrom: availableFrom || undefined,
        availableUntil: availableUntil || undefined,
        attemptsAllowed: Number(attemptsAllowed) || 1,
      };

      const res = await assessmentService.assignAssessment(assessmentId, payload, orgId);
      const count = res?.assignedCount ?? res?.data?.assignedCount ?? selectedCandidateIds.length;

      if (isOpen) {
        setToastMessage({
          type: 'success',
          text: `Assessment configured for Open Entry / Admission Testing (Code: ${entryCodeInput})!`,
        });
      } else {
        setToastMessage({
          type: 'success',
          text: `Assessment assigned successfully to ${count} candidate(s)!`,
        });
      }

      setAssignModalOpen(false);
      setAssigningAssessment(null);
      await fetchAssessments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign assessment.';
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter dynamic assessments
  const filtered = assessmentsList.filter((a) => {
    const title = (a.title || a.name || '').toLowerCase();
    const code = (a.code || '').toLowerCase();
    const category = (a.category || a.type || '').toLowerCase();
    const subjName = (a.subjectName || a.subjectId?.name || '').toLowerCase();

    const matchesSearch =
      title.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase()) ||
      category.includes(search.toLowerCase()) ||
      subjName.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (a.status || '').toLowerCase() === statusFilter.toLowerCase();

    const matchesFormat =
      formatFilter === 'all' ||
      (a.type || '').toLowerCase().includes(formatFilter.toLowerCase());

    const matchesSubj =
      subjectFilter === 'all' ||
      a.subjectId === subjectFilter ||
      a.subjectId?._id === subjectFilter;

    return matchesSearch && matchesStatus && matchesFormat && matchesSubj;
  });

  // Calculate dynamic stats
  const publishedCount = assessmentsList.filter((a) => a.status === 'PUBLISHED' || a.isPublished).length;
  const draftCount = assessmentsList.filter((a) => a.status === 'DRAFT' || (!a.isPublished && a.status !== 'ARCHIVED')).length;
  const archivedCount = assessmentsList.filter((a) => a.status === 'ARCHIVED').length;

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
        title="Assessments"
        subtitle="Manage, author, schedule, and assign exams synced with your organization database."
        icon={<FileText size={22} className="text-primary-600 dark:text-primary-400 shrink-0" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Assessments' }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchAssessments}
              disabled={loading}
            >
              Sync
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => onNavigate('org-assessment-builder')}
            >
              Create Assessment
            </Button>
          </div>
        }
      />

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-primary-50/20 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Total Assessments
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {assessmentsList.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/60 text-primary-600 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-success-50/20 dark:bg-success-950/20 border-success-200 dark:border-success-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-success-600 dark:text-success-400">
                Published & Active
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {publishedCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/60 text-success-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Draft Exams
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {draftCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center shrink-0">
              <Pencil size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-accent-50/50 dark:bg-accent-900/30 border-accent-200 dark:border-accent-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-accent-500">
                Archived
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {archivedCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-800 text-accent-500 flex items-center justify-center shrink-0">
              <Archive size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Dynamic Filter Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Search Input */}
          <div className="relative">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search assessment title or code..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Statuses ({assessmentsList.length})</option>
              <option value="published">Published & Active ({publishedCount})</option>
              <option value="draft">Drafts ({draftCount})</option>
              <option value="archived">Archived ({archivedCount})</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Academic Subjects ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Formats</option>
              <option value="examination">Examination</option>
              <option value="mcq">MCQ Test</option>
              <option value="quiz">Quiz</option>
              <option value="skills">Skills Assessment</option>
            </select>
          </div>
        </div>

        {(search || statusFilter !== 'all' || formatFilter !== 'all' || subjectFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs text-accent-500 pt-1">
            <span>Showing <strong>{filtered.length}</strong> of {assessmentsList.length} assessments</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setFormatFilter('all');
                setSubjectFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Assessment Cards Grid */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((assessment) => {
            const subjObj = subjects.find(
              (s) => s._id === assessment.subjectId || s._id === assessment.subjectId?._id
            );
            const deptObj = departments.find(
              (d) => d._id === assessment.departmentId || d._id === assessment.departmentId?._id
            );

            const subjectLabel = subjObj
              ? `${subjObj.code}: ${subjObj.name}`
              : assessment.subjectName || deptObj?.name || 'General';

            const durationMins = assessment.duration?.value || Math.round((assessment.durationSeconds || 3600) / 60);
            const isPublished = assessment.status === 'PUBLISHED' || assessment.isPublished;
            const isSecure = assessment.securitySettings?.proctoringEnabled || assessment.securityLevel === 'Secure';

            return (
              <Card
                key={assessment._id || assessment.id}
                className="hover:shadow-md transition-shadow min-w-0 flex flex-col justify-between"
              >
                <CardBody className="p-4 sm:p-5 space-y-4 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    {/* Header Row: Subject Badge + Status + Code */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                            <BookOpen size={11} />
                            <span className="truncate max-w-[150px]">{subjectLabel}</span>
                          </span>
                          <span className="font-mono text-[10px] font-bold text-accent-400">
                            {assessment.code || 'ASSESS-01'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-accent-900 dark:text-white break-words leading-snug">
                          {assessment.title || assessment.name || 'Untitled Assessment'}
                        </h4>
                      </div>

                      <div className="shrink-0">
                        <StatusBadge status={assessment.status || (isPublished ? 'PUBLISHED' : 'DRAFT')} />
                      </div>
                    </div>

                    {assessment.description && (
                      <p className="text-xs text-accent-500 dark:text-accent-400 line-clamp-2 leading-relaxed">
                        {assessment.description}
                      </p>
                    )}

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 text-xs text-accent-600 dark:text-accent-400 flex-wrap">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-[11px] font-medium">
                        <Clock size={12} className="text-accent-500" />
                        <span>{durationMins}m</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-[11px] font-medium">
                        <span>Pass: {assessment.passingScore || 60}%</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-[11px] font-medium">
                        <ShieldCheck size={12} className={isSecure ? 'text-primary-600' : 'text-accent-400'} />
                        <span>{isSecure ? 'Proctored' : 'Standard'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-accent-100 dark:border-accent-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleStatus(e, assessment)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                          isPublished
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                            : 'bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800 hover:bg-success-100'
                        }`}
                        title={isPublished ? 'Unpublish to Draft' : 'Publish Assessment'}
                      >
                        {isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<UserPlus size={13} />}
                        onClick={(e) => handleOpenAssignModal(e, assessment)}
                        title="Assign to Candidates, Department, Subject, or Open Entry"
                      >
                        Assign
                      </Button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleClone(e, assessment)}
                        className="p-1.5 text-accent-400 hover:text-accent-700 dark:hover:text-accent-200 cursor-pointer rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800"
                        title="Clone Assessment"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => onNavigate('org-assessment-builder', { assessmentId: assessment._id || assessment.id, id: assessment._id || assessment.id, assessment })}
                        className="p-1.5 text-accent-400 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950"
                        title="Edit in Builder"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAssessment(assessment);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-accent-400 hover:text-danger-600 dark:hover:text-danger-400 cursor-pointer rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950"
                        title="Delete Assessment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 mx-auto flex items-center justify-center mb-3">
            <FileText size={24} />
          </div>
          <h4 className="text-sm font-bold text-accent-900 dark:text-white">No Assessments Registered in Database</h4>
          <p className="text-xs text-accent-500 max-w-sm mx-auto mt-1 mb-4">
            Build and publish your first examination suite or quiz mapped directly to your academic curriculum.
          </p>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => onNavigate('org-assessment-builder')}
          >
            Create First Assessment
          </Button>
        </Card>
      )}

      {/* Comprehensive Versatile Assignment Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Assessment: "${assigningAssessment?.title || 'Exam'}"`}
        subtitle="Target candidates individually, by Department, Degree Program, Subject enrollment, Cohort Group, or Open Entry test link."
        size="xl"
      >
        <form onSubmit={handleExecuteAssignment} className="space-y-4 text-xs">
          {/* Assignment Scope Tabs */}
          <div>
            <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1.5">
              Assignment Target Scope
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 bg-accent-100/80 dark:bg-accent-900/80 rounded-xl border border-accent-200/60 dark:border-accent-800">
              {[
                { id: 'individual', label: 'Individuals', icon: <Users size={14} className="shrink-0" /> },
                { id: 'department', label: 'Department', icon: <Building2 size={14} className="shrink-0" /> },
                { id: 'program', label: 'Program', icon: <Award size={14} className="shrink-0" /> },
                { id: 'subject', label: 'Subject', icon: <BookOpen size={14} className="shrink-0" /> },
                { id: 'group', label: 'Group/Cohort', icon: <CheckSquare size={14} className="shrink-0" /> },
                { id: 'open_entry', label: 'Open Entry', icon: <Globe size={14} className="shrink-0" /> },
              ].map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setAssignScope(scope.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-w-0 border ${
                    assignScope === scope.id
                      ? 'bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 border-primary-300 dark:border-primary-700 shadow-sm'
                      : 'border-transparent text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white hover:bg-accent-50/60 dark:hover:bg-accent-800/40'
                  }`}
                >
                  {scope.icon}
                  <span className="truncate">{scope.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scope 1: Individual Candidates Selection */}
          {assignScope === 'individual' && (
            <div className="space-y-2 p-3 bg-accent-50 dark:bg-accent-900/40 rounded-xl border border-accent-200 dark:border-accent-800">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-accent-700 dark:text-accent-300">
                  Select Candidates ({selectedCandidateIds.length} selected)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCandidateIds.length === candidates.length) {
                      setSelectedCandidateIds([]);
                    } else {
                      setSelectedCandidateIds(candidates.map((c) => c._id));
                    }
                  }}
                  className="text-primary-600 dark:text-primary-400 font-bold hover:underline cursor-pointer"
                >
                  {selectedCandidateIds.length === candidates.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2 text-accent-400" />
                <input
                  type="text"
                  placeholder="Filter candidate roster by name or email..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-xs"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-accent-100 dark:divide-accent-800">
                {candidates
                  .filter((c) => {
                    const str = `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''} ${c.candidateCode || ''}`.toLowerCase();
                    return str.includes(candidateSearch.toLowerCase());
                  })
                  .map((c) => {
                    const isChecked = selectedCandidateIds.includes(c._id);
                    return (
                      <label
                        key={c._id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-accent-800 transition-colors ${
                          isChecked ? 'bg-primary-50/60 dark:bg-primary-950/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCandidateIds([...selectedCandidateIds, c._id]);
                              } else {
                                setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== c._id));
                              }
                            }}
                            className="w-3.5 h-3.5 text-primary-600 rounded"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-accent-900 dark:text-white truncate">
                              {c.firstName} {c.lastName}
                            </p>
                            <p className="text-[10px] text-accent-400 truncate">{c.email}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-accent-400 shrink-0">
                          {c.candidateCode}
                        </span>
                      </label>
                    );
                  })}
                {candidates.length === 0 && (
                  <p className="text-center py-4 text-accent-500">No candidates found in roster.</p>
                )}
              </div>
            </div>
          )}

          {/* Scope 2: Department-wise Assignment */}
          {assignScope === 'department' && (
            <div className="space-y-2 p-3 bg-accent-50 dark:bg-accent-900/40 rounded-xl border border-accent-200 dark:border-accent-800">
              <span className="font-semibold text-accent-700 dark:text-accent-300">
                Target Departments (Assigns all enrolled students)
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {departments.map((d) => {
                  const isChecked = selectedDeptIds.includes(d._id);
                  const deptCands = candidates.filter((c) => c.departmentId === d._id || c.departmentId?._id === d._id);
                  return (
                    <label
                      key={d._id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40'
                          : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeptIds([...selectedDeptIds, d._id]);
                            } else {
                              setSelectedDeptIds(selectedDeptIds.filter((id) => id !== d._id));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white">{d.name} ({d.code})</p>
                          <p className="text-[10px] text-accent-500">{deptCands.length} student(s) currently enrolled</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scope 3: Degree Program-wise Assignment */}
          {assignScope === 'program' && (
            <div className="space-y-2 p-3 bg-accent-50 dark:bg-accent-900/40 rounded-xl border border-accent-200 dark:border-accent-800">
              <span className="font-semibold text-accent-700 dark:text-accent-300">
                Target Degree Programs (Assigns all students in curriculum)
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {programs.map((p) => {
                  const isChecked = selectedProgIds.includes(p._id);
                  const progCands = candidates.filter((c) => c.programId === p._id || c.programId?._id === p._id);
                  return (
                    <label
                      key={p._id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-secondary-500 bg-secondary-50/60 dark:bg-secondary-950/40'
                          : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProgIds([...selectedProgIds, p._id]);
                            } else {
                              setSelectedProgIds(selectedProgIds.filter((id) => id !== p._id));
                            }
                          }}
                          className="w-4 h-4 text-secondary-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white">{p.name} ({p.code})</p>
                          <p className="text-[10px] text-accent-500">{progCands.length} enrolled student(s)</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scope 4: Subject-wise Assignment */}
          {assignScope === 'subject' && (
            <div className="space-y-2 p-3 bg-accent-50 dark:bg-accent-900/40 rounded-xl border border-accent-200 dark:border-accent-800">
              <span className="font-semibold text-accent-700 dark:text-accent-300">
                Target Course Subjects (Assigns enrolled class students)
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {subjects.map((s) => {
                  const isChecked = selectedSubjIds.includes(s._id);
                  return (
                    <label
                      key={s._id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-success-500 bg-success-50/60 dark:bg-success-950/40'
                          : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjIds([...selectedSubjIds, s._id]);
                            } else {
                              setSelectedSubjIds(selectedSubjIds.filter((id) => id !== s._id));
                            }
                          }}
                          className="w-4 h-4 text-success-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white">{s.code}: {s.name}</p>
                          <p className="text-[10px] text-accent-500">{s.credits || 3} Credits Course</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scope 5: Candidate Group / Cohort Assignment */}
          {assignScope === 'group' && (
            <div className="space-y-2 p-3 bg-accent-50 dark:bg-accent-900/40 rounded-xl border border-accent-200 dark:border-accent-800">
              <span className="font-semibold text-accent-700 dark:text-accent-300">
                Target Candidate Groups / Cohort Batches
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {groups.map((g) => {
                  const isChecked = selectedGroupIds.includes(g._id);
                  const memberCount = g.candidates?.length || g.candidateCount || 0;
                  return (
                    <label
                      key={g._id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-info-500 bg-info-50/60 dark:bg-info-950/40'
                          : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroupIds([...selectedGroupIds, g._id]);
                            } else {
                              setSelectedGroupIds(selectedGroupIds.filter((id) => id !== g._id));
                            }
                          }}
                          className="w-4 h-4 text-info-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white">{g.name}</p>
                          <p className="text-[10px] text-accent-500">{memberCount} member candidates</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
                {groups.length === 0 && (
                  <p className="text-center py-4 text-accent-500">No candidate groups created yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Scope 6: Open Entry / Admission Test */}
          {assignScope === 'open_entry' && (
            <div className="p-4 bg-primary-50/50 dark:bg-primary-950/30 rounded-xl border border-primary-200 dark:border-primary-800/80 space-y-3">
              <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-bold">
                <Globe size={16} />
                <span>Open Entry / Universal Admission Test Mode</span>
              </div>
              <p className="text-xs text-accent-600 dark:text-accent-400">
                Enables universal entry for admission screenings and open entrance exams. Candidates can self-register and enter the exam session using the access code below.
              </p>
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Access Code / Entry Key *
                </label>
                <input
                  type="text"
                  required
                  value={entryCodeInput}
                  onChange={(e) => setEntryCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-700 bg-white dark:bg-accent-800 font-mono font-bold text-xs"
                />
              </div>
            </div>
          )}

          {/* Scheduling & Access Windows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-accent-100 dark:border-accent-800">
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Available From (Optional)
              </label>
              <input
                type="datetime-local"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Available Until (Deadline)
              </label>
              <input
                type="datetime-local"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Attempts Allowed
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={attemptsAllowed}
                onChange={(e) => setAttemptsAllowed(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-accent-100 dark:border-accent-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isAssigning}>
              {assignScope === 'open_entry' ? 'Enable Open Entry Test' : 'Confirm Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Assessment"
        subtitle="This action will permanently delete or archive this assessment record from your database."
      >
        <div className="space-y-4 text-xs">
          <p className="text-accent-700 dark:text-accent-300">
            Are you sure you want to remove assessment <strong>"{selectedAssessment?.title}"</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-accent-100 dark:border-accent-800">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-danger-600 hover:bg-danger-700 text-white"
              loading={deleting}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AssessmentLibrary;
