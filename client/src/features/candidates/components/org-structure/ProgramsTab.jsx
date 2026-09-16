import React from 'react';
import { GraduationCap, Plus, Edit2, Trash2, BookOpen, Building2 } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

export function ProgramsTab({
  programs,
  departments,
  subjects,
  searchQuery,
  onOpenNewModal,
  onOpenEditModal,
  onDeleteProgram,
}) {
  const filtered = programs.filter((p) => {
    const q = searchQuery.toLowerCase();
    const deptName = (p.departmentId?.name || '').toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      deptName.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-accent-900 dark:text-white">
            Degree Programs ({filtered.length})
          </h3>
          <p className="text-xs text-accent-500 dark:text-accent-400">
            Academic curricula, majors, and undergraduate/postgraduate degrees
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onOpenNewModal}
        >
          Add Program
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-accent-50/50 dark:bg-accent-900/30 rounded-2xl border border-accent-200 dark:border-accent-800 text-xs text-accent-500">
          No degree programs found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prog) => {
            const progSubjects = subjects.filter(
              (s) => (s.programId?._id || s.programId) === prog._id
            );
            const deptName =
              prog.departmentId?.name ||
              departments.find((d) => d._id === (prog.departmentId?._id || prog.departmentId))?.name ||
              'Department';

            return (
              <div
                key={prog._id}
                className="p-5 rounded-2xl border border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-900 shadow-soft hover:shadow-glow transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <GraduationCap size={20} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {prog.code}
                      </Badge>
                      <Badge variant="primary" className="text-[10px]">
                        {prog.level || 'UNDERGRADUATE'}
                      </Badge>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-accent-900 dark:text-white mb-1">
                    {prog.name}
                  </h4>
                  <p className="text-xs text-accent-500 dark:text-accent-400 flex items-center gap-1 mb-4">
                    <Building2 size={12} className="text-accent-400 shrink-0" />
                    <span className="truncate">{deptName}</span>
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-850 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-accent-600 dark:text-accent-300">
                      <BookOpen size={13} className="text-primary-500" />
                      <span>{progSubjects.length} Courses</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent-600 dark:text-accent-300">
                      <span>⏱ {prog.duration || '4 Years'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-accent-100 dark:border-accent-800">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Edit2 size={13} />}
                      onClick={() => onOpenEditModal(prog)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-danger-500 hover:text-danger-600"
                      icon={<Trash2 size={13} />}
                      onClick={() => onDeleteProgram(prog)}
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
