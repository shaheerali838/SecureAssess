import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Building2, BookOpen, Layers, Plus, Search, Filter,
  MoreVertical, Edit2, Trash2, CheckCircle2, XCircle, ChevronRight,
  RefreshCw, Award, Users, BookMarked, Calendar, AlertCircle, Info,
  FolderPlus, FileCode
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, Input, Select, PageHeader, Modal, Toast
} from '@/components/ui';
import departmentService from '@/services/department.service';
import programService from '@/services/program.service';
import subjectService from '@/services/subject.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

export function OrgStructure({ onNavigate }) {
  const { currentOrganization, t } = useOrganization();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Dynamic Terminology
  const deptSingular = t ? t('department') : 'Department';
  const deptPlural = t ? t('department', true) : 'Departments';
  const progSingular = t ? t('program') : 'Degree Program';
  const progPlural = t ? t('program', true) : 'Degree Programs';
  const subjSingular = t ? t('subject') : 'Subject';
  const subjPlural = t ? t('subject', true) : 'Subjects';
  const structureTitle = t ? t('structure') : 'Academic Structure';
  const levelLabel = t ? t('level') : 'Level';
  const creditsLabel = t ? t('credits') : 'Credits';

  // Entities state
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Modal States
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', status: 'ACTIVE' });

  const [progModalOpen, setProgModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState(null);
  const [progForm, setProgForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    level: 'UNDERGRADUATE',
    duration: '4 Years',
    description: '',
    status: 'ACTIVE',
  });

  const [subjModalOpen, setSubjModalOpen] = useState(false);
  const [editingSubj, setEditingSubj] = useState(null);
  const [subjForm, setSubjForm] = useState({
    name: '',
    code: '',
    programId: '',
    credits: 3,
    description: '',
    status: 'ACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);

  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || null;

  // Extract array helper
  const extractItems = (res) => {
    if (!res) return [];
    const val = res.status === 'fulfilled' ? res.value : res;
    if (Array.isArray(val)) return val;
    if (Array.isArray(val?.items)) return val.items;
    if (Array.isArray(val?.data?.items)) return val.data.items;
    if (Array.isArray(val?.departments)) return val.departments;
    if (Array.isArray(val?.programs)) return val.programs;
    if (Array.isArray(val?.subjects)) return val.subjects;
    if (Array.isArray(val?.data)) return val.data;
    return [];
  };

  // Fetch Structure Data from Database
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, subjRes] = await Promise.allSettled([
        departmentService.getDepartments({}, orgId),
        programService.getPrograms({}, orgId),
        subjectService.getSubjects({}, orgId),
      ]);

      const loadedDepts = extractItems(deptRes);
      const loadedProgs = extractItems(progRes);
      const loadedSubjs = extractItems(subjRes);

      setDepartments(loadedDepts);
      setPrograms(loadedProgs);
      setSubjects(loadedSubjs);
    } catch (err) {
      console.warn('Structure load note:', err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Department Modal
  const openNewDepartmentModal = () => {
    setEditingDept(null);
    setDeptForm({ name: '', code: '', description: '', status: 'ACTIVE' });
    setDeptModalOpen(true);
  };

  // Open Program Modal
  const openNewProgramModal = () => {
    setEditingProg(null);
    setProgForm({
      name: '',
      code: '',
      departmentId: departments[0]?._id || '',
      level: 'UNDERGRADUATE',
      duration: '4 Years',
      description: '',
      status: 'ACTIVE',
    });
    setProgModalOpen(true);
  };

  // Open Subject Modal
  const openNewSubjectModal = () => {
    setEditingSubj(null);
    setSubjForm({
      name: '',
      code: '',
      programId: programs[0]?._id || '',
      credits: 3,
      description: '',
      status: 'ACTIVE',
    });
    setSubjModalOpen(true);
  };

  // Department CRUD
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      setToast({ type: 'error', text: 'Department name and code are required.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept._id, deptForm, orgId);
        setToast({ type: 'success', text: `${deptSingular} "${deptForm.name}" updated successfully.` });
      } else {
        await departmentService.createDepartment(deptForm, orgId);
        setToast({ type: 'success', text: `${deptSingular} "${deptForm.name}" created successfully.` });
      }
      setDeptModalOpen(false);
      setEditingDept(null);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save department.';
      setToast({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${deptSingular.toLowerCase()} "${name}"?`)) return;
    try {
      await departmentService.deleteDepartment(id, orgId);
      setToast({ type: 'info', text: `${deptSingular} "${name}" deleted.` });
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete department.';
      setToast({ type: 'error', text: msg });
    }
  };

  // Program CRUD
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!progForm.name.trim() || !progForm.code.trim()) {
      setToast({ type: 'error', text: 'Program title and code are required.' });
      return;
    }
    if (!progForm.departmentId) {
      setToast({ type: 'error', text: 'Please select a parent department for this program.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingProg) {
        await programService.updateProgram(editingProg._id, progForm, orgId);
        setToast({ type: 'success', text: `${progSingular} "${progForm.name}" updated successfully.` });
      } else {
        await programService.createProgram(progForm, orgId);
        setToast({ type: 'success', text: `${progSingular} "${progForm.name}" created successfully.` });
      }
      setProgModalOpen(false);
      setEditingProg(null);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save program.';
      setToast({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (id, name) => {
    if (!window.confirm(`Delete ${progSingular.toLowerCase()} "${name}"?`)) return;
    try {
      await programService.deleteProgram(id, orgId);
      setToast({ type: 'info', text: `${progSingular} "${name}" deleted.` });
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete program.';
      setToast({ type: 'error', text: msg });
    }
  };

  // Subject CRUD
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjForm.name.trim() || !subjForm.code.trim()) {
      setToast({ type: 'error', text: 'Subject name and code are required.' });
      return;
    }
    if (!subjForm.programId) {
      setToast({ type: 'error', text: 'Please select an associated degree program for this subject.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingSubj) {
        await subjectService.updateSubject(editingSubj._id, subjForm, orgId);
        setToast({ type: 'success', text: `${subjSingular} "${subjForm.name}" updated successfully.` });
      } else {
        await subjectService.createSubject(subjForm, orgId);
        setToast({ type: 'success', text: `${subjSingular} "${subjForm.name}" created successfully.` });
      }
      setSubjModalOpen(false);
      setEditingSubj(null);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save subject.';
      setToast({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Delete ${subjSingular.toLowerCase()} "${name}"?`)) return;
    try {
      await subjectService.deleteSubject(id, orgId);
      setToast({ type: 'info', text: `${subjSingular} "${name}" deleted.` });
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete subject.';
      setToast({ type: 'error', text: msg });
    }
  };

  // Filtered lists
  const filteredDepartments = departments.filter(
    (d) =>
      (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrograms = programs.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <PageHeader
        title={`${structureTitle} & Curriculum`}
        subtitle={`Manage ${deptPlural.toLowerCase()}, ${progPlural.toLowerCase()}, and ${subjPlural.toLowerCase()} synced with your organization database.`}
        icon={<GraduationCap size={22} className="text-primary-600 dark:text-primary-400 shrink-0" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: structureTitle },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={loadData}
              disabled={loading}
            >
              Sync
            </Button>
            {activeTab === 'departments' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={openNewDepartmentModal}
              >
                New {deptSingular}
              </Button>
            )}
            {activeTab === 'programs' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={openNewProgramModal}
              >
                New {progSingular}
              </Button>
            )}
            {activeTab === 'subjects' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={openNewSubjectModal}
              >
                New {subjSingular}
              </Button>
            )}
          </div>
        }
      />

      {/* Summary KPI Counters - Fully Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card
          onClick={() => setActiveTab('departments')}
          className={`p-4 sm:p-5 transition-all cursor-pointer border-2 min-w-0 ${
            activeTab === 'departments'
              ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/20'
              : 'border-accent-200 dark:border-accent-800 hover:border-primary-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 truncate">
                {deptPlural}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {departments.length}
              </h3>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary-100 dark:bg-primary-900/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800 shadow-soft">
              <Building2 size={20} />
            </div>
          </div>
        </Card>

        <Card
          onClick={() => setActiveTab('programs')}
          className={`p-4 sm:p-5 transition-all cursor-pointer border-2 min-w-0 ${
            activeTab === 'programs'
              ? 'border-secondary-500 bg-secondary-50/20 dark:bg-secondary-950/20'
              : 'border-accent-200 dark:border-accent-800 hover:border-secondary-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400 truncate">
                {progPlural}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {programs.length}
              </h3>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary-100 dark:bg-secondary-900/60 text-secondary-600 dark:text-secondary-400 flex items-center justify-center shrink-0 border border-secondary-200 dark:border-secondary-800 shadow-soft">
              <Award size={20} />
            </div>
          </div>
        </Card>

        <Card
          onClick={() => setActiveTab('subjects')}
          className={`p-4 sm:p-5 transition-all cursor-pointer border-2 min-w-0 ${
            activeTab === 'subjects'
              ? 'border-success-500 bg-success-50/20 dark:bg-success-950/20'
              : 'border-accent-200 dark:border-accent-800 hover:border-success-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-success-600 dark:text-success-400 truncate">
                {subjPlural}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {subjects.length}
              </h3>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-success-100 dark:bg-success-900/60 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0 border border-success-200 dark:border-success-800 shadow-soft">
              <BookOpen size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-accent-200 dark:border-accent-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-accent-100 dark:bg-accent-900 rounded-xl overflow-x-auto">
          {[
            { id: 'departments', label: deptPlural, icon: <Building2 size={14} />, count: departments.length },
            { id: 'programs', label: progPlural, icon: <Award size={14} />, count: programs.length },
            { id: 'subjects', label: subjPlural, icon: <BookOpen size={14} />, count: subjects.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent-200 dark:bg-accent-700 text-accent-700 dark:text-accent-300 font-normal">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-accent-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-accent-50 dark:bg-accent-900 border border-accent-200 dark:border-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Departments */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-accent-900 dark:text-white">
              All {deptPlural} ({filteredDepartments.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={openNewDepartmentModal}
            >
              Add {deptSingular}
            </Button>
          </div>

          {filteredDepartments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {filteredDepartments.map((dept) => {
                const deptPrograms = programs.filter(
                  (p) => p.departmentId === dept._id || p.departmentId?._id === dept._id
                );
                return (
                  <Card key={dept._id} className="hover:shadow-md transition-shadow min-w-0 flex flex-col justify-between">
                    <CardBody className="p-4 sm:p-5 space-y-3.5 flex flex-col justify-between h-full">
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Responsive Logo Avatar */}
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800 shadow-soft">
                              <Building2 size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-700 shrink-0">
                                  {dept.code}
                                </span>
                                <Badge variant={dept.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px] shrink-0">
                                  {dept.status || 'ACTIVE'}
                                </Badge>
                              </div>
                              <h4 className="font-bold text-sm text-accent-900 dark:text-white mt-1 break-words">
                                {dept.name}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingDept(dept);
                                setDeptForm({
                                  name: dept.name,
                                  code: dept.code,
                                  description: dept.description || '',
                                  status: dept.status || 'ACTIVE',
                                });
                                setDeptModalOpen(true);
                              }}
                              className="p-1.5 text-accent-400 hover:text-accent-600 dark:hover:text-accent-200 cursor-pointer rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(dept._id, dept.name)}
                              className="p-1.5 text-accent-400 hover:text-danger-600 dark:hover:text-danger-400 cursor-pointer rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/60"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {dept.description && (
                          <p className="text-xs text-accent-500 dark:text-accent-400 line-clamp-2 leading-relaxed">
                            {dept.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-accent-100 dark:border-accent-800/80 flex items-center justify-between text-xs text-accent-500">
                        <span className="font-medium">{deptPrograms.length} {deptPrograms.length === 1 ? progSingular : progPlural}</span>
                        <button
                          onClick={() => {
                            setEditingProg(null);
                            setProgForm({
                              name: '',
                              code: '',
                              departmentId: dept._id,
                              level: 'UNDERGRADUATE',
                              duration: '4 Years',
                              description: '',
                              status: 'ACTIVE',
                            });
                            setProgModalOpen(true);
                          }}
                          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
                        >
                          + Add {progSingular}
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 mx-auto flex items-center justify-center mb-3">
                <Building2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-accent-900 dark:text-white">No {deptPlural} Registered</h4>
              <p className="text-xs text-accent-500 max-w-sm mx-auto mt-1 mb-4">
                Get started by creating your first academic or organizational department.
              </p>
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openNewDepartmentModal}>
                Create First {deptSingular}
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Degree Programs */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-accent-900 dark:text-white">
              All {progPlural} ({filteredPrograms.length})
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={openNewProgramModal}
            >
              Add {progSingular}
            </Button>
          </div>

          {filteredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {filteredPrograms.map((prog) => {
                const parentDept = departments.find(
                  (d) => d._id === prog.departmentId || d._id === prog.departmentId?._id
                );
                const progSubjects = subjects.filter(
                  (s) => s.programId === prog._id || s.programId?._id === prog._id
                );

                return (
                  <Card key={prog._id} className="hover:shadow-md transition-shadow min-w-0 flex flex-col justify-between">
                    <CardBody className="p-4 sm:p-5 space-y-3.5 flex flex-col justify-between h-full">
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Responsive Logo Avatar */}
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary-100 dark:bg-secondary-950 text-secondary-600 dark:text-secondary-400 flex items-center justify-center shrink-0 border border-secondary-200 dark:border-secondary-800 shadow-soft">
                              <Award size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-700 shrink-0">
                                  {prog.code}
                                </span>
                                <Badge variant={prog.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px] shrink-0">
                                  {prog.status || 'ACTIVE'}
                                </Badge>
                              </div>
                              <h4 className="font-bold text-sm text-accent-900 dark:text-white mt-1 break-words">
                                {prog.name}
                              </h4>
                              <p className="text-[11px] text-accent-500 dark:text-accent-400 mt-0.5 truncate font-medium">
                                {parentDept ? parentDept.name : 'Global / Unassigned'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingProg(prog);
                                setProgForm({
                                  name: prog.name,
                                  code: prog.code,
                                  departmentId: prog.departmentId?._id || prog.departmentId || '',
                                  level: prog.level || 'UNDERGRADUATE',
                                  duration: prog.duration || '4 Years',
                                  description: prog.description || '',
                                  status: prog.status || 'ACTIVE',
                                });
                                setProgModalOpen(true);
                              }}
                              className="p-1.5 text-accent-400 hover:text-accent-600 dark:hover:text-accent-200 cursor-pointer rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteProgram(prog._id, prog.name)}
                              className="p-1.5 text-accent-400 hover:text-danger-600 dark:hover:text-danger-400 cursor-pointer rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/60"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {prog.description && (
                          <p className="text-xs text-accent-500 dark:text-accent-400 line-clamp-2 leading-relaxed">
                            {prog.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 font-medium">
                            {prog.level || 'UNDERGRADUATE'}
                          </span>
                          {prog.duration && (
                            <span className="px-2 py-0.5 rounded-md bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-400">
                              {prog.duration}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-accent-100 dark:border-accent-800/80 flex items-center justify-between text-xs text-accent-500">
                        <span className="font-medium">{progSubjects.length} {subjPlural}</span>
                        <button
                          onClick={() => {
                            setEditingSubj(null);
                            setSubjForm({
                              name: '',
                              code: '',
                              programId: prog._id,
                              credits: 3,
                              description: '',
                              status: 'ACTIVE',
                            });
                            setSubjModalOpen(true);
                          }}
                          className="text-secondary-600 dark:text-secondary-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
                        >
                          + Add {subjSingular}
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 mx-auto flex items-center justify-center mb-3">
                <Award size={24} />
              </div>
              <h4 className="text-sm font-bold text-accent-900 dark:text-white">No {progPlural} Created</h4>
              <p className="text-xs text-accent-500 max-w-sm mx-auto mt-1 mb-4">
                {departments.length === 0
                  ? `Create a ${deptSingular.toLowerCase()} first before adding degree programs.`
                  : `Add degree programs and curricula under your departments.`}
              </p>
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openNewProgramModal}>
                Create First {progSingular}
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Tab 3: Subjects */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-accent-900 dark:text-white">
              All {subjPlural} ({filteredSubjects.length})
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={openNewSubjectModal}
            >
              Add {subjSingular}
            </Button>
          </div>

          {filteredSubjects.length > 0 ? (
            <>
              {/* Desktop/Tablet Table */}
              <Card className="hidden sm:block overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-accent-50/80 dark:bg-accent-800/60 text-accent-600 dark:text-accent-400 font-semibold border-b border-accent-200 dark:border-accent-800">
                      <tr>
                        <th className="py-3 px-4">{subjSingular} Name & Code</th>
                        <th className="py-3 px-4">Associated {progSingular}</th>
                        <th className="py-3 px-4">{creditsLabel}</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                      {filteredSubjects.map((subj) => {
                        const parentProg = programs.find(
                          (p) => p._id === subj.programId || p._id === subj.programId?._id
                        );

                        return (
                          <tr key={subj._id} className="hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0 border border-success-200 dark:border-success-800 shadow-soft">
                                  <BookOpen size={16} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 shrink-0 border border-accent-200 dark:border-accent-700">
                                      {subj.code}
                                    </span>
                                    <p className="font-bold text-accent-900 dark:text-white truncate">{subj.name}</p>
                                  </div>
                                  {subj.description && (
                                    <p className="text-[10px] text-accent-400 truncate max-w-xs mt-0.5">{subj.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-accent-700 dark:text-accent-300 font-medium truncate max-w-xs">
                              {parentProg ? parentProg.name : 'Global / Unassigned'}
                            </td>
                            <td className="py-3 px-4 font-semibold text-accent-900 dark:text-white">
                              {subj.credits || 3}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={subj.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                                {subj.status || 'ACTIVE'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingSubj(subj);
                                    setSubjForm({
                                      name: subj.name,
                                      code: subj.code,
                                      programId: subj.programId?._id || subj.programId || '',
                                      credits: subj.credits || 3,
                                      description: subj.description || '',
                                      status: subj.status || 'ACTIVE',
                                    });
                                    setSubjModalOpen(true);
                                  }}
                                  className="p-1.5 text-accent-400 hover:text-accent-600 dark:hover:text-accent-200 cursor-pointer rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800"
                                  title="Edit"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubject(subj._id, subj.name)}
                                  className="p-1.5 text-accent-400 hover:text-danger-600 dark:hover:text-danger-400 cursor-pointer rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/60"
                                  title="Delete"
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
              </Card>

              {/* Mobile Subject Cards */}
              <div className="sm:hidden space-y-3">
                {filteredSubjects.map((subj) => {
                  const parentProg = programs.find(
                    (p) => p._id === subj.programId || p._id === subj.programId?._id
                  );
                  return (
                    <Card key={subj._id} className="p-4 space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0 border border-success-200 dark:border-success-800 shadow-soft">
                            <BookOpen size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-700 shrink-0">
                                {subj.code}
                              </span>
                              <Badge variant={subj.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px] shrink-0">
                                {subj.status || 'ACTIVE'}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-sm text-accent-900 dark:text-white mt-1 break-words">{subj.name}</h4>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-accent-500 dark:text-accent-400">
                        {parentProg ? parentProg.name : 'Global / Unassigned'} · <strong>{subj.credits || 3} Credits</strong>
                      </p>

                      <div className="pt-2 border-t border-accent-100 dark:border-accent-800/80 flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 size={13} />}
                          onClick={() => {
                            setEditingSubj(subj);
                            setSubjForm({
                              name: subj.name,
                              code: subj.code,
                              programId: subj.programId?._id || subj.programId || '',
                              credits: subj.credits || 3,
                              description: subj.description || '',
                              status: subj.status || 'ACTIVE',
                            });
                            setSubjModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger-600 dark:text-danger-400"
                          icon={<Trash2 size={13} />}
                          onClick={() => handleDeleteSubject(subj._id, subj.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-success-50 dark:bg-success-950/60 text-success-600 mx-auto flex items-center justify-center mb-3">
                <BookOpen size={24} />
              </div>
              <h4 className="text-sm font-bold text-accent-900 dark:text-white">No {subjPlural} Registered</h4>
              <p className="text-xs text-accent-500 max-w-sm mx-auto mt-1 mb-4">
                {programs.length === 0
                  ? `Create a degree program first before adding subjects.`
                  : `Add syllabus courses and course modules under your degree programs.`}
              </p>
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openNewSubjectModal}>
                Create First {subjSingular}
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Department Create/Edit Modal */}
      <Modal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? `Edit ${deptSingular}` : `Register New ${deptSingular}`}
        subtitle="Specify academic department details and unique code identifier."
      >
        <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
              {deptSingular} Name *
            </label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Computer Science & AI, Mechanical Engineering"
              className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Code / Identifier *
            </label>
            <input
              type="text"
              required
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CS, MECH, AERO, DIV-01"
              className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              placeholder={`Scope and curriculum managed by this ${deptSingular.toLowerCase()}...`}
              className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Status
            </label>
            <select
              value={deptForm.status}
              onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-accent-100 dark:border-accent-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              {editingDept ? 'Update Department' : 'Save Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Program Create/Edit Modal */}
      <Modal
        open={progModalOpen}
        onClose={() => setProgModalOpen(false)}
        title={editingProg ? `Edit ${progSingular}` : `Create New ${progSingular}`}
        subtitle="Define degree program, academic level, and parent department association."
      >
        {departments.length === 0 ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
              <AlertCircle size={16} />
              <span>No Department Found</span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Degree programs require a parent department. Please create at least one department first.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setProgModalOpen(false);
                openNewDepartmentModal();
              }}
            >
              + Create Department First
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSaveProgram} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                {progSingular} Title *
              </label>
              <input
                type="text"
                required
                value={progForm.name}
                onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                placeholder="e.g. B.S. Computer Science, M.S. Artificial Intelligence"
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={progForm.code}
                  onChange={(e) => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. BS-CS, MS-AI"
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Parent {deptSingular} *
                </label>
                <select
                  required
                  value={progForm.departmentId}
                  onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  {levelLabel}
                </label>
                <select
                  value={progForm.level}
                  onChange={(e) => setProgForm({ ...progForm, level: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="UNDERGRADUATE">Undergraduate / Entry</option>
                  <option value="GRADUATE">Graduate / Intermediate</option>
                  <option value="POSTGRADUATE">Postgraduate / Advanced</option>
                  <option value="DIPLOMA">Diploma</option>
                  <option value="CERTIFICATION">Professional Certification</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={progForm.duration}
                  onChange={(e) => setProgForm({ ...progForm, duration: e.target.value })}
                  placeholder="e.g. 4 Years, 2 Years, 6 Months"
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={progForm.description}
                onChange={(e) => setProgForm({ ...progForm, description: e.target.value })}
                placeholder="Curriculum summary and program objectives..."
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-accent-100 dark:border-accent-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setProgModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                {editingProg ? 'Update Program' : 'Save Program'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Subject Create/Edit Modal */}
      <Modal
        open={subjModalOpen}
        onClose={() => setSubjModalOpen(false)}
        title={editingSubj ? `Edit ${subjSingular}` : `Create New ${subjSingular}`}
        subtitle="Add a subject course unit associated with a degree program."
      >
        {programs.length === 0 ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
              <AlertCircle size={16} />
              <span>No Degree Program Found</span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Subjects must be linked to a degree program. Please create at least one degree program first.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setSubjModalOpen(false);
                openNewProgramModal();
              }}
            >
              + Create Degree Program First
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                {subjSingular} Name *
              </label>
              <input
                type="text"
                required
                value={subjForm.name}
                onChange={(e) => setSubjForm({ ...subjForm, name: e.target.value })}
                placeholder="e.g. Data Structures & Algorithms, Network Security"
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={subjForm.code}
                  onChange={(e) => setSubjForm({ ...subjForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CS-201, SEC-402"
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  {creditsLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={subjForm.credits}
                  onChange={(e) => setSubjForm({ ...subjForm, credits: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Associated {progSingular} *
              </label>
              <select
                required
                value={subjForm.programId}
                onChange={(e) => setSubjForm({ ...subjForm, programId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="" disabled>Select Degree Program</option>
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={subjForm.description}
                onChange={(e) => setSubjForm({ ...subjForm, description: e.target.value })}
                placeholder="Course outline and syllabus summary..."
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-accent-100 dark:border-accent-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setSubjModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                {editingSubj ? 'Update Subject' : 'Save Subject'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default OrgStructure;
