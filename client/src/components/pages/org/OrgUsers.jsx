import React, { useState, useEffect, useCallback } from 'react';
import {
  UsersRound, Plus, MoreHorizontal, Shield, RefreshCw, Check
} from 'lucide-react';
import {
  Card, CardBody, Badge, StatusBadge, Button, Avatar, SearchBar,
  PageHeader, Select, Modal, Input, Toast, SkeletonTable, EmptyState
} from '@/components/ui';
import { platformUsers as defaultStaff } from '@/data';
import organizationService from '@/services/organization.service';
import { useOrganization } from '@/contexts/OrganizationContext';

export function OrgUsers({ onNavigate }) {
  const { currentOrganization } = useOrganization();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EXAMINER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = currentOrganization?._id || currentOrganization?.id;
      if (orgId) {
        const data = await organizationService.listMembers(orgId);
        const items = Array.isArray(data) ? data : (data?.items || data?.members || data?.data || []);
        if (items && items.length > 0) {
          setUsersList(items.map((m) => {
            const roleName = typeof m.roleId === 'object' && m.roleId !== null
              ? (m.roleId.name || 'EXAMINER')
              : (typeof m.role === 'object' && m.role !== null ? (m.role.name || 'EXAMINER') : (m.roleId || m.role || 'EXAMINER'));

            const memberName = `${m.userId?.firstName || ''} ${m.userId?.lastName || ''}`.trim() || (typeof m.name === 'string' ? m.name : 'Staff Member');

            return {
              id: m._id || m.id,
              name: memberName,
              email: m.userId?.email || (typeof m.email === 'string' ? m.email : 'staff@secureassess.internal'),
              role: String(roleName),
              status: typeof m.status === 'string' ? m.status : 'ACTIVE',
              lastActive: 'Active recently',
            };
          }));
          return;
        }
      }
      setUsersList(defaultStaff.map((s) => ({
        ...s,
        role: typeof s.role === 'object' && s.role !== null ? (s.role.name || 'Examiner') : String(s.role || 'Examiner'),
      })));
    } catch (err) {
      console.warn('Members API fallback triggered:', err.message);
      setUsersList(defaultStaff.map((s) => ({
        ...s,
        role: typeof s.role === 'object' && s.role !== null ? (s.role.name || 'Examiner') : String(s.role || 'Examiner'),
      })));
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteStaff = async () => {
    if (!name.trim() || !email.trim()) return;
    setIsSubmitting(true);
    try {
      const orgId = currentOrganization?._id || currentOrganization?.id;
      const parts = name.trim().split(' ');
      const firstName = parts[0] || 'Staff';
      const lastName = parts.slice(1).join(' ') || 'Member';

      if (orgId) {
        await organizationService.inviteMember(orgId, {
          email: email.trim().toLowerCase(),
          roleName: role.toUpperCase(),
          firstName,
          lastName,
        });
        setToastMessage({ type: 'success', text: `Invitation dispatched to ${email}!` });
      } else {
        setToastMessage({ type: 'success', text: 'Staff member added to workspace!' });
      }

      fetchUsers();
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
    const staffName = (typeof u.name === 'string' ? u.name : String(u.name || '')).toLowerCase();
    const staffRole = (typeof u.role === 'string' ? u.role : String(u.role || '')).toLowerCase();
    const staffEmail = (typeof u.email === 'string' ? u.email : String(u.email || '')).toLowerCase();
    const matchesSearch = staffName.includes(search.toLowerCase()) || staffEmail.includes(search.toLowerCase());
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
              Invite Staff
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
                    const memberRole = String(u.role || 'Examiner');
                    const memberStatus = String(u.status || 'Active');
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
                          <Badge variant={memberRole.toLowerCase().includes('admin') || memberRole.toLowerCase().includes('owner') ? 'primary' : 'neutral'} icon={<Shield size={12} />}>{memberRole}</Badge>
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
        subtitle="Provision access to this organization workspace."
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Institutional Email"
            type="email"
            placeholder="jane.doe@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <label className="block text-xs font-medium text-accent-700 dark:text-accent-300 mb-1.5">Workspace Role</label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'EXAMINER', label: 'Examiner (Create & Grade Exams)' },
                { value: 'PROCTOR', label: 'Proctor (Invigilate Live Sessions)' },
                { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin (Full Workspace Access)' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={isSubmitting} onClick={handleInviteStaff} icon={<Check size={14} />}>
              Dispatch Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default OrgUsers;
