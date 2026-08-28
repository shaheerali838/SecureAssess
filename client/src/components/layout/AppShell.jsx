import { useState } from 'react';
import {
  LayoutDashboard, Building2, CreditCard, Package, BarChart3, TrendingUp,
  LifeBuoy, Shield, Settings, Menu, X, ChevronDown, LogOut, ArrowLeft,
  Moon, Sun, Check, User
} from 'lucide-react';
import { orgNav, platformNav } from '@/data';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ROLE_LABELS } from '@/constants/roles';

const iconMap = {
  LayoutDashboard: <LayoutDashboard size={18} />,
  Building2: <Building2 size={18} />,
  CreditCard: <CreditCard size={18} />,
  Package: <Package size={18} />,
  BarChart3: <BarChart3 size={18} />,
  TrendingUp: <TrendingUp size={18} />,
  LifeBuoy: <LifeBuoy size={18} />,
  Shield: <Shield size={18} />,
  Settings: <Settings size={18} />,
};

export function AppShell({
  context,
  activeView,
  onNavigate,
  onExit,
  orgName: propOrgName,
  orgLogoText: propLogoText,
  orgBrandColor: propBrandColor,
  children
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  const { user, logout, isPlatformStaff } = useAuth();
  const { organizations, currentOrganization, switchOrganization, userRole } = useOrganization();
  const { theme, toggleTheme, isDark } = useTheme();

  const isPlatform = context.layer === 'platform';
  const navItems = isPlatform ? platformNav : orgNav;

  const displayOrgName = currentOrganization?.name || propOrgName || 'Organization';
  const displayLogoText = currentOrganization?.code || propLogoText || 'SA';
  const displayBrandColor = currentOrganization?.settings?.branding?.primaryColor || propBrandColor || '#2563eb';

  const userDisplayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : isPlatform
    ? 'Platform Administrator'
    : 'Sarah Mitchell';

  const userEmail = user?.email || (isPlatform ? 'admin@secureassess.com' : 'user@organization.com');
  const roleDisplay = ROLE_LABELS[userRole || user?.platformRole] || (isPlatform ? 'Platform Owner' : 'Organization Admin');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-accent-900 border-r border-accent-200 dark:border-accent-800 transition-colors duration-200">
      {/* Logo / Brand Header */}
      <div className="px-5 py-4 border-b border-accent-200 dark:border-accent-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isPlatform ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center shrink-0 shadow-soft">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold font-display text-accent-900 dark:text-white text-sm leading-tight truncate">
                    Secure<span className="text-primary-600 dark:text-primary-400">Assess</span>
                  </p>
                  <p className="text-[11px] text-accent-500 dark:text-accent-400 font-medium leading-tight">
                    Platform Admin
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-xs shadow-soft tracking-wider uppercase"
                  style={{ backgroundColor: displayBrandColor }}
                >
                  {displayLogoText.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold font-display text-accent-900 dark:text-white text-sm leading-tight truncate">
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
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-accent-500 hover:text-accent-800 dark:hover:text-accent-200 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun size={16} className="text-warning-400" /> : <Moon size={16} />}
          </button>
        </div>

        {/* Tenant Organization Switcher (if multi-org) */}
        {!isPlatform && organizations.length > 1 && (
          <div className="mt-3 relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700 text-xs font-medium text-accent-700 dark:text-accent-200 hover:bg-accent-100 transition-colors"
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
                {organizations.map((orgItem) => {
                  const org = orgItem.organization || orgItem;
                  const isSelected = org._id === currentOrganization?._id;
                  return (
                    <button
                      key={org._id}
                      onClick={() => {
                        switchOrganization(org._id);
                        setOrgDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-accent-50 dark:hover:bg-accent-700 transition-colors ${
                        isSelected ? 'font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40' : 'text-accent-700 dark:text-accent-200'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      {isSelected && <Check size={13} className="text-primary-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-accent-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.label}
              onClick={() => {
                onNavigate(item.key);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 shadow-soft'
                  : 'text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-800 hover:text-accent-900 dark:hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-accent-500'}>
                {iconMap[item.icon] || <LayoutDashboard size={18} />}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="px-3 py-3 border-t border-accent-200 dark:border-accent-800">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-soft">
              {user?.firstName ? user.firstName[0].toUpperCase() : <User size={16} />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">
                {userDisplayName}
              </p>
              <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">
                {roleDisplay}
              </p>
            </div>
            <ChevronDown size={14} className="text-accent-400 shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-accent-800 rounded-xl shadow-medium border border-accent-200 dark:border-accent-700 py-1.5 z-50 animate-scale-in">
              <div className="px-3 py-1.5 border-b border-accent-100 dark:border-accent-700 mb-1">
                <p className="text-[11px] font-bold text-accent-900 dark:text-white truncate">{userDisplayName}</p>
                <p className="text-[10px] text-accent-400 truncate">{userEmail}</p>
              </div>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  onExit();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-700 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Return to Landing</span>
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                  onExit();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors"
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
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-accent-100 flex transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="w-64 fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col shadow-soft">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-accent-950/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="w-64 fixed inset-y-0 left-0 z-50 lg:hidden animate-slide-in-left shadow-strong">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-accent-400 hover:text-accent-700 dark:hover:text-white z-10 p-1"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-accent-900 border-b border-accent-200 dark:border-accent-800 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-accent-600 dark:text-accent-300 hover:text-accent-900 p-1 rounded-lg"
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
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-800"
          >
            {isDark ? <Sun size={16} className="text-warning-400" /> : <Moon size={16} />}
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
