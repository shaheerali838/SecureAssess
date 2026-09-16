import React from 'react';
import { Search, CheckSquare, Square } from 'lucide-react';
import { Avatar } from '@/components/ui';

export function ScheduleCandidateRoster({
  searchTerm,
  setSearchTerm,
  filteredCandidates,
  selectedCandidateIds,
  toggleCandidate,
  toggleAllFilteredCandidates,
}) {
  const allFilteredSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((c) => selectedCandidateIds.includes(c._id || c.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-accent-400" />
          <input
            type="text"
            placeholder="Search candidates by name, email, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 text-xs h-8 rounded-lg bg-white dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          type="button"
          onClick={toggleAllFilteredCandidates}
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline self-end sm:self-auto cursor-pointer"
        >
          {allFilteredSelected ? 'Deselect All Filtered' : 'Select All Filtered'}
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-6 text-xs text-accent-500">
            No candidates found matching search criteria.
          </div>
        ) : (
          filteredCandidates.map((cand) => {
            const id = cand._id || cand.id;
            const isSelected = selectedCandidateIds.includes(id);
            const name = `${cand.firstName || ''} ${cand.lastName || ''}`.trim() || 'Candidate';
            return (
              <div
                key={id}
                onClick={() => toggleCandidate(id)}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all text-xs ${
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-400 dark:border-primary-600'
                    : 'bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isSelected ? (
                    <CheckSquare size={16} className="text-primary-600 shrink-0" />
                  ) : (
                    <Square size={16} className="text-accent-400 shrink-0" />
                  )}
                  <Avatar name={name} size="xs" color="#3b82f6" />
                  <div className="min-w-0">
                    <p className="font-bold text-accent-900 dark:text-white truncate">{name}</p>
                    <p className="text-[11px] text-accent-500 truncate">
                      {cand.email} {cand.candidateCode ? `· ${cand.candidateCode}` : ''}
                    </p>
                  </div>
                </div>
                {cand.deptCode && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-300">
                    {cand.deptCode}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-[11px] text-accent-500">
        {selectedCandidateIds.length} candidate(s) selected for 1-on-1 interview scheduling.
      </p>
    </div>
  );
}
