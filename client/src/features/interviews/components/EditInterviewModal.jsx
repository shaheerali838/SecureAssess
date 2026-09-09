import React, { useState, useEffect } from 'react';
import {
  Video, Calendar, Clock, User, Mail, FileText, CheckCircle2,
  AlertCircle, Shield, X, Save, Search, Check, Users, Sparkles, UserCheck, Link2, Lock
} from 'lucide-react';
import { Button, Avatar, Badge } from '@/components/ui';
import interviewService from '@/services/interview.service';
import candidateService from '@/services/candidate.service';
import { InterviewQuestionsBuilder } from './InterviewQuestionsBuilder';

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
  const [questions, setQuestions] = useState([]);

  // Candidate Fields (Read-Only Locked)
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateCode, setCandidateCode] = useState('');

  // Room Policies
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [screenSharingEnabled, setScreenSharingEnabled] = useState(true);
  const [candidateCameraRequired, setCandidateCameraRequired] = useState(true);
  const [candidateMicrophoneRequired, setCandidateMicrophoneRequired] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Populate interview data into form
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

    if (Array.isArray(interview.questions) && interview.questions.length > 0) {
      setQuestions(interview.questions);
    } else {
      setQuestions([]);
    }

    // Determine actual scheduled candidate details (Permanently Locked)
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

    const code = (
      (typeof interview.candidateId === 'object' ? interview.candidateId?.candidateCode : '') ||
      interview.metadata?.candidateCode ||
      ''
    ).trim();

    setCandidateName(actualName);
    setCandidateEmail(actualEmail);
    setCandidateCode(code);

    if (interview.settings) {
      setWaitingRoomEnabled(interview.settings.waitingRoomEnabled ?? true);
      setRecordingEnabled(interview.settings.recordingEnabled ?? true);
      setScreenSharingEnabled(interview.settings.screenSharingEnabled ?? true);
      setCandidateCameraRequired(interview.settings.candidateCameraRequired ?? true);
      setCandidateMicrophoneRequired(interview.settings.candidateMicrophoneRequired ?? true);
    }
  }, [isVisible, interview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Interview title is required');
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
        // Keep original candidate assignment strictly unchanged
        candidateId: typeof interview.candidateId === 'object' ? interview.candidateId?._id : interview.candidateId,
        questions: questions || [],
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

            {/* 1. Candidate Assignment Section (Permanently Locked) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={14} className="text-amber-500" />
                  Assigned Candidate (Permanently Locked)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Lock size={10} /> Locked Assignee
                </span>
              </div>

              {/* Locked Candidate Information Card */}
              <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <Avatar name={candidateName || 'Candidate'} color="#2563eb" size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-accent-900 dark:text-white">
                        {candidateName || 'Assigned Candidate'}
                      </span>
                      {interview?.candidateId?.candidateCode && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-mono">
                          {interview.candidateId.candidateCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-accent-600 dark:text-accent-400 mt-0.5">{candidateEmail || 'No candidate email'}</p>
                    <p className="text-[11px] text-accent-400 mt-1 flex items-center gap-1">
                      <Shield size={11} className="text-emerald-500" /> Candidate identity bound to scheduled oral defense session
                    </p>
                  </div>
                </div>

                <div className="text-right sm:self-center">
                  <span className="text-[10px] text-accent-400 block">Candidate Assignment Status</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Permanently Bound</span>
                </div>
              </div>
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

            {/* 4. Pre-Interview Oral Defense Questions & Rubric Builder */}
            <div className="space-y-3 pt-3 border-t border-accent-200 dark:border-accent-800">
              <InterviewQuestionsBuilder
                questions={questions}
                onChange={setQuestions}
                interviewType={interviewType}
              />
            </div>

            {/* 5. Room Security & Policies */}
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
