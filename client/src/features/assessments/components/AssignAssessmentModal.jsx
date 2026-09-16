import React from "react";
import { createPortal } from "react-dom";
import { UserPlus, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useAssignAssessmentForm,
  AssignScopeTabs,
  AssignCandidateChecklist,
  AssignHierarchyChecklist,
  AssignOpenEntry,
  AssignScheduleConfig,
} from "./assign";

export function AssignAssessmentModal({
  isOpen,
  onClose,
  assessments = [],
  selectedAssessment = null,
  onAssigned = () => {},
}) {
  const form = useAssignAssessmentForm({
    isOpen,
    assessments,
    selectedAssessment,
    onAssigned,
    onClose,
  });

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-accent-100 dark:border-accent-800 flex items-center justify-between shrink-0 bg-accent-50/50 dark:bg-accent-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-accent-900 dark:text-white">
                Assign Assessment to Candidates
              </h2>
              <p className="text-xs text-accent-500 dark:text-accent-400">
                Target by academic cohort, department, subject, individual roster, or 1-time link
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
              form.statusFeedback.type === "success"
                ? "bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800"
                : "bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800"
            }`}
          >
            {form.statusFeedback.type === "success" ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{form.statusFeedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={form.handleAssign} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Target Assessment Selector */}
          <div>
            <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 mb-1">
              Select Assessment *
            </label>
            <select
              value={form.targetAssessmentId}
              onChange={(e) => form.setTargetAssessmentId(e.target.value)}
              className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {assessments.map((a) => (
                <option key={a._id || a.id} value={a._id || a.id}>
                  {a.title} ({a.code || "ASSESSMENT"}) · {a.durationMinutes || 45} mins
                </option>
              ))}
            </select>
          </div>

          {/* 1. Scope Tabs */}
          <AssignScopeTabs
            assignmentScope={form.assignmentScope}
            onScopeChange={form.setAssignmentScope}
          />

          {/* Scope Content Checklist Box */}
          <div className="p-4 rounded-xl bg-accent-50/70 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700">
            {form.assignmentScope === "candidates" && (
              <AssignCandidateChecklist
                searchTerm={form.searchTerm}
                setSearchTerm={form.setSearchTerm}
                filteredCandidates={form.getFilteredCandidates()}
                selectedCandidateIds={form.selectedCandidateIds}
                setSelectedCandidateIds={form.setSelectedCandidateIds}
                toggleItem={form.toggleItem}
                toggleSelectAllForScope={form.toggleSelectAllForScope}
              />
            )}

            {(form.assignmentScope === "departments" ||
              form.assignmentScope === "programs" ||
              form.assignmentScope === "subjects" ||
              form.assignmentScope === "groups") && (
              <AssignHierarchyChecklist
                assignmentScope={form.assignmentScope}
                filteredDepartments={form.getFilteredDepartments()}
                selectedDepartmentIds={form.selectedDepartmentIds}
                setSelectedDepartmentIds={form.setSelectedDepartmentIds}
                filteredPrograms={form.getFilteredPrograms()}
                selectedProgramIds={form.selectedProgramIds}
                setSelectedProgramIds={form.setSelectedProgramIds}
                filteredSubjects={form.getFilteredSubjects()}
                selectedSubjectIds={form.selectedSubjectIds}
                setSelectedSubjectIds={form.setSelectedSubjectIds}
                filteredGroups={form.getFilteredGroups()}
                selectedGroupIds={form.selectedGroupIds}
                setSelectedGroupIds={form.setSelectedGroupIds}
                toggleItem={form.toggleItem}
              />
            )}

            {form.assignmentScope === "open_entry" && (
              <AssignOpenEntry
                currentAssessment={form.currentAssessment}
                customEmail={form.customEmail}
                setCustomEmail={form.setCustomEmail}
                copiedLink={form.copiedLink}
                handleCopyLink={form.handleCopyLink}
                getPublicLinkOrigin={form.getPublicLinkOrigin}
              />
            )}
          </div>

          {/* 2. Schedule & Availability Policies */}
          <AssignScheduleConfig
            availableFrom={form.availableFrom}
            setAvailableFrom={form.setAvailableFrom}
            availableUntil={form.availableUntil}
            setAvailableUntil={form.setAvailableUntil}
            attemptsAllowed={form.attemptsAllowed}
            setAttemptsAllowed={form.setAttemptsAllowed}
            sendNotification={form.sendNotification}
            setSendNotification={form.setSendNotification}
          />

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-accent-100 dark:border-accent-800">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={form.submitting}>
              {form.assignmentScope === "open_entry"
                ? "Generate & Dispatch Assessment Access"
                : "Assign Assessment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}

export default AssignAssessmentModal;
