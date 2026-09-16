import React from 'react';
import { User, Building2, BookOpen, GraduationCap, Link2 } from 'lucide-react';

const SCOPES = [
  { id: 'candidates', label: 'Candidate (1-on-1)', icon: User },
  { id: 'departments', label: 'By Department', icon: Building2 },
  { id: 'subjects', label: 'By Subject / Course', icon: BookOpen },
  { id: 'programs', label: 'Degree Program', icon: GraduationCap },
  { id: 'open_entry', label: '1-Time Entry Link', icon: Link2 },
];

export function ScheduleScopeTabs({ targetScope, onScopeChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-2">
        1. Select Scheduling Scope & Target
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {SCOPES.map(({ id, label, icon: Icon }) => {
          const isActive = targetScope === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onScopeChange(id)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                isActive
                  ? 'bg-primary-600/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                  : 'bg-white dark:bg-accent-800/60 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-800'
              }`}
            >
              <Icon size={18} />
              <span className="text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
