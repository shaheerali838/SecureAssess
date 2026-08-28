import React from 'react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { FileCheck, Users, FolderKanban, Award, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrganizationDashboard = () => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const metrics = [
    { label: 'Total Assessments', value: '12', icon: FileCheck, color: 'text-primary-500 bg-primary-50 dark:bg-primary-950/50' },
    { label: 'Registered Candidates', value: '348', icon: Users, color: 'text-secondary-500 bg-secondary-50 dark:bg-secondary-950/50' },
    { label: 'Pending Grading', value: '7', icon: FolderKanban, color: 'text-warning-500 bg-warning-50 dark:bg-warning-950/50' },
    { label: 'Issued Certificates', value: '290', icon: Award, color: 'text-success-500 bg-success-50 dark:bg-success-950/50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-accent-900 dark:text-white">
            {currentOrganization?.name || 'Organization Workspace'}
          </h1>
          <p className="text-sm text-accent-500 dark:text-accent-400 mt-1">
            Manage your assessment lifecycle, candidate cohorts, and grading workflows.
          </p>
        </div>

        <Link
          to="/organization/assessments/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-soft transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assessment</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-5 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft card-hover"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold font-display text-accent-900 dark:text-white mt-4">
                {m.value}
              </p>
              <p className="text-xs font-medium text-accent-500 dark:text-accent-400 mt-1">
                {m.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Assessment Cohorts */}
      <div className="p-6 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-accent-900 dark:text-white">
            Active Examinations
          </h2>
          <span className="text-xs font-semibold text-primary-500 hover:underline cursor-pointer">
            View all assessments
          </span>
        </div>

        <div className="divide-y divide-accent-100 dark:divide-accent-800">
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-accent-900 dark:text-white">
                CS401 — Advanced Operating Systems Final
              </p>
              <p className="text-[11px] text-accent-500">
                Duration: 90 mins • 45 Questions • Proctoring: Fullscreen + Audio/Video
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-success-50 text-success-700 border border-success-200">
              Active / Scheduled
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-accent-900 dark:text-white">
                Senior Fullstack Engineer Screening Challenge
              </p>
              <p className="text-[11px] text-accent-500">
                Duration: 120 mins • 5 Coding Challenges • Anti-Cheat: Enabled
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
              Draft / Review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;
