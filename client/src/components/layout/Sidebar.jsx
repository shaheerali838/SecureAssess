import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  FileCheck,
  FolderKanban,
  HelpCircle,
  Award,
  Video,
  BarChart3,
  ScrollText,
  Settings,
  GraduationCap,
} from 'lucide-react';

export const Sidebar = ({ portalType = 'organization' }) => {
  const platformNav = [
    { name: 'Dashboard', path: '/platform/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', path: '/platform/organizations', icon: Building2 },
    { name: 'Platform Users', path: '/platform/users', icon: Users },
    { name: 'Roles & RBAC', path: '/platform/roles', icon: ShieldCheck },
    { name: 'System Analytics', path: '/platform/analytics', icon: BarChart3 },
    { name: 'Platform Audit', path: '/platform/audit-logs', icon: ScrollText },
  ];

  const organizationNav = [
    { name: 'Overview', path: '/organization/dashboard', icon: LayoutDashboard },
    { name: 'Assessments', path: '/organization/assessments', icon: FileCheck },
    { name: 'Question Banks', path: '/organization/question-banks', icon: HelpCircle },
    { name: 'Candidates & Batches', path: '/organization/candidates', icon: Users },
    { name: 'Grading Queue', path: '/organization/grading', icon: FolderKanban },
    { name: 'Live Proctoring', path: '/organization/proctoring', icon: Video },
    { name: 'Results & Reports', path: '/organization/results', icon: BarChart3 },
    { name: 'Certificates', path: '/organization/certificates', icon: Award },
    { name: 'Tenant Settings', path: '/organization/settings', icon: Settings },
  ];

  const candidateNav = [
    { name: 'My Assessments', path: '/candidate/dashboard', icon: GraduationCap },
    { name: 'Scorecards', path: '/candidate/results', icon: BarChart3 },
    { name: 'My Certificates', path: '/candidate/certificates', icon: Award },
  ];

  const items =
    portalType === 'platform'
      ? platformNav
      : portalType === 'candidate'
      ? candidateNav
      : organizationNav;

  return (
    <aside className="w-64 bg-white dark:bg-accent-900 border-r border-accent-200 dark:border-accent-800 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-accent-400">
          Navigation
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 shadow-soft'
                    : 'text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-800 hover:text-accent-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-800/50 border border-accent-200 dark:border-accent-700/50 text-center">
        <p className="text-[11px] font-semibold text-accent-700 dark:text-accent-300">
          SecureAssess v2.0
        </p>
        <p className="text-[10px] text-accent-400">Multi-Tenant B2B Platform</p>
      </div>
    </aside>
  );
};

export default Sidebar;
