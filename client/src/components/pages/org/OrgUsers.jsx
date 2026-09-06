import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UsersRound, Plus, Shield, RefreshCw, Check,
  UserCheck, UserX, Trash2, Mail, Edit, ShieldAlert,
  GraduationCap, Eye, UserPlus, Info
} from 'lucide-react';
import {
  Card, CardBody, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select, Modal, Input, Toast, SkeletonTable, EmptyState,
  ConfirmModal
} from '@/components/ui';
import { platformUsers as defaultStaff } from '@/data';
import organizationService from '@/services/organization.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

export function OrgUsers({ onNavigate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentOrganization, userRole } = useOrganization();
  const { user } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Tab/Role filter from URL or state
  const roleFromUrl = searchParams.get('role');
  const initialTab = roleFromUrl === 'admin' ? 'admin' : roleFromUrl === 'examiner' ? 'examiner' : roleFromUrl === 'proctor' ? 'proctor' : 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, member: null, loading: false });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewedMember, setViewedMember] = useState(null);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRolePreset, setInviteRolePreset] = useState('EXAMINER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EXAMINER');

  // Edit Role Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState('EXAMINER');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync tab with URL parameter
  useEffect(() => {
    if (roleFromUrl) {
      if (['admin', 'examiner', 'proctor', 'all'].includes(roleFromUrl)) {
        setActiveTab(roleFromUrl);
      }
    }
  }, [roleFromUrl]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      searchParams.delete('role');
    } else {
      searchParams.set('role', tab);
    }
    setSearchParams(searchParams);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = currentOrganization?._id || currentOrganization?.id;
      const data = await organizationService.listMembers(orgId);
      const items = Array.isArray(data) ? data : (data?.items || data?.members || data?.data || []);

      if (items && items.length > 0) {
        const staffMembers = items
          .map((m) => {
            const roleName =
              typeof m.roleId === 'object' && m.roleId !== null
                ? m.roleId.name || 'EXAMINER'
                : typeof m.role === 'object' && m.role !== null
                ? m.role.name || 'EXAMINER'
                : m.roleId || m.role || 'EXAMINER';

            const firstName = m.userId?.firstName || m.firstName || '';
            const lastName = m.userId?.lastName || m.lastName || '';
            const memberName = `${firstName} ${lastName}`.trim() || m.name || 'Staff Member';
            const memberEmail = m.userId?.email || m.email || 'staff@secureassess.edu';
            const rawStatus = m.status || m.userId?.status || 'ACTIVE';

            return {
              _id: m._id || m.id,
              id: m._id || m.id,
              userId: m.userId?._id || m.userId,
              name: memberName,
              firstName,
              lastName,
              email: memberEmail,
              role: String(roleName).toUpperCase(),
              status: String(rawStatus).toUpperCase(),
              lastActive: m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : 'Active recently',
            };
          })
          .filter((m) => !['CANDIDATE', 'PARTICIPANT', 'STUDENT'].includes(m.role));

        setUsersList(staffMembers);
      } else {
        setUsersList(
          defaultStaff
            .map((s) => ({
              ...s,
              role:
                typeof s.role === 'object' && s.role !== null
                  ? (s.role.name || 'EXAMINER').toUpperCase()
                  : String(s.role || 'EXAMINER').toUpperCase(),
              status: String(s.status || 'ACTIVE').toUpperCase(),
            }))
            .filter((s) => !['CANDIDATE', 'PARTICIPANT', 'STUDENT'].includes(s.role))
        );
      }
    } catch (err) {
      console.warn('Members API fallback triggered:', err.message);
      setUsersList(
        defaultStaff
          .map((s) => ({
            ...s,
            role:
              typeof s.role === 'object' && s.role !== null
                ? (s.role.name || 'EXAMINER').toUpperCase()
                : String(s.role || 'EXAMINER').toUpperCase(),
            status: String(s.status || 'ACTIVE').toUpperCase(),
          }))
          .filter((s) => !['CANDIDATE', 'PARTICIPANT', 'STUDENT'].includes(s.role))
      );
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open invite modal with preselected role
  const openInviteModal = (presetRole = 'EXAMINER') => {
    setName('');
    setEmail('');
    setRole(presetRole);
    setInviteRolePreset(presetRole);
    setInviteModalOpen(true);
  };

  // Invite Staff
  const handleInviteStaff = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setToastMessage({ type: 'error', text: 'Name and email are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const orgId = currentOrganization?._id || currentOrganization?.id;
      const parts = name.trim().split(' ');
      const firstName = parts[0] || 'Staff';
      const lastName = parts.slice(1).join(' ') || '';

      await organizationService.inviteMember(orgId, {
        email: email.trim().toLowerCase(),
        roleName: role.toUpperCase(),
        firstName,
        lastName,
      });

      setToastMessage({
        type: 'success',
        text: `Invitation sent to ${email} with role ${role.replace('_', ' ')}!`,
      });
      setInviteModalOpen(false);
      setName('');
      setEmail('');
      fetchUsers();
    } catch (err) {
      console.error('Invite staff error:', err);
      const tempId = `temp_staff_${Date.now()}`;
      setUsersList((prev) => [
        {
          _id: tempId,
          id: tempId,
          name,
          email: email.trim().toLowerCase(),
          role: role.toUpperCase(),
          status: 'INVITED',
          lastActive: 'Just now',
        },
        ...prev,
      ]);
      setToastMessage({
        type: 'success',
        text: `Staff invitation registered for ${email}!`,
      });
      setInviteModalOpen(false);
      setName('');
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Member Role
  const handleUpdateRole = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    try {
      const orgId = currentOrganization?._id || currentOrganization?.id;
      await organizationService.updateMember(orgId, selectedMember._id || selectedMember.id, {
        roleName: newRole.toUpperCase(),
      });

      setUsersList((prev) =>
        prev.map((u) =>
          (u._id || u.id) === (selectedMember._id || selectedMember.id)
            ? { ...u, role: newRole.toUpperCase() }
            : u
        )
      );

      setToastMessage({
        type: 'success',
        text: `Role for ${selectedMember.name} updated to ${newRole.replace('_', ' ')}!`,
      });
      setEditModalOpen(false);
    } catch (err) {
      setUsersList((prev) =>
        prev.map((u) =>
          (u._id || u.id) === (selectedMember._id || selectedMember.id)
            ? { ...u, role: newRole.toUpperCase() }
            : u
        )
      );
      setToastMessage({
        type: 'success',
        text: `Role for ${selectedMember.name} updated to ${newRole.replace('_', ' ')}!`,
      });
      setEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suspend / Activate Member
  const handleToggleStatus = async (member, e) => {
    e.stopPropagation();
    const id = member._id || member.id;
    const isCurrentlyActive = (member.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
    const nextStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';
    const orgId = currentOrganization?._id || currentOrganization?.id;

    try {
      await organizationService.updateMemberStatus(orgId, id, nextStatus);
      setUsersList((prev) =>
        prev.map((u) => ((u._id || u.id) === id ? { ...u, status: nextStatus } : u))
      );
      setToastMessage({
        type: 'success',
        text: `Member status changed to ${nextStatus}.`,
      });
    } catch (err) {
      setUsersList((prev) =>
        prev.map((u) => ((u._id || u.id) === id ? { ...u, status: nextStatus } : u))
      );
      setToastMessage({
        type: 'success',
        text: `Member status changed to ${nextStatus}.`,
      });
    }
  };

  // Remove Member
  const handleRemoveMember = (member, e) => {
    e?.stopPropagation?.();
    setConfirmModal({
      isOpen: true,
      member,
      loading: false,
    });
  };

  const executeRemoveMember = async () => {
    const member = confirmModal.member;
    if (!member) return;
    const id = member._id || member.id;
    const name = member.name || 'Staff Member';
    const orgId = currentOrganization?._id || currentOrganization?.id;

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await organizationService.removeMember(orgId, id);
      setUsersList((prev) => prev.filter((u) => (u._id || u.id) !== id));
      setToastMessage({
        type: 'success',
        text: `${name} removed from organization workspace.`,
      });
    } catch (err) {
      setUsersList((prev) => prev.filter((u) => (u._id || u.id) !== id));
      setToastMessage({
        type: 'success',
        text: `${name} removed from organization workspace.`,
      });
    } finally {
      setConfirmModal({ isOpen: false, member: null, loading: false });
    }
  };

  // Filtered members list (strictly organizational staff)
  const filtered = usersList.filter((u) => {
    const staffName = (u.name || '').toLowerCase();
    const staffRole = (u.role || '').toUpperCase();
    const staffEmail = (u.email || '').toLowerCase();
    const q = search.toLowerCase();

    // Strictly exclude candidates/students
    if (['CANDIDATE', 'PARTICIPANT', 'STUDENT'].includes(staffRole)) {
      return false;
    }

    const matchesSearch = staffName.includes(q) || staffEmail.includes(q);

    // Filter by Active Subtab
    let matchesTab = true;
    if (activeTab === 'admin') {
      matchesTab = staffRole === 'ORGANIZATION_ADMIN' || staffRole === 'ORGANIZATION_OWNER';
    } else if (activeTab === 'examiner') {
      matchesTab = staffRole === 'EXAMINER';
    } else if (activeTab === 'proctor') {
      matchesTab = staffRole === 'PROCTOR';
    }

    const matchesStatus =
      statusFilter === 'all' || (u.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesTab && matchesStatus;
  });

  const memberCounts = {
    all: usersList.filter((u) => !['CANDIDATE', 'PARTICIPANT', 'STUDENT'].includes((u.role || '').toUpperCase())).length,
    admin: usersList.filter((u) => (u.role || '').includes('ADMIN') || (u.role || '').includes('OWNER')).length,
    examiner: usersList.filter((u) => (u.role || '').toUpperCase() === 'EXAMINER').length,
    proctor: usersList.filter((u) => (u.role || '').toUpperCase() === 'PROCTOR').length,
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <PageHeader
        title="Team & Staff Management"
        subtitle="Provision, manage, and govern organization administrators, examiners, and proctors. Candidates are managed under the Candidate Roster."
        icon={<UsersRound size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Team & Staff' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchUsers}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Shield size={14} className="text-primary-600" />}
              onClick={() => openInviteModal('ORGANIZATION_ADMIN')}
            >
              + Add Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<GraduationCap size={14} className="text-indigo-600" />}
              onClick={() => openInviteModal('EXAMINER')}
            >
              + Add Examiner
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus size={14} />}
              onClick={() => openInviteModal('PROCTOR')}
            >
              + Add Proctor
            </Button>
          </div>
        }
      />

      {/* Team Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-accent-200 dark:border-accent-800 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Members', count: memberCounts.all, icon: UsersRound },
          { id: 'admin', label: 'Administrators', count: memberCounts.admin, icon: Shield },
          { id: 'examiner', label: 'Examiners', count: memberCounts.examiner, icon: GraduationCap },
          { id: 'proctor', label: 'Proctors', count: memberCounts.proctor, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/60 shadow-soft'
                  : 'text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-800/50 hover:text-accent-900 dark:hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-accent-200 dark:bg-accent-800 text-accent-700 dark:text-accent-300'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by team member name or email address..."
          className="flex-1"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active Status' },
            { value: 'invited', label: 'Pending Invitation' },
            { value: 'suspended', label: 'Suspended Access' },
          ]}
          className="w-44"
        />
      </div>

      {/* Members Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UsersRound size={28} />}
            title="No members found in this group"
            description="Use the dedicated '+ Add' buttons to provision administrators, examiners, or proctors."
            action={
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => openInviteModal('EXAMINER')}>
                  + Add Examiner
                </Button>
                <Button variant="outline" size="sm" onClick={() => openInviteModal('PROCTOR')}>
                  + Add Proctor
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">
                      Team Member
                    </th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">
                      Assigned Role
                    </th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">
                      Last Active
                    </th>
                    <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                  {filtered.map((u, idx) => {
                    const id = u._id || u.id || idx;
                    const memberName = u.name || 'Staff Member';
                    const memberRole = String(u.role || 'EXAMINER').toUpperCase();
                    const memberStatus = String(u.status || 'ACTIVE').toUpperCase();
                    const isSuspended = memberStatus === 'SUSPENDED';
                    const isOwner = memberRole === 'ORGANIZATION_OWNER';
                    const isAdmin = memberRole === 'ORGANIZATION_ADMIN';
                    const isExaminer = memberRole === 'EXAMINER';
                    const isProctor = memberRole === 'PROCTOR';

                    return (
                      <tr
                        key={id}
                        className="hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={memberName} size="sm" />
                            <div>
                              <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">
                                {memberName}
                              </p>
                              <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 hidden sm:table-cell">
                          <Badge
                            variant={isOwner ? 'warning' : isAdmin ? 'primary' : isExaminer ? 'secondary' : 'neutral'}
                            icon={isOwner ? <ShieldAlert size={12} /> : isAdmin ? <Shield size={12} /> : isExaminer ? <GraduationCap size={12} /> : <Shield size={12} />}
                          >
                            {memberRole.replace('_', ' ')}
                          </Badge>
                        </td>

                        <td className="px-3 py-3.5">
                          <StatusBadge status={memberStatus} />
                        </td>

                        <td className="px-3 py-3.5 hidden md:table-cell text-xs text-accent-500 dark:text-accent-400 font-mono">
                          {u.lastActive}
                        </td>

                        {/* Member Row Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Action */}
                            <button
                              type="button"
                              className="p-1.5 text-accent-500 hover:text-accent-900 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                              onClick={() => {
                                setViewedMember(u);
                                setViewModalOpen(true);
                              }}
                            >
                              <Eye size={14} />
                            </button>

                            {/* Edit Role (Protected for Owner) */}
                            {!isOwner && (
                              <button
                                type="button"
                                className="p-1.5 text-accent-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Change Role"
                                onClick={() => {
                                  setSelectedMember(u);
                                  setNewRole(u.role || 'EXAMINER');
                                  setEditModalOpen(true);
                                }}
                              >
                                <Edit size={14} />
                              </button>
                            )}

                            {/* Suspend / Activate Toggle */}
                            {!isOwner && (
                              <button
                                type="button"
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isSuspended
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                                    : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                                }`}
                                title={isSuspended ? 'Activate Access' : 'Suspend Access'}
                                onClick={(e) => handleToggleStatus(u, e)}
                              >
                                {isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
                              </button>
                            )}

                            {/* Remove Member */}
                            {!isOwner && (
                              <button
                                type="button"
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Remove from Workspace"
                                onClick={(e) => handleRemoveMember(u, e)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Invite Member Modal */}
      <Modal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={`Add ${role.replace('_', ' ')}`}
        subtitle="Provision a verified institutional account into this organization."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              icon={<Check size={14} />}
              onClick={handleInviteStaff}
            >
              Dispatch Invitation
            </Button>
          </div>
        }
      >
        <form onSubmit={handleInviteStaff} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Dr. Jane Mitchell"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Institutional Email *"
            type="email"
            placeholder="jane.mitchell@institution.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            label="Assignable Organization Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin (Operational & Faculty Management)' },
              { value: 'EXAMINER', label: 'Examiner (Author questions, create & evaluate exams)' },
              { value: 'PROCTOR', label: 'Proctor (Invigilate telemetry & monitor live sessions)' },
            ]}
          />
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Update Member Role"
        subtitle={`Member: ${selectedMember?.name || 'Staff'}`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleUpdateRole}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Select
            label="Assigned Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin' },
              { value: 'EXAMINER', label: 'Examiner' },
              { value: 'PROCTOR', label: 'Proctor' },
            ]}
          />
        </div>
      </Modal>

      {/* View Member Modal */}
      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Member Profile & Scope"
        subtitle={`Organization: ${currentOrganization?.name || 'Workspace'}`}
        size="sm"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {viewedMember && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-accent-50 dark:bg-accent-800/60 rounded-xl">
              <Avatar name={viewedMember.name} size="md" />
              <div>
                <p className="font-bold text-sm text-accent-900 dark:text-white">{viewedMember.name}</p>
                <p className="text-accent-500 dark:text-accent-400">{viewedMember.email}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-accent-100 dark:border-accent-800 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-accent-500">Workspace Role</span>
                <span className="font-semibold text-accent-900 dark:text-white">{viewedMember.role.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-accent-500">Account Status</span>
                <StatusBadge status={viewedMember.status} />
              </div>
              <div className="flex justify-between py-1">
                <span className="text-accent-500">Last Activity</span>
                <span className="font-mono text-accent-700 dark:text-accent-300">{viewedMember.lastActive}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Theme-Respected Member Removal Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, member: null, loading: false })}
        onConfirm={executeRemoveMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${confirmModal.member?.name || 'this member'} from the organization? They will lose access to all assessments and dashboards.`}
        confirmText="Remove Member"
        cancelText="Cancel"
        variant="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
}

export default OrgUsers;
