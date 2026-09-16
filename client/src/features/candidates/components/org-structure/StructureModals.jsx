import React from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';

export function StructureModals({
  deptModalOpen,
  setDeptModalOpen,
  editingDept,
  deptForm,
  setDeptForm,
  handleSaveDepartment,

  progModalOpen,
  setProgModalOpen,
  editingProg,
  progForm,
  setProgForm,
  departments,
  handleSaveProgram,

  subjModalOpen,
  setSubjModalOpen,
  editingSubj,
  subjForm,
  setSubjForm,
  programs,
  examiners,
  handleSaveSubject,

  submitting,
}) {
  return (
    <>
      {/* Department Modal */}
      <Modal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Edit Academic Department' : 'Create Academic Department'}
        subtitle="Configure department name, institutional code, and operational status"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setDeptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="dept-form"
              loading={submitting}
            >
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        }
      >
        <form id="dept-form" onSubmit={handleSaveDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Department Name *
            </label>
            <Input
              required
              placeholder="e.g. Department of Computer Science & Engineering"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Department Code *
              </label>
              <Input
                required
                placeholder="e.g. CSE / CS"
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Status
              </label>
              <Select
                value={deptForm.status}
                onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value })}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive / Archived' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of department scope..."
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              className="w-full text-xs p-3 rounded-xl bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Program Modal */}
      <Modal
        open={progModalOpen}
        onClose={() => setProgModalOpen(false)}
        title={editingProg ? 'Edit Degree Program' : 'Create Degree Program'}
        subtitle="Link degree program to parent department and set academic degree level"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setProgModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="prog-form"
              loading={submitting}
            >
              {editingProg ? 'Save Changes' : 'Create Program'}
            </Button>
          </div>
        }
      >
        <form id="prog-form" onSubmit={handleSaveProgram} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Program Name *
            </label>
            <Input
              required
              placeholder="e.g. Bachelor of Science in Artificial Intelligence"
              value={progForm.name}
              onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Program Code *
              </label>
              <Input
                required
                placeholder="e.g. BS-AI / BSCS"
                value={progForm.code}
                onChange={(e) => setProgForm({ ...progForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Parent Department *
              </label>
              <Select
                value={progForm.departmentId}
                onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}
                options={departments.map((d) => ({ value: d._id, label: d.name }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Academic Degree Level
              </label>
              <Select
                value={progForm.level}
                onChange={(e) => setProgForm({ ...progForm, level: e.target.value })}
                options={[
                  { value: 'UNDERGRADUATE', label: 'Undergraduate (BS)' },
                  { value: 'POSTGRADUATE', label: 'Postgraduate (MS/MSc)' },
                  { value: 'DOCTORAL', label: 'Doctoral (PhD)' },
                  { value: 'DIPLOMA', label: 'Professional Diploma' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Curriculum Duration
              </label>
              <Input
                placeholder="e.g. 4 Years (8 Semesters)"
                value={progForm.duration}
                onChange={(e) => setProgForm({ ...progForm, duration: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal
        open={subjModalOpen}
        onClose={() => setSubjModalOpen(false)}
        title={editingSubj ? 'Edit Subject / Course' : 'Create Subject / Course'}
        subtitle="Configure course code, credit units, degree parent, and appointed examiner"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setSubjModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="subj-form"
              loading={submitting}
            >
              {editingSubj ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        }
      >
        <form id="subj-form" onSubmit={handleSaveSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Subject Name *
            </label>
            <Input
              required
              placeholder="e.g. Distributed Operating Systems & Cloud"
              value={subjForm.name}
              onChange={(e) => setSubjForm({ ...subjForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Subject Code *
              </label>
              <Input
                required
                placeholder="e.g. CS-401 / AI-302"
                value={subjForm.code}
                onChange={(e) => setSubjForm({ ...subjForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Credit Units
              </label>
              <Input
                type="number"
                min={1}
                max={12}
                value={subjForm.credits}
                onChange={(e) => setSubjForm({ ...subjForm, credits: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Degree Program *
              </label>
              <Select
                value={subjForm.programId}
                onChange={(e) => setSubjForm({ ...subjForm, programId: e.target.value })}
                options={programs.map((p) => ({ value: p._id, label: p.name }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Lead Examiner / Faculty
              </label>
              <Select
                value={subjForm.examinerId}
                onChange={(e) => setSubjForm({ ...subjForm, examinerId: e.target.value })}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...examiners.map((ex) => ({ value: ex._id, label: `${ex.name} (${ex.email})` })),
                ]}
              />
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
