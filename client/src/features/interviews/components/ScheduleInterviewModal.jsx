import React from 'react';
import { createPortal } from 'react-dom';
import { Video, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { InterviewQuestionsBuilder } from './InterviewQuestionsBuilder';
import {
  useScheduleInterviewForm,
  ScheduleScopeTabs,
  ScheduleCandidateRoster,
  ScheduleAcademicHierarchy,
  ScheduleOpenEntry,
  ScheduleDetailsForm,
  SchedulePoliciesSection,
  ScheduleSuccessView,
} from './schedule';

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  onScheduled = () => {},
  onLaunchRoom = () => {},
}) {
  const form = useScheduleInterviewForm({ isOpen, onClose, onScheduled });

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-scale-in">
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
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-accent-400 hover:text-accent-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {form.statusFeedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium border ${
              form.statusFeedback.type === 'success'
                ? 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800'
                : 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800'
            }`}
          >
            {form.statusFeedback.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{form.statusFeedback.message}</span>
          </div>
        )}

        {/* Success / Host Launch Screen */}
        {form.scheduledInterviewResult ? (
          <ScheduleSuccessView
            scheduledInterviewResult={form.scheduledInterviewResult}
            copiedLink={form.copiedLink}
            setCopiedLink={form.copiedLink}
            onClose={onClose}
            onLaunchRoom={onLaunchRoom}
            setScheduledInterviewResult={form.setScheduledInterviewResult}
          />
        ) : (
          /* Form Body */
          <form onSubmit={form.handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. Target Scope Tabs */}
            <ScheduleScopeTabs
              targetScope={form.targetScope}
              onScopeChange={form.handleScopeChange}
            />

            {/* Scope Selection Box */}
            <div className="p-4 rounded-xl bg-accent-50/70 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700">
              {form.targetScope === 'candidates' && (
                <ScheduleCandidateRoster
                  searchTerm={form.searchTerm}
                  setSearchTerm={form.setSearchTerm}
                  filteredCandidates={form.filteredCandidates}
                  selectedCandidateIds={form.selectedCandidateIds}
                  toggleCandidate={form.toggleCandidate}
                  toggleAllFilteredCandidates={form.toggleAllFilteredCandidates}
                />
              )}

              {(form.targetScope === 'departments' ||
                form.targetScope === 'subjects' ||
                form.targetScope === 'programs') && (
                <ScheduleAcademicHierarchy
                  targetScope={form.targetScope}
                  filteredDepartments={form.filteredDepartments}
                  selectedDepartmentId={form.selectedDepartmentId}
                  setSelectedDepartmentId={form.setSelectedDepartmentId}
                  filteredSubjects={form.filteredSubjects}
                  selectedSubjectId={form.selectedSubjectId}
                  setSelectedSubjectId={form.setSelectedSubjectId}
                  filteredPrograms={form.filteredPrograms}
                  selectedProgramId={form.selectedProgramId}
                  setSelectedProgramId={form.setSelectedProgramId}
                />
              )}

              {form.targetScope === 'open_entry' && (
                <ScheduleOpenEntry
                  candidateNameEntry={form.candidateNameEntry}
                  setCandidateNameEntry={form.setCandidateNameEntry}
                  candidateEmailEntry={form.candidateEmailEntry}
                  setCandidateEmailEntry={form.setCandidateEmailEntry}
                  generatedEntryLink={form.generatedEntryLink}
                  copiedLink={form.copiedLink}
                  handleCopyLink={form.handleCopyLink}
                  getCandidateLinkOrigin={form.getCandidateLinkOrigin}
                />
              )}
            </div>

            {/* 2. Interview Details & Timing */}
            <ScheduleDetailsForm
              title={form.title}
              setTitle={form.setTitle}
              interviewPurpose={form.interviewPurpose}
              setInterviewPurpose={form.setInterviewPurpose}
              interviewType={form.interviewType}
              setInterviewType={form.setInterviewType}
              scheduledDate={form.scheduledDate}
              setScheduledDate={form.setScheduledDate}
              scheduledTime={form.scheduledTime}
              setScheduledTime={form.setScheduledTime}
              durationMinutes={form.durationMinutes}
              setDurationMinutes={form.setDurationMinutes}
              description={form.description}
              setDescription={form.setDescription}
            />

            {/* 3. Pre-Interview Oral Defense Questions & Rubrics */}
            <div className="p-4 rounded-xl bg-accent-50/50 dark:bg-accent-800/30 border border-accent-200 dark:border-accent-700">
              <InterviewQuestionsBuilder
                questions={form.questions}
                onChange={form.setQuestions}
                interviewType={form.interviewType}
              />
            </div>

            {/* 4. Room Policies & Proctoring Telemetry */}
            <SchedulePoliciesSection
              recordingEnabled={form.recordingEnabled}
              setRecordingEnabled={form.setRecordingEnabled}
              screenSharingEnabled={form.screenSharingEnabled}
              setScreenSharingEnabled={form.setScreenSharingEnabled}
              waitingRoomEnabled={form.waitingRoomEnabled}
              setWaitingRoomEnabled={form.setWaitingRoomEnabled}
              candidateCameraRequired={form.candidateCameraRequired}
              setCandidateCameraRequired={form.setCandidateCameraRequired}
              candidateMicrophoneRequired={form.candidateMicrophoneRequired}
              setCandidateMicrophoneRequired={form.setCandidateMicrophoneRequired}
            />

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-accent-100 dark:border-accent-800">
              <span className="text-xs text-accent-500">
                {form.targetScope === 'open_entry'
                  ? 'Generates instant shareable link for applicant.'
                  : form.targetScope === 'candidates'
                  ? `Scheduling for ${form.selectedCandidateIds.length} candidate(s).`
                  : `Targeting all enrolled candidates in selected ${form.targetScope.slice(0, -1)}.`}
              </span>
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={form.submitting}>
                  {form.targetScope === 'open_entry'
                    ? 'Generate & Schedule Entry Link'
                    : 'Schedule Live Interview'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default ScheduleInterviewModal;
