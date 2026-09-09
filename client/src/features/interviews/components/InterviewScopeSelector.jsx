import React from 'react';
import { User, Building2, BookOpen, GraduationCap, Link2 } from 'lucide-react';

export function InterviewScopeSelector({ targetScope, setTargetScope, departments, subjects, programs, candidates }) {
  const scopeOptions = [
    {
      id: 'candidates',
      label: 'Single Candidate(s)',
      sub: `${candidates.length} Registered Candidates`,
      icon: User,
    },
    {
      id: 'departments',
      label: 'Department Cohort',
      sub: `${departments.length} Academic Departments`,
      icon: Building2,
    },
    {
      id: 'subjects',
      label: 'Subject Enrollment',
      sub: `${subjects.length} Course Subjects`,
      icon: BookOpen,
    },
    {
      id: 'programs',
      label: 'Academic Program',
      sub: `${programs.length} Degree Programs`,
      icon: GraduationCap,
    },
    {
      id: 'open_entry',
      label: '1-Time Direct Link',
      sub: 'External candidate / Custom link',
      icon: Link2,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      {scopeOptions.map((opt) => {
        const Icon = opt.icon;
        const isSelected = targetScope === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTargetScope(opt.id)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/20'
                : 'bg-accent-50/50 dark:bg-accent-900/30 border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-300 hover:bg-accent-100/60 dark:hover:bg-accent-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-accent-200 dark:bg-accent-800 text-accent-600 dark:text-accent-400'
                }`}
              >
                <Icon size={14} />
              </div>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">{opt.label}</div>
              <div className="text-[10px] text-accent-400 mt-0.5 leading-snug">
                {opt.sub}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default InterviewScopeSelector;
