import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import organizationService from '@/services/organization.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

export function useOrgUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentOrganization, userRole } = useOrganization();
  const { user } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const roleFromUrl = searchParams.get('role');
  const initialTab =
    roleFromUrl === 'admin'
      ? 'admin'
      : roleFromUrl === 'examiner'
      ? 'examiner'
      : roleFromUrl === 'proctor'
      ? 'proctor'
      : 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, member: null, loading: false });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewedMember, setViewedMember] = useState(null);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRolePreset, setInviteRolePreset] = useState('EXAMINER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EXAMINER');

  // Edit Role Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState('EXAMINER');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (roleFromUrl && ['admin', 'examiner', 'proctor', 'all'].includes(roleFromUrl)) {
      setActiveTab(roleFromUrl);
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
      if (!orgId) {
        setUsersList([]);
        setLoading(false);
        return;
      }
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
            const memberName = `${firstName} ${lastName}`.trim() || m.name || m.userId?.name || 'Staff Member';
            const memberEmail = m.userId?.email || m.email || m.invitedEmail || m.userEmail || '';
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
        setUsersList([]);
      }
    } catch (err) {
      console.warn('Members fetch error:', err.message);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openInviteModal = (presetRole = 'EXAMINER') => {
    setName('');
    setEmail('');
    setRole(presetRole);
    setInviteRolePreset(presetRole);
    setInviteModalOpen(true);
  };

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
        text: `Invitation email sent to ${email} with role ${role.replace('_', ' ')}!`,
      });
      setInviteModalOpen(false);
      setName('');
      setEmail('');
      fetchUsers();
    } catch (err) {
      console.error('Invite staff error:', err);
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to dispatch staff invitation email',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvitation = async (member) => {
    setResendingId(member._id || member.id);
    try {
      const orgId = currentOrganization?._id || currentOrganization?.id;
      await organizationService.inviteMember(orgId, {
        email: member.email,
        roleName: member.role,
        firstName: member.firstName || member.name?.split(' ')[0] || 'Staff',
        lastName: member.lastName || member.name?.split(' ').slice(1).join(' ') || '',
      });
      setToastMessage({
        type: 'success',
        text: `Invitation email resent to ${member.email}!`,
      });
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to resend invitation.',
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleUpdateRole = async (e) => {
    if (e) e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);
    try {
      const orgId = currentOrganization?._id || currentOrganization?.id;
      await organizationService.updateMemberRole(orgId, selectedMember._id || selectedMember.id, {
        roleName: newRole.toUpperCase(),
      });
      setToastMessage({
        type: 'success',
        text: `Role updated for ${selectedMember.name} to ${newRole}!`,
      });
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to update member role.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (member) => {
    setConfirmModal({ isOpen: true, member, loading: false });
  };

  const executeDeleteMember = async () => {
    const member = confirmModal.member;
    if (!member) return;
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const orgId = currentOrganization?._id || currentOrganization?.id;
      await organizationService.removeMember(orgId, member._id || member.id);
      setToastMessage({
        type: 'success',
        text: `Member ${member.name} removed from organization.`,
      });
      setConfirmModal({ isOpen: false, member: null, loading: false });
      fetchUsers();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to remove member.',
      });
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q);

    let matchesTab = true;
    if (activeTab === 'admin') {
      matchesTab = u.role.includes('ADMIN') || u.role.includes('OWNER');
    } else if (activeTab === 'examiner') {
      matchesTab = u.role.includes('EXAMINER');
    } else if (activeTab === 'proctor') {
      matchesTab = u.role.includes('PROCTOR');
    }

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = (u.status || '').toLowerCase() === statusFilter.toLowerCase();
    }

    return matchesSearch && matchesTab && matchesStatus;
  });

  return {
    usersList,
    filteredUsers,
    loading,
    search,
    setSearch,
    activeTab,
    handleTabChange,
    statusFilter,
    setStatusFilter,
    confirmModal,
    setConfirmModal,
    viewModalOpen,
    setViewModalOpen,
    viewedMember,
    setViewedMember,
    inviteModalOpen,
    setInviteModalOpen,
    name,
    setName,
    email,
    setEmail,
    role,
    setRole,
    editModalOpen,
    setEditModalOpen,
    selectedMember,
    setSelectedMember,
    newRole,
    setNewRole,
    isSubmitting,
    resendingId,
    toastMessage,
    setToastMessage,
    fetchUsers,
    openInviteModal,
    handleInviteStaff,
    handleResendInvitation,
    handleUpdateRole,
    handleDeleteMember,
    executeDeleteMember,
  };
}
