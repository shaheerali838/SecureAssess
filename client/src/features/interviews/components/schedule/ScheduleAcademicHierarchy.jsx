import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function ScheduleAcademicHierarchy({
  targetScope,
  filteredDepartments,
  selectedDepartmentId,
  setSelectedDepartmentId,
  filteredSubjects,
  selectedSubjectId,
  setSelectedSubjectId,
  filteredPrograms,
  selectedProgramId,
  setSelectedProgramId,
}) {
  if (targetScope === 'departments') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-accent-700 dark:text-accent-300">
          Choose Academic Division / Department:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredDepartments.map((dept) => {
            const id = dept._id || dept.id;
            const isSelected = selectedDepartmentId === id;
            return (
              <div
                key={id}
                onClick={() => setSelectedDepartmentId(id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500'
                    : 'bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800'
                }`}
              >
                <div>
                  <p className="font-bold text-accent-900 dark:text-white">{dept.name}</p>
                  <p className="text-[11px] text-accent-500 font-mono">{dept.code || 'DEPT'}</p>
                </div>
                {isSelected && <CheckCircle2 size={16} className="text-primary-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (targetScope === 'subjects') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-accent-700 dark:text-accent-300">
          Choose Subject / Course for Oral Viva & Defense:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredSubjects.map((subj) => {
            const id = subj._id || subj.id;
            const isSelected = selectedSubjectId === id;
            return (
              <div
                key={id}
                onClick={() => setSelectedSubjectId(id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500'
                    : 'bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800'
                }`}
              >
                <div>
                  <p className="font-bold text-accent-900 dark:text-white">{subj.name}</p>
                  <p className="text-[11px] text-accent-500 font-mono">
                    {subj.code} {subj.credits ? `· ${subj.credits} Credits` : ''}
                  </p>
                </div>
                {isSelected && <CheckCircle2 size={16} className="text-primary-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (targetScope === 'programs') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-accent-700 dark:text-accent-300">
          Choose Degree Program & Cohort:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredPrograms.map((prog) => {
            const id = prog._id || prog.id;
            const isSelected = selectedProgramId === id;
            return (
              <div
                key={id}
                onClick={() => setSelectedProgramId(id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500'
                    : 'bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800'
                }`}
              >
                <div>
                  <p className="font-bold text-accent-900 dark:text-white">{prog.name}</p>
                  <p className="text-[11px] text-accent-500 font-mono">{prog.code || 'PROG'}</p>
                </div>
                {isSelected && <CheckCircle2 size={16} className="text-primary-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
