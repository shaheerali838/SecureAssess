import React, { useState, useEffect } from 'react';
import {
  Video, Users, Building2, BookOpen, GraduationCap, Link2,
  Calendar, Clock, Copy, Check, AlertCircle, CheckCircle2,
  Search, Shield, Sparkles, X, Plus, User, Layers, CheckSquare, Square
} from 'lucide-react';
import { Modal, Button, Badge, Avatar } from '@/components/ui';
import candidateService from '@/services/candidate.service';
import organizationService from '@/services/organization.service';
import interviewService from '@/services/interview.service';

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  onScheduled = () => {},
  onLaunchRoom = () => {}
}) {
  // Target Scope: 'candidates' | 'departments' | 'subjects' | 'programs' | 'open_entry'
  const [targetScope, setTargetScope] = useState('candidates');

  // Datasets from MongoDB
  const [candidates, setCandidates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [candidateGroups, setCandidateGroups] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Selected Target IDs
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');

  // Interview Metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [interviewType, setInterviewType] = useState('TECHNICAL');
  const [interviewPurpose, setInterviewPurpose] = useState('HIRING'); // 'HIRING' | 'ACADEMIC_ENTRY' | 'ORAL_EXAM' | 'TECHNICAL' | 'TESTING'

  // Scheduling Date & Window
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);

  // Room Policies
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [screenSharingEnabled, setScreenSharingEnabled] = useState(true);
  const [candidateCameraRequired, setCandidateCameraRequired] = useState(true);
  const [candidateMicrophoneRequired, setCandidateMicrophoneRequired] = useState(true);

  // 1-Time Entry Link specific fields
  const [candidateNameEntry, setCandidateNameEntry] = useState('');
  const [candidateEmailEntry, setCandidateEmailEntry] = useState('');
  const [generatedEntryLink, setGeneratedEntryLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Search & Submission
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [scheduledInterviewResult, setScheduledInterviewResult] = useState(null);

  // Fetch Academic Roster & Candidates on modal open
  useEffect(() => {
    if (!isOpen) {
      setSelectedCandidateIds([]);
      setSelectedDepartmentId('');
      setSelectedSubjectId('');
      setSelectedProgramId('');
      setStatusFeedback(null);
      setSearchTerm('');
      setGeneratedEntryLink('');
      setCopiedLink(false);
      return;
    }

    const loadAllData = async () => {
      setLoadingData(true);
      try {
        const [candRes, deptRes, progRes, subjRes, grpRes] = await Promise.allSettled([
          candidateService.getCandidates(),
          organizationService.getDepartments(),
          organizationService.getPrograms(),
          organizationService.getSubjects(),
          organizationService.getCandidateGroups(),
        ]);

        if (candRes.status === 'fulfilled') {
          const list = Array.isArray(candRes.value) ? candRes.value : (candRes.value?.items || candRes.value?.data || []);
          setCandidates(list || []);
        } else {
          setCandidates([]);
        }

        if (deptRes.status === 'fulfilled') {
          const list = Array.isArray(deptRes.value) ? deptRes.value : (deptRes.value?.items || deptRes.value?.data || []);
          setDepartments(list || []);
        } else {
          setDepartments([]);
        }

        if (progRes.status === 'fulfilled') {
          const list = Array.isArray(progRes.value) ? progRes.value : (progRes.value?.items || progRes.value?.data || []);
          setPrograms(list || []);
        } else {
          setPrograms([]);
        }

        if (subjRes.status === 'fulfilled') {
          const list = Array.isArray(subjRes.value) ? subjRes.value : (subjRes.value?.items || subjRes.value?.data || []);
          setSubjects(list || []);
        } else {
          setSubjects([]);
        }

        if (grpRes.status === 'fulfilled') {
          const list = Array.isArray(grpRes.value) ? grpRes.value : (grpRes.value?.items || grpRes.value?.data || []);
          setCandidateGroups(list || []);
        } else {
          setCandidateGroups([]);
        }
      } catch (err) {
        console.warn('Academic data load warning:', err.message);
      } finally {
        setLoadingData(false);
      }
    };

    loadAllData();
  }, [isOpen]);

  // Scope Toggle Handler
  const handleScopeChange = (scope) => {
    setTargetScope(scope);
    setStatusFeedback(null);
  };

  // Toggle Single Candidate Selection
  const toggleCandidate = (id) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all filtered candidates
  const toggleAllFilteredCandidates = () => {
    const currentFiltered = filteredCandidates.map((c) => c._id || c.id);
    const allSelected = currentFiltered.every((id) => selectedCandidateIds.includes(id));
    if (allSelected) {
      setSelectedCandidateIds((prev) => prev.filter((id) => !currentFiltered.includes(id)));
    } else {
      setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...currentFiltered])));
    }
  };

  // Filter Candidates by search
  const filteredCandidates = candidates.filter((c) => {
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    const code = (c.candidateCode || c.studentId || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || email.includes(query) || code.includes(query);
  });

  // Filter Departments
  const filteredDepartments = departments.filter((d) => {
    const name = (d.name || '').toLowerCase();
    const code = (d.code || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  // Filter Subjects
  const filteredSubjects = subjects.filter((s) => {
    const name = (s.name || '').toLowerCase();
    const code = (s.code || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  // Filter Programs
  const filteredPrograms = programs.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const code = (p.code || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  // Copy 1-Time Link
  const handleCopyLink = () => {
    if (!generatedEntryLink) return;
    navigator.clipboard.writeText(generatedEntryLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Generate 1-Time Entry Link
  const handleGenerateEntryLink = () => {
    const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const origin = window.location.origin || 'https://secureassess.io';
    const link = `${origin}/interview/entry/${token}?purpose=${interviewPurpose.toLowerCase()}`;
    setGeneratedEntryLink(link);
    setStatusFeedback({
      type: 'success',
      message: '1-Time candidate entry link generated! Candidates can enter the room directly through this link.',
    });
  };

  // Schedule Interview Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusFeedback(null);

    const interviewTitle = title.trim() || `${interviewPurpose} Oral Assessment`;

    const startDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + Number(durationMinutes) * 60 * 1000);

    const commonSettings = {
      waitingRoomEnabled,
      recordingEnabled,
      screenSharingEnabled,
      candidateCameraRequired,
      candidateMicrophoneRequired,
    };

    setSubmitting(true);

    try {
      if (targetScope === 'open_entry') {
        // 1-Time Entry / Hiring Link Mode - Name & Email are strictly required
        if (!candidateNameEntry.trim()) {
          setStatusFeedback({
            type: 'error',
            message: 'Candidate Full Name is required to generate and dispatch the 1-time entry link.',
          });
          setSubmitting(false);
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!candidateEmailEntry.trim() || !emailRegex.test(candidateEmailEntry.trim())) {
          setStatusFeedback({
            type: 'error',
            message: 'A valid Candidate Email Address is required to email the 1-time entry link.',
          });
          setSubmitting(false);
          return;
        }

        const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        const origin = window.location.origin || 'https://secureassess.io';
        const roomLink = `${origin}/interview/entry/${token}?purpose=${interviewPurpose.toLowerCase()}`;
        setGeneratedEntryLink(roomLink);

        const payload = {
          title: interviewTitle,
          description: description || `1-Time Entry / Hiring Evaluation (${interviewPurpose})`,
          type: interviewType,
          scheduledStartAt: startDateTime.toISOString(),
          scheduledEndAt: endDateTime.toISOString(),
          settings: commonSettings,
          metadata: {
            purpose: interviewPurpose,
            openEntry: true,
            entryToken: token,
            candidateEmail: candidateEmailEntry.trim(),
            candidateName: candidateNameEntry.trim(),
            entryLink: roomLink,
            sendEmailInvite: true,
          },
        };

        const created = await interviewService.scheduleInterview(payload);
        const interviewData = created?.data || created || payload;
        setScheduledInterviewResult({
          interview: interviewData,
          roomLink,
          candidateName: candidateNameEntry.trim(),
          candidateEmail: candidateEmailEntry.trim(),
          title: interviewTitle,
          scheduledDate,
          scheduledTime,
        });

        setStatusFeedback({
          type: 'success',
          message: `1-Time entry link generated and official invitation email dispatched to ${candidateEmailEntry.trim()}!`,
        });

        onScheduled();
        return;
      }

      if (targetScope === 'candidates') {
        if (selectedCandidateIds.length === 0) {
          setStatusFeedback({ type: 'error', message: 'Please select at least one candidate.' });
          setSubmitting(false);
          return;
        }

        // Schedule for each selected candidate
        let successCount = 0;
        for (const candId of selectedCandidateIds) {
          const cand = candidates.find((c) => (c._id || c.id) === candId);
          const candTitle = selectedCandidateIds.length > 1
            ? `${interviewTitle} - ${cand?.firstName || 'Candidate'}`
            : interviewTitle;

          const payload = {
            title: candTitle,
            description: description || `${interviewPurpose} defense session.`,
            type: interviewType,
            candidateId: candId,
            scheduledStartAt: startDateTime.toISOString(),
            scheduledEndAt: endDateTime.toISOString(),
            settings: commonSettings,
            metadata: {
              purpose: interviewPurpose,
              candidateEmail: cand?.email,
              candidateName: `${cand?.firstName || ''} ${cand?.lastName || ''}`.trim(),
            },
          };

          await interviewService.scheduleInterview(payload);
          successCount++;
        }

        setStatusFeedback({
          type: 'success',
          message: `Successfully scheduled and emailed ${successCount} live interview session(s)!`,
        });

        setTimeout(() => {
          onScheduled();
          onClose();
        }, 1200);
        return;
      }

      if (targetScope === 'departments') {
        if (!selectedDepartmentId) {
          setStatusFeedback({ type: 'error', message: 'Please select a target Department.' });
          setSubmitting(false);
          return;
        }

        const dept = departments.find((d) => (d._id || d.id) === selectedDepartmentId);
        // Find candidates in this department or schedule a representative cohort interview
        const deptCandidates = candidates.filter((c) =>
          c.departmentId === selectedDepartmentId || c.deptCode === dept?.code
        );

        const targetList = deptCandidates.length > 0 ? deptCandidates : [candidates[0]];
        let count = 0;
        for (const cand of targetList) {
          if (!cand) continue;
          await interviewService.scheduleInterview({
            title: `${dept?.name || 'Department'} Oral Defense: ${interviewTitle}`,
            description: description || `Departmental ${dept?.code || ''} evaluation for ${interviewPurpose}`,
            type: interviewType,
            candidateId: cand._id || cand.id,
            scheduledStartAt: startDateTime.toISOString(),
            scheduledEndAt: endDateTime.toISOString(),
            settings: commonSettings,
            metadata: {
              departmentId: selectedDepartmentId,
              purpose: interviewPurpose,
              candidateEmail: cand.email,
              candidateName: `${cand.firstName || ''} ${cand.lastName || ''}`.trim(),
            },
          });
          count++;
        }

        setStatusFeedback({
          type: 'success',
          message: `Scheduled & emailed ${count} interview invitation(s) for Department ${dept?.name || ''}!`,
        });

        setTimeout(() => {
          onScheduled();
          onClose();
        }, 1200);
        return;
      }

      if (targetScope === 'subjects') {
        if (!selectedSubjectId) {
          setStatusFeedback({ type: 'error', message: 'Please select a target Subject / Course.' });
          setSubmitting(false);
          return;
        }

        const subj = subjects.find((s) => (s._id || s.id) === selectedSubjectId);
        const subjCandidates = candidates.filter((c) =>
          c.subjectIds?.includes(selectedSubjectId) || c.progCode === subj?.progCode
        );

        const targetList = subjCandidates.length > 0 ? subjCandidates : [candidates[0]];
        let count = 0;
        for (const cand of targetList) {
          if (!cand) continue;
          await interviewService.scheduleInterview({
            title: `[${subj?.code || 'Course'}] ${subj?.name || 'Subject'}: ${interviewTitle}`,
            description: description || `Subject examination and viva for ${subj?.name} (${interviewPurpose})`,
            type: interviewType,
            candidateId: cand._id || cand.id,
            scheduledStartAt: startDateTime.toISOString(),
            scheduledEndAt: endDateTime.toISOString(),
            settings: commonSettings,
            metadata: {
              subjectId: selectedSubjectId,
              purpose: interviewPurpose,
              candidateEmail: cand.email,
              candidateName: `${cand.firstName || ''} ${cand.lastName || ''}`.trim(),
            },
          });
          count++;
        }

        setStatusFeedback({
          type: 'success',
          message: `Scheduled & emailed ${count} oral defense invitation(s) for Subject ${subj?.name || ''}!`,
        });

        setTimeout(() => {
          onScheduled();
          onClose();
        }, 1200);
        return;
      }

      if (targetScope === 'programs') {
        if (!selectedProgramId) {
          setStatusFeedback({ type: 'error', message: 'Please select a target Degree Program.' });
          setSubmitting(false);
          return;
        }

        const prog = programs.find((p) => (p._id || p.id) === selectedProgramId);
        const progCandidates = candidates.filter((c) =>
          c.programId === selectedProgramId || c.progCode === prog?.code
        );

        const targetList = progCandidates.length > 0 ? progCandidates : [candidates[0]];
        let count = 0;
        for (const cand of targetList) {
          if (!cand) continue;
          await interviewService.scheduleInterview({
            title: `${prog?.name || 'Program'} Defense: ${interviewTitle}`,
            description: description || `Program assessment for ${prog?.code || ''}`,
            type: interviewType,
            candidateId: cand._id || cand.id,
            scheduledStartAt: startDateTime.toISOString(),
            scheduledEndAt: endDateTime.toISOString(),
            settings: commonSettings,
            metadata: {
              programId: selectedProgramId,
              purpose: interviewPurpose,
              candidateEmail: cand.email,
              candidateName: `${cand.firstName || ''} ${cand.lastName || ''}`.trim(),
            },
          });
          count++;
        }

        setStatusFeedback({
          type: 'success',
          message: `Scheduled & emailed ${count} interview invitation(s) for ${prog?.name || ''}!`,
        });

        setTimeout(() => {
          onScheduled();
          onClose();
        }, 1200);
        return;
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        message: err?.response?.data?.message || err.message || 'Failed to schedule interview.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-accent-100 dark:border-accent-800 flex items-center justify-between shrink-0 bg-accent-50/50 dark:bg-accent-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Video size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-accent-900 dark:text-white">
                Schedule Live Video Interview
              </h2>
              <p className="text-xs text-accent-500 dark:text-accent-400">
                Target by Department, Subject, Candidate Roster, or 1-Time Entry Link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-accent-400 hover:text-accent-600 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {statusFeedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium border ${
              statusFeedback.type === 'success'
                ? 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800'
                : 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800'
            }`}
          >
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{statusFeedback.message}</span>
          </div>
        )}

        {/* Success / Host Launch Screen */}
        {scheduledInterviewResult ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="p-5 rounded-2xl bg-success-500/10 border border-success-500/30 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-success-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-success-500/30">
                <CheckCircle2 size={30} />
              </div>
              <h3 className="text-lg font-bold text-accent-900 dark:text-white">Live Interview Scheduled!</h3>
              <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 max-w-md">
                Official invitation with the 1-time secure entry link has been dispatched to{' '}
                <strong className="text-accent-900 dark:text-white">{scheduledInterviewResult.candidateEmail}</strong>.
              </p>
            </div>

            {/* Host Join Room Card */}
            <div className="p-5 rounded-2xl bg-primary-600/10 border border-primary-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-accent-900 dark:text-white flex items-center gap-2">
                    <Video size={18} className="text-primary-600 dark:text-primary-400" />
                    Examiner / Recruiter Host Access
                  </h4>
                  <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">
                    Enter the live room with full scoring rubrics, private notes, and candidate proctoring controls.
                  </p>
                </div>
                <Badge variant="primary" size="sm">Host / Interviewer</Badge>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Video size={16} />}
                  onClick={() => {
                    onClose();
                    onLaunchRoom(scheduledInterviewResult.interview || scheduledInterviewResult);
                  }}
                  className="shadow-lg shadow-primary-500/20"
                >
                  Enter Room as Host Now
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setScheduledInterviewResult(null);
                    onClose();
                  }}
                >
                  Done / View All Interviews
                </Button>
              </div>
            </div>

            {/* Candidate 1-Time Link Card */}
            <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent-700 dark:text-accent-300">
                  Candidate 1-Time Entry Link
                </span>
                <span className="text-[11px] text-success-600 dark:text-success-400 font-semibold flex items-center gap-1">
                  <Check size={13} /> Sent via Email
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={scheduledInterviewResult.roomLink}
                  className="flex-1 text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-300 dark:border-accent-700 font-mono text-accent-800 dark:text-accent-200 select-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  icon={copiedLink ? <Check size={14} className="text-success-600" /> : <Copy size={14} />}
                  onClick={() => {
                    navigator.clipboard.writeText(scheduledInterviewResult.roomLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                >
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Target Scope Tabs */}
            <div>
              <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-2">
                1. Select Scheduling Scope & Target
              </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleScopeChange('candidates')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                  targetScope === 'candidates'
                    ? 'bg-primary-600/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                    : 'bg-white dark:bg-accent-800/60 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-800'
                }`}
              >
                <User size={18} />
                <span>Candidate (1-on-1)</span>
              </button>

              <button
                type="button"
                onClick={() => handleScopeChange('departments')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                  targetScope === 'departments'
                    ? 'bg-primary-600/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                    : 'bg-white dark:bg-accent-800/60 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-800'
                }`}
              >
                <Building2 size={18} />
                <span>By Department</span>
              </button>

              <button
                type="button"
                onClick={() => handleScopeChange('subjects')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                  targetScope === 'subjects'
                    ? 'bg-primary-600/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                    : 'bg-white dark:bg-accent-800/60 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-800'
                }`}
              >
                <BookOpen size={18} />
                <span>By Subject / Course</span>
              </button>

              <button
                type="button"
                onClick={() => handleScopeChange('programs')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                  targetScope === 'programs'
                    ? 'bg-primary-600/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                    : 'bg-white dark:bg-accent-800/60 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-800'
                }`}
              >
                <GraduationCap size={18} />
                <span>Degree Program</span>
              </button>

              <button
                type="button"
                onClick={() => handleScopeChange('open_entry')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                  targetScope === 'open_entry'
                    ? 'bg-primary-600/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                    : 'bg-white dark:bg-accent-800/60 border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-800'
                }`}
              >
                <Link2 size={18} />
                <span>1-Time Entry Link</span>
              </button>
            </div>
          </div>

          {/* Scope Content Selection Box */}
          <div className="p-4 rounded-xl bg-accent-50/70 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700">
            {/* 1. CANDIDATES SCOPE */}
            {targetScope === 'candidates' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-2.5 text-accent-400" />
                    <input
                      type="text"
                      placeholder="Search candidates by name, email, or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 text-xs h-8 rounded-lg bg-white dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={toggleAllFilteredCandidates}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {filteredCandidates.every((c) => selectedCandidateIds.includes(c._id || c.id))
                      ? 'Deselect All'
                      : 'Select All Filtered'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {filteredCandidates.map((cand) => {
                    const id = cand._id || cand.id;
                    const isSelected = selectedCandidateIds.includes(id);
                    const name = `${cand.firstName || ''} ${cand.lastName || ''}`.trim() || 'Candidate';
                    return (
                      <div
                        key={id}
                        onClick={() => toggleCandidate(id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all text-xs ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-400 dark:border-primary-600'
                            : 'bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-primary-600 shrink-0" />
                          ) : (
                            <Square size={16} className="text-accent-400 shrink-0" />
                          )}
                          <Avatar name={name} size="xs" color="#3b82f6" />
                          <div className="min-w-0">
                            <p className="font-bold text-accent-900 dark:text-white truncate">{name}</p>
                            <p className="text-[11px] text-accent-500 truncate">
                              {cand.email} {cand.candidateCode ? `· ${cand.candidateCode}` : ''}
                            </p>
                          </div>
                        </div>
                        {cand.deptCode && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-300">
                            {cand.deptCode}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-accent-500">
                  {selectedCandidateIds.length} candidate(s) selected for 1-on-1 interview scheduling.
                </p>
              </div>
            )}

            {/* 2. DEPARTMENTS SCOPE */}
            {targetScope === 'departments' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                  Choose Academic Division / Department:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredDepartments.map((dept) => {
                    const id = dept._id || dept.id;
                    const isSelected = selectedDepartmentId === id;
                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedDepartmentId(id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500'
                            : 'bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white">{dept.name}</p>
                          <p className="text-[11px] text-accent-500 font-mono">{dept.code || 'DEPT'}</p>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="text-primary-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SUBJECTS SCOPE */}
            {targetScope === 'subjects' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                  Choose Subject / Course for Oral Viva & Defense:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredSubjects.map((subj) => {
                    const id = subj._id || subj.id;
                    const isSelected = selectedSubjectId === id;
                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedSubjectId(id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500'
                            : 'bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white">{subj.name}</p>
                          <p className="text-[11px] text-accent-500 font-mono">
                            {subj.code} {subj.credits ? `· ${subj.credits} Credits` : ''}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="text-primary-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. DEGREE PROGRAM SCOPE */}
            {targetScope === 'programs' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                  Choose Degree Program & Cohort:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredPrograms.map((prog) => {
                    const id = prog._id || prog.id;
                    const isSelected = selectedProgramId === id;
                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedProgramId(id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500'
                            : 'bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-accent-900 dark:text-white">{prog.name}</p>
                          <p className="text-[11px] text-accent-500 font-mono">{prog.code || 'PROG'}</p>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="text-primary-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. 1-TIME ENTRY / HIRING LINK */}
            {targetScope === 'open_entry' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-between text-xs text-primary-900 dark:text-primary-200">
                  <span className="flex items-center gap-2 font-medium">
                    <Sparkles size={15} className="text-primary-500 shrink-0" />
                    Candidate will automatically receive an official 1-time room access invitation in their email inbox.
                  </span>
                  <Badge variant="primary" size="sm">Direct Email Dispatch</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 mb-1">
                      Candidate Full Name <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe (Applicant / Examinee)"
                      value={candidateNameEntry}
                      onChange={(e) => setCandidateNameEntry(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-800 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-[11px] text-accent-500 mt-1">Recipient name for the formal invitation.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 mb-1">
                      Candidate Email Address <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. applicant@company.com"
                      value={candidateEmailEntry}
                      onChange={(e) => setCandidateEmailEntry(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-800 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-[11px] text-accent-500 mt-1">1-time entry link will be dispatched to this email.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800">
                  <p className="text-xs font-bold text-primary-900 dark:text-primary-200 flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={14} /> 1-Time Entry Access Link
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        generatedEntryLink ||
                        `${window.location.origin || 'https://secureassess.io'}/interview/entry/1-time-${Math.random().toString(36).substring(7)}`
                      }
                      className="flex-1 text-xs h-8 px-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-300 dark:border-accent-700 font-mono text-accent-800 dark:text-accent-200 select-all"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      icon={copiedLink ? <Check size={14} className="text-success-600" /> : <Copy size={14} />}
                      onClick={() => {
                        const link =
                          generatedEntryLink ||
                          `${window.location.origin || 'https://secureassess.io'}/interview/entry/1-time-${Math.random().toString(36).substring(7)}`;
                        navigator.clipboard.writeText(link);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                    >
                      {copiedLink ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-accent-500 mt-2">
                    Distribute this one-time entry link to hiring candidates, recruitment applicants, or guest examinees.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Interview Details & Timing */}
          <div>
            <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-2">
              2. Interview Details & Purpose
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Interview Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Architecture & WebRTC Defense"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Purpose / Category
                </label>
                <select
                  value={interviewPurpose}
                  onChange={(e) => setInterviewPurpose(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="HIRING">Hiring & Recruitment</option>
                  <option value="ACADEMIC_ENTRY">Academic Entry / Admission</option>
                  <option value="ORAL_EXAM">Course Oral Exam / Viva</option>
                  <option value="TECHNICAL">Technical Defense</option>
                  <option value="TESTING">Skill & Certification Test</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Format Type
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="TECHNICAL">Technical Defense</option>
                  <option value="CODING">Live Coding & Whiteboard</option>
                  <option value="PANEL">Multi-Examiner Panel</option>
                  <option value="BEHAVIORAL">Behavioral / Case Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Duration Window
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Agenda / Topics & Evaluation Criteria
              </label>
              <textarea
                rows={2}
                placeholder="Key questions, core rubrics, or instructions for candidate..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* 3. Room Policies & Proctoring Telemetry */}
          <div>
            <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-2">
              3. Room Policies & Telemetry
            </label>
            <div className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-800/60 border border-accent-200 dark:border-accent-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
                  <input
                    type="checkbox"
                    checked={recordingEnabled}
                    onChange={(e) => setRecordingEnabled(e.target.checked)}
                    className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Cloud Video Recording</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
                  <input
                    type="checkbox"
                    checked={screenSharingEnabled}
                    onChange={(e) => setScreenSharingEnabled(e.target.checked)}
                    className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Screen Sharing & IDE Mirror</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
                  <input
                    type="checkbox"
                    checked={waitingRoomEnabled}
                    onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                    className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Host Waiting Room</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
                  <input
                    type="checkbox"
                    checked={candidateCameraRequired}
                    onChange={(e) => setCandidateCameraRequired(e.target.checked)}
                    className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Enforce HD Camera</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-accent-700 dark:text-accent-300">
                  <input
                    type="checkbox"
                    checked={candidateMicrophoneRequired}
                    onChange={(e) => setCandidateMicrophoneRequired(e.target.checked)}
                    className="rounded border-accent-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Enforce Live Microphone</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-accent-100 dark:border-accent-800">
            <span className="text-xs text-accent-500">
              {targetScope === 'open_entry'
                ? 'Generates instant shareable link for applicant.'
                : targetScope === 'candidates'
                ? `Scheduling for ${selectedCandidateIds.length} candidate(s).`
                : `Targeting all enrolled candidates in selected ${targetScope.slice(0, -1)}.`}
            </span>
            <div className="flex items-center gap-2.5">
              <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={submitting}>
                {targetScope === 'open_entry' ? 'Generate & Schedule Entry Link' : 'Schedule Live Interview'}
              </Button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default ScheduleInterviewModal;

