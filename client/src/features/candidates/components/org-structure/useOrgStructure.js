import { useState, useEffect, useCallback } from 'react';
import departmentService from '@/services/department.service';
import programService from '@/services/program.service';
import subjectService from '@/services/subject.service';
import organizationService from '@/services/organization.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

export function useOrgStructure() {
  const { currentOrganization, t } = useOrganization();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Entities state
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examiners, setExaminers] = useState([]);

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
    examinerId: '',
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
    if (Array.isArray(val?.members)) return val.members;
    if (Array.isArray(val?.data)) return val.data;
    return [];
  };

  // Fetch Structure Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, subjRes, staffRes] = await Promise.allSettled([
        departmentService.getDepartments({ limit: 200 }, orgId),
        programService.getPrograms({ limit: 200 }, orgId),
        subjectService.getSubjects({ limit: 200 }, orgId),
        organizationService.listMembers(orgId),
      ]);

      const loadedDepts = extractItems(deptRes);
      const loadedProgs = extractItems(progRes);
      const loadedSubjs = extractItems(subjRes);
      const loadedStaff = extractItems(staffRes);

      const parsedExaminers = loadedStaff
        .map((m) => {
          const u =
            m.userId && typeof m.userId === 'object'
              ? m.userId
              : m.user && typeof m.user === 'object'
              ? m.user
              : m;

          const roleName = (
            (typeof m.roleId === 'object' && m.roleId !== null ? m.roleId.name : null) ||
            (typeof m.role === 'object' && m.role !== null ? m.role.name : null) ||
            m.roleName ||
            u.role ||
            m.role ||
            ''
          ).toUpperCase();

          if (roleName !== 'EXAMINER') {
            return null;
          }

          const id = u._id || u.id || (typeof m.userId === 'string' ? m.userId : null) || m._id;
          if (!id) return null;

          const firstName = u.firstName || m.firstName || '';
          const lastName = u.lastName || m.lastName || '';
          const fullName =
            firstName || lastName
              ? `${firstName} ${lastName}`.trim()
              : u.name || m.name || u.email || m.email || 'Examiner';
          const email = u.email || m.email || '';

          return {
            _id: id,
            name: fullName,
            email,
            role: 'EXAMINER',
          };
        })
        .filter(Boolean);

      setDepartments(loadedDepts);
      setPrograms(loadedProgs);
      setSubjects(loadedSubjs);
      setExaminers(parsedExaminers);
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

  const openEditDepartmentModal = (dept) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      status: dept.status || 'ACTIVE',
    });
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

  const openEditProgramModal = (prog) => {
    setEditingProg(prog);
    setProgForm({
      name: prog.name || '',
      code: prog.code || '',
      departmentId: prog.departmentId?._id || prog.departmentId || '',
      level: prog.level || 'UNDERGRADUATE',
      duration: prog.duration || '4 Years',
      description: prog.description || '',
      status: prog.status || 'ACTIVE',
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
      examinerId: '',
      description: '',
      status: 'ACTIVE',
    });
    setSubjModalOpen(true);
  };

  const openEditSubjectModal = (subj) => {
    setEditingSubj(subj);
    setSubjForm({
      name: subj.name || '',
      code: subj.code || '',
      programId: subj.programId?._id || subj.programId || '',
      credits: subj.credits || 3,
      examinerId: subj.examinerId?._id || subj.examinerId || '',
      description: subj.description || '',
      status: subj.status || 'ACTIVE',
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
        setToast({ type: 'success', text: `Department "${deptForm.name}" updated successfully.` });
      } else {
        await departmentService.createDepartment(deptForm, orgId);
        setToast({ type: 'success', text: `Department "${deptForm.name}" created successfully.` });
      }
      setDeptModalOpen(false);
      setEditingDept(null);
      loadData();
    } catch (err) {
      setToast({ type: 'error', text: err?.response?.data?.message || err.message || 'Action failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (dept) => {
    if (!window.confirm(`Are you sure you want to remove department "${dept.name}"?`)) return;
    try {
      await departmentService.deleteDepartment(dept._id, orgId);
      setToast({ type: 'success', text: `Department "${dept.name}" removed.` });
      loadData();
    } catch (err) {
      setToast({ type: 'error', text: err?.response?.data?.message || err.message || 'Delete failed.' });
    }
  };

  // Program CRUD
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!progForm.name.trim() || !progForm.code.trim() || !progForm.departmentId) {
      setToast({ type: 'error', text: 'Program name, code, and parent department are required.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingProg) {
        await programService.updateProgram(editingProg._id, progForm, orgId);
        setToast({ type: 'success', text: `Degree program "${progForm.name}" updated.` });
      } else {
        await programService.createProgram(progForm, orgId);
        setToast({ type: 'success', text: `Degree program "${progForm.name}" created.` });
      }
      setProgModalOpen(false);
      setEditingProg(null);
      loadData();
    } catch (err) {
      setToast({ type: 'error', text: err?.response?.data?.message || err.message || 'Action failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (prog) => {
    if (!window.confirm(`Are you sure you want to remove program "${prog.name}"?`)) return;
    try {
      await programService.deleteProgram(prog._id, orgId);
      setToast({ type: 'success', text: `Program "${prog.name}" removed.` });
      loadData();
    } catch (err) {
      setToast({ type: 'error', text: err?.response?.data?.message || err.message || 'Delete failed.' });
    }
  };

  // Subject CRUD
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjForm.name.trim() || !subjForm.code.trim() || !subjForm.programId) {
      setToast({ type: 'error', text: 'Subject name, code, and parent program are required.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingSubj) {
        await subjectService.updateSubject(editingSubj._id, subjForm, orgId);
        setToast({ type: 'success', text: `Subject "${subjForm.name}" updated.` });
      } else {
        await subjectService.createSubject(subjForm, orgId);
        setToast({ type: 'success', text: `Subject "${subjForm.name}" created.` });
      }
      setSubjModalOpen(false);
      setEditingSubj(null);
      loadData();
    } catch (err) {
      setToast({ type: 'error', text: err?.response?.data?.message || err.message || 'Action failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subj) => {
    if (!window.confirm(`Are you sure you want to remove subject "${subj.name}"?`)) return;
    try {
      await subjectService.deleteSubject(subj._id, orgId);
      setToast({ type: 'success', text: `Subject "${subj.name}" removed.` });
      loadData();
    } catch (err) {
      setToast({ type: 'error', text: err?.response?.data?.message || err.message || 'Delete failed.' });
    }
  };

  return {
    t,
    activeTab,
    setActiveTab,
    loading,
    searchQuery,
    setSearchQuery,
    toast,
    setToast,
    departments,
    programs,
    subjects,
    examiners,
    deptModalOpen,
    setDeptModalOpen,
    editingDept,
    deptForm,
    setDeptForm,
    progModalOpen,
    setProgModalOpen,
    editingProg,
    progForm,
    setProgForm,
    subjModalOpen,
    setSubjModalOpen,
    editingSubj,
    subjForm,
    setSubjForm,
    submitting,
    loadData,
    openNewDepartmentModal,
    openEditDepartmentModal,
    openNewProgramModal,
    openEditProgramModal,
    openNewSubjectModal,
    openEditSubjectModal,
    handleSaveDepartment,
    handleDeleteDepartment,
    handleSaveProgram,
    handleDeleteProgram,
    handleSaveSubject,
    handleDeleteSubject,
  };
}
