import React, { useState, useEffect } from 'react';
import {
  Video, Calendar, Clock, User, Mail, FileText, CheckCircle2,
  AlertCircle, Shield, X, Save, Search, Check, Users, Sparkles, UserCheck, Link2
} from 'lucide-react';
import { Button, Avatar, Badge } from '@/components/ui';
import interviewService from '@/services/interview.service';
import candidateService from '@/services/candidate.service';
import { participants as defaultParticipants } from '@/data';

export function EditInterviewModal({
  isOpen,
  open,
  onClose,
  interview,
  onUpdated = () => {},
}) {
  const isVisible = isOpen ?? open ?? false;

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [interviewType, setInterviewType] = useState('TECHNICAL');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);

  // Dynamic Candidates from Database
  const [candidatesList, setCandidatesList] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateMode, setCandidateMode] = useState('custom'); // 'database' | 'custom'
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');

  // Candidate Fields
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  // Room Policies
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [screenSharingEnabled, setScreenSharingEnabled] = useState(true);
  const [candidateCameraRequired, setCandidateCameraRequired] = useState(true);
  const [candidateMicrophoneRequired, setCandidateMicrophoneRequired] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch live candidates from MongoDB
  useEffect(() => {
    if (!isVisible) return;

    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const res = await candidateService.getCandidates({ limit: 100 });
        const list = Array.isArray(res) ? res : (res?.items || res?.data || res?.candidates || []);
        setCandidatesList(list.length > 0 ? list : defaultParticipants);
      } catch (err) {
        console.warn('Candidate list fetch fallback:', err.message);
        setCandidatesList(defaultParticipants);
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [isVisible]);

  // 2. Populate interview data into form
  useEffect(() => {
    if (!isVisible || !interview) {
      setErrorMsg('');
      setSuccessMsg('');
      return;
    }

    setTitle(interview.title || '');
    setDescription(interview.description || '');
    setInterviewType((interview.type || 'TECHNICAL').toUpperCase());

    if (interview.scheduledStartAt) {
      try {
        const d = new Date(interview.scheduledStartAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setScheduledDate(`${yyyy}-${mm}-${dd}`);
        const hh = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        setScheduledTime(`${hh}:${mins}`);
      } catch (e) {
        setScheduledDate(new Date().toISOString().split('T')[0]);
        setScheduledTime('14:00');
      }
    } else {
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setScheduledTime('14:00');
    }

    if (interview.scheduledStartAt && interview.scheduledEndAt) {
      try {
        const start = new Date(interview.scheduledStartAt).getTime();
        const end = new Date(interview.scheduledEndAt).getTime();
        const diffMins = Math.round((end - start) / 60000);
        setDurationMinutes(diffMins > 0 ? diffMins : 45);
      } catch (e) {
        setDurationMinutes(45);
      }
    } else {
      setDurationMinutes(45);
    }

    // Determine actual scheduled candidate details from interview metadata and direct fields
    const actualEmail = (
      interview.metadata?.candidateEmail ||
      interview.candidateEmail ||
      (typeof interview.candidateId === 'object' ? interview.candidateId?.email : '') ||
      ''
    ).trim();

    const actualName = (
      interview.metadata?.candidateName ||
      interview.candidateName ||
      interview.participant ||
      (typeof interview.candidateId === 'object'
        ? `${interview.candidateId?.firstName || ''} ${interview.candidateId?.lastName || ''}`.trim()
        : '') ||
      'Candidate'
    ).trim();

    setCandidateName(actualName);
    setCandidateEmail(actualEmail);

    // If metadata indicates openEntry or if email is set, default to custom/direct unless a matching database candidate is found
    if (interview.metadata?.openEntry || (!interview.candidateId && actualEmail)) {
      setCandidateMode('custom');
      setSelectedCandidateId('');
    } else {
      // Check candidate ID
      const candId = typeof interview.candidateId === 'object'
        ? (interview.candidateId?._id || interview.candidateId?.id)
        : interview.candidateId;
      if (candId) {
        setSelectedCandidateId(String(candId));
      }
    }

    if (interview.settings) {
      setWaitingRoomEnabled(interview.settings.waitingRoomEnabled ?? true);
      setRecordingEnabled(interview.settings.recordingEnabled ?? true);
      setScreenSharingEnabled(interview.settings.screenSharingEnabled ?? true);
      setCandidateCameraRequired(interview.settings.candidateCameraRequired ?? true);
      setCandidateMicrophoneRequired(interview.settings.candidateMicrophoneRequired ?? true);
    }
  }, [isVisible, interview]);

  // Synchronize candidate selection when candidatesList is fetched
  useEffect(() => {
    if (candidatesList.length > 0 && interview) {
      const actualEmail = (
        interview.metadata?.candidateEmail ||
        interview.candidateEmail ||
        (typeof interview.candidateId === 'object' ? interview.candidateId?.email : '') ||
        ''
      ).toLowerCase().trim();

      const initialName = (
        interview.metadata?.candidateName ||
        interview.candidateName ||
        interview.participant ||
        ''
      ).trim();

      const candId = typeof interview.candidateId === 'object'
        ? (interview.candidateId?._id || interview.candidateId?.id)
        : interview.candidateId;

      // 1. Try matching by exact candidate email first
      if (actualEmail) {
        const matchedByEmail = candidatesList.find(
          (c) => (c.email || '').toLowerCase().trim() === actualEmail
        );
        if (matchedByEmail) {
          setSelectedCandidateId(String(matchedByEmail._id || matchedByEmail.id));
          setCandidateMode('database');
          if (!initialName) {
            setCandidateName(`${matchedByEmail.firstName || ''} ${matchedByEmail.lastName || ''}`.trim() || matchedByEmail.name || '');
          }
          return;
        } else {
          // It's a custom/direct 1-time entry candidate (e.g. Shaheer Ali / tiktoker <shaheerali838838@gmail.com>)
          setCandidateMode('custom');
          setSelectedCandidateId('');
          return;
        }
      }

      // 2. Fallback matching by ID only if no explicit email was in metadata
      if (candId) {
        const matchedById = candidatesList.find(
          (c) => String(c._id || c.id) === String(candId)
        );
        if (matchedById) {
          setSelectedCandidateId(String(matchedById._id || matchedById.id));
          setCandidateMode('database');
          if (!initialName) {
            setCandidateName(`${matchedById.firstName || ''} ${matchedById.lastName || ''}`.trim() || matchedById.name || '');
          }
        }
      }
    }
  }, [candidatesList, interview]);

  const handleSelectCandidate = (candidate) => {
    const id = String(candidate._id || candidate.id);
    setSelectedCandidateId(id);
    setCandidateName(`${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.name || 'Candidate');
    setCandidateEmail(candidate.email || '');
  };

  const filteredCandidates = candidatesList.filter((c) => {
    const fullName = `${c.firstName || ''} ${c.lastName || ''} ${c.name || ''}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    const code = (c.candidateCode || c.rollNo || '').toLowerCase();
    const q = candidateSearch.toLowerCase();
    return fullName.includes(q) || email.includes(q) || code.includes(q);
  });

  const selectedCandidateObj = candidatesList.find(
    (c) => String(c._id || c.id) === String(selectedCandidateId)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Interview title is required');
      return;
    }

    if (!candidateName.trim()) {
      setErrorMsg('Candidate name is required');
      return;
    }

    if (!candidateEmail.trim()) {
      setErrorMsg('Candidate email is required');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const startDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        type: interviewType,
        scheduledStartAt: startDateTime.toISOString(),
        scheduledEndAt: endDateTime.toISOString(),
        candidateId: candidateMode === 'database' && selectedCandidateId ? selectedCandidateId : undefined,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        metadata: {
          ...interview?.metadata,
          candidateName: candidateName.trim(),
          candidateEmail: candidateEmail.trim(),
        },
        settings: {
          waitingRoomEnabled,
          recordingEnabled,
          screenSharingEnabled,
          candidateCameraRequired,
          candidateMicrophoneRequired,
        },
      };

      const interviewId = interview._id || interview.id;
      await interviewService.updateInterview(interviewId, payload);

      setSuccessMsg('Scheduled interview updated and synced with database successfully!');
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to update interview');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-accent-100 dark:border-accent-800 flex items-center justify-between shrink-0 bg-accent-50/50 dark:bg-accent-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Video size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-accent-900 dark:text-white">Edit Scheduled Interview</h3>
              <p className="text-xs text-accent-500 dark:text-accent-400">Modify candidate assignment, timing, and evaluation policies</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-accent-400 hover:text-accent-700 dark:hover:text-white rounded-xl hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. Candidate Assignment Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} className="text-primary-500" />
                  Assigned Candidate & Identity
                </h4>
                <div className="flex items-center gap-1 bg-accent-100 dark:bg-accent-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCandidateMode('database')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      candidateMode === 'database'
                        ? 'bg-white dark:bg-accent-700 text-primary-600 dark:text-primary-300 shadow-sm'
                        : 'text-accent-500 hover:text-accent-800 dark:hover:text-accent-200'
                    }`}
                  >
                    Select from Database
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateMode('custom')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      candidateMode === 'custom'
                        ? 'bg-white dark:bg-accent-700 text-primary-600 dark:text-primary-300 shadow-sm'
                        : 'text-accent-500 hover:text-accent-800 dark:hover:text-accent-200'
                    }`}
                  >
                    Direct / External
                  </button>
                </div>
              </div>

              {/* Current Active Candidate Preview Card */}
              {candidateMode === 'database' && selectedCandidateObj ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${selectedCandidateObj.firstName || ''} ${selectedCandidateObj.lastName || ''}`.trim() || selectedCandidateObj.name}
                      color="#2563eb"
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent-900 dark:text-white">
                          {`${selectedCandidateObj.firstName || ''} ${selectedCandidateObj.lastName || ''}`.trim() || selectedCandidateObj.name}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300">
                          {selectedCandidateObj.candidateCode || selectedCandidateObj.rollNo || 'Candidate'}
                        </span>
                      </div>
                      <p className="text-xs text-accent-500 dark:text-accent-400">{selectedCandidateObj.email}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Active Assignee</Badge>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-accent-50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800">
                  <div className="flex items-center gap-3">
                    <Avatar name={candidateName || 'Candidate'} color="#6366f1" size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent-900 dark:text-white">
                          {candidateName || 'Assigned Candidate'}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-accent-200 dark:bg-accent-800 text-accent-700 dark:text-accent-300 flex items-center gap-1">
                          <Link2 size={10} /> 1-Time / Direct
                        </span>
                      </div>
                      <p className="text-xs text-accent-500 dark:text-accent-400">{candidateEmail || 'No email specified'}</p>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">Scheduled Candidate</Badge>
                </div>
              )}

              {candidateMode === 'database' ? (
                <div className="space-y-3 bg-accent-50/70 dark:bg-accent-900/40 p-3.5 rounded-xl border border-accent-200 dark:border-accent-800">
                  {/* Search and Select Candidate from Database */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400" />
                      <input
                        type="text"
                        placeholder="Search candidate by name, email, or candidate code..."
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        className="w-full text-xs h-9 pl-8 pr-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {loadingCandidates ? (
                        <p className="text-xs text-center py-4 text-accent-400">Loading candidates from database...</p>
                      ) : filteredCandidates.length === 0 ? (
                        <p className="text-xs text-center py-4 text-accent-400">No matching candidates found.</p>
                      ) : (
                        filteredCandidates.map((cand) => {
                          const candId = String(cand._id || cand.id);
                          const isSelected = selectedCandidateId === candId;
                          const name = `${cand.firstName || ''} ${cand.lastName || ''}`.trim() || cand.name || 'Candidate';

                          return (
                            <div
                              key={candId}
                              onClick={() => handleSelectCandidate(cand)}
                              className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-500 text-primary-900 dark:text-primary-200 ring-1 ring-primary-500/20'
                                  : 'bg-white dark:bg-accent-900/80 border-accent-200 dark:border-accent-800 hover:border-primary-300 dark:hover:border-primary-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar name={name} size="sm" color={isSelected ? '#2563eb' : '#64748b'} />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate text-accent-900 dark:text-white">{name}</p>
                                  <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{cand.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {cand.candidateCode && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-300 font-mono">
                                    {cand.candidateCode}
                                  </span>
                                )}
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                  isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-accent-300 dark:border-accent-600'
                                }`}>
                                  {isSelected && <Check size={10} />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Custom / Direct External Candidate Fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-accent-50/70 dark:bg-accent-900/40 p-3.5 rounded-xl border border-accent-200 dark:border-accent-800">
                  <div>
                    <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                      Candidate Full Name <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shaheer Ali"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                      Candidate Email Address <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. candidate@university.edu"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Interview Details */}
            <div className="space-y-3 pt-3 border-t border-accent-200 dark:border-accent-800">
              <h4 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider flex items-center gap-1.5">
                <Video size={14} className="text-primary-500" />
                Session Format & Details
              </h4>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Interview Title <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems & Technical Oral Defense"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs h-10 px-3.5 rounded-xl bg-accent-50 dark:bg-accent-900/60 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                    Interview Format
                  </label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full text-xs h-10 px-3 rounded-xl bg-accent-50 dark:bg-accent-900/60 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="TECHNICAL">Technical Oral Defense</option>
                    <option value="CODING">Live Collaborative Coding</option>
                    <option value="PANEL">Panel Oral Examination</option>
                    <option value="BEHAVIORAL">Behavioral / Leadership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs h-10 px-3 rounded-xl bg-accent-50 dark:bg-accent-900/60 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 hour)</option>
                    <option value={90}>90 minutes (1.5 hours)</option>
                    <option value={120}>120 minutes (2 hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Description / Agenda Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide briefing notes, discussion topics, or candidate preparation details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-accent-50 dark:bg-accent-900/60 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>

            {/* 3. Schedule Date & Time */}
            <div className="space-y-3 pt-3 border-t border-accent-200 dark:border-accent-800">
              <h4 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-primary-500" />
                Schedule Date & Time
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs h-10 px-3 rounded-xl bg-accent-50 dark:bg-accent-900/60 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full text-xs h-10 px-3 rounded-xl bg-accent-50 dark:bg-accent-900/60 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Room Security & Policies */}
            <div className="space-y-3 pt-3 border-t border-accent-200 dark:border-accent-800">
              <h4 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-500" />
                Security & Room Controls
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-accent-700 dark:text-accent-300">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-800/60">
                  <input
                    type="checkbox"
                    checked={waitingRoomEnabled}
                    onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Enable Pre-Session Waiting Room</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-800/60">
                  <input
                    type="checkbox"
                    checked={recordingEnabled}
                    onChange={(e) => setRecordingEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Enable Live Session Recording</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-800/60">
                  <input
                    type="checkbox"
                    checked={candidateCameraRequired}
                    onChange={(e) => setCandidateCameraRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Candidate Camera Required</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-800/60">
                  <input
                    type="checkbox"
                    checked={candidateMicrophoneRequired}
                    onChange={(e) => setCandidateMicrophoneRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Candidate Mic Required</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 border-t border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50 flex items-center justify-end gap-3 shrink-0">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting} icon={<Save size={15} />}>
              Save & Sync Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditInterviewModal;
