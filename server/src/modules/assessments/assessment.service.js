import mongoose from "mongoose";
import Assessment from "./assessment.model.js";
import AssessmentSection from "../assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../assessmentAssignments/assessmentAssignment.model.js";
import Candidate from "../candidates/candidate.model.js";
import CandidateGroup from "../candidateGroups/candidateGroup.model.js";
import Subject from "../subjects/subject.model.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import {
  ASSESSMENT_STATUSES,
  EDITABLE_ASSESSMENT_STATUSES,
} from "../../constants/assessmentStatuses.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";

export class AssessmentService {
  static async createAssessment(organizationId, data, userId) {
    const code = (data.code || `ASM-${Date.now()}`).trim().toUpperCase();

    // 1. Verify subject belongs to this organization (if provided)
    if (data.subjectId) {
      const subject = await Subject.findOne({
        _id: data.subjectId,
        organizationId,
      });
      if (!subject) {
        throw new ApiError(400, "Subject not found in this organization");
      }
    }

    // 2. Check duplicate code
    const existing = await Assessment.findOne({ organizationId, code });
    if (existing) {
      throw new ApiError(409, `Assessment with code '${code}' already exists in this organization`);
    }

    const durationVal = data.duration?.value || (data.durationSeconds ? Math.ceil(data.durationSeconds / 60) : 60);
    const durationUnit = data.duration?.unit || "MINUTES";

    const assessment = await Assessment.create({
      organizationId,
      title: data.title.trim(),
      code,
      description: data.description || "",
      type: data.type || "MCQ",
      departmentId: data.departmentId || null,
      programId: data.programId || null,
      subjectId: data.subjectId || null,
      createdBy: userId,
      status: ASSESSMENT_STATUSES.DRAFT,
      instructions: data.instructions || "Read each question carefully and submit before the timer expires.",
      duration: { value: durationVal, unit: durationUnit },
      durationSeconds: durationUnit === "MINUTES" ? durationVal * 60 : durationVal,
      totalPoints: 0,
      passingScore: data.passingScore !== undefined ? data.passingScore : (data.gradingSettings?.passingScore || 60),
      scheduling: data.scheduling || { mode: "WINDOW", timezone: "UTC" },
      settings: data.settings || {},
      securitySettings: data.securitySettings || {},
      gradingSettings: data.gradingSettings || {},
      attemptSettings: data.attemptSettings || {},
      reviewSettings: data.reviewSettings || {},
      resultSettings: data.resultSettings || {},
      navigation: data.navigation || { mode: "ALLOW_BACKWARD_NAVIGATION" },
      version: 1,
    });

    return assessment;
  }

