import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, PlusCircle, Library, Users, Video,
  ClipboardList, BarChart3, Settings, CreditCard, Shield, Building2,
  Sliders, UserPlus, FileSearch, ShieldCheck, Activity,
  ChevronDown, Sun, Moon, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Badge, Avatar } from '@/components/ui';

export function AppShell({
  currentPage,
  activeView,
  onNavigate,
  children,
}) {
  const { user, logout, isPlatformAdmin, isPlatformStaff } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { currentOrganization, organizations, switchOrganization } = useOrganization();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  const currentKey = activeView || currentPage || 'org-dashboard';

  const isPlatformUser = Boolean(
    typeof isPlatformAdmin === 'function'
      ? isPlatformAdmin()
      : isPlatformStaff || user?.platformRole === 'PLATFORM_OWNER' || user?.platformRole === 'PLATFORM_ADMIN'
  );

  const isPlatform = currentKey.startsWith('platform');

  // Navigation schema for Platform Admins
  const platformNav = [
    { label: 'Platform Hub', icon: <LayoutDashboard size={18} />, id: 'platform-dashboard' },
    { label: 'Tenant Organizations', icon: <Building2 size={18} />, id: 'platform-organizations' },
    { label: 'Provision Tenant', icon: <UserPlus size={18} />, id: 'platform-onboarding' },
  ];

  // Navigation schema for Organization Staff
  const orgNav = [
    { label: 'Overview Dashboard', icon: <LayoutDashboard size={18} />, id: 'org-dashboard' },
    { label: 'Assessments Library', icon: <FileText size={18} />, id: 'org-assessments' },
    { label: 'Create Assessment', icon: <PlusCircle size={18} />, id: 'org-assessment-builder' },
    { label: 'Question Bank', icon: <Library size={18} />, id: 'org-question-bank' },
    { label: 'Candidate Roster', icon: <Users size={18} />, id: 'org-participants' },
    { label: 'Proctoring Telemetry', icon: <ShieldCheck size={18} />, id: 'org-integrity' },
    { label: 'Session Recordings', icon: <Activity size={18} />, id: 'org-sessions' },
    { label: 'Live Interviews', icon: <Video size={18} />, id: 'org-interviews' },
    { label: 'Grading & Rubrics', icon: <ClipboardList size={18} />, id: 'org-evaluations' },
    { label: 'Certified Reports', icon: <BarChart3 size={18} />, id: 'org-reports' },
    { label: 'Faculty & Staff', icon: <Users size={18} />, id: 'org-users' },
    { label: 'Resource Billing', icon: <CreditCard size={18} />, id: 'org-billing' },
    { label: 'Workspace Settings', icon: <Settings size={18} />, id: 'org-settings' },
  ];

  const currentNav = isPlatform ? platformNav : orgNav;

  const displayOrgName = currentOrganization?.name || user?.organizationName || 'Stanford Engineering';
  const displayUserName = user?.name || (isPlatform ? 'Platform Super Admin' : 'Dean of Engineering');
  const displayUserEmail = user?.email || (isPlatform ? 'shaheer838838@gmail.com' : 'dean@stanford.edu');
  const displayUserRole = user?.role || (isPlatform ? 'Super Admin' : 'Org Admin');

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-accent-900 border-r border-accent-200 dark:border-accent-800 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-accent-100 dark:border-accent-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {isPlatform ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-soft shrink-0">
                  <Shield size={18} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-xs text-accent-900 dark:text-white truncate">
                    SecureAssess
                  </h1>
                  <Badge variant="primary" className="text-[10px] px-1.5 py-0">Platform Root</Badge>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-secondary-600 flex items-center justify-center text-white font-bold text-xs shadow-soft shrink-0">
                  {displayOrgName.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-accent-900 dark:text-white truncate">
                    {displayOrgName}
                  </p>
                  <p className="text-[10px] text-accent-500 dark:text-accent-400 font-medium leading-tight">
                    SecureAssess Tenant
                  </p>
                </div>
              </>
            )}
          </div>

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

        {/* Tenant Organization Switcher */}
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

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {currentNav.map((item) => {
          const isActive = currentKey === item.id;
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
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Portal Mode Switcher / User Footer */}
      <div className="p-3 border-t border-accent-100 dark:border-accent-800 space-y-2">
        {isPlatformUser && (
          <button
            type="button"
            onClick={() => onNavigate(isPlatform ? 'org-dashboard' : 'platform-dashboard')}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-700 transition-colors cursor-pointer"
          >
            <Sliders size={13} />
            <span>{isPlatform ? 'Switch to Organization Workspace' : 'Switch to Platform Admin'}</span>
          </button>
        )}

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
      {/* Desktop Sidebar */}
      <aside className="w-64 fixed inset-y-0 left-0 z-30 hidden md:flex flex-col shadow-soft">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-accent-950/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="w-64 fixed inset-y-0 left-0 z-50 md:hidden animate-slide-in-left shadow-strong">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-accent-400 hover:text-accent-700 dark:hover:text-white z-10 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-white p-1.5 rounded-lg cursor-pointer"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shadow-soft">
              <Shield size={15} className="text-white" />
            </div>
            <span className="font-bold text-xs text-accent-900 dark:text-white truncate max-w-[150px]">
              {isPlatform ? 'SecureAssess' : displayOrgName}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleClick}
            className="p-1.5 rounded-xl text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-800 cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={17} className="text-warning-400" /> : <Moon size={17} />}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
