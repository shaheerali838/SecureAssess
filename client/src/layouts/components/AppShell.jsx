import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, PlusCircle, Library, Users, Video,
  ClipboardList, BarChart3, Settings, CreditCard, Shield, Building2,
  Sliders, UserPlus, FileSearch, ShieldCheck, Activity,
  ChevronDown, Sun, Moon, LogOut, Menu, X,
  GraduationCap, FileCheck, FolderKanban, HelpCircle, Award, ScrollText,
  ShieldAlert, Key
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Badge, Avatar } from '@/components/ui';

import { getSidebarForRole, hasPermission } from '@/config/rbac.config';

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
};

export function AppShell({
  currentPage,
  activeView,
  onNavigate,
  children,
}) {
  const { user, logout, isPlatformAdmin, isPlatformStaff } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { currentOrganization, organizations, switchOrganization, userRole } = useOrganization();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const currentKey = activeView || currentPage || 'org-dashboard';

  const isPlatformUser = Boolean(
    typeof isPlatformAdmin === 'function'
      ? isPlatformAdmin()
      : isPlatformStaff || user?.platformRole === 'PLATFORM_ADMIN'
  );

  const isPlatform = currentKey.startsWith('platform');
  const normalizedRole = (userRole || user?.platformRole || user?.role || '').toUpperCase();
  const isCandidate = normalizedRole === 'CANDIDATE';
  const isProctor = normalizedRole === 'PROCTOR';
  const isExaminer = normalizedRole === 'EXAMINER';

  const activeRole = isPlatform
    ? 'PLATFORM_ADMIN'
    : isCandidate
    ? 'CANDIDATE'
    : normalizedRole || (isPlatformUser ? 'PLATFORM_ADMIN' : 'ORGANIZATION_ADMIN');

  const rawNav = getSidebarForRole(activeRole);

  // Filter navigation items and groups based on permissions
  const currentNav = rawNav
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

  const displayOrgName = currentOrganization?.name || user?.organizationName || (isPlatform ? 'SecureAssess Platform' : 'Workspace');
  const displayUserName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (isPlatform ? 'Platform Administrator' : 'Staff Member'));
  const displayUserEmail = user?.email || '';
  const displayUserRole = normalizedRole.replace(/_/g, ' ') || (isPlatform ? 'PLATFORM ADMIN' : 'STAFF');

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  const renderNavItem = (item) => {
    const isActive = currentKey === item.id;
    const Icon = typeof item.icon === 'string' ? ICON_MAP[item.icon] || LayoutDashboard : item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavigate(item.id);
          setMobileOpen(false);
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          isActive
            ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50 shadow-soft'
            : 'text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-800/60 hover:text-accent-900 dark:hover:text-white'
        }`}
      >
        <span className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-accent-400'}>
          {React.isValidElement(Icon) ? Icon : <Icon size={16} />}
        </span>
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-accent-900 border-r border-accent-200 dark:border-accent-800 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-accent-100 dark:border-accent-800">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const defaultKey = isPlatform
                ? 'platform-dashboard'
                : isCandidate
                ? 'candidate-dashboard'
                : 'org-dashboard';
              onNavigate(defaultKey);
              setMobileOpen(false);
            }}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer group"
          >
            {isPlatform ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-soft shrink-0 group-hover:scale-105 transition-transform">
                  <Shield size={18} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-xs text-accent-900 dark:text-white truncate">
                    SecureAssess
                  </h1>
                  <Badge variant="primary" className="text-[10px] px-1.5 py-0">Platform Operator</Badge>
                </div>
              </>
            ) : (
              <>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-soft shrink-0 group-hover:scale-105 transition-transform ${
                  isCandidate ? 'bg-emerald-600' : isProctor ? 'bg-amber-600' : isExaminer ? 'bg-indigo-600' : 'bg-secondary-600'
                }`}>
                  {displayOrgName.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-accent-900 dark:text-white truncate">
                    {displayOrgName}
                  </p>
                  <p className="text-[10px] text-accent-500 dark:text-accent-400 font-medium leading-tight">
                    {isCandidate ? 'Candidate Portal' : isProctor ? 'Proctoring Workspace' : isExaminer ? 'Examiner Workspace' : 'SecureAssess Tenant'}
                  </p>
                </div>
              </>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={handleToggleClick}
            className="p-1.5 rounded-xl text-accent-500 hover:text-accent-800 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer shrink-0"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={17} className="text-warning-400" /> : <Moon size={17} />}
          </button>
        </div>

        {/* Tenant Organization Switcher (Only within tenant workspace) */}
        {!isPlatform && organizations.length > 1 && (
          <div className="mt-3 relative">
            <button
              type="button"
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 text-xs font-medium text-accent-700 dark:text-accent-200 hover:bg-accent-100 dark:hover:bg-accent-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 size={13} className="text-primary-500 shrink-0" />
                <span className="truncate">{displayOrgName}</span>
              </div>
              <ChevronDown size={13} className="shrink-0 text-accent-400" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-accent-800 border border-accent-200 dark:border-accent-700 rounded-xl shadow-medium py-1 z-50 animate-scale-in">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-400">
                  Switch Organization
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      switchOrganization(org.id);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-accent-50 dark:hover:bg-accent-700 cursor-pointer ${
                      currentOrganization?.id === org.id
                        ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/50 dark:bg-primary-950/40'
                        : 'text-accent-700 dark:text-accent-300'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    {currentOrganization?.id === org.id && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links with Group Headers */}
      <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto no-scrollbar">
        {currentNav.map((entry, idx) => {
          if (entry.group) {
            return (
              <div key={entry.group || idx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-400 dark:text-accent-500">
                  {entry.group}
                </div>
                {entry.items.map((item) => renderNavItem(item))}
              </div>
            );
          }
          return <div key={entry.id || idx}>{renderNavItem(entry)}</div>;
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-accent-100 dark:border-accent-800">
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent-50 dark:hover:bg-accent-800/60 transition-colors text-left cursor-pointer"
          >
            <Avatar name={displayUserName} size="sm" color={isPlatform ? '#2563eb' : '#0d9488'} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-accent-900 dark:text-white truncate leading-tight">
                {displayUserName}
              </p>
              <p className="text-[10px] text-accent-500 dark:text-accent-400 truncate leading-tight">
                {displayUserRole}
              </p>
            </div>
            <ChevronDown size={14} className="text-accent-400 shrink-0" />
          </button>

          {userDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-accent-800 border border-accent-200 dark:border-accent-700 rounded-xl shadow-strong p-1 z-50 animate-scale-in">
              <div className="px-3 py-2 border-b border-accent-100 dark:border-accent-700">
                <p className="text-xs font-bold text-accent-900 dark:text-white truncate">{displayUserName}</p>
                <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{displayUserEmail}</p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  handleToggleClick(e);
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Sun size={14} className="text-warning-400" /> : <Moon size={14} />}
                  <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-accent-400">{theme}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-lg cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-accent-100 flex transition-colors duration-200 font-sans">
      {/* Desktop Sidebar (Only on large screens) */}
      <aside className="w-64 fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col shadow-soft">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer Sidebar (Shown only when hamburger is clicked) */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-accent-950/70 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="w-72 max-w-[85vw] fixed inset-y-0 left-0 z-50 lg:hidden animate-slide-in-left shadow-2xl flex flex-col">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-accent-400 hover:text-accent-700 dark:hover:text-white z-10 p-1.5 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer"
              aria-label="Close navigation drawer"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Mobile & Tablet Top Bar (Visible ONLY when sidebar is hidden into hamburger) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 h-14 bg-white/95 dark:bg-accent-900/95 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex items-center justify-center p-2 rounded-xl bg-accent-100/80 dark:bg-accent-800/80 hover:bg-accent-200 dark:hover:bg-accent-700 text-accent-700 dark:text-accent-200 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            {/* Brand Logo & Context */}
            <button
              type="button"
              onClick={() => {
                const defaultKey = isPlatform
                  ? 'platform-dashboard'
                  : isCandidate
                  ? 'candidate-dashboard'
                  : 'org-dashboard';
                onNavigate(defaultKey);
              }}
              className="flex items-center gap-2 cursor-pointer group text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform shrink-0">
                <Shield size={15} className="text-white" />
              </div>
              <div className="min-w-0 max-w-[140px] sm:max-w-[220px]">
                <span className="font-bold text-xs text-accent-900 dark:text-white truncate block">
                  {isPlatform ? 'SecureAssess' : displayOrgName}
                </span>
                <span className="text-[10px] text-accent-500 dark:text-accent-400 font-medium truncate block leading-none">
                  {isCandidate ? 'Candidate Portal' : isProctor ? 'Proctor Workspace' : isExaminer ? 'Examiner Cockpit' : 'Workspace'}
                </span>
              </div>
            </button>
          </div>

          {/* Quick Actions in Mobile Header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleToggleClick}
              className="p-1.5 rounded-xl text-accent-500 hover:text-accent-900 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 cursor-pointer transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={17} className="text-warning-400" /> : <Moon size={17} />}
            </button>

            <div className="pl-1 border-l border-accent-200 dark:border-accent-800 flex items-center">
              <Avatar name={displayUserName} size="xs" color={isPlatform ? '#2563eb' : '#0d9488'} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
