import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  ShieldCheck,
  BarChart3,
  Activity,
  FileText,
  PlusCircle,
  Library,
  Users,
  Video,
  ClipboardList,
  CreditCard,
  Settings,
  GraduationCap,
  FileCheck,
  FolderKanban,
  HelpCircle,
  Award,
  ScrollText,
  Shield,
  ShieldAlert,
  Sliders,
  Key,
  Calendar,
  Sparkles,
} from 'lucide-react';

import { getSidebarForRole, hasPermission } from '@/config/rbac.config';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  ROLE_SCOPES,
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
  ROLE_LABELS,
} from '@/constants/roles';

const ICON_MAP = {
  LayoutDashboard,
  Building2,
  UserPlus,
  ShieldCheck,
  BarChart3,
  Activity,
  FileText,
  PlusCircle,
  Library,
  Users,
  Video,
  ClipboardList,
  CreditCard,
  Settings,
  GraduationCap,
  FileCheck,
  FolderKanban,
  HelpCircle,
  Award,
  ScrollText,
  Shield,
  ShieldAlert,
  Sliders,
  Key,
  Calendar,
  Sparkles,
};

/**
 * Dynamic Multi-Tenant Sidebar
 * Reads active role scope (Platform vs Organization vs Candidate)
 * and renders strictly authorized navigation links.
 */
export const Sidebar = ({ portalType }) => {
  const { user, isPlatformStaff } = useAuth();
  const { userRole, currentMembership, currentOrganization } = useOrganization();

  const isPlatformUser = Boolean(
    isPlatformStaff ||
      user?.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
      user?.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      user?.role === PLATFORM_ROLES.PLATFORM_ADMIN ||
      user?.role === PLATFORM_ROLES.PLATFORM_OWNER
  );

  const effectiveOrgRole = (
    userRole ||
    currentMembership?.roleId?.name ||
    currentMembership?.role?.name ||
    currentMembership?.roleName ||
    user?.memberships?.[0]?.roleId?.name ||
    user?.memberships?.[0]?.role?.name ||
    user?.memberships?.[0]?.roleName ||
    user?.role ||
    ''
  ).toUpperCase();

  // Resolve active role according to portal context
  const activeRole =
    portalType === 'platform' || isPlatformUser
      ? user?.platformRole || PLATFORM_ROLES.PLATFORM_ADMIN
      : portalType === 'candidate' || effectiveOrgRole === ORGANIZATION_ROLES.CANDIDATE
      ? ORGANIZATION_ROLES.CANDIDATE
      : effectiveOrgRole || ORGANIZATION_ROLES.ORGANIZATION_ADMIN;

  const rawNav = getSidebarForRole(activeRole);

  const filteredNav = rawNav
    .map((entry) => {
      if (entry.group) {
        const filteredItems = entry.items.filter(
          (item) => !item.permission || hasPermission(activeRole, item.permission)
        );
        if (filteredItems.length === 0) return null;
        return { ...entry, items: filteredItems };
      }
      if (entry.permission && !hasPermission(activeRole, entry.permission)) {
        return null;
      }
      return entry;
    })
    .filter(Boolean);

  const renderLink = (item) => {
    const Icon = ICON_MAP[item.icon] || LayoutDashboard;
    return (
      <NavLink
        key={item.id || item.path}
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
        <span className="truncate">{item.label || item.name}</span>
      </NavLink>
    );
  };

  const roleDisplayLabel = ROLE_LABELS[activeRole] || activeRole;

  return (
    <aside className="w-64 bg-white dark:bg-accent-900 border-r border-accent-200 dark:border-accent-800 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {filteredNav.map((entry, idx) => {
          if (entry.group) {
            return (
              <div key={entry.group || idx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-400">
                  {entry.group}
                </div>
                {entry.items.map((item) => renderLink(item))}
              </div>
            );
          }
          return <div key={entry.id || idx}>{renderLink(entry)}</div>;
        })}
      </div>

      {/* Role Scope & Security Status Badge */}
      <div className="pt-3 border-t border-accent-100 dark:border-accent-800 space-y-2">
        <div className="p-2.5 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent-400">
              Role Access
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-300">
              <ShieldCheck size={10} /> Verified
            </span>
          </div>
          <p className="text-xs font-bold text-accent-900 dark:text-white mt-1 truncate">
            {roleDisplayLabel}
          </p>
        </div>

        <div className="px-2 text-center">
          <p className="text-[10px] text-accent-400">SecureAssess v2.0 · Enterprise RBAC</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
