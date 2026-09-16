import React from 'react';
import { Building2, Plus, Edit2, Trash2, BookOpen, Layers } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

export function DepartmentsTab({
  departments,
  programs,
  subjects,
  searchQuery,
  onOpenNewModal,
  onOpenEditModal,
  onDeleteDepartment,
}) {
  const filtered = departments.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (d.name || '').toLowerCase().includes(q) ||
      (d.code || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-accent-900 dark:text-white">
            Academic Departments ({filtered.length})
          </h3>
          <p className="text-xs text-accent-500 dark:text-accent-400">
            Faculties and administrative divisions housing degree programs
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onOpenNewModal}
        >
          Add Department
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-accent-50/50 dark:bg-accent-900/30 rounded-2xl border border-accent-200 dark:border-accent-800 text-xs text-accent-500">
          No departments found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => {
            const deptPrograms = programs.filter(
              (p) => (p.departmentId?._id || p.departmentId) === dept._id
            );
            const deptSubjects = subjects.filter((s) =>
              deptPrograms.some(
                (p) => (s.programId?._id || s.programId) === p._id
              )
            );

            return (
              <div
                key={dept._id}
                className="p-5 rounded-2xl border border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-900 shadow-soft hover:shadow-glow transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                      <Building2 size={20} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {dept.code}
                      </Badge>
                      <Badge
                        variant={dept.status === 'ACTIVE' ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {dept.status || 'ACTIVE'}
                      </Badge>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-accent-900 dark:text-white mb-1">
                    {dept.name}
                  </h4>
                  <p className="text-xs text-accent-500 dark:text-accent-400 line-clamp-2 leading-relaxed mb-4">
                    {dept.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-850 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-accent-600 dark:text-accent-300">
                      <Layers size={13} className="text-primary-500" />
                      <span>{deptPrograms.length} Programs</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent-600 dark:text-accent-300">
                      <BookOpen size={13} className="text-indigo-500" />
                      <span>{deptSubjects.length} Courses</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-accent-100 dark:border-accent-800">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Edit2 size={13} />}
                      onClick={() => onOpenEditModal(dept)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-danger-500 hover:text-danger-600"
                      icon={<Trash2 size={13} />}
                      onClick={() => onDeleteDepartment(dept)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