  static async getAssessments(organizationId, query = {}, callerUser = null) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId, status: { $ne: "DELETED" } };

    const isCandidate = callerUser?.organizationRole?.name === ORGANIZATION_ROLES.CANDIDATE;
    if (isCandidate) {
      filter.status = { $in: [ASSESSMENT_STATUSES.PUBLISHED, ASSESSMENT_STATUSES.ACTIVE] };
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.type) filter.type = query.type;
    if (query.search || query.q) {
      const searchStr = query.search || query.q;
      filter.$or = [
        { title: { $regex: searchStr, $options: "i" } },
        { code: { $regex: searchStr, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      Assessment.find(filter)
        .populate("subjectId", "name code")
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Assessment.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getAssessment(organizationId, assessmentId, callerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const filter = { _id: assessmentId, organizationId };
    const isCandidate = callerUser?.organizationRole?.name === ORGANIZATION_ROLES.CANDIDATE;
    if (isCandidate) {
      filter.status = { $in: [ASSESSMENT_STATUSES.PUBLISHED, ASSESSMENT_STATUSES.ACTIVE] };
    }

    const assessment = await Assessment.findOne(filter)
      .populate("subjectId", "name code")
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("createdBy", "firstName lastName email")
      .lean();

    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    const [sections, questions] = await Promise.all([
      AssessmentSection.find({ assessmentId }).sort({ order: 1 }).lean(),
      AssessmentQuestion.find({ assessmentId }).sort({ order: 1 }).lean(),
    ]);

    return {
      ...assessment,
      sections,
      questions,
    };
  }

  static async updateAssessment(organizationId, assessmentId, updateData, userId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      organizationId,
    });

    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    if (!EDITABLE_ASSESSMENT_STATUSES.includes(assessment.status)) {
      throw new ApiError(
        400,
        `Assessment is locked in '${assessment.status}' status and cannot be modified`
      );
    }

    const safeUpdate = {
      updatedBy: userId,
      $inc: { version: 1 },
    };

    if (updateData.title) safeUpdate.title = updateData.title.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.type) safeUpdate.type = updateData.type;
    if (updateData.instructions !== undefined) safeUpdate.instructions = updateData.instructions;
    if (updateData.duration) {
      safeUpdate.duration = updateData.duration;
      safeUpdate.durationSeconds = updateData.duration.unit === "MINUTES" ? updateData.duration.value * 60 : updateData.duration.value;
    } else if (updateData.durationSeconds) {
      safeUpdate.durationSeconds = updateData.durationSeconds;
      safeUpdate.duration = { value: Math.ceil(updateData.durationSeconds / 60), unit: "MINUTES" };
    }

    if (updateData.passingScore !== undefined) safeUpdate.passingScore = updateData.passingScore;
    if (updateData.settings) safeUpdate.settings = updateData.settings;
    if (updateData.securitySettings) safeUpdate.securitySettings = updateData.securitySettings;
    if (updateData.gradingSettings) safeUpdate.gradingSettings = updateData.gradingSettings;
    if (updateData.attemptSettings) safeUpdate.attemptSettings = updateData.attemptSettings;
    if (updateData.reviewSettings) safeUpdate.reviewSettings = updateData.reviewSettings;
    if (updateData.resultSettings) safeUpdate.resultSettings = updateData.resultSettings;
    if (updateData.navigation) safeUpdate.navigation = updateData.navigation;
    if (updateData.scheduling) safeUpdate.scheduling = updateData.scheduling;

    const updated = await Assessment.findOneAndUpdate(
      { _id: assessmentId, organizationId },
      safeUpdate,
      { returnDocument: "after", runValidators: true }
    );

    return updated;
  }

  static async deleteAssessment(organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const assessment = await Assessment.findOneAndUpdate(
      { _id: assessmentId, organizationId },
      { $set: { status: ASSESSMENT_STATUSES.ARCHIVED, archivedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    return { success: true, message: "Assessment archived successfully" };
  }

  static async publishAssessment(organizationId, assessmentId, userId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const assessment = await Assessment.findOne({ _id: assessmentId, organizationId });
    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    if (![ASSESSMENT_STATUSES.APPROVED, ASSESSMENT_STATUSES.READY_FOR_REVIEW, ASSESSMENT_STATUSES.DRAFT].includes(assessment.status)) {
      throw new ApiError(400, `Cannot publish assessment from '${assessment.status}' status`);
    }

    const sectionCount = await AssessmentSection.countDocuments({ assessmentId });
    if (sectionCount === 0) {
      throw new ApiError(400, "Cannot publish assessment: Must contain at least 1 section");
    }

    const questionCount = await AssessmentQuestion.countDocuments({ assessmentId });
    if (questionCount === 0) {
      throw new ApiError(400, "Cannot publish assessment: Must contain at least 1 question snapshot");
    }

    assessment.status = ASSESSMENT_STATUSES.PUBLISHED;
    assessment.publishedAt = new Date();
    assessment.publishedBy = userId;
    assessment.updatedBy = userId;
    await assessment.save();

    return assessment;
  }

  static async archiveAssessment(organizationId, assessmentId, userId) {
    return this.deleteAssessment(organizationId, assessmentId);
  }

  static async duplicateAssessment(organizationId, assessmentId, userId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const source = await Assessment.findOne({ _id: assessmentId, organizationId }).lean();
    if (!source) {
      throw new ApiError(404, "Source assessment not found");
    }

    const newCode = `${source.code}_COPY_${Date.now().toString().slice(-4)}`;
    const clonedAssessment = await Assessment.create({
      ...source,
      _id: new mongoose.Types.ObjectId(),
      title: `${source.title} (Copy)`,
      code: newCode,
      status: ASSESSMENT_STATUSES.DRAFT,
      publishedAt: null,
      publishedBy: null,
      archivedAt: null,
      createdBy: userId,
      updatedBy: userId,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sourceSections = await AssessmentSection.find({ assessmentId }).lean();
    const sectionMap = new Map();

    for (const sec of sourceSections) {
      const newSec = await AssessmentSection.create({
        ...sec,
        _id: new mongoose.Types.ObjectId(),
        assessmentId: clonedAssessment._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      sectionMap.set(sec._id.toString(), newSec._id);
    }

    const sourceQuestions = await AssessmentQuestion.find({ assessmentId }).lean();
    for (const q of sourceQuestions) {
      await AssessmentQuestion.create({
        ...q,
        _id: new mongoose.Types.ObjectId(),
        assessmentId: clonedAssessment._id,
        sectionId: sectionMap.get(q.sectionId?.toString()) || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return clonedAssessment;
  }

  static async previewAssessment(organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const assessment = await Assessment.findOne({ _id: assessmentId, organizationId })
      .populate("subjectId", "name code")
      .lean();

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    const [sections, questions] = await Promise.all([
      AssessmentSection.find({ assessmentId }).sort({ order: 1 }).lean(),
      AssessmentQuestion.find({ assessmentId }).sort({ order: 1 }).lean(),
    ]);

    const sanitizedQuestions = questions.map((q) => ({
      _id: q._id,
      sectionId: q.sectionId,
      order: q.order,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      isRequired: q.isRequired,
      snapshot: {
        type: q.snapshot?.type,
        title: q.snapshot?.title,
        prompt: q.snapshot?.prompt,
        options: (q.snapshot?.options || []).map((o) => ({ id: o.id, text: o.text })),
        coding: q.snapshot?.coding
          ? {
              languages: q.snapshot.coding.languages,
              starterCode: q.snapshot.coding.starterCode,
              timeLimit: q.snapshot.coding.timeLimit,
            }
          : undefined,
      },
    }));

    return {
      assessment: {
        title: assessment.title,
        description: assessment.description,
        instructions: assessment.instructions,
        duration: assessment.duration,
        durationSeconds: assessment.durationSeconds,
        totalPoints: assessment.totalPoints,
        passingScore: assessment.passingScore,
        securitySettings: assessment.securitySettings,
        sectionsCount: sections.length,
        questionsCount: questions.length,
      },
      sections,
      questions: sanitizedQuestions,
    };
  }

  /**
   * Candidate & Group Assignments
   */
  static async assignCandidates(organizationId, assessmentId, data, userId) {
    const { candidateIds = [], groupIds = [], availableFrom, availableUntil, attemptsAllowed } = data;

    const assessment = await Assessment.findOne({ _id: assessmentId, organizationId });
    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    const targetCandidateIds = new Set(candidateIds.map((id) => id.toString()));

    if (Array.isArray(groupIds) && groupIds.length > 0) {
      const groups = await CandidateGroup.find({ _id: { $in: groupIds }, organizationId }).lean();
      for (const grp of groups) {
        if (Array.isArray(grp.candidates)) {
          grp.candidates.forEach((cId) => targetCandidateIds.add(cId.toString()));
        }
      }
    }

    const createdAssignments = [];
    for (const candId of targetCandidateIds) {
      if (mongoose.Types.ObjectId.isValid(candId)) {
        const candidate = await Candidate.findOne({ _id: candId, organizationId });
        if (candidate) {
          const assignment = await AssessmentAssignment.findOneAndUpdate(
            { assessmentId, candidateId: candId, organizationId },
            {
              assessmentId,
              candidateId: candId,
              organizationId,
              assignedBy: userId,
              status: "ASSIGNED",
              assignedAt: new Date(),
              availableFrom: availableFrom ? new Date(availableFrom) : assessment.scheduling?.startAt,
              availableUntil: availableUntil ? new Date(availableUntil) : assessment.scheduling?.endAt,
              attemptsAllowed: attemptsAllowed || assessment.settings?.maxAttempts || 1,
            },
            { upsert: true, returnDocument: "after" }
          );
          createdAssignments.push(assignment);

          if (candidate.userId) {
            await NotificationService.notify({
              organizationId,
              recipientId: candidate.userId,
              type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
              data: {
                assessmentId: assessment._id,
                assessmentTitle: assessment.title,
                durationMinutes: assessment.duration?.value || 60,
                availableUntil: availableUntil || "Open",
              },
            });
          }
        }
      }
    }

    return {
      assignedCount: createdAssignments.length,
      assignments: createdAssignments,
    };
  }

  static async getAssignments(organizationId, assessmentId, query = {}) {
    const filter = { organizationId, assessmentId };
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      AssessmentAssignment.find(filter)
        .populate("candidateId", "firstName lastName email candidateCode")
        .populate("assignedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AssessmentAssignment.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async removeAssignment(organizationId, assessmentId, candidateId) {
    return AssessmentAssignment.findOneAndDelete({
      organizationId,
      assessmentId,
      candidateId,
    });
  }
}
