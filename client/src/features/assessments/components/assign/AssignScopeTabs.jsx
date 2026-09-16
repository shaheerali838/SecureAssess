import React from "react";
import { Users, Building2, BookOpen, GraduationCap, Layers, Link2 } from "lucide-react";

const SCOPES = [
  { id: "candidates", label: "Individual Candidates", icon: Users },
  { id: "departments", label: "By Department", icon: Building2 },
  { id: "programs", label: "By Degree Program", icon: GraduationCap },
  { id: "subjects", label: "By Subject / Course", icon: BookOpen },
  { id: "groups", label: "Candidate Cohorts", icon: Layers },
  { id: "open_entry", label: "1-Time Public Link", icon: Link2 },
];

export function AssignScopeTabs({ assignmentScope, onScopeChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-2">
        1. Select Assignment Scope & Target Roster
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {SCOPES.map(({ id, label, icon: Icon }) => {
          const isActive = assignmentScope === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onScopeChange(id)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                isActive
                  ? "bg-primary-600/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20"
                  : "bg-white dark:bg-accent-800/60 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-800"
              }`}
            >
              <Icon size={16} />
              <span className="text-center text-[11px] leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
