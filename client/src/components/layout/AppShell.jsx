import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, FileText, PlusCircle, Library, Users, Video,
  ClipboardList, BarChart3, Settings, CreditCard, Shield, Building2,
  Sliders, UserPlus, FileSearch, ShieldCheck, Activity, Bell,
  ChevronDown, Sun, Moon, LogOut, Menu, X, Lock, GraduationCap, CheckSquare,
  Search, User, Award, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Badge, Avatar } from '@/components/ui';
import NotificationBell from '@/modules/notifications/components/NotificationBell';

export function AppShell({
  currentPage,
  activeView,
  onNavigate,
  children,
}) {
  const { user, logout, isPlatformAdmin, isPlatformStaff } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { currentOrganization, organizations, switchOrganization, t } = useOrganization();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const orgDropdownRef = useRef(null);

  const currentKey = activeView || currentPage || 'org-dashboard';

  const isPlatformUser = Boolean(
    typeof isPlatformAdmin === 'function'
      ? isPlatformAdmin()
      : isPlatformStaff || user?.platformRole === 'PLATFORM_OWNER' || user?.platformRole === 'PLATFORM_ADMIN'
  );

  const isPlatform = currentKey.startsWith('platform');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation schema for Platform Admins
  const platformNav = [
    { label: 'Platform Hub', icon: <LayoutDashboard size={18} />, id: 'platform-dashboard' },
    { label: 'Tenant Organizations', icon: <Building2 size={18} />, id: 'platform-organizations' },
    { label: 'Provision Tenant', icon: <UserPlus size={18} />, id: 'platform-onboarding' },
    { label: 'Platform Users', icon: <Users size={18} />, id: 'platform-users' },
    { label: 'Roles & RBAC', icon: <ShieldCheck size={18} />, id: 'platform-roles' },
    { label: 'System Analytics', icon: <BarChart3 size={18} />, id: 'platform-analytics' },
    { label: 'Security & Audit Logs', icon: <Lock size={18} />, id: 'platform-audit-logs' },
  ];

  // Navigation schema for Organization Staff
  const orgNav = [
    { label: 'Overview Dashboard', icon: <LayoutDashboard size={18} />, id: 'org-dashboard' },
    { label: t('structure'), icon: <GraduationCap size={18} />, id: 'org-academic-structure' },
    { label: 'Assessments Library', icon: <FileText size={18} />, id: 'org-assessments' },
    { label: 'Create Assessment', icon: <PlusCircle size={18} />, id: 'org-assessment-builder' },
    { label: 'Question Bank', icon: <Library size={18} />, id: 'org-question-bank' },
    { label: `${t('candidate')} Roster & ${t('candidateGroup', true)}`, icon: <Users size={18} />, id: 'org-participants' },
    { label: 'Evaluation Rubrics', icon: <CheckSquare size={18} />, id: 'org-rubrics' },
    { label: 'Proctoring Telemetry', icon: <ShieldCheck size={18} />, id: 'org-integrity' },
    { label: 'Session Recordings', icon: <Activity size={18} />, id: 'org-sessions' },
    { label: 'Live Interviews', icon: <Video size={18} />, id: 'org-interviews' },
    { label: `${t('grading')} & Rubrics`, icon: <ClipboardList size={18} />, id: 'org-evaluations' },
    { label: 'Certified Reports', icon: <BarChart3 size={18} />, id: 'org-reports' },
    { label: 'Verifiable Certificates', icon: <Award size={18} />, id: 'org-certificates' },
    { label: 'Notifications', icon: <Bell size={18} />, id: 'org-notifications' },
    { label: 'Security & Audit Logs', icon: <Lock size={18} />, id: 'org-audit-logs' },
    { label: 'Staff & Team', icon: <Users size={18} />, id: 'org-users' },
    { label: 'Resource Billing', icon: <CreditCard size={18} />, id: 'org-billing' },
    { label: 'Workspace Settings', icon: <Settings size={18} />, id: 'org-settings' },
  ];

  const currentNav = isPlatform ? platformNav : orgNav;

  const displayOrgName = currentOrganization?.name || user?.organizationName || 'Alpha Polytechnic Institute';
  const displayUserName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.name || (isPlatform ? 'Shaheer Ali (Platform Owner)' : 'Dr. Alan Turing');
  const displayUserEmail = user?.email || (isPlatform ? 'owner@secureassess.io' : 'admin@alpha.edu');
  const displayUserRole = user?.role || user?.platformRole || (isPlatform ? 'PLATFORM_OWNER' : 'ORG_ADMIN');

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-accent-900 border-r border-accent-200 dark:border-accent-800 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-accent-100 dark:border-accent-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white shadow-soft shrink-0">
            <Shield size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm font-display tracking-tight text-accent-900 dark:text-white truncate">
              Secure<span className="text-primary-600 dark:text-primary-400">Assess</span>
            </h1>
            <p className="text-[10px] text-accent-400 font-semibold tracking-wider uppercase">
              {isPlatform ? 'Platform Owner Console' : 'Tenant Workspace'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-400">
          Navigation Menu
        </div>
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
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-accent-100 dark:border-accent-800">
        <div className="p-2.5 rounded-xl bg-accent-50 dark:bg-accent-800/40 border border-accent-200/60 dark:border-accent-700/40 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-accent-700 dark:text-accent-300">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>SecureAssess v2.0</span>
          </div>
          <p className="text-[10px] text-accent-400 mt-0.5">Production Architecture</p>
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

      {/* Main Content Area with Top Navbar */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-accent-900/95 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 px-4 sm:px-6 flex items-center justify-between shadow-soft">
          {/* Left: Mobile Toggle & Context Info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-white p-1.5 rounded-lg cursor-pointer"
            >
              <Menu size={20} />
            </button>

            {/* Tenant Org Selector or Platform Badge */}
            {isPlatform ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center gap-1.5">
                  <Shield size={13} className="text-primary-500" />
                  <span>Platform Super Admin</span>
                </span>
              </div>
            ) : (
              <div className="relative" ref={orgDropdownRef}>
                <button
                  type="button"
                  onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-50 dark:bg-accent-800/70 border border-accent-200 dark:border-accent-700 text-xs font-semibold text-accent-800 dark:text-accent-200 hover:bg-accent-100 dark:hover:bg-accent-700 transition-colors cursor-pointer"
                >
                  <Building2 size={14} className="text-primary-500 shrink-0" />
                  <span className="max-w-[160px] sm:max-w-[220px] truncate">{displayOrgName}</span>
                  {organizations.length > 1 && <ChevronDown size={13} className="text-accent-400" />}
                </button>

                {orgDropdownOpen && organizations.length > 1 && (
                  <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-accent-800 border border-accent-200 dark:border-accent-700 rounded-xl shadow-strong py-1 z-50 animate-scale-in">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-400 border-b border-accent-100 dark:border-accent-700">
                      Switch Organization Tenant
                    </div>
                    {organizations.map((org) => {
                      const orgId = org._id || org.id;
                      const isSelected = (currentOrganization?._id || currentOrganization?.id) === orgId;
                      return (
                        <button
                          key={orgId}
                          type="button"
                          onClick={() => {
                            switchOrganization(orgId);
                            setOrgDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-accent-50 dark:hover:bg-accent-700 cursor-pointer ${
                            isSelected
                              ? 'text-primary-600 dark:text-primary-400 font-bold bg-primary-50/50 dark:bg-primary-950/40'
                              : 'text-accent-700 dark:text-accent-300'
                          }`}
                        >
                          <span className="truncate">{org.name}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Switch Mode + Notifications + Theme + User Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Switch between Platform Admin & Org Workspace for Platform Staff */}
            {isPlatformUser && (
              <button
                type="button"
                onClick={() => onNavigate(isPlatform ? 'org-dashboard' : 'platform-dashboard')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-700 transition-colors cursor-pointer border border-accent-200 dark:border-accent-700"
              >
                <Sliders size={13} />
                <span>{isPlatform ? 'Switch to Org Workspace' : 'Switch to Platform Admin'}</span>
              </button>
            )}

            {/* Notification Bell */}
            <NotificationBell onViewAll={() => onNavigate('org-notifications')} />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={handleToggleClick}
              className="p-2 rounded-xl text-accent-500 hover:text-accent-800 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={18} className="text-warning-400" /> : <Moon size={18} />}
            </button>

            {/* User Profile Dropdown in Top Navbar */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer border border-transparent hover:border-accent-200 dark:hover:border-accent-700"
              >
                <Avatar
                  name={displayUserName}
                  size="sm"
                  color={isPlatform ? '#2563eb' : '#0d9488'}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-accent-900 dark:text-white leading-tight">
                    {displayUserName}
                  </p>
                  <p className="text-[10px] text-accent-500 dark:text-accent-400 font-mono">
                    {displayUserRole}
                  </p>
                </div>
                <ChevronDown size={14} className="text-accent-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-accent-800 border border-accent-200 dark:border-accent-700 rounded-2xl shadow-strong p-2 z-50 animate-scale-in">
                  <div className="p-3 border-b border-accent-100 dark:border-accent-700">
                    <p className="text-xs font-bold text-accent-900 dark:text-white truncate">
                      {displayUserName}
                    </p>
                    <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">
                      {displayUserEmail}
                    </p>
                    <Badge variant="primary" className="mt-2 text-[10px]">
                      {displayUserRole}
                    </Badge>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('org-settings');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-700/60 rounded-xl cursor-pointer"
                    >
                      <Settings size={14} />
                      <span>Account & Workspace Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('org-billing');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-700/60 rounded-xl cursor-pointer"
                    >
                      <CreditCard size={14} />
                      <span>Billing & Subscriptions</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-accent-100 dark:border-accent-700">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-xl cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
