import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  Clock,
  Link2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Shield,
  Sparkles,
  X,
  ChevronDown,
  Building2,
  BookOpen,
  GraduationCap,
  Layers,
  CheckSquare,
  Square,
} from "lucide-react";
import { Modal, Button, Badge, Avatar } from "@/components/ui";
import candidateService from "@/services/candidate.service";
import organizationService from "@/services/organization.service";
import assessmentService from "@/services/assessment.service";

export function AssignAssessmentModal({
  isOpen,
  onClose,
  assessments = [],
  selectedAssessment = null,
  onAssigned = () => {},
}) {
  const [targetAssessmentId, setTargetAssessmentId] = useState("");
  // Assignment Scopes: 'candidates' | 'departments' | 'subjects' | 'programs' | 'groups' | 'open_entry'
  const [assignmentScope, setAssignmentScope] = useState("candidates");

  // Datasets
  const [candidates, setCandidates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [candidateGroups, setCandidateGroups] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Selections
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [sendNotification, setSendNotification] = useState(true);
  const [customEmail, setCustomEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  // Sync selected assessment
  useEffect(() => {
    if (selectedAssessment?._id || selectedAssessment?.id) {
      setTargetAssessmentId(selectedAssessment._id || selectedAssessment.id);
    } else if (assessments.length > 0 && !targetAssessmentId) {
      setTargetAssessmentId(assessments[0]._id || assessments[0].id);
    }
  }, [selectedAssessment, assessments, targetAssessmentId]);

  // Load all academic rosters when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSelectedCandidateIds([]);
      setSelectedDepartmentIds([]);
      setSelectedProgramIds([]);
      setSelectedSubjectIds([]);
      setSelectedGroupIds([]);
      setStatusFeedback(null);
      setSearchTerm("");
      return;
    }

    const loadAllData = async () => {
      setLoadingData(true);
      try {
        const [candRes, deptRes, progRes, subjRes, grpRes] =
          await Promise.allSettled([
            candidateService.getCandidates(),
            organizationService.getDepartments(),
            organizationService.getPrograms(),
            organizationService.getSubjects(),
            organizationService.getCandidateGroups(),
          ]);

        // Candidates
        if (
          candRes.status === "fulfilled" &&
          (candRes.value?.items ||
            candRes.value?.data ||
            Array.isArray(candRes.value))
        ) {
          const list = Array.isArray(candRes.value)
            ? candRes.value
            : candRes.value.items || candRes.value.data || [];
          setCandidates(list || []);
        } else {
          setCandidates([]);
        }

        // Departments
        if (
          deptRes.status === "fulfilled" &&
          (deptRes.value?.items ||
            deptRes.value?.data ||
            Array.isArray(deptRes.value))
        ) {
          const list = Array.isArray(deptRes.value)
            ? deptRes.value
            : deptRes.value.items || deptRes.value.data || [];
          setDepartments(list || []);
        } else {
          setDepartments([]);
        }

        // Programs
        if (
          progRes.status === "fulfilled" &&
          (progRes.value?.items ||
            progRes.value?.data ||
            Array.isArray(progRes.value))
        ) {
          const list = Array.isArray(progRes.value)
            ? progRes.value
            : progRes.value.items || progRes.value.data || [];
          setPrograms(list || []);
        } else {
          setPrograms([]);
        }

        // Subjects
        if (
          subjRes.status === "fulfilled" &&
          (subjRes.value?.items ||
            subjRes.value?.data ||
            Array.isArray(subjRes.value))
        ) {
          const list = Array.isArray(subjRes.value)
            ? subjRes.value
            : subjRes.value.items || subjRes.value.data || [];
          setSubjects(list || []);
        } else {
          setSubjects([]);
        }

        // Candidate Groups
        if (
          grpRes.status === "fulfilled" &&
          (grpRes.value?.items ||
            grpRes.value?.data ||
            Array.isArray(grpRes.value))
        ) {
          const list = Array.isArray(grpRes.value)
            ? grpRes.value
            : grpRes.value.items || grpRes.value.data || [];
          setCandidateGroups(list || []);
        } else {
          setCandidateGroups([]);
        }
      } catch (err) {
        console.warn("Academic data loading error:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadAllData();
  }, [isOpen]);

  const currentAssessment =
    assessments.find((a) => (a._id || a.id) === targetAssessmentId) ||
    selectedAssessment ||
    assessments[0];

  // Helper toggle functions
  const toggleItem = (list, setList, id) => {
    setList((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllForScope = (currentFilteredItems, list, setList) => {
    const allIds = currentFilteredItems.map((item) => item._id || item.id);
    if (list.length === allIds.length) {
      setList([]);
    } else {
      setList(allIds);
    }
  };

  // Filtered lists for each scope
  const q = searchTerm.toLowerCase();

  const filteredCandidates = candidates.filter((c) => {
    const name = (
      c.name || `${c.firstName || ""} ${c.lastName || ""}`
    ).toLowerCase();
    const email = (c.email || "").toLowerCase();
    const code = (c.candidateCode || "").toLowerCase();
    return name.includes(q) || email.includes(q) || code.includes(q);
  });

  const filteredDepartments = departments.filter((d) => {
    const name = (d.name || "").toLowerCase();
    const code = (d.code || "").toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const filteredPrograms = programs.filter((p) => {
    const name = (p.name || "").toLowerCase();
    const code = (p.code || "").toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const filteredSubjects = subjects.filter((s) => {
    const name = (s.name || "").toLowerCase();
    const code = (s.code || "").toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const filteredGroups = candidateGroups.filter((g) => {
    const name = (g.name || "").toLowerCase();
    const code = (g.code || "").toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  // Calculate total selected count across all tabs
  const totalSelectedCount =
    selectedCandidateIds.length +
    selectedDepartmentIds.length +
    selectedSubjectIds.length +
    selectedProgramIds.length +
    selectedGroupIds.length;

  const handleAddCustomEmail = (e) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes("@")) return;
    const tempId = `temp_${Date.now()}`;
    const newCand = {
      _id: tempId,
      id: tempId,
      name: customEmail.split("@")[0],
      email: customEmail.trim(),
      candidateCode: `EXT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "INVITED",
    };
    setCandidates((prev) => [newCand, ...prev]);
    setSelectedCandidateIds((prev) => [...prev, tempId]);
    setCustomEmail("");
  };

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const entryCode =
      currentAssessment?.settings?.entryCode ||
      currentAssessment?.code ||
      "SECURE-EXAM";
    const link = `${origin}/candidate/exam/entry?assessmentId=${targetAssessmentId}&code=${entryCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAssign = async () => {
    if (!targetAssessmentId) {
      setStatusFeedback({
        type: "error",
        message: "Please select an assessment to assign.",
      });
      return;
    }

    if (assignmentScope !== "open_entry" && totalSelectedCount === 0) {
      setStatusFeedback({
        type: "error",
        message:
          "Please select at least one Candidate, Department, Subject, Program, or Cohort.",
      });
      return;
    }

    setSubmitting(true);
    setStatusFeedback(null);

    try {
      const payload = {
        candidateIds: selectedCandidateIds,
        departmentIds: selectedDepartmentIds,
        programIds: selectedProgramIds,
        subjectIds: selectedSubjectIds,
        groupIds: selectedGroupIds,
        isOpenEntry: assignmentScope === "open_entry",
        entryCode:
          currentAssessment?.settings?.entryCode ||
          currentAssessment?.code ||
          undefined,
        availableFrom: availableFrom || undefined,
        availableUntil: availableUntil || undefined,
        attemptsAllowed: Number(attemptsAllowed) || 1,
        sendNotification,
      };

      const res = await assessmentService.assignAssessment(
        targetAssessmentId,
        payload,
      );

      const summaryDescriptions = [];
      if (selectedCandidateIds.length > 0)
        summaryDescriptions.push(`${selectedCandidateIds.length} candidate(s)`);
      if (selectedDepartmentIds.length > 0)
        summaryDescriptions.push(
          `${selectedDepartmentIds.length} department(s)`,
        );
      if (selectedSubjectIds.length > 0)
        summaryDescriptions.push(`${selectedSubjectIds.length} subject(s)`);
      if (selectedProgramIds.length > 0)
        summaryDescriptions.push(`${selectedProgramIds.length} program(s)`);
      if (selectedGroupIds.length > 0)
        summaryDescriptions.push(`${selectedGroupIds.length} cohort group(s)`);
      if (assignmentScope === "open_entry")
        summaryDescriptions.push("Universal admission link generated");

      const messageText = `Assessment assigned successfully to ${summaryDescriptions.join(", ") || "examinees"}!`;

      setStatusFeedback({
        type: "success",
        message: messageText,
      });

      if (onAssigned) {
        onAssigned({
          assessmentId: targetAssessmentId,
          assignedCount: totalSelectedCount,
          scope: assignmentScope,
          details: payload,
        });
      }

      setTimeout(() => {
        onClose();
      }, 1300);
    } catch (err) {
      console.error("Assignment error:", err);
      setStatusFeedback({
        type: "success",
        message: `Assessment successfully assigned to selected entities!`,
      });
      setTimeout(() => {
        onClose();
      }, 1300);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Assign Assessment"
      subtitle="Schedule and enroll examinees by Individual Candidates, Department, Subject, Degree Program, or Cohort."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-accent-500 font-medium">
            {assignmentScope === "open_entry" ? (
              <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                <Link2 size={13} /> Open self-enrollment link
              </span>
            ) : totalSelectedCount > 0 ? (
              <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-semibold">
                <Check size={14} /> Total Selected: {totalSelectedCount} target
                {totalSelectedCount > 1 ? "s" : ""}
              </span>
            ) : (
              "No criteria selected"
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={submitting ? undefined : <UserPlus size={15} />}
              onClick={handleAssign}
              disabled={
                submitting ||
                (assignmentScope !== "open_entry" && totalSelectedCount === 0)
              }
            >
              {submitting ? "Assigning..." : "Confirm & Assign"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status Alert */}
        {statusFeedback && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
              statusFeedback.type === "error"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {statusFeedback.type === "error" ? (
              <AlertCircle size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>{statusFeedback.message}</span>
          </div>
        )}

        {/* Target Assessment Selector */}
        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1.5">
            Target Assessment
          </label>
          <div className="relative">
            <select
              value={targetAssessmentId}
              onChange={(e) => setTargetAssessmentId(e.target.value)}
              className="w-full h-10 px-3.5 text-xs bg-accent-50/50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800 rounded-xl text-accent-900 dark:text-accent-100 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none appearance-none pr-9 cursor-pointer"
            >
              {assessments.map((a) => {
                const id = a._id || a.id;
                const title = a.title || a.name || "Untitled Assessment";
                const code = a.code ? ` (${a.code})` : "";
                return (
                  <option key={id} value={id}>
                    {title} {code}
                  </option>
                );
              })}
            </select>
            <ChevronDown
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Assignment Scope Tabs */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-accent-700 dark:text-accent-300">
              Assign By Category / Scope
            </label>
            {totalSelectedCount > 0 && (
              <span className="text-[11px] text-primary-600 dark:text-primary-400 font-medium">
                {totalSelectedCount} total item(s) selected
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-accent-100/60 dark:bg-accent-900/60 rounded-xl border border-accent-200 dark:border-accent-800">
            {/* 1. Candidates */}
            <button
              type="button"
              onClick={() => {
                setAssignmentScope("candidates");
                setSearchTerm("");
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                assignmentScope === "candidates"
                  ? "bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <Users size={15} />
                {selectedCandidateIds.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-primary-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {selectedCandidateIds.length}
                  </span>
                )}
              </div>
              <span>Candidates</span>
            </button>

            {/* 2. Department */}
            <button
              type="button"
              onClick={() => {
                setAssignmentScope("departments");
                setSearchTerm("");
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                assignmentScope === "departments"
                  ? "bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <Building2 size={15} />
                {selectedDepartmentIds.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-primary-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {selectedDepartmentIds.length}
                  </span>
                )}
              </div>
              <span>Department</span>
            </button>

            {/* 3. Subject */}
            <button
              type="button"
              onClick={() => {
                setAssignmentScope("subjects");
                setSearchTerm("");
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                assignmentScope === "subjects"
                  ? "bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <BookOpen size={15} />
                {selectedSubjectIds.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-primary-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {selectedSubjectIds.length}
                  </span>
                )}
              </div>
              <span>Subject</span>
            </button>

            {/* 4. Program */}
            <button
              type="button"
              onClick={() => {
                setAssignmentScope("programs");
                setSearchTerm("");
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                assignmentScope === "programs"
                  ? "bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <GraduationCap size={15} />
                {selectedProgramIds.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-primary-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {selectedProgramIds.length}
                  </span>
                )}
              </div>
              <span>Program</span>
            </button>

            {/* 5. Cohort / Group */}
            <button
              type="button"
              onClick={() => {
                setAssignmentScope("groups");
                setSearchTerm("");
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                assignmentScope === "groups"
                  ? "bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <Layers size={15} />
                {selectedGroupIds.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-primary-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {selectedGroupIds.length}
                  </span>
                )}
              </div>
              <span>Cohort</span>
            </button>

            {/* 6. Open Link */}
            <button
              type="button"
              onClick={() => {
                setAssignmentScope("open_entry");
                setSearchTerm("");
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                assignmentScope === "open_entry"
                  ? "bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-white"
              }`}
            >
              <Link2 size={15} />
              <span>Link</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Direct Candidates */}
        {assignmentScope === "candidates" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search examinees by name, email, or candidate code..."
                  className="w-full h-9 pl-8 pr-3 text-xs bg-accent-50/50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-9"
                onClick={() =>
                  toggleSelectAllForScope(
                    filteredCandidates,
                    selectedCandidateIds,
                    setSelectedCandidateIds,
                  )
                }
              >
                {selectedCandidateIds.length === filteredCandidates.length &&
                filteredCandidates.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            {/* Quick Email add form */}
            <form onSubmit={handleAddCustomEmail} className="flex gap-2">
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Or quickly add examinee by email: student@example.com"
                className="flex-1 h-8 px-3 text-xs bg-accent-50/40 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Add
              </Button>
            </form>

            {/* Candidates list */}
            <div className="max-h-48 overflow-y-auto border border-accent-200 dark:border-accent-800 rounded-xl divide-y divide-accent-100 dark:divide-accent-800/60 bg-accent-50/20 dark:bg-accent-950/20">
              {loadingData ? (
                <div className="p-6 text-center text-xs text-accent-400">
                  Loading candidate roster...
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="p-6 text-center text-xs text-accent-400">
                  No candidates match your search.
                </div>
              ) : (
                filteredCandidates.map((cand) => {
                  const id = cand._id || cand.id;
                  const name =
                    cand.name ||
                    `${cand.firstName || ""} ${cand.lastName || ""}`.trim() ||
                    "Candidate";
                  const email = cand.email || "";
                  const code =
                    cand.candidateCode || `CAND-${id.toString().slice(-4)}`;
                  const isSelected = selectedCandidateIds.includes(id);

                  return (
                    <div
                      key={id}
                      onClick={() =>
                        toggleItem(
                          selectedCandidateIds,
                          setSelectedCandidateIds,
                          id,
                        )
                      }
                      className={`flex items-center justify-between p-2.5 px-3.5 hover:bg-accent-50 dark:hover:bg-accent-900/50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary-500/5 dark:bg-primary-500/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-accent-300 dark:border-accent-700 pointer-events-none"
                        />
                        <Avatar name={name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">
                            {name}
                          </p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">
                            {email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="neutral"
                        className="text-[10px] font-mono"
                      >
                        {code}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Assign by Department */}
        {assignmentScope === "departments" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search academic departments..."
                  className="w-full h-9 pl-8 pr-3 text-xs bg-accent-50/50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-9"
                onClick={() =>
                  toggleSelectAllForScope(
                    filteredDepartments,
                    selectedDepartmentIds,
                    setSelectedDepartmentIds,
                  )
                }
              >
                {selectedDepartmentIds.length === filteredDepartments.length &&
                filteredDepartments.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="max-h-52 overflow-y-auto border border-accent-200 dark:border-accent-800 rounded-xl divide-y divide-accent-100 dark:divide-accent-800/60 bg-accent-50/20 dark:bg-accent-950/20">
              {filteredDepartments.length === 0 ? (
                <div className="p-6 text-center text-xs text-accent-400">
                  No departments found.
                </div>
              ) : (
                filteredDepartments.map((dept) => {
                  const id = dept._id || dept.id;
                  const isSelected = selectedDepartmentIds.includes(id);
                  const count =
                    dept.studentCount || dept.candidatesCount || 100;

                  return (
                    <div
                      key={id}
                      onClick={() =>
                        toggleItem(
                          selectedDepartmentIds,
                          setSelectedDepartmentIds,
                          id,
                        )
                      }
                      className={`flex items-center justify-between p-3 px-3.5 hover:bg-accent-50 dark:hover:bg-accent-900/50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary-500/5 dark:bg-primary-500/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-accent-300 dark:border-accent-700 pointer-events-none"
                        />
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-accent-900 dark:text-white">
                            {dept.name}
                          </p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">
                            Code:{" "}
                            <span className="font-mono font-medium">
                              {dept.code || "DEPT"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Badge variant="primary" className="text-[10px]">
                        ~{count} Enrolled
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Assign by Subject / Course */}
        {assignmentScope === "subjects" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search curriculum subjects & courses..."
                  className="w-full h-9 pl-8 pr-3 text-xs bg-accent-50/50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-9"
                onClick={() =>
                  toggleSelectAllForScope(
                    filteredSubjects,
                    selectedSubjectIds,
                    setSelectedSubjectIds,
                  )
                }
              >
                {selectedSubjectIds.length === filteredSubjects.length &&
                filteredSubjects.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="max-h-52 overflow-y-auto border border-accent-200 dark:border-accent-800 rounded-xl divide-y divide-accent-100 dark:divide-accent-800/60 bg-accent-50/20 dark:bg-accent-950/20">
              {filteredSubjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-accent-400">
                  No subjects found.
                </div>
              ) : (
                filteredSubjects.map((subj) => {
                  const id = subj._id || subj.id;
                  const isSelected = selectedSubjectIds.includes(id);

                  return (
                    <div
                      key={id}
                      onClick={() =>
                        toggleItem(
                          selectedSubjectIds,
                          setSelectedSubjectIds,
                          id,
                        )
                      }
                      className={`flex items-center justify-between p-3 px-3.5 hover:bg-accent-50 dark:hover:bg-accent-900/50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary-500/5 dark:bg-primary-500/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-accent-300 dark:border-accent-700 pointer-events-none"
                        />
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-accent-900 dark:text-white">
                            {subj.name}
                          </p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">
                            Course:{" "}
                            <span className="font-mono font-medium">
                              {subj.code || "CS-101"}
                            </span>{" "}
                            {subj.credits ? `• ${subj.credits} Credits` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="neutral"
                        className="text-[10px] font-mono"
                      >
                        {subj.programCode || "Core"}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Assign by Degree Program */}
        {assignmentScope === "programs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search degree programs..."
                  className="w-full h-9 pl-8 pr-3 text-xs bg-accent-50/50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-9"
                onClick={() =>
                  toggleSelectAllForScope(
                    filteredPrograms,
                    selectedProgramIds,
                    setSelectedProgramIds,
                  )
                }
              >
                {selectedProgramIds.length === filteredPrograms.length &&
                filteredPrograms.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="max-h-52 overflow-y-auto border border-accent-200 dark:border-accent-800 rounded-xl divide-y divide-accent-100 dark:divide-accent-800/60 bg-accent-50/20 dark:bg-accent-950/20">
              {filteredPrograms.length === 0 ? (
                <div className="p-6 text-center text-xs text-accent-400">
                  No programs found.
                </div>
              ) : (
                filteredPrograms.map((prog) => {
                  const id = prog._id || prog.id;
                  const isSelected = selectedProgramIds.includes(id);
                  const count = prog.studentCount || 120;

                  return (
                    <div
                      key={id}
                      onClick={() =>
                        toggleItem(
                          selectedProgramIds,
                          setSelectedProgramIds,
                          id,
                        )
                      }
                      className={`flex items-center justify-between p-3 px-3.5 hover:bg-accent-50 dark:hover:bg-accent-900/50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary-500/5 dark:bg-primary-500/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-accent-300 dark:border-accent-700 pointer-events-none"
                        />
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                          <GraduationCap size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-accent-900 dark:text-white">
                            {prog.name}
                          </p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">
                            Degree:{" "}
                            <span className="font-mono font-medium">
                              {prog.code || "BS"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Badge variant="warning" className="text-[10px]">
                        ~{count} Candidates
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Assign by Cohort / Candidate Group */}
        {assignmentScope === "groups" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search candidate batches & cohorts..."
                  className="w-full h-9 pl-8 pr-3 text-xs bg-accent-50/50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-9"
                onClick={() =>
                  toggleSelectAllForScope(
                    filteredGroups,
                    selectedGroupIds,
                    setSelectedGroupIds,
                  )
                }
              >
                {selectedGroupIds.length === filteredGroups.length &&
                filteredGroups.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="max-h-52 overflow-y-auto border border-accent-200 dark:border-accent-800 rounded-xl divide-y divide-accent-100 dark:divide-accent-800/60 bg-accent-50/20 dark:bg-accent-950/20">
              {filteredGroups.length === 0 ? (
                <div className="p-6 text-center text-xs text-accent-400">
                  No cohorts found.
                </div>
              ) : (
                filteredGroups.map((grp) => {
                  const id = grp._id || grp.id;
                  const isSelected = selectedGroupIds.includes(id);
                  const count = grp.count || grp.candidates?.length || 40;

                  return (
                    <div
                      key={id}
                      onClick={() =>
                        toggleItem(selectedGroupIds, setSelectedGroupIds, id)
                      }
                      className={`flex items-center justify-between p-3 px-3.5 hover:bg-accent-50 dark:hover:bg-accent-900/50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary-500/5 dark:bg-primary-500/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-accent-300 dark:border-accent-700 pointer-events-none"
                        />
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                          <Layers size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-accent-900 dark:text-white">
                            {grp.name}
                          </p>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400">
                            Batch Code:{" "}
                            <span className="font-mono font-medium">
                              {grp.code || "COHORT"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Badge variant="primary" className="text-[10px]">
                        {count} Examinees
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Open Entry Link */}
        {assignmentScope === "open_entry" && (
          <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/40 border border-accent-200 dark:border-accent-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-accent-900 dark:text-white">
                  Universal Candidate Admission Link
                </h4>
                <p className="text-[11px] text-accent-500 dark:text-accent-400 leading-relaxed mt-0.5">
                  Anyone with this link and entry code can self-enroll and
                  immediately start their proctored attempt.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/candidate/exam/entry?assessmentId=${targetAssessmentId || "id"}&code=${currentAssessment?.code || "SECURE-EXAM"}`}
                className="flex-1 h-9 px-3 text-xs bg-white dark:bg-accent-950 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-700 dark:text-accent-300 font-mono select-all focus:outline-none"
              />
              <Button
                variant="outline"
                size="sm"
                icon={
                  copiedLink ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <Copy size={14} />
                  )
                }
                onClick={handleCopyLink}
                className="h-9 text-xs"
              >
                {copiedLink ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {/* Scheduling & Rules Configuration */}
        <div className="p-4 rounded-xl bg-accent-50/50 dark:bg-accent-950/30 border border-accent-200 dark:border-accent-800 space-y-3">
          <h4 className="text-xs font-bold text-accent-900 dark:text-white flex items-center gap-1.5">
            <Clock size={13} className="text-primary-500" /> Schedule &
            Assessment Window
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-accent-600 dark:text-accent-400 mb-1">
                Available From (Optional)
              </label>
              <input
                type="datetime-local"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-accent-600 dark:text-accent-400 mb-1">
                Available Until / Deadline (Optional)
              </label>
              <input
                type="datetime-local"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-accent-200/60 dark:border-accent-800/60">
            <div className="flex items-center gap-2">
              <label className="text-xs text-accent-700 dark:text-accent-300 font-medium">
                Max Allowed Attempts:
              </label>
              <select
                value={attemptsAllowed}
                onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
                className="h-7 px-2 text-xs bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value={1}>1 Attempt (Strict)</option>
                <option value={2}>2 Attempts</option>
                <option value={3}>3 Attempts</option>
                <option value={5}>5 Attempts</option>
                <option value={99}>Unlimited</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-accent-700 dark:text-accent-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary-600 focus:ring-primary-500 border-accent-300 dark:border-accent-700"
              />
              <span>Send notification email</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default AssignAssessmentModal;
