import React from "react";
import CandidateMonitorCard from "./CandidateMonitorCard";

export const CandidateGrid = ({
  sessions = [],
  onSelectCandidate,
  onWarnCandidate,
  onTerminateCandidate,
}) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/60 p-8">
        <div className="text-4xl mb-3">👥</div>
        <h3 className="text-base font-semibold text-slate-300">No Active Candidates</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Currently there are no candidates taking proctored examinations under this assessment filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sessions.map((session) => (
        <CandidateMonitorCard
          key={session._id}
          session={session}
          onSelect={onSelectCandidate}
          onWarn={onWarnCandidate}
          onTerminate={onTerminateCandidate}
        />
      ))}
    </div>
  );
};

export default CandidateGrid;
