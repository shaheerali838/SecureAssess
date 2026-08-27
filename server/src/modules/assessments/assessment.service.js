import mongoose from "mongoose";
import Assessment from "./assessment.model.js";
import AssessmentSection from "../assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../assessmentQuestions/assessmentQuestion.model.js";
import Subject from "../subjects/subject.model.js";
import {
  ASSESSMENT_STATUSES,
  EDITABLE_ASSESSMENT_STATUSES,
} from "../../constants/assessmentStatuses.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";

export class AssessmentService {
  static async createAssessment(organizationId, data, userId) {
    const code = data.code.trim().toUpperCase();

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
      instructions: data.instructions || "",
      durationSeconds: data.durationSeconds || 3600,
      totalPoints: 0,
      passingScore: data.passingScore !== undefined ? data.passingScore : 60,
      settings: data.settings || {},
      scheduling: data.scheduling || {},
      version: 1,
    });

    return assessment;
  }

  static async getAssessments(organizationId, query = {}, callerUser = null) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

    const isCandidate = callerUser?.organizationRole?.name === ORGANIZATION_ROLES.CANDIDATE;
    if (isCandidate) {
      // Candidates only see PUBLISHED or ACTIVE assessments
      filter.status = { $in: [ASSESSMENT_STATUSES.PUBLISHED, ASSESSMENT_STATUSES.ACTIVE] };
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.type) filter.type = query.type;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { code: { $regex: query.search, $options: "i" } },
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
      .populate("createdBy", "firstName lastName email");

    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    return assessment;
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

    // Assessment locking check
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
    if (updateData.durationSeconds) safeUpdate.durationSeconds = updateData.durationSeconds;
    if (updateData.passingScore !== undefined) safeUpdate.passingScore = updateData.passingScore;
    if (updateData.settings) safeUpdate.settings = updateData.settings;
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
      { $set: { status: ASSESSMENT_STATUSES.ARCHIVED } },
      { returnDocument: "after" }
    );

    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    return { success: true, message: "Assessment archived successfully" };
  }

  /**
   * Dedicated Lifecycle Transitions
   */
  static async submitForReview(organizationId, assessmentId, userId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const assessment = await Assessment.findOne({ _id: assessmentId, organizationId });
    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    if (assessment.status !== ASSESSMENT_STATUSES.DRAFT) {
      throw new ApiError(400, `Cannot submit for review from '${assessment.status}' status. Must be in DRAFT.`);
    }

    assessment.status = ASSESSMENT_STATUSES.READY_FOR_REVIEW;
    assessment.updatedBy = userId;
    await assessment.save();

    return assessment;
  }

  static async approveAssessment(organizationId, assessmentId, userId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const assessment = await Assessment.findOne({ _id: assessmentId, organizationId });
    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    if (assessment.status !== ASSESSMENT_STATUSES.READY_FOR_REVIEW && assessment.status !== ASSESSMENT_STATUSES.DRAFT) {
      throw new ApiError(400, `Cannot approve assessment from '${assessment.status}' status`);
    }

    assessment.status = ASSESSMENT_STATUSES.APPROVED;
    assessment.updatedBy = userId;
    await assessment.save();

    return assessment;
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

    // Publishing Pre-Requisites Validation (Rule 21 & 22)
    const sectionCount = await AssessmentSection.countDocuments({ assessmentId });
    if (sectionCount === 0) {
      throw new ApiError(400, "Cannot publish assessment: Must contain at least 1 section");
    }

    const questionCount = await AssessmentQuestion.countDocuments({ assessmentId });
    if (questionCount === 0) {
      throw new ApiError(400, "Cannot publish assessment: Must contain at least 1 question snapshot");
    }

    if (!assessment.durationSeconds || assessment.durationSeconds < 60) {
      throw new ApiError(400, "Cannot publish assessment: Duration must be greater than 60 seconds");
    }

    if (assessment.scheduling?.startAt && assessment.scheduling?.endAt) {
      if (new Date(assessment.scheduling.startAt) >= new Date(assessment.scheduling.endAt)) {
        throw new ApiError(400, "Cannot publish assessment: Scheduled startAt must be before endAt");
      }
    }

    assessment.status = ASSESSMENT_STATUSES.PUBLISHED;
    assessment.publishedAt = new Date();
    assessment.publishedBy = userId;
    assessment.updatedBy = userId;
    await assessment.save();

    return assessment;
  }

  static async closeAssessment(organizationId, assessmentId, userId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const assessment = await Assessment.findOne({ _id: assessmentId, organizationId });
    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    if (![ASSESSMENT_STATUSES.PUBLISHED, ASSESSMENT_STATUSES.ACTIVE].includes(assessment.status)) {
      throw new ApiError(400, `Cannot close assessment from '${assessment.status}' status`);
    }

    assessment.status = ASSESSMENT_STATUSES.CLOSED;
    assessment.updatedBy = userId;
    await assessment.save();

    return assessment;
  }

  static async archiveAssessment(organizationId, assessmentId, userId) {
    return this.deleteAssessment(organizationId, assessmentId);
  }
}
