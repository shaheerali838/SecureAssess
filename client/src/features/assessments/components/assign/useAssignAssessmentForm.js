import { useState, useEffect } from "react";
import candidateService from "@/services/candidate.service";
import organizationService from "@/services/organization.service";
import assessmentService from "@/services/assessment.service";

const getPublicLinkOrigin = () => "https://secure-assess.vercel.app";

export function useAssignAssessmentForm({
  isOpen,
  assessments = [],
  selectedAssessment = null,
  onAssigned = () => {},
  onClose = () => {},
}) {
  const [targetAssessmentId, setTargetAssessmentId] = useState("");
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

  // Search & Settings
  const [searchTerm, setSearchTerm] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [sendNotification, setSendNotification] = useState(true);
  const [customEmail, setCustomEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  useEffect(() => {
    if (selectedAssessment?._id || selectedAssessment?.id) {
      setTargetAssessmentId(selectedAssessment._id || selectedAssessment.id);
    } else if (assessments.length > 0 && !targetAssessmentId) {
      setTargetAssessmentId(assessments[0]._id || assessments[0].id);
    }
  }, [selectedAssessment, assessments, targetAssessmentId]);

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

        if (candRes.status === "fulfilled") {
          const list = Array.isArray(candRes.value)
            ? candRes.value
            : candRes.value?.items || candRes.value?.data || [];
          setCandidates(list || []);
        } else {
          setCandidates([]);
        }

        if (deptRes.status === "fulfilled") {
          const list = Array.isArray(deptRes.value)
            ? deptRes.value
            : deptRes.value?.items || deptRes.value?.data || [];
          setDepartments(list || []);
        } else {
          setDepartments([]);
        }

        if (progRes.status === "fulfilled") {
          const list = Array.isArray(progRes.value)
            ? progRes.value
            : progRes.value?.items || progRes.value?.data || [];
          setPrograms(list || []);
        } else {
          setPrograms([]);
        }

        if (subjRes.status === "fulfilled") {
          const list = Array.isArray(subjRes.value)
            ? subjRes.value
            : subjRes.value?.items || subjRes.value?.data || [];
          setSubjects(list || []);
        } else {
          setSubjects([]);
        }

        if (grpRes.status === "fulfilled") {
          const list = Array.isArray(grpRes.value)
            ? grpRes.value
            : grpRes.value?.items || grpRes.value?.data || [];
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

  const toggleItem = (list, setList, id) => {
    setList((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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

  const getFilteredCandidates = () => {
    return candidates.filter((c) => {
      const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const code = (c.candidateCode || c.studentId || "").toLowerCase();
      const q = searchTerm.toLowerCase();
      return name.includes(q) || email.includes(q) || code.includes(q);
    });
  };

  const getFilteredDepartments = () => {
    return departments.filter(
      (d) =>
        (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredPrograms = () => {
    return programs.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredSubjects = () => {
    return subjects.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredGroups = () => {
    return candidateGroups.filter(
      (g) =>
        (g.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleCopyLink = () => {
    if (!currentAssessment) return;
    const origin = getPublicLinkOrigin();
    const token =
      currentAssessment.entryToken ||
      currentAssessment.invitationToken ||
      currentAssessment._id ||
      currentAssessment.id;
    const link = `${origin}/assessment/entry/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!targetAssessmentId) {
      setStatusFeedback({
        type: "error",
        message: "Please choose an assessment to assign.",
      });
      return;
    }

    if (assignmentScope === "candidates" && selectedCandidateIds.length === 0) {
      setStatusFeedback({
        type: "error",
        message: "Please select at least one candidate.",
      });
      return;
    }

    if (
      assignmentScope === "departments" &&
      selectedDepartmentIds.length === 0
    ) {
      setStatusFeedback({
        type: "error",
        message: "Please select at least one academic department.",
      });
      return;
    }

    if (assignmentScope === "programs" && selectedProgramIds.length === 0) {
      setStatusFeedback({
        type: "error",
        message: "Please select at least one degree program cohort.",
      });
      return;
    }

    if (assignmentScope === "subjects" && selectedSubjectIds.length === 0) {
      setStatusFeedback({
        type: "error",
        message: "Please select at least one course / subject.",
      });
      return;
    }

    if (assignmentScope === "groups" && selectedGroupIds.length === 0) {
      setStatusFeedback({
        type: "error",
        message: "Please select at least one candidate group.",
      });
      return;
    }

    setSubmitting(true);
    setStatusFeedback(null);

    try {
      const payload = {
        assessmentId: targetAssessmentId,
        scope: assignmentScope,
        candidateIds:
          assignmentScope === "candidates" ? selectedCandidateIds : [],
        departmentIds:
          assignmentScope === "departments" ? selectedDepartmentIds : [],
        programIds: assignmentScope === "programs" ? selectedProgramIds : [],
        subjectIds: assignmentScope === "subjects" ? selectedSubjectIds : [],
        groupIds: assignmentScope === "groups" ? selectedGroupIds : [],
        customEmail: assignmentScope === "open_entry" ? customEmail : undefined,
        availableFrom: availableFrom || undefined,
        availableUntil: availableUntil || undefined,
        attemptsAllowed: Number(attemptsAllowed) || 1,
        sendNotification,
      };

      await assessmentService.assignAssessment(targetAssessmentId, payload);

      setStatusFeedback({
        type: "success",
        message: "Assessment successfully assigned and invitations dispatched!",
      });

      onAssigned();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Assignment error:", err);
      setStatusFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          err.message ||
          "Failed to assign assessment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    targetAssessmentId,
    setTargetAssessmentId,
    assignmentScope,
    setAssignmentScope,
    currentAssessment,
    candidates,
    departments,
    programs,
    subjects,
    candidateGroups,
    loadingData,
    selectedCandidateIds,
    setSelectedCandidateIds,
    selectedDepartmentIds,
    setSelectedDepartmentIds,
    selectedProgramIds,
    setSelectedProgramIds,
    selectedSubjectIds,
    setSelectedSubjectIds,
    selectedGroupIds,
    setSelectedGroupIds,
    searchTerm,
    setSearchTerm,
    availableFrom,
    setAvailableFrom,
    availableUntil,
    setAvailableUntil,
    attemptsAllowed,
    setAttemptsAllowed,
    sendNotification,
    setSendNotification,
    customEmail,
    setCustomEmail,
    copiedLink,
    submitting,
    statusFeedback,
    toggleItem,
    toggleSelectAllForScope,
    getFilteredCandidates,
    getFilteredDepartments,
    getFilteredPrograms,
    getFilteredSubjects,
    getFilteredGroups,
    handleCopyLink,
    handleAssign,
    getPublicLinkOrigin,
  };
}
