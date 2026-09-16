import React from 'react';
import { UsersRound, RefreshCw } from 'lucide-react';
import { PageHeader, Button, Toast } from '@/components/ui';
import {
  useOrgUsers,
  OrgUsersFilterToolbar,
  OrgUsersTable,
  OrgUsersModals,
} from '../components/org-users';

export function OrgUsers({ onNavigate }) {
  const {
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
  } = useOrgUsers();

  const handleOpenEditRole = (member) => {
    setNewRole(member.role || 'EXAMINER');
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <PageHeader
        title="Faculty, Examiners & Staff"
        subtitle="Manage institutional access, examiner permissions, proctoring roles, and invitations."
        icon={<UsersRound size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate?.('org-dashboard') },
          { label: 'Staff Management' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchUsers}
          >
            Sync Roster
          </Button>
        }
      />

      {/* Filter and Role Toolbar */}
      <OrgUsersFilterToolbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        usersList={usersList}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenInviteModal={openInviteModal}
      />

      {/* Roster Table */}
      <OrgUsersTable
        filteredUsers={filteredUsers}
        resendingId={resendingId}
        onResendInvitation={handleResendInvitation}
        onOpenEditRole={handleOpenEditRole}
        onDeleteMember={handleDeleteMember}
      />

      {/* Modals Suite */}
      <OrgUsersModals
        inviteModalOpen={inviteModalOpen}
        setInviteModalOpen={setInviteModalOpen}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        role={role}
        setRole={setRole}
        isSubmitting={isSubmitting}
        handleInviteStaff={handleInviteStaff}
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        selectedMember={selectedMember}
        newRole={newRole}
        setNewRole={setNewRole}
        handleUpdateRole={handleUpdateRole}
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        executeDeleteMember={executeDeleteMember}
      />
    </div>
  );
}

export default OrgUsers;
