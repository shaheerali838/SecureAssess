import { useState } from 'react';
import {
  LayoutDashboard, Building2, CreditCard, Package, BarChart3, TrendingUp,
  LifeBuoy, Shield, Settings, Menu, X, ChevronDown, LogOut, ArrowLeft,
} from 'lucide-react';
import { orgNav, platformNav } from '@/data';


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












export function AppShell({ context, activeView, onNavigate, onExit, orgName, orgLogoText, orgBrandColor, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = context.layer === 'platform' ? platformNav : orgNav;
  const isPlatform = context.layer === 'platform';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-accent-200">
        <div className="flex items-center gap-3">
          {isPlatform ? (
            <>
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-accent-900 text-sm leading-tight">SecureAssess</p>
                <p className="text-xs text-accent-500 leading-tight">Platform Admin</p>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-white text-sm"
                style={{ backgroundColor: orgBrandColor || '#2563eb' }}
              >
                {orgLogoText || 'SA'}
              </div>
              <div>
                <p className="font-bold text-accent-900 text-sm leading-tight">{orgName || 'Organization'}</p>
                <p className="text-xs text-accent-500 leading-tight">Powered by SecureAssess</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.label}
              onClick={() => {
                onNavigate(item.key );
                setMobileOpen(false);
              }}
              className={`nav-link w-full ${isActive ? 'nav-link-active' : ''}`}
            >
              {iconMap[item.icon] || <LayoutDashboard size={18} />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-accent-200">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {isPlatform ? 'PA' : 'SA'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-accent-800 truncate">{isPlatform ? 'Platform Admin' : 'Sarah Mitchell'}</p>
              <p className="text-xs text-accent-500 truncate">{isPlatform ? 'admin@secureassess.com' : 'sarah@vu.edu'}</p>
            </div>
            <ChevronDown size={16} className="text-accent-400" />
          </button>
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-medium border border-accent-200 py-1 animate-fade-in">
              <button onClick={onExit} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors">
                <ArrowLeft size={16} />
                Switch Workspace
              </button>
              <button onClick={onExit} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-accent-50 flex">
      {/* Desktop sidebar */}
      <aside className="w-64 bg-white border-r border-accent-200 flex flex-col fixed inset-y-0 left-0 z-30 hidden lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-accent-950/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="w-64 bg-white border-r border-accent-200 flex flex-col fixed inset-y-0 left-0 z-50 lg:hidden animate-slide-in-left">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-accent-400 hover:text-accent-700">
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-accent-200 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="text-accent-600 hover:text-accent-900">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-accent-900">{isPlatform ? 'SecureAssess' : orgName}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-xs">
            {isPlatform ? 'PA' : 'SA'}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
