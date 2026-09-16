import React from 'react';
import { BookOpen, Plus, Edit2, Trash2, User, GraduationCap } from 'lucide-react';
import { Button, Badge, Avatar } from '@/components/ui';

export function SubjectsTab({
  subjects,
  programs,
  examiners,
  searchQuery,
  onOpenNewModal,
  onOpenEditModal,
  onDeleteSubject,
}) {
  const filtered = subjects.filter((s) => {
    const q = searchQuery.toLowerCase();
    const progName = (s.programId?.name || '').toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      progName.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-accent-900 dark:text-white">
            Subjects & Courses ({filtered.length})
          </h3>
          <p className="text-xs text-accent-500 dark:text-accent-400">
            Course modules, oral viva exams, and appointed faculty examiners
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onOpenNewModal}
        >
          Add Subject
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-accent-50/50 dark:bg-accent-900/30 rounded-2xl border border-accent-200 dark:border-accent-800 text-xs text-accent-500">
          No courses or subjects found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((subj) => {
            const progName =
              subj.programId?.name ||
              programs.find((p) => p._id === (subj.programId?._id || subj.programId))?.name ||
              'Program';

            const examiner =
              subj.examinerId?.name ? subj.examinerId :
              examiners.find((e) => e._id === (subj.examinerId?._id || subj.examinerId));

            return (
              <div
                key={subj._id}
                className="p-5 rounded-2xl border border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-900 shadow-soft hover:shadow-glow transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <BookOpen size={20} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {subj.code}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {subj.credits || 3} Credits
                      </Badge>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-accent-900 dark:text-white mb-1">
                    {subj.name}
                  </h4>
                  <p className="text-xs text-accent-500 dark:text-accent-400 flex items-center gap-1 mb-4">
                    <GraduationCap size={12} className="text-accent-400 shrink-0" />
                    <span className="truncate">{progName}</span>
                  </p>
                </div>

                <div>
                  <div className="p-2.5 rounded-xl bg-accent-50 dark:bg-accent-850 text-xs mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        name={examiner?.name || 'Unassigned'}
                        size="xs"
                        color="#3b82f6"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-accent-900 dark:text-white truncate">
                          {examiner?.name || 'Unassigned Examiner'}
                        </p>
                        <p className="text-[10px] text-accent-500">Lead Faculty</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-accent-400">Oral Viva</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-accent-100 dark:border-accent-800">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Edit2 size={13} />}
                      onClick={() => onOpenEditModal(subj)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-danger-500 hover:text-danger-600"
                      icon={<Trash2 size={13} />}
                      onClick={() => onDeleteSubject(subj)}
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
