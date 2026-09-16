import React from 'react';
import { Building2, GraduationCap, BookOpen, RefreshCw, Search } from 'lucide-react';
import { PageHeader, Button, Toast } from '@/components/ui';
import {
  useOrgStructure,
  DepartmentsTab,
  ProgramsTab,
  SubjectsTab,
  StructureModals,
} from '../components/org-structure';

export function OrgStructure({ onNavigate }) {
  const {
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
  } = useOrgStructure();

  const deptPlural = t ? t('department', true) : 'Departments';
  const progPlural = t ? t('program', true) : 'Degree Programs';
  const subjPlural = t ? t('subject', true) : 'Subjects';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.text}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Academic & Organizational Structure"
        subtitle="Manage academic faculties, degree program cohorts, and course catalog for oral defense and examinations."
        icon={<Building2 size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate?.('org-dashboard') },
          { label: 'Academic Structure' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={loadData}
            >
              Sync Structure
            </Button>
          </div>
        }
      />

      {/* Navigation Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl shadow-soft">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-accent-50 dark:bg-accent-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'departments'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <Building2 size={14} />
            <span>{deptPlural} ({departments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'programs'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap size={14} />
            <span>{progPlural} ({programs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>{subjPlural} ({subjects.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-accent-400" />
          <input
            type="text"
            placeholder="Search structure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 text-xs h-9 rounded-xl bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'departments' && (
        <DepartmentsTab
          departments={departments}
          programs={programs}
          subjects={subjects}
          searchQuery={searchQuery}
          onOpenNewModal={openNewDepartmentModal}
          onOpenEditModal={openEditDepartmentModal}
          onDeleteDepartment={handleDeleteDepartment}
        />
      )}

      {activeTab === 'programs' && (
        <ProgramsTab
          programs={programs}
          departments={departments}
          subjects={subjects}
          searchQuery={searchQuery}
          onOpenNewModal={openNewProgramModal}
          onOpenEditModal={openEditProgramModal}
          onDeleteProgram={handleDeleteProgram}
        />
      )}

      {activeTab === 'subjects' && (
        <SubjectsTab
          subjects={subjects}
          programs={programs}
          examiners={examiners}
          searchQuery={searchQuery}
          onOpenNewModal={openNewSubjectModal}
          onOpenEditModal={openEditSubjectModal}
          onDeleteSubject={handleDeleteSubject}
        />
      )}

      {/* Modals Suite */}
      <StructureModals
        deptModalOpen={deptModalOpen}
        setDeptModalOpen={setDeptModalOpen}
        editingDept={editingDept}
        deptForm={deptForm}
        setDeptForm={setDeptForm}
        handleSaveDepartment={handleSaveDepartment}
        progModalOpen={progModalOpen}
        setProgModalOpen={setProgModalOpen}
        editingProg={editingProg}
        progForm={progForm}
        setProgForm={setProgForm}
        departments={departments}
        handleSaveProgram={handleSaveProgram}
        subjModalOpen={subjModalOpen}
        setSubjModalOpen={setSubjModalOpen}
        editingSubj={editingSubj}
        subjForm={subjForm}
        setSubjForm={setSubjForm}
        programs={programs}
        examiners={examiners}
        handleSaveSubject={handleSaveSubject}
        submitting={submitting}
      />
    </div>
  );
}

export default OrgStructure;
