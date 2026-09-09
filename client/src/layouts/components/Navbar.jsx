import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { LogOut, Building2, Shield, User, ChevronDown } from 'lucide-react';
import { ROLE_LABELS } from '../../constants/roles';

export const Navbar = ({ portalType = 'organization' }) => {
  const { user, logout, isPlatformStaff } = useAuth();
  const { organizations, currentOrganization, switchOrganization, userRole } = useOrganization();

  return (
    <header className="h-16 bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold shadow-soft">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-accent-900 dark:text-white tracking-tight">
            Secure<span className="text-primary-600 dark:text-primary-400">Assess</span>
          </span>
        </div>

        <div className="hidden md:flex items-center">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-700">
            {portalType === 'platform'
              ? 'Platform Super Admin'
              : portalType === 'candidate'
              ? 'Candidate Workspace'
              : 'Organization Portal'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Tenant Switcher for Multi-Org Users / Platform Staff */}
        {portalType === 'organization' && organizations.length > 1 && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent-200 dark:border-accent-700 bg-accent-50 dark:bg-accent-800 text-xs font-medium text-accent-800 dark:text-accent-200 hover:bg-accent-100 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-primary-500" />
              <span className="max-w-[140px] truncate">
                {currentOrganization?.name || 'Select Organization'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-accent-800 border border-accent-200 dark:border-accent-700 rounded-xl shadow-medium py-1.5 hidden group-hover:block z-50 animate-scale-in">
              <div className="px-3 py-1 text-[11px] font-semibold text-accent-400 uppercase tracking-wider">
                Switch Organization
              </div>
              {organizations.map((orgItem) => {
                const org = orgItem.organization || orgItem;
                const isSelected = org._id === currentOrganization?._id;
                return (
                  <button
                    key={org._id}
                    onClick={() => switchOrganization(org._id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-accent-100 dark:hover:bg-accent-700 transition-colors ${
                      isSelected ? 'font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40' : 'text-accent-700 dark:text-accent-300'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-accent-200 dark:border-accent-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-accent-900 dark:text-white leading-tight">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
            </p>
            <p className="text-[11px] text-accent-500 dark:text-accent-400">
              {ROLE_LABELS[userRole || user?.platformRole] || userRole || 'User'}
            </p>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs border border-primary-200 dark:border-primary-800">
            {user?.firstName ? user.firstName[0].toUpperCase() : <User className="w-4 h-4" />}
          </div>

          <button
            onClick={logout}
            title="Sign out of SecureAssess"
            className="p-2 rounded-lg text-accent-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
