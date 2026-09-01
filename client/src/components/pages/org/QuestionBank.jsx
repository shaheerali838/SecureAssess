import React, { useState, useEffect, useCallback } from 'react';
import {
  Library, Plus, Filter, Copy, Trash2, Pencil,
  Tag, Star, RefreshCw, Check, FolderPlus, Tags,
  Layers, CheckCircle2, ChevronRight, SlidersHorizontal,
  Building2, Award, BookOpen, GraduationCap, AlertCircle, HelpCircle,
  Search
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, SearchBar, PageHeader, Select, EmptyState,
  Modal, Input, Textarea, Toast, SkeletonCards
} from '@/components/ui';
import questionBankService from '@/services/questionBank.service';
import departmentService from '@/services/department.service';
import programService from '@/services/program.service';
import subjectService from '@/services/subject.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

const difficultyColors = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger',
};

const extractArray = (res) => {
  if (!res) return [];
  const val = res.status === 'fulfilled' ? res.value : res;
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.items)) return val.items;
  if (Array.isArray(val?.data?.items)) return val.data.items;
  if (Array.isArray(val?.questions)) return val.questions;
  if (Array.isArray(val?.departments)) return val.departments;
  if (Array.isArray(val?.programs)) return val.programs;
  if (Array.isArray(val?.subjects)) return val.subjects;
  if (Array.isArray(val?.data)) return val.data;
  return [];
};

const getQuestionPrompt = (q) => {
  if (!q) return '';
  if (typeof q.prompt === 'string') return q.prompt;
  if (typeof q.title === 'string') return q.title;
  if (typeof q.stem === 'string') return q.stem;
  if (typeof q.text === 'string') return q.text;
  if (typeof q.content === 'string') return q.content;
  if (typeof q.content?.text === 'string') return q.content.text;
  return '';
};

