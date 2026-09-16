import React from 'react';
import { Modal, Button, Input, Select, ConfirmModal } from '@/components/ui';

export function OrgUsersModals({
  inviteModalOpen,
  setInviteModalOpen,
  name,
  setName,
  email,
  setEmail,
  role,
  setRole,
  isSubmitting,
  handleInviteStaff,

  editModalOpen,
  setEditModalOpen,
  selectedMember,
  newRole,
  setNewRole,
  handleUpdateRole,

  confirmModal,
  setConfirmModal,
  executeDeleteMember,
}) {
  return (
    <>
      {/* Invite Member Modal */}
      <Modal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Organization Member"
        subtitle="Send an official email invitation to add faculty, examiner, or proctor"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="invite-user-form"
              loading={isSubmitting}
            >
              Dispatch Invitation
            </Button>
          </div>
        }
      >
        <form id="invite-user-form" onSubmit={handleInviteStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Full Name *
            </label>
            <Input
              required
              placeholder="e.g. Dr. Alan Turing"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Email Address *
            </label>
            <Input
              type="email"
              required
              placeholder="e.g. aturing@stanford.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Assigned Platform Role *
            </label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'EXAMINER', label: 'Examiner / Faculty Evaluator' },
                { value: 'PROCTOR', label: 'Proctor / Integrity Monitor' },
                { value: 'ORGANIZATION_ADMIN', label: 'Organization Administrator' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Update Member Role"
        subtitle={`Modify permissions for ${selectedMember?.name || 'staff member'}`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="edit-role-form"
              loading={isSubmitting}
            >
              Save Role
            </Button>
          </div>
        }
      >
        <form id="edit-role-form" onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Assigned Role
            </label>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={[
                { value: 'EXAMINER', label: 'Examiner / Faculty Evaluator' },
                { value: 'PROCTOR', label: 'Proctor / Integrity Monitor' },
                { value: 'ORGANIZATION_ADMIN', label: 'Organization Administrator' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Member Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, member: null, loading: false })}
        onConfirm={executeDeleteMember}
        title="Remove Staff Member?"
        message={`Are you sure you want to remove ${confirmModal.member?.name} from this organization? Their access to scheduled sessions will be revoked.`}
        confirmText="Remove Member"
        variant="danger"
        loading={confirmModal.loading}
      />
    </>
  );
}
