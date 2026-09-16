import React from 'react';
import { UsersRound, Shield, GraduationCap, Eye, Search, Plus } from 'lucide-react';
import { Button, Select } from '@/components/ui';

export function OrgUsersFilterToolbar({
  activeTab,
  onTabChange,
  usersList,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onOpenInviteModal,
}) {
  const adminCount = usersList.filter((u) => u.role.includes('ADMIN') || u.role.includes('OWNER')).length;
  const examinerCount = usersList.filter((u) => u.role.includes('EXAMINER')).length;
  const proctorCount = usersList.filter((u) => u.role.includes('PROCTOR')).length;

  return (
    <div className="space-y-3">
      {/* Role Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-accent-100 dark:bg-accent-800 rounded-xl">
          <button
            type="button"
            onClick={() => onTabChange('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <UsersRound size={14} />
            <span>All Staff ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <Shield size={14} />
            <span>Administrators ({adminCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('examiner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'examiner'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap size={14} />
            <span>Examiners & Faculty ({examinerCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('proctor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'proctor'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <Eye size={14} />
            <span>Proctors ({proctorCount})</span>
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => onOpenInviteModal('EXAMINER')}
        >
          Invite Member
        </Button>
      </div>

      {/* Filter and Search Inputs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-accent-400" />
          <input
            type="text"
            placeholder="Search members by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 text-xs h-9 rounded-xl bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active Members' },
            { value: 'pending', label: 'Pending Invitations' },
            { value: 'inactive', label: 'Inactive / Suspended' },
          ]}
          className="w-full sm:w-44"
        />
      </div>
    </div>
  );
}