export function QuestionBank({ onNavigate }) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || null;

  // Academic Structure State
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Questions State
  const [questionsList, setQuestionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Domain Filter States (Academic Structure cascading filters)
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const [selectedProgId, setSelectedProgId] = useState('all');
  const [selectedSubjId, setSelectedSubjId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');

  // Modal State for Add/Edit Question
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formDeptId, setFormDeptId] = useState('');
  const [formProgId, setFormProgId] = useState('');
  const [formSubjId, setFormSubjId] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('Multiple Choice');
  const [newDifficulty, setNewDifficulty] = useState('Medium');
  const [newPoints, setNewPoints] = useState(1);
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState(0);
  const [newExplanation, setNewExplanation] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Academic Structure and Question Bank
  const fetchBankData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, subjRes, qRes] = await Promise.allSettled([
        departmentService.getDepartments({}, orgId),
        programService.getPrograms({}, orgId),
        subjectService.getSubjects({}, orgId),
        questionBankService.getQuestions({}, orgId),
      ]);

      const loadedDepts = extractArray(deptRes);
      const loadedProgs = extractArray(progRes);
      const loadedSubjs = extractArray(subjRes);
      const loadedQuestions = extractArray(qRes);

      setDepartments(loadedDepts);
      setPrograms(loadedProgs);
      setSubjects(loadedSubjs);
      setQuestionsList(loadedQuestions);
    } catch (err) {
      console.warn('Questions/taxonomies fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  // Handle department change in Add Modal (auto-update cascaded programs and subjects)
  const handleModalDeptChange = (deptId) => {
    setFormDeptId(deptId);
    const availableProgs = programs.filter(
      (p) => p.departmentId === deptId || p.departmentId?._id === deptId
    );
    const firstProg = availableProgs[0]?._id || '';
    setFormProgId(firstProg);

    if (firstProg) {
      const availableSubjs = subjects.filter(
        (s) => s.programId === firstProg || s.programId?._id === firstProg
      );
      setFormSubjId(availableSubjs[0]?._id || '');
    } else {
      setFormSubjId('');
    }
  };

  // Handle program change in Add Modal (auto-update cascaded subjects)
  const handleModalProgChange = (progId) => {
    setFormProgId(progId);
    const availableSubjs = subjects.filter(
      (s) => s.programId === progId || s.programId?._id === progId
    );
    setFormSubjId(availableSubjs[0]?._id || '');
  };

  // Open modal for creating a new question
  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    const initDept = departments[0]?._id || '';
    const availableProgs = programs.filter(
      (p) => p.departmentId === initDept || p.departmentId?._id === initDept
    );
    const initProg = availableProgs[0]?._id || programs[0]?._id || '';
    const availableSubjs = subjects.filter(
      (s) => s.programId === initProg || s.programId?._id === initProg
    );
    const initSubj = availableSubjs[0]?._id || subjects[0]?._id || '';

    setFormDeptId(initDept);
    setFormProgId(initProg);
    setFormSubjId(initSubj);
    setNewContent('');
    setNewType('Multiple Choice');
    setNewDifficulty('Medium');
    setNewPoints(1);
    setNewOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    setNewCorrectAnswer(0);
    setNewExplanation('');
    setNewTags('');
    setModalOpen(true);
  };

  // Open modal for editing existing question
  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    setFormDeptId(q.departmentId?._id || q.departmentId || '');
    setFormProgId(q.programId?._id || q.programId || '');
    setFormSubjId(q.subjectId?._id || q.subjectId || '');
    setNewContent(q.content || q.text || '');
    setNewType(q.type || 'Multiple Choice');
    setNewDifficulty(q.difficulty || 'Medium');
    setNewPoints(q.points || 1);
    setNewOptions(Array.isArray(q.options) ? q.options.map((o) => (typeof o === 'string' ? o : o.text || '')) : ['', '', '', '']);
    setNewCorrectAnswer(typeof q.correctAnswer === 'number' ? q.correctAnswer : 0);
    setNewExplanation(q.explanation || '');
    setNewTags(Array.isArray(q.tags) ? q.tags.join(', ') : '');
    setModalOpen(true);
  };

  // Save / Update Question
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) {
      setToastMessage({ type: 'error', text: 'Question content cannot be empty.' });
      return;
    }
    if (!formSubjId && subjects.length > 0) {
      setToastMessage({ type: 'error', text: 'Please associate this question with an academic subject.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const parentSubj = subjects.find((s) => s._id === formSubjId);
      const parentProg = programs.find((p) => p._id === formProgId || p._id === parentSubj?.programId);
      const parentDept = departments.find((d) => d._id === formDeptId || d._id === parentProg?.departmentId);

      const parsedTags = newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        prompt: newContent.trim(),
        title: newContent.trim().slice(0, 80),
        stem: newContent.trim(),
        content: { text: newContent.trim() },
        text: newContent.trim(),
        type: newType,
        difficulty: newDifficulty.toUpperCase(),
        points: Number(newPoints) || 1,
        marks: Number(newPoints) || 1,
        options:
          newType === 'Multiple Choice'
            ? newOptions.map((text, idx) => ({
                id: String.fromCharCode(65 + idx),
                text: text.trim() || `Option ${String.fromCharCode(65 + idx)}`,
              }))
            : [],
        correctAnswer: newCorrectAnswer,
        explanation: newExplanation,
        tags: parsedTags,
        subjectId: formSubjId || null,
        programId: formProgId || parentSubj?.programId || null,
        departmentId: formDeptId || parentProg?.departmentId || null,
        subjectName: parentSubj ? `${parentSubj.code}: ${parentSubj.name}` : undefined,
        programName: parentProg ? parentProg.name : undefined,
        departmentName: parentDept ? parentDept.name : undefined,
      };

      if (editingQuestion) {
        await questionBankService.updateQuestion(editingQuestion._id || editingQuestion.id, payload, orgId);
        setToastMessage({ type: 'success', text: 'Question updated in repository!' });
      } else {
        await questionBankService.createQuestion(payload, orgId);
        setToastMessage({ type: 'success', text: 'Question created and mapped to curriculum!' });
      }

      setModalOpen(false);
      await fetchBankData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save question.';
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to remove this question from the bank?')) return;
    try {
      await questionBankService.deleteQuestion(id, orgId);
      setToastMessage({ type: 'info', text: 'Question removed from question bank.' });
      await fetchBankData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete question.';
      setToastMessage({ type: 'error', text: msg });
    }
  };

  // Filter cascaded programs based on selected Department
  const filteredProgramsForFilter = programs.filter((p) =>
    selectedDeptId === 'all' ? true : (p.departmentId === selectedDeptId || p.departmentId?._id === selectedDeptId)
  );

  // Filter cascaded subjects based on selected Program
  const filteredSubjectsForFilter = subjects.filter((s) => {
    if (selectedProgId !== 'all') {
      return s.programId === selectedProgId || s.programId?._id === selectedProgId;
    }
    if (selectedDeptId !== 'all') {
      const deptProgIds = filteredProgramsForFilter.map((p) => p._id);
      return deptProgIds.includes(s.programId) || deptProgIds.includes(s.programId?._id);
    }
    return true;
  });

  // Filter questions by Academic Domain hierarchy and metadata
  const filteredQuestions = questionsList.filter((q) => {
    const qContent = getQuestionPrompt(q).toLowerCase();
    const qTags = Array.isArray(q.tags) ? q.tags.join(' ').toLowerCase() : '';
    const matchesSearch = qContent.includes(search.toLowerCase()) || qTags.includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || q.type === typeFilter;
    const matchesDiff = diffFilter === 'all' || q.difficulty === diffFilter;

    // Academic Domain matching
    const matchesDept = selectedDeptId === 'all' || q.departmentId === selectedDeptId || q.departmentId?._id === selectedDeptId;
    const matchesProg = selectedProgId === 'all' || q.programId === selectedProgId || q.programId?._id === selectedProgId;
    const matchesSubj = selectedSubjId === 'all' || q.subjectId === selectedSubjId || q.subjectId?._id === selectedSubjId;

    return matchesSearch && matchesType && matchesDiff && matchesDept && matchesProg && matchesSubj;
  });

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
        title="Question Bank"
        subtitle="Central questions repository directly linked with academic curriculum, departments, and course subjects."
        icon={<Library size={22} className="text-primary-600 dark:text-primary-400 shrink-0" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Question Bank' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchBankData}
              disabled={loading}
            >
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<GraduationCap size={14} />}
              onClick={() => onNavigate('org-academic-structure')}
            >
              Academic Structure
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={handleOpenCreateModal}
            >
              New Question
            </Button>
          </div>
        }
      />

      {/* Academic Domain Coverage Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-primary-50/20 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Total Questions
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {questionsList.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/60 text-primary-600 flex items-center justify-center shrink-0">
              <Library size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-secondary-50/20 dark:bg-secondary-950/20 border-secondary-200 dark:border-secondary-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400">
                Departments Covered
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {departments.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/60 text-secondary-600 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-info-50/20 dark:bg-info-950/20 border-info-200 dark:border-info-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-info-600 dark:text-info-400">
                Degree Programs
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {programs.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-info-100 dark:bg-info-900/60 text-info-600 flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-success-50/20 dark:bg-success-950/20 border-success-200 dark:border-success-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-success-600 dark:text-success-400">
                Course Subjects
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {subjects.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/60 text-success-600 flex items-center justify-center shrink-0">
              <BookOpen size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Cascading Domain Filters & Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-accent-900 dark:text-white mb-1">
          <SlidersHorizontal size={14} className="text-primary-600 dark:text-primary-400" />
          <span>Curriculum Domain & Classification Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Department Domain Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-accent-600 dark:text-accent-400 mb-1">
              Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedProgId('all');
                setSelectedSubjId('all');
              }}
              className="w-full h-8 px-2.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Degree Program Domain Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-accent-600 dark:text-accent-400 mb-1">
              Degree Program
            </label>
            <select
              value={selectedProgId}
              onChange={(e) => {
                setSelectedProgId(e.target.value);
                setSelectedSubjId('all');
              }}
              className="w-full h-8 px-2.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Programs ({filteredProgramsForFilter.length})</option>
              {filteredProgramsForFilter.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Domain Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-accent-600 dark:text-accent-400 mb-1">
              Subject
            </label>
            <select
              value={selectedSubjId}
              onChange={(e) => setSelectedSubjId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Subjects ({filteredSubjectsForFilter.length})</option>
              {filteredSubjectsForFilter.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Question Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-accent-600 dark:text-accent-400 mb-1">
              Question Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="Multiple Choice">Multiple Choice</option>
              <option value="True / False">True / False</option>
              <option value="Short Answer">Short Answer</option>
              <option value="Coding">Coding</option>
              <option value="Essay">Essay</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-accent-600 dark:text-accent-400 mb-1">
              Difficulty
            </label>
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Search Bar & Reset */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-2.5 text-accent-400" />
            <input
              type="text"
              placeholder="Search question text or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-accent-50 dark:bg-accent-900 border border-accent-200 dark:border-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end">
            {(selectedDeptId !== 'all' || selectedProgId !== 'all' || selectedSubjId !== 'all' || typeFilter !== 'all' || diffFilter !== 'all' || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDeptId('all');
                  setSelectedProgId('all');
                  setSelectedSubjId('all');
                  setTypeFilter('all');
                  setDiffFilter('all');
                  setSearch('');
                }}
              >
                Clear Filters
              </Button>
            )}
            <span className="text-xs text-accent-500 font-medium">
              Showing <strong>{filteredQuestions.length}</strong> of {questionsList.length} questions
            </span>
          </div>
        </div>
      </Card>

      {/* Questions Grid List */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredQuestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map((q, idx) => {
            const subjObj = subjects.find((s) => s._id === q.subjectId || s._id === q.subjectId?._id);
            const progObj = programs.find((p) => p._id === q.programId || p._id === q.programId?._id || p._id === subjObj?.programId);
            const deptObj = departments.find((d) => d._id === q.departmentId || d._id === q.departmentId?._id || d._id === progObj?.departmentId);

            const subjectLabel = subjObj ? `${subjObj.code}: ${subjObj.name}` : q.subjectName || q.category || 'General';
            const programLabel = progObj ? progObj.name : q.programName || deptObj?.name || 'Academic Core';

            const opts = Array.isArray(q.options)
              ? q.options.map((o) => (typeof o === 'string' ? o : o.text || ''))
              : [];

            return (
              <Card key={q._id || q.id || idx} className="p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow min-w-0">
                <div className="space-y-3">
                  {/* Domain Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 shrink-0">
                        <BookOpen size={11} />
                        <span className="truncate max-w-[150px]">{subjectLabel}</span>
                      </span>
                      <span className="text-[10px] font-medium text-accent-500 truncate max-w-[120px]">
                        {programLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={difficultyColors[q.difficulty] || 'secondary'} className="text-[10px]">
                        {q.difficulty || 'Medium'}
                      </Badge>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300">
                        {q.points || 1} pt{q.points !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Question Content Prompt */}
                  <h4 className="text-xs sm:text-sm font-bold text-accent-900 dark:text-white leading-snug break-words">
                    {getQuestionPrompt(q) || 'Untitled Question'}
                  </h4>

                  {/* Multiple Choice Options Preview */}
                  {opts.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {opts.slice(0, 4).map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correctAnswer || (q.options && q.options[oIdx]?.isCorrect);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg text-xs flex items-center gap-2 border transition-colors ${
                              isCorrect
                                ? 'bg-success-50/60 dark:bg-success-950/40 border-success-300 dark:border-success-800 text-success-900 dark:text-success-200 font-semibold'
                                : 'bg-accent-50/50 dark:bg-accent-900/40 border-accent-100 dark:border-accent-800 text-accent-700 dark:text-accent-300'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 border border-current font-mono">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate flex-1">{opt}</span>
                            {isCorrect && <CheckCircle2 size={13} className="text-success-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tags */}
                  {Array.isArray(q.tags) && q.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {q.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] text-accent-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-accent-100 dark:border-accent-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-accent-400 font-medium">
                    Type: {q.type || 'Multiple Choice'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pencil size={13} />}
                      onClick={() => handleOpenEditModal(q)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-600 dark:text-danger-400"
                      icon={<Trash2 size={13} />}
                      onClick={() => handleDeleteQuestion(q._id || q.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 mx-auto flex items-center justify-center mb-3">
            <Library size={24} />
          </div>
          <h4 className="text-sm font-bold text-accent-900 dark:text-white">No Questions in This Academic Domain</h4>
          <p className="text-xs text-accent-500 max-w-sm mx-auto mt-1 mb-4">
            {subjects.length === 0
              ? 'Please configure your academic structure (departments and subjects) first to map your questions.'
              : 'Add questions mapped to your subjects and degree programs to start building exams easily.'}
          </p>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleOpenCreateModal}>
            Add First Question
          </Button>
        </Card>
      )}

      {/* Add / Edit Question Modal with Academic Structure Hierarchy */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'Add Question to Question Bank'}
        subtitle="Map question to curriculum subjects and configure options and difficulty."
        size="lg"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
          {/* Academic Structure Domain Selectors */}
          <div className="p-3.5 bg-accent-50/70 dark:bg-accent-950/50 rounded-xl border border-accent-200 dark:border-accent-800 space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-accent-900 dark:text-white text-xs">
              <GraduationCap size={15} className="text-primary-600 dark:text-primary-400" />
              <span>Academic Curriculum Domain (Department → Program → Subject)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Department */}
              <div>
                <label className="block text-[11px] font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Department *
                </label>
                <select
                  required
                  value={formDeptId}
                  onChange={(e) => handleModalDeptChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree Program */}
              <div>
                <label className="block text-[11px] font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Degree Program *
                </label>
                <select
                  required
                  value={formProgId}
                  onChange={(e) => handleModalProgChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
                >
                  <option value="" disabled>Select Program</option>
                  {programs
                    .filter((p) => !formDeptId || p.departmentId === formDeptId || p.departmentId?._id === formDeptId)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Subject *
                </label>
                <select
                  required
                  value={formSubjId}
                  onChange={(e) => setFormSubjId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects
                    .filter((s) => !formProgId || s.programId === formProgId || s.programId?._id === formProgId)
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Question Type & Difficulty & Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Question Type *
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
              >
                <option value="Multiple Choice">Multiple Choice</option>
                <option value="True / False">True / False</option>
                <option value="Short Answer">Short Answer</option>
                <option value="Coding">Coding</option>
                <option value="Essay">Essay</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Difficulty *
              </label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Marks / Points *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newPoints}
                onChange={(e) => setNewPoints(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Question Content / Prompt *
            </label>
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Which data structure operates on a First-In, First-Out (FIFO) basis?"
              className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Multiple Choice Options */}
          {newType === 'Multiple Choice' && (
            <div className="space-y-2 pt-1">
              <label className="block font-semibold text-accent-700 dark:text-accent-300">
                Answer Options & Correct Choice
              </label>
              {newOptions.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctAnswerOption"
                    checked={newCorrectAnswer === oIdx}
                    onChange={() => setNewCorrectAnswer(oIdx)}
                    className="w-4 h-4 text-primary-600 cursor-pointer"
                    title="Mark as correct answer"
                  />
                  <span className="font-mono font-bold text-xs w-4">{String.fromCharCode(65 + oIdx)}</span>
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newOptions];
                      updated[oIdx] = e.target.value;
                      setNewOptions(updated);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Keywords & Tags (comma separated)
            </label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="e.g. queue, fifo, linear-data-structures, midterms"
              className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-accent-100 dark:border-accent-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
              {editingQuestion ? 'Update Question' : 'Save to Question Bank'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default QuestionBank;
