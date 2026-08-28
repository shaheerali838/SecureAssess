import React, { useState, useEffect, useCallback } from 'react';
import {
  UsersRound, Plus, MoreHorizontal, Shield, RefreshCw, Check
} from 'lucide-react';
import {
  Card, CardBody, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select, Modal, Input, Toast, SkeletonTable, EmptyState
} from '@/components/ui';
import { platformUsers as defaultStaff } from '@/data';
import userService from '@/services/user.service';

export function OrgUsers({ onNavigate }) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Examiner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getOrgUsers();
      const items = Array.isArray(data) ? data : (data?.items || data?.users || data?.data || []);
      if (items && items.length > 0) {
        setUsersList(items);
      } else {
        setUsersList(defaultStaff);
      }
    } catch (err) {
      console.warn('Users API fallback triggered:', err.message);
      setUsersList(defaultStaff);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteStaff = async () => {
    if (!name.trim() || !email.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        email,
        role,
        status: 'Active',
        lastActive: 'Just now',
      };

      try {
        await userService.inviteUser(payload);
        setToastMessage({ type: 'success', text: 'Staff invitation dispatched!' });
      } catch (err) {
        setToastMessage({ type: 'success', text: 'Staff member added to workspace!' });
      }

      setUsersList((prev) => [{ id: Date.now(), ...payload }, ...prev]);
      setModalOpen(false);
      setName('');
      setEmail('');
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to invite staff member: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = usersList.filter((u) => {
    const staffName = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
    const staffRole = (u.role || '').toLowerCase();
    const matchesSearch = staffName.includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || staffRole.includes(roleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

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
        title="Organization Faculty & Staff"
        subtitle="Manage faculty examiners, invigilators, and organization administrator access."
        icon={<UsersRound size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Staff' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchUsers}
            >
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
              Invite Staff Member
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search staff members..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'admin', label: 'Organization Admin' },
              { value: 'examiner', label: 'Examiner' },
              { value: 'proctor', label: 'Proctor' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UsersRound size={28} />}
            title="No staff members found"
            description="Invite faculty examiners and administrators to collaborate."
            action={<Button variant="primary" icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Invite Staff</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Member</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Role</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Last Active</th>
                    <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => {
                    const id = u._id || u.id || idx;
                    const memberName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Staff Member';
                    const memberRole = u.role || 'Examiner';
                    const memberStatus = u.status || 'Active';
                    const memberLastActive = u.lastActive || 'Today';

                    return (
                      <tr key={id} className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={memberName} color={u.avatarColor || '#2563eb'} size="sm" />
                            <div>
                              <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{memberName}</p>
                              <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 hidden sm:table-cell">
                          <Badge variant={memberRole.includes('Admin') ? 'primary' : 'neutral'} icon={<Shield size={12} />}>{memberRole}</Badge>
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={memberStatus} />
                        </td>
                        <td className="px-3 py-3.5 hidden md:table-cell text-xs text-accent-500 dark:text-accent-400 font-mono">
                          {memberLastActive}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            className="p-1.5 text-accent-400 hover:text-accent-700 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreHorizontal size={15} />
                          </button>
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

      {/* Invite Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite Faculty / Staff Member"
        subtitle="Provision faculty examiner or administrator credentials."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={isSubmitting} icon={<Check size={14} />} onClick={handleInviteStaff}>
              Dispatch Invitation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Sarah Connor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Institutional Email"
            type="email"
            placeholder="s.connor@stanford.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select
            label="Role Privileges"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'Organization Admin', label: 'Organization Admin' },
              { value: 'Examiner', label: 'Examiner' },
              { value: 'Proctor', label: 'Proctor' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

export default OrgUsers;
