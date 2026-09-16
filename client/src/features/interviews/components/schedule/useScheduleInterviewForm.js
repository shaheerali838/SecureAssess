import { useState, useEffect } from 'react';
import candidateService from '@/services/candidate.service';
import organizationService from '@/services/organization.service';
import interviewService from '@/services/interview.service';

const getCandidateLinkOrigin = () => 'https://secure-assess.vercel.app';

export function useScheduleInterviewForm({ isOpen, onClose, onScheduled }) {
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
  const [interviewPurpose, setInterviewPurpose] = useState('HIRING');

  // Pre-Interview Evaluation Questions & Rubrics
  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      title: 'Architectural Decisions & Design Patterns',
      prompt: 'Explain the core distributed architectural decisions, design patterns, and trade-offs made in your implementation.',
      category: 'TECHNICAL',
      rating: 0,
      notes: '',
      completed: false,
    },
    {
      id: 'q2',
      title: 'Real-time WebSockets & State Reconciliation',
      prompt: 'How do you handle peer-to-peer disconnects, network degradation, packet loss, and state reconciliation?',
      category: 'TECHNICAL',
      rating: 0,
      notes: '',
      completed: false,
    },
    {
      id: 'q3',
      title: 'Data Consistency, Transactions & Concurrency',
      prompt: 'Describe your database transaction boundaries, concurrency lock strategies, and isolation levels under load.',
      category: 'SYSTEM_DESIGN',
      rating: 0,
      notes: '',
      completed: false,
    },
    {
      id: 'q4',
      title: 'Critical Incident Response & Failure Modes',
      prompt: 'Walk through a scenario where a critical subsystem fails during peak proctoring load. How does the system degrade gracefully?',
      category: 'PROBLEM_SOLVING',
      rating: 0,
      notes: '',
      completed: false,
    },
  ]);

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

  // Filter Candidates by search
  const filteredCandidates = candidates.filter((c) => {
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    const code = (c.candidateCode || c.studentId || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || email.includes(query) || code.includes(query);
  });

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

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusFeedback(null);

    if (!title.trim()) {
      setStatusFeedback({ type: 'error', message: 'Please provide an interview title.' });
      return;
    }

    if (targetScope === 'candidates' && selectedCandidateIds.length === 0) {
      setStatusFeedback({ type: 'error', message: 'Please select at least one candidate from the roster.' });
      return;
    }

    if (targetScope === 'departments' && !selectedDepartmentId) {
      setStatusFeedback({ type: 'error', message: 'Please choose an academic department.' });
      return;
    }

    if (targetScope === 'subjects' && !selectedSubjectId) {
      setStatusFeedback({ type: 'error', message: 'Please select a course / subject for oral defense.' });
      return;
    }

    if (targetScope === 'programs' && !selectedProgramId) {
      setStatusFeedback({ type: 'error', message: 'Please select a degree program cohort.' });
      return;
    }

    if (targetScope === 'open_entry') {
      if (!candidateNameEntry.trim() || !candidateEmailEntry.trim()) {
        setStatusFeedback({ type: 'error', message: 'Candidate full name and email are required for 1-time invitation link.' });
        return;
      }
    }

    setSubmitting(true);

    try {
      const startDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        type: interviewType,
        purpose: interviewPurpose,
        scheduledStartAt: startDateTime.toISOString(),
        scheduledEndAt: endDateTime.toISOString(),
        durationMinutes,
        questions: questions || [],
        settings: {
          waitingRoomEnabled,
          recordingEnabled,
          screenSharingEnabled,
          candidateCameraRequired,
          candidateMicrophoneRequired,
        },
        targetScope,
        selectedCandidateIds: targetScope === 'candidates' ? selectedCandidateIds : [],
        departmentId: targetScope === 'departments' ? selectedDepartmentId : undefined,
        subjectId: targetScope === 'subjects' ? selectedSubjectId : undefined,
        programId: targetScope === 'programs' ? selectedProgramId : undefined,
        candidateNameEntry: targetScope === 'open_entry' ? candidateNameEntry.trim() : undefined,
        candidateEmailEntry: targetScope === 'open_entry' ? candidateEmailEntry.trim() : undefined,
      };

      const result = await interviewService.scheduleInterview(payload);

      const roomToken =
        result?.roomToken ||
        result?.interview?.roomToken ||
        result?.data?.roomToken ||
        `interview_${Date.now()}`;

      const origin = getCandidateLinkOrigin();
      const directRoomLink = `${origin}/interview/entry/${roomToken}`;

      setScheduledInterviewResult({
        ...result,
        roomLink: directRoomLink,
        candidateEmail:
          targetScope === 'open_entry'
            ? candidateEmailEntry
            : targetScope === 'candidates'
            ? `${selectedCandidateIds.length} candidate(s)`
            : 'Enrolled academic cohort',
        interview: result?.interview || result?.data || result,
      });

      setStatusFeedback({
        type: 'success',
        message: 'Live interview successfully scheduled and invitations dispatched!',
      });

      onScheduled();
    } catch (err) {
      console.error('Schedule interview error:', err);
      setStatusFeedback({
        type: 'error',
        message: err?.response?.data?.message || err.message || 'Failed to schedule interview.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    targetScope,
    handleScopeChange,
    candidates,
    filteredCandidates,
    selectedCandidateIds,
    toggleCandidate,
    toggleAllFilteredCandidates,
    filteredDepartments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    filteredSubjects,
    selectedSubjectId,
    setSelectedSubjectId,
    filteredPrograms,
    selectedProgramId,
    setSelectedProgramId,
    candidateNameEntry,
    setCandidateNameEntry,
    candidateEmailEntry,
    setCandidateEmailEntry,
    generatedEntryLink,
    copiedLink,
    handleCopyLink,
    searchTerm,
    setSearchTerm,
    title,
    setTitle,
    description,
    setDescription,
    interviewType,
    setInterviewType,
    interviewPurpose,
    setInterviewPurpose,
    questions,
    setQuestions,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    durationMinutes,
    setDurationMinutes,
    waitingRoomEnabled,
    setWaitingRoomEnabled,
    recordingEnabled,
    setRecordingEnabled,
    screenSharingEnabled,
    setScreenSharingEnabled,
    candidateCameraRequired,
    setCandidateCameraRequired,
    candidateMicrophoneRequired,
    setCandidateMicrophoneRequired,
    submitting,
    statusFeedback,
    scheduledInterviewResult,
    setScheduledInterviewResult,
    handleSubmit,
    getCandidateLinkOrigin,
  };
}
