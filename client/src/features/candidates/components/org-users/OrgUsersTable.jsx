import React from 'react';
import { Mail, Edit, Trash2, Send } from 'lucide-react';
import { Badge, StatusBadge, Button, Avatar } from '@/components/ui';

export function OrgUsersTable({
  filteredUsers,
  resendingId,
  onResendInvitation,
  onOpenEditRole,
  onOpenViewModal,
  onDeleteMember,
}) {
  if (filteredUsers.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl text-xs text-accent-500">
        No staff members found matching your search and filter criteria.
      </div>
    );
  }

  const getRoleBadgeVariant = (role) => {
    if (role.includes('ADMIN') || role.includes('OWNER')) return 'primary';
    if (role.includes('EXAMINER')) return 'secondary';
    if (role.includes('PROCTOR')) return 'outline';
    return 'outline';
  };

  return (
    <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-accent-700 dark:text-accent-300">
          <thead className="bg-accent-50/70 dark:bg-accent-800/40 border-b border-accent-100 dark:border-accent-800 text-[11px] font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
            <tr>
              <th className="px-5 py-3.5">Staff Member</th>
              <th className="px-5 py-3.5">Assigned Role</th>
              <th className="px-5 py-3.5">Membership Status</th>
              <th className="px-5 py-3.5">Last Active</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
            {filteredUsers.map((member) => {
              const isPending = member.status === 'PENDING' || member.status === 'INVITED';
              const isResending = resendingId === (member._id || member.id);

              return (
                <tr
                  key={member._id || member.id}
                  className="hover:bg-accent-50/50 dark:hover:bg-accent-850/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" color="#3b82f6" />
                      <div>
                        <p className="font-bold text-accent-900 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-accent-500 font-mono">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge status={member.status} />
                  </td>

                  <td className="px-5 py-3.5 text-accent-500 text-[11px]">
                    {member.lastActive}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isPending && (
                        <Button
                          variant="ghost"
                          size="xs"
                          title="Resend Invitation Email"
                          loading={isResending}
                          icon={<Send size={13} className="text-primary-600" />}
                          onClick={() => onResendInvitation(member)}
                        >
                          Resend
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="xs"
                        title="Edit Role & Permissions"
                        icon={<Edit size={13} />}
                        onClick={() => onOpenEditRole(member)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="xs"
                        title="Remove Member"
                        className="text-danger-500 hover:text-danger-600"
                        icon={<Trash2 size={13} />}
                        onClick={() => onDeleteMember(member)}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
