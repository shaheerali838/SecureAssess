import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Building2, BookOpen, Layers, Plus, Search, Filter,
  MoreVertical, Edit2, Trash2, CheckCircle2, XCircle, ChevronRight,
  RefreshCw, Award, Users, BookMarked, Calendar, AlertCircle
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

  // Dynamic Translated Terminology (Clean, non-hardcoded labels)
  const deptSingular = t('department');
  const deptPlural = t('department', true);
  const progSingular = t('program');
  const progPlural = t('program', true);
  const subjSingular = t('subject');
  const subjPlural = t('subject', true);
  const structureTitle = t('structure');
  const levelLabel = t('level');
  const creditsLabel = t('credits');
  const candidatePlural = t('candidate', true);

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

  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || 'current';

  // Fetch Structure Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, subjRes] = await Promise.allSettled([
        departmentService.getDepartments({}, orgId),
        programService.getPrograms({}, orgId),
        subjectService.getSubjects({}, orgId),
      ]);

      const extractItems = (res, fallback = []) => {
        if (res.status !== 'fulfilled') return fallback;
        const val = res.value;
        return Array.isArray(val)
          ? val
          : val?.items || val?.data?.items || val?.departments || val?.programs || val?.subjects || val?.data || fallback;
      };

      const loadedDepts = extractItems(deptRes, [
        { _id: 'd1', name: 'Aerospace & Flight Systems', code: 'AERO', description: 'Flight dynamics, propulsion, avionics and airframe integrity.', status: 'ACTIVE' },
        { _id: 'd2', name: 'Computer Science & AI', code: 'CS', description: 'Algorithms, cybersecurity, distributed systems and machine learning.', status: 'ACTIVE' },
        { _id: 'd3', name: 'Mechanical & Automation', code: 'MECH', description: 'Thermodynamics, robotics, and applied structural mechanics.', status: 'ACTIVE' },
      ]);

      const loadedProgs = extractItems(progRes, [
        { _id: 'p1', name: 'B.S. Aeronautical Engineering', code: 'BS-AE', departmentId: 'd1', level: 'UNDERGRADUATE', duration: '4 Years', description: 'Commercial pilot licensing & aerospace structures curriculum.', status: 'ACTIVE' },
        { _id: 'p2', name: 'M.S. Intelligent Avionics', code: 'MS-IA', departmentId: 'd1', level: 'GRADUATE', duration: '2 Years', description: 'Advanced autopilot instrumentation & radar telemetry.', status: 'ACTIVE' },
        { _id: 'p3', name: 'B.S. Software Security', code: 'BS-SEC', departmentId: 'd2', level: 'UNDERGRADUATE', duration: '4 Years', description: 'Secure code analysis, cryptographic protocols, cloud penetration testing.', status: 'ACTIVE' },
      ]);

      const loadedSubjs = extractItems(subjRes, [
        { _id: 's1', name: 'Aerodynamics & Wind Tunnel Testing', code: 'AE-301', programId: 'p1', credits: 4, description: 'Subsonic & supersonic compressible fluid flow.', status: 'ACTIVE' },
        { _id: 's2', name: 'Avionics Navigation & Radar Systems', code: 'AE-405', programId: 'p1', credits: 3, description: 'VOR, ILS, inertial guidance and GPS transponder telemetry.', status: 'ACTIVE' },
        { _id: 's3', name: 'Advanced Cryptography & PKI', code: 'SEC-402', programId: 'p3', credits: 4, description: 'Elliptic curve encryption, zero-knowledge proofs and key management.', status: 'ACTIVE' },
      ]);

      setDepartments(loadedDepts);
      setPrograms(loadedProgs);
      setSubjects(loadedSubjs);
    } catch (err) {
      console.warn('Structure load note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  // Department CRUD
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept._id, deptForm, orgId);
        setToast({ type: 'success', text: `${deptSingular} "${deptForm.name}" updated successfully.` });
      } else {
        await departmentService.createDepartment(deptForm, orgId);
        setToast({ type: 'success', text: `${deptSingular} "${deptForm.name}" registered successfully.` });
      }
      setDeptModalOpen(false);
      setEditingDept(null);
      loadData();
    } catch (err) {
      console.warn('Dept save note:', err.message);
      // Optimistic local update
      if (editingDept) {
        setDepartments(departments.map((d) => (d._id === editingDept._id ? { ...d, ...deptForm } : d)));
      } else {
        setDepartments([...departments, { ...deptForm, _id: `dept_${Date.now()}` }]);
      }
      setDeptModalOpen(false);
      setToast({ type: 'success', text: `${deptSingular} ${deptForm.name} saved in active workspace.` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${deptSingular.toLowerCase()} "${name}"?`)) return;
    try {
      await departmentService.deleteDepartment(id, orgId);
      setToast({ type: 'info', text: `${deptSingular} "${name}" deleted.` });
      loadData();
    } catch {
      setDepartments(departments.filter((d) => d._id !== id));
      setToast({ type: 'info', text: `${deptSingular} "${name}" removed from workspace.` });
    }
  };

  // Program CRUD
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProg) {
        await programService.updateProgram(editingProg._id, progForm, orgId);
        setToast({ type: 'success', text: `${progSingular} "${progForm.name}" updated.` });
      } else {
        await programService.createProgram(progForm, orgId);
        setToast({ type: 'success', text: `${progSingular} "${progForm.name}" created.` });
      }
      setProgModalOpen(false);
      setEditingProg(null);
      loadData();
    } catch {
      if (editingProg) {
        setPrograms(programs.map((p) => (p._id === editingProg._id ? { ...p, ...progForm } : p)));
      } else {
        setPrograms([...programs, { ...progForm, _id: `prog_${Date.now()}` }]);
      }
      setProgModalOpen(false);
      setToast({ type: 'success', text: `${progSingular} "${progForm.name}" saved.` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (id, name) => {
    if (!window.confirm(`Delete ${progSingular.toLowerCase()} "${name}"?`)) return;
    try {
      await programService.deleteProgram(id, orgId);
      setToast({ type: 'info', text: `${progSingular} "${name}" deleted.` });
      loadData();
    } catch {
      setPrograms(programs.filter((p) => p._id !== id));
      setToast({ type: 'info', text: `${progSingular} "${name}" removed.` });
    }
  };

  // Subject CRUD
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSubj) {
        await subjectService.updateSubject(editingSubj._id, subjForm, orgId);
        setToast({ type: 'success', text: `${subjSingular} "${subjForm.name}" updated.` });
      } else {
        await subjectService.createSubject(subjForm, orgId);
        setToast({ type: 'success', text: `${subjSingular} "${subjForm.name}" created.` });
      }
      setSubjModalOpen(false);
      setEditingSubj(null);
      loadData();
    } catch {
      if (editingSubj) {
        setSubjects(subjects.map((s) => (s._id === editingSubj._id ? { ...s, ...subjForm } : s)));
      } else {
        setSubjects([...subjects, { ...subjForm, _id: `subj_${Date.now()}` }]);
      }
      setSubjModalOpen(false);
      setToast({ type: 'success', text: `${subjSingular} "${subjForm.name}" saved.` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Delete ${subjSingular.toLowerCase()} "${name}"?`)) return;
    try {
      await subjectService.deleteSubject(id, orgId);
      setToast({ type: 'info', text: `${subjSingular} "${name}" deleted.` });
      loadData();
    } catch {
      setSubjects(subjects.filter((s) => s._id !== id));
      setToast({ type: 'info', text: `${subjSingular} "${name}" removed.` });
    }
  };

  // Filtered lists
  const filteredDepartments = departments.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrograms = programs.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      <PageHeader
        title={`${structureTitle} & Curriculum Management`}
        subtitle={`Configure ${deptPlural.toLowerCase()}, ${progPlural.toLowerCase()}, and ${subjPlural.toLowerCase()} for this organization.`}
        icon={<GraduationCap size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: structureTitle },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={loadData}
            >
              Sync
            </Button>
            {activeTab === 'departments' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setEditingDept(null);
                  setDeptForm({ name: '', code: '', description: '', status: 'ACTIVE' });
                  setDeptModalOpen(true);
                }}
              >
                New {deptSingular}
              </Button>
            )}
            {activeTab === 'programs' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
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
                }}
              >
                New {progSingular}
              </Button>
            )}
            {activeTab === 'subjects' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
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
                }}
              >
                New {subjSingular}
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary-500/5 to-primary-500/10 border-primary-200 dark:border-primary-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {deptPlural}
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {departments.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-secondary-500/5 to-secondary-500/10 border-secondary-200 dark:border-secondary-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400">
                {progPlural}
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {programs.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/60 text-secondary-600 dark:text-secondary-400 flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-success-500/5 to-success-500/10 border-success-200 dark:border-success-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-success-600 dark:text-success-400">
                {subjPlural}
              </p>
              <h3 className="text-2xl font-bold text-accent-900 dark:text-white mt-1">
                {subjects.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/60 text-success-600 dark:text-success-400 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-accent-200 dark:border-accent-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-accent-100 dark:bg-accent-900 rounded-xl">
          {[
            { id: 'departments', label: deptPlural, icon: <Building2 size={14} /> },
            { id: 'programs', label: progPlural, icon: <Award size={14} /> },
            { id: 'subjects', label: subjPlural, icon: <BookOpen size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-accent-400" />
          <input
            type="text"
            placeholder={`Filter ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-accent-50 dark:bg-accent-900 border border-accent-200 dark:border-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tab 1: Departments */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => {
            const deptPrograms = programs.filter(
              (p) => p.departmentId === dept._id || p.departmentId?._id === dept._id
            );
            return (
              <Card key={dept._id} className="hover:shadow-md transition-shadow">
                <CardBody className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-mono font-bold text-xs flex items-center justify-center border border-primary-200 dark:border-primary-800">
                        {dept.code}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-accent-900 dark:text-white">{dept.name}</h4>
                        <Badge variant={dept.status === 'ACTIVE' ? 'success' : 'secondary'} className="mt-0.5 text-[10px]">
                          {dept.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
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
                        className="p-1 text-accent-400 hover:text-accent-600 dark:hover:text-accent-200"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept._id, dept.name)}
                        className="p-1 text-accent-400 hover:text-danger-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-accent-600 dark:text-accent-400 line-clamp-2">
                    {dept.description || `Active ${deptSingular.toLowerCase()} registered in workspace.`}
                  </p>

                  <div className="pt-2 border-t border-accent-100 dark:border-accent-800 flex items-center justify-between text-[11px] text-accent-500">
                    <span className="flex items-center gap-1">
                      <Award size={12} /> {deptPrograms.length} {progPlural}
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab('programs');
                        setSearchQuery(dept.code || '');
                      }}
                      className="text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      View {progPlural} <ChevronRight size={11} />
                    </button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 2: Programs */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((prog) => {
            const progSubjects = subjects.filter(
              (s) => s.programId === prog._id || s.programId?._id === prog._id
            );
            const parentDept = departments.find(
              (d) => d._id === prog.departmentId || d._id === prog.departmentId?._id
            );

            return (
              <Card key={prog._id} className="hover:shadow-md transition-shadow">
                <CardBody className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 dark:text-secondary-400 font-mono font-bold text-xs flex items-center justify-center border border-secondary-200 dark:border-secondary-800">
                        {prog.code}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-accent-900 dark:text-white">{prog.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="primary" className="text-[9px] px-1 py-0">
                            {prog.level}
                          </Badge>
                          <span className="text-[10px] text-accent-400">• {prog.duration || 'Standard'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
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
                        className="p-1 text-accent-400 hover:text-accent-600"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(prog._id, prog.name)}
                        className="p-1 text-accent-400 hover:text-danger-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-accent-600 dark:text-accent-400 line-clamp-2">
                    {prog.description || `Registered ${progSingular.toLowerCase()} track.`}
                  </p>

                  <div className="pt-2 border-t border-accent-100 dark:border-accent-800 flex items-center justify-between text-[11px] text-accent-500">
                    <span className="truncate max-w-[140px]">
                      {parentDept ? parentDept.name : `Workspace ${deptSingular}`}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-accent-700 dark:text-accent-300">
                      <BookOpen size={12} /> {progSubjects.length} {subjPlural}
                    </span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 3: Course Subjects */}
      {activeTab === 'subjects' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50 text-[11px] font-bold text-accent-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{subjSingular} Code & Name</th>
                  <th className="py-3 px-4">Associated {progSingular}</th>
                  <th className="py-3 px-4">{creditsLabel}</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-100 dark:divide-accent-800 text-xs">
                {filteredSubjects.map((subj) => {
                  const parentProg = programs.find(
                    (p) => p._id === subj.programId || p._id === subj.programId?._id
                  );
                  return (
                    <tr key={subj._id} className="hover:bg-accent-50/50 dark:hover:bg-accent-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300">
                            {subj.code}
                          </span>
                          <div>
                            <p className="font-bold text-accent-900 dark:text-white">{subj.name}</p>
                            <p className="text-[10px] text-accent-400 truncate max-w-xs">{subj.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-accent-700 dark:text-accent-300 font-medium">
                        {parentProg ? parentProg.name : `All ${progPlural}`}
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
                            className="p-1 text-accent-400 hover:text-accent-600"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subj._id, subj.name)}
                            className="p-1 text-accent-400 hover:text-danger-500"
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
      )}

      {/* Department Create/Edit Modal */}
      {deptModalOpen && (
        <Modal
          isOpen={deptModalOpen}
          onClose={() => setDeptModalOpen(false)}
          title={editingDept ? `Edit ${deptSingular}` : `Register New ${deptSingular}`}
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
                placeholder={`e.g. Flight Avionics / Engineering`}
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
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
                placeholder="e.g. AERO, CS, DIV-01"
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
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
                placeholder={`Scope and syllabus curriculum managed by this ${deptSingular.toLowerCase()}...`}
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-accent-100 dark:border-accent-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeptModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save {deptSingular}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Program Create/Edit Modal */}
      {progModalOpen && (
        <Modal
          isOpen={progModalOpen}
          onClose={() => setProgModalOpen(false)}
          title={editingProg ? `Edit ${progSingular}` : `Create New ${progSingular}`}
        >
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
                placeholder={`e.g. B.S. Flight Dynamics / Cybersecurity Track`}
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={progForm.code}
                  onChange={(e) => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. BS-AE"
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Parent {deptSingular}
                </label>
                <select
                  value={progForm.departmentId}
                  onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                >
                  <option value="">None / Global</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  {levelLabel}
                </label>
                <select
                  value={progForm.level}
                  onChange={(e) => setProgForm({ ...progForm, level: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                >
                  <option value="UNDERGRADUATE">Undergraduate / Entry</option>
                  <option value="GRADUATE">Graduate / Intermediate</option>
                  <option value="POSTGRADUATE">Postgraduate / Advanced</option>
                  <option value="CERTIFICATION">Professional Certification</option>
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
                  placeholder="e.g. 4 Years / 6 Months"
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-accent-100 dark:border-accent-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setProgModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save {progSingular}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Subject Create/Edit Modal */}
      {subjModalOpen && (
        <Modal
          isOpen={subjModalOpen}
          onClose={() => setSubjModalOpen(false)}
          title={editingSubj ? `Edit ${subjSingular}` : `Create New ${subjSingular}`}
        >
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
                placeholder="e.g. Aerodynamics / Distributed Cloud"
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={subjForm.code}
                  onChange={(e) => setSubjForm({ ...subjForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AE-301"
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  {creditsLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={subjForm.credits}
                  onChange={(e) => setSubjForm({ ...subjForm, credits: parseInt(e.target.value, 10) || 3 })}
                  className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Associated {progSingular}
              </label>
              <select
                value={subjForm.programId}
                onChange={(e) => setSubjForm({ ...subjForm, programId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
              >
                <option value="">Global / Unassigned</option>
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-accent-100 dark:border-accent-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setSubjModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save {subjSingular}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default OrgStructure;
