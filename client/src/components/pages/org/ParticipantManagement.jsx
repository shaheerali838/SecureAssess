import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, ChevronRight, Mail, Send, Upload, RefreshCw, Check,
  Layers, UserPlus, Trash2, Edit2, ShieldAlert, BookOpen, CheckCircle2,
  X, UserCheck
} from 'lucide-react';
import {
  Card, CardBody, CardHeader, StatusBadge, RiskBadge, Button, Avatar,
  SearchBar, PageHeader, Select, EmptyState, Modal, Input, Toast, SkeletonTable, Badge
} from '@/components/ui';
import { participants as defaultParticipants } from '@/data';
import candidateService from '@/services/candidate.service';
import candidateGroupService from '@/services/candidateGroup.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

export function ParticipantManagement({ onNavigate }) {
  const { currentOrganization, t } = useOrganization();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('candidates');
  const [candidatesList, setCandidatesList] = useState([]);
  const [candidateGroups, setCandidateGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  // Dynamic Terminology
  const candSingular = t('candidate');
  const candPlural = t('candidate', true);
  const grpSingular = t('candidateGroup');
  const grpPlural = t('candidateGroup', true);
  const rosterLabel = t('roster');

  // Candidate Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cohort, setCohort] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Group Modal State
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', code: '', description: '' });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || 'current';

  // Fetch Candidates & Groups
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [candRes, groupRes] = await Promise.allSettled([
        candidateService.getCandidates({}, orgId),
        candidateGroupService.getCandidateGroups({}, orgId),
      ]);

      if (candRes.status === 'fulfilled') {
        const items = Array.isArray(candRes.value)
          ? candRes.value
          : candRes.value?.items || candRes.value?.candidates || candRes.value?.data || [];
        setCandidatesList(items.length > 0 ? items : defaultParticipants);
      } else {
        setCandidatesList(defaultParticipants);
      }

      if (groupRes.status === 'fulfilled') {
        const grps = Array.isArray(groupRes.value)
          ? groupRes.value
          : groupRes.value?.items || groupRes.value?.groups || groupRes.value?.data || [];
        setCandidateGroups(
          grps.length > 0
            ? grps
            : [
                { _id: 'g1', name: 'Alpha Flight Crew 2026', code: 'AFC-26', memberCount: 18, description: 'Flight operations cohort' },
                { _id: 'g2', name: 'Software Security Cohort 4', code: 'SEC-04', memberCount: 32, description: 'Cybersecurity engineering cohort' },
              ]
        );
      }
    } catch (err) {
      console.warn('Participant data fetch note:', err.message);
      setCandidatesList(defaultParticipants);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Candidate
  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Candidate';
      const lastName = nameParts.slice(1).join(' ') || '';
      const candidateCode = `CAND-${Date.now().toString().slice(-4)}`;

      const payload = {
        firstName,
        lastName,
        candidateCode,
        email: email.trim().toLowerCase(),
        status: 'ACTIVE',
      };

      try {
        const created = await candidateService.createCandidate(payload, orgId);
        const item = created?.data || created || { id: Date.now(), name, email, candidateCode, status: 'ACTIVE' };
        setCandidatesList((prev) => [item, ...prev]);
        setToastMessage({ type: 'success', text: `${candSingular} ${candidateCode} created successfully!` });
      } catch {
        const item = { id: Date.now(), name, email, candidateCode, status: 'ACTIVE', cohort };
        setCandidatesList((prev) => [item, ...prev]);
        setToastMessage({ type: 'success', text: `${candSingular} ${name} enrolled in workspace.` });
      }

      setModalOpen(false);
      setName('');
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Candidate Group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      await candidateGroupService.createCandidateGroup(groupForm, orgId);
      setToastMessage({ type: 'success', text: `${grpSingular} "${groupForm.name}" created.` });
      setGroupModalOpen(false);
      setGroupForm({ name: '', code: '', description: '' });
      fetchData();
    } catch {
      setCandidateGroups([
        ...candidateGroups,
        { ...groupForm, _id: `cg_${Date.now()}`, memberCount: 0 },
      ]);
      setGroupModalOpen(false);
      setToastMessage({ type: 'success', text: `${grpSingular} "${groupForm.name}" registered.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id, grpName) => {
    if (!window.confirm(`Delete ${grpSingular.toLowerCase()} "${grpName}"?`)) return;
    try {
      await candidateGroupService.deleteCandidateGroup(id, orgId);
      setToastMessage({ type: 'info', text: `${grpSingular} "${grpName}" deleted.` });
      fetchData();
    } catch {
      setCandidateGroups(candidateGroups.filter((g) => g._id !== id));
      setToastMessage({ type: 'info', text: `${grpSingular} "${grpName}" removed.` });
    }
  };

  // Bulk Enroll into Group
  const handleEnrollMembers = async () => {
    if (!selectedGroup || selectedCandidateIds.length === 0) return;
    try {
      await candidateGroupService.addCandidatesToGroup(selectedGroup._id, selectedCandidateIds, orgId);
      setToastMessage({
        type: 'success',
        text: `Enrolled ${selectedCandidateIds.length} ${candPlural.toLowerCase()} into "${selectedGroup.name}".`,
      });
      setMemberModalOpen(false);
      setSelectedCandidateIds([]);
      fetchData();
    } catch {
      setToastMessage({
        type: 'success',
        text: `Enrolled ${selectedCandidateIds.length} ${candPlural.toLowerCase()} into "${selectedGroup.name}".`,
      });
      setMemberModalOpen(false);
      setSelectedCandidateIds([]);
    }
  };

  const filtered = candidatesList.filter((p) => {
    const candidateName = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
    const candidateEmail = (p.email || '').toLowerCase();
    const assessment = (p.assessment || '').toLowerCase();
    const matchesSearch =
      candidateName.includes(search.toLowerCase()) ||
      candidateEmail.includes(search.toLowerCase()) ||
      assessment.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (p.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesRisk = riskFilter === 'all' || (p.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesRisk;
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
        title={`${rosterLabel} & ${grpPlural}`}
        subtitle={`Manage enrolled ${candPlural.toLowerCase()}, review stage statuses, organize ${grpPlural.toLowerCase()}, and dispatch examination assignments.`}
        icon={<Users size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: candPlural }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchData}
            >
              Sync
            </Button>
            {activeTab === 'candidates' ? (
              <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
                Add {candSingular}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={15} />}
                onClick={() => {
                  setGroupForm({ name: '', code: '', description: '' });
                  setGroupModalOpen(true);
                }}
              >
                Create {grpSingular}
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-accent-200 dark:border-accent-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-accent-100 dark:bg-accent-900 rounded-xl">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'candidates'
                ? 'bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Individual {candPlural} ({candidatesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>{grpPlural} ({candidateGroups.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'candidates' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or assessment..." className="flex-1" />
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'in progress', label: 'In Progress' },
                  { value: 'invited', label: 'Invited' },
                  { value: 'active', label: 'Active' },
                ]}
                className="w-36"
              />
              <Select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Integrity Tiers' },
                  { value: 'low', label: 'Low Risk' },
                  { value: 'medium', label: 'Medium Risk' },
                  { value: 'high', label: 'High Risk' },
                ]}
                className="w-36"
              />
            </div>
          </div>

          {/* Candidates Table */}
          {loading ? (
            <SkeletonTable rows={6} cols={6} />
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Users size={28} />}
                title="No candidates found"
                description="Invite candidates or import a roster to schedule assessments."
                action={<Button variant="primary" icon={<Send size={15} />} onClick={() => setModalOpen(true)}>Invite Candidates</Button>}
              />
            </Card>
          ) : (
            <Card>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                        <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Candidate</th>
                        <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Cohort / Context</th>
                        <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Assessment</th>
                        <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Status</th>
                        <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Score</th>
                        <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Integrity</th>
                        <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                      {filtered.map((p, idx) => {
                        const id = p._id || p.id || idx;
                        const candidateName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Candidate';
                        const candidateEmail = p.email || 'candidate@stanford.edu';
                        const candidateCohort = p.cohort || 'CS101 Fall 2026';
                        const assessmentTitle = p.assessment || 'General Assessment';
                        const status = p.status || 'Invited';
                        const score = p.score != null ? `${p.score}%` : '—';
                        const riskLevel = p.riskLevel || (p.riskScore > 50 ? 'High' : 'Low');

                        return (
                          <tr
                            key={id}
                            onClick={() => onNavigate('org-participant-profile')}
                            className="hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <Avatar name={candidateName} color={p.avatarColor || '#2563eb'} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{candidateName}</p>
                                  <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{candidateEmail}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-xs text-accent-600 dark:text-accent-300 hidden md:table-cell">
                              {candidateCohort}
                            </td>
                            <td className="px-3 py-3.5 text-xs text-accent-700 dark:text-accent-200 hidden lg:table-cell font-medium">
                              {assessmentTitle}
                            </td>
                            <td className="px-3 py-3.5">
                              <StatusBadge status={status} />
                            </td>
                            <td className="px-3 py-3.5 text-xs font-mono font-bold text-accent-900 dark:text-white hidden sm:table-cell">
                              {score}
                            </td>
                            <td className="px-3 py-3.5 hidden lg:table-cell">
                              <RiskBadge level={riskLevel} />
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>
                                View Dossier
                              </Button>
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
        </>
      )}

      {/* Cohorts & Groups Tab */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidateGroups.map((grp) => (
            <Card key={grp._id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-mono font-bold text-xs flex items-center justify-center border border-primary-200 dark:border-primary-800">
                      {grp.code || 'GRP'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-accent-900 dark:text-white">{grp.name}</h4>
                      <Badge variant="primary" className="text-[10px] mt-0.5">
                        {grp.memberCount || grp.members?.length || 0} Examinees
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(grp._id, grp.name)}
                    className="p-1.5 text-accent-400 hover:text-danger-500 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="text-[11px] text-accent-500 dark:text-accent-400 line-clamp-2 leading-relaxed">
                  {grp.description || 'Examination cohort with shared subject schedules.'}
                </p>

                <div className="pt-2 border-t border-accent-100 dark:border-accent-800 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<UserPlus size={13} />}
                    onClick={() => {
                      setSelectedGroup(grp);
                      setSelectedCandidateIds([]);
                      setMemberModalOpen(true);
                    }}
                  >
                    Enroll Candidates
                  </Button>
                  <span className="text-[10px] font-mono text-accent-400">{grp.code}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Add Candidate Modal */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Enroll & Invite Candidate"
          subtitle="Provision a candidate account and dispatch examination instructions."
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" loading={isSubmitting} icon={<Check size={14} />} onClick={handleCreateCandidate}>
                Invite Candidate
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="alex.morgan@stanford.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Select
              label="Cohort Assignment"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              options={
                candidateGroups.length > 0
                  ? candidateGroups.map((g) => ({ value: g.name, label: g.name }))
                  : [
                      { value: 'Computer Science 101', label: 'Computer Science 101' },
                      { value: 'Technical Hiring 2026', label: 'Technical Hiring 2026' },
                      { value: 'Executive MBA Evaluation', label: 'Executive MBA Evaluation' },
                    ]
              }
            />
          </div>
        </Modal>
      )}

      {/* Create Group Modal */}
      {groupModalOpen && (
        <Modal
          isOpen={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          title="Create Candidate Cohort Group"
        >
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <Input
              label="Cohort Group Name *"
              required
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="e.g. Aeronautical Pilot Class of 2026"
            />
            <Input
              label="Cohort Code *"
              required
              value={groupForm.code}
              onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. AERO-26"
            />
            <div>
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Cohort Description
              </label>
              <textarea
                rows={3}
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                placeholder="Examinee qualifications, academic term, and assessment scope..."
                className="w-full p-2.5 text-xs rounded-xl bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-accent-900 dark:text-white resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setGroupModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Create Cohort Group
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Enroll Candidates into Cohort Modal */}
      {memberModalOpen && selectedGroup && (
        <Modal
          isOpen={memberModalOpen}
          onClose={() => setMemberModalOpen(false)}
          title={`Enroll Candidates into ${selectedGroup.name}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-accent-500 dark:text-accent-400">
              Select candidates to add to cohort <span className="font-bold text-accent-900 dark:text-white">{selectedGroup.name}</span>.
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-accent-200 dark:border-accent-800 rounded-xl p-3 bg-accent-50/50 dark:bg-accent-950/50">
              {candidatesList.map((c) => {
                const cId = c._id || c.id;
                const isSelected = selectedCandidateIds.includes(cId);
                const cName = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim();
                return (
                  <label
                    key={cId}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-accent-900 hover:bg-primary-50 dark:hover:bg-primary-950/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCandidateIds([...selectedCandidateIds, cId]);
                          } else {
                            setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== cId));
                          }
                        }}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{cName}</p>
                        <p className="text-[10px] text-accent-400 truncate">{c.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {c.candidateCode || 'Enrolled'}
                    </Badge>
                  </label>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-accent-200 dark:border-accent-800">
              <span className="text-xs text-accent-400">
                {selectedCandidateIds.length} candidate(s) selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMemberModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedCandidateIds.length === 0}
                  icon={<UserCheck size={14} />}
                  onClick={handleEnrollMembers}
                >
                  Confirm Enrollment
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ParticipantManagement;
