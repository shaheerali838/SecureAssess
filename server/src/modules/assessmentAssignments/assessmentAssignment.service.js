import mongoose from "mongoose";
import crypto from "crypto";
import AssessmentAssignment from "./assessmentAssignment.model.js";
import Assessment from "../assessments/assessment.model.js";
import Candidate from "../candidates/candidate.model.js";
import CandidateGroup from "../candidateGroups/candidateGroup.model.js";
import CandidateGroupMember from "../candidateGroups/candidateGroupMember.model.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { ASSESSMENT_STATUSES } from "../../constants/assessmentStatuses.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";

const generateAccessCode = () => {
  const bytes = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `SA-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`;
};

export class AssessmentAssignmentService {
  /**
   * Helper: Asserts that assessment exists and is published/active in this organization
   */
  static async assertPublishedAssessment(organizationId, assessmentId) {
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

    if (![ASSESSMENT_STATUSES.PUBLISHED, ASSESSMENT_STATUSES.ACTIVE].includes(assessment.status)) {
      throw new ApiError(
        400,
        `Cannot assign assessment in '${assessment.status}' status. Only PUBLISHED or ACTIVE assessments can be assigned.`
      );
    }

    return assessment;
  }

  /**
   * Assigns an assessment to an array of specific candidates
   */
  static async createAssignments(organizationId, assessmentId, data, userId = null) {
    const assessment = await this.assertPublishedAssessment(organizationId, assessmentId);

    if (data.availableFrom && data.availableUntil) {
      if (new Date(data.availableFrom) >= new Date(data.availableUntil)) {
        throw new ApiError(400, "availableFrom must be before availableUntil");
      }
    }

    const candidateIds = data.candidateIds || [];
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      throw new ApiError(400, "candidateIds array is required and must not be empty");
    }

    // 1. Verify all candidateIds exist in this organization and are active
    const candidates = await Candidate.find({
      _id: { $in: candidateIds },
      organizationId,
      status: "ACTIVE",
    });

    if (candidates.length !== candidateIds.length) {
      throw new ApiError(
        400,
        "One or more candidate IDs are invalid, do not belong to this organization, or are not ACTIVE."
      );
    }

    // 2. Check duplicate active assignments across all candidates before creation
    for (const candidate of candidates) {
      const existing = await AssessmentAssignment.findOne({
        organizationId,
        assessmentId,
        candidateId: candidate._id,
        status: { $in: ["ASSIGNED", "AVAILABLE", "INVITED", "STARTED", "IN_PROGRESS"] },
      });

      if (existing) {
        throw new ApiError(
          409,
          `Candidate '${candidate.firstName} ${candidate.lastName}' (${candidate.candidateCode}) already has an active assignment for this assessment.`
        );
      }
    }

    const createdAssignments = [];
    for (const candidate of candidates) {
      const assignment = await AssessmentAssignment.create({
        organizationId,
        assessmentId,
        candidateId: candidate._id,
        assignedBy: userId,
        status: "ASSIGNED",
        accessCode: generateAccessCode(),
        assignedAt: new Date(),
        scheduledAt: data.scheduledAt || data.availableFrom || null,
        availableFrom: data.availableFrom || assessment.scheduling?.startAt || null,
        availableUntil: data.availableUntil || assessment.scheduling?.endAt || null,
        maxAttempts: data.maxAttempts || data.attemptLimit || assessment.settings?.maxAttempts || 1,
        attemptLimit: data.attemptLimit || data.maxAttempts || assessment.settings?.maxAttempts || 1,
        instructions: data.instructions || assessment.instructions || "",
        metadata: data.metadata || {},
        createdBy: userId,
      });

      createdAssignments.push(assignment);

      // Trigger candidate notification if candidate has a linked user
      if (candidate.userId) {
        NotificationService.createNotification({
          organizationId,
          recipientId: candidate.userId,
          type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
          title: "New Assessment Assigned",
          message: `You have been assigned the assessment: ${assessment.title}`,
          data: { assessmentId: assessment._id, assignmentId: assignment._id },
        }).catch(() => {});
      }

      // Record audit log
      AuditLogService.createAuditLog({
        organizationId,
        actorId: userId,
        action: "CREATE",
        resource: "ASSIGNMENT",
        resourceId: assignment._id,
        description: `Candidate '${candidate.email}' assigned to assessment '${assessment.title}'`,
      }).catch(() => {});
    }

    return {
      assignedCount: createdAssignments.length,
      assignments: createdAssignments,
    };
  }

  /**
   * Assigns an assessment to an entire candidate group
   */
  static async createGroupAssignment(organizationId, assessmentId, data, userId = null) {
    const assessment = await this.assertPublishedAssessment(organizationId, assessmentId);

    if (!mongoose.Types.ObjectId.isValid(data.groupId)) {
      throw new ApiError(400, "Invalid groupId format");
    }

    const group = await CandidateGroup.findOne({ _id: data.groupId, organizationId });
    if (!group) {
      throw new ApiError(404, "Candidate group not found in this organization");
    }

    if (data.availableFrom && data.availableUntil) {
      if (new Date(data.availableFrom) >= new Date(data.availableUntil)) {
        throw new ApiError(400, "availableFrom must be before availableUntil");
      }
    }

    // Retrieve group members
    const members = await CandidateGroupMember.find({ organizationId, groupId: group._id });
    const candidateIds = members.map((m) => m.candidateId);

    const candidates = await Candidate.find({
      _id: { $in: candidateIds },
      organizationId,
      status: "ACTIVE",
    });

    const createdAssignments = [];
    for (const candidate of candidates) {
      const existing = await AssessmentAssignment.findOne({
        organizationId,
        assessmentId,
        candidateId: candidate._id,
        status: { $in: ["ASSIGNED", "AVAILABLE", "INVITED", "STARTED", "IN_PROGRESS"] },
      });

      if (!existing) {
        const assignment = await AssessmentAssignment.create({
          organizationId,
          assessmentId,
          candidateId: candidate._id,
          candidateGroupId: group._id,
          assignedBy: userId,
          status: "ASSIGNED",
          accessCode: generateAccessCode(),
          assignedAt: new Date(),
          scheduledAt: data.scheduledAt || data.availableFrom || null,
          availableFrom: data.availableFrom || assessment.scheduling?.startAt || null,
          availableUntil: data.availableUntil || assessment.scheduling?.endAt || null,
          maxAttempts: data.maxAttempts || data.attemptLimit || assessment.settings?.maxAttempts || 1,
          attemptLimit: data.attemptLimit || data.maxAttempts || assessment.settings?.maxAttempts || 1,
          instructions: data.instructions || assessment.instructions || "",
          metadata: data.metadata || {},
          createdBy: userId,
        });
        createdAssignments.push(assignment);

        if (candidate.userId) {
          NotificationService.createNotification({
            organizationId,
            recipientId: candidate.userId,
            type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
            title: "New Group Assessment Assigned",
            message: `You have been assigned the assessment: ${assessment.title} via group ${group.name}`,
            data: { assessmentId: assessment._id, assignmentId: assignment._id, groupId: group._id },
          }).catch(() => {});
        }
      }
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "CREATE",
      resource: "ASSIGNMENT",
      resourceId: assessment._id,
      description: `Bulk assigned assessment '${assessment.title}' to group '${group.name}' (${createdAssignments.length} candidates)`,
    }).catch(() => {});

    return {
      groupId: group._id,
      assignedCount: createdAssignments.length,
      assignments: createdAssignments,
    };
  }

  static async getAssignments(organizationId, assessmentId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId, assessmentId };

    if (query.status) filter.status = query.status;
    if (query.candidateId && mongoose.Types.ObjectId.isValid(query.candidateId)) {
      filter.candidateId = query.candidateId;
    }
    if (query.candidateGroupId && mongoose.Types.ObjectId.isValid(query.candidateGroupId)) {
      filter.candidateGroupId = query.candidateGroupId;
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      AssessmentAssignment.find(filter)
        .populate("candidateId", "candidateCode firstName lastName email")
        .populate("candidateGroupId", "name code")
        .sort({ assignedAt: -1 })
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

  static async getAssignmentById(organizationId, assignmentId, callerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ApiError(400, "Invalid assignment ID format");
    }

    const assignment = await AssessmentAssignment.findOne({
      _id: assignmentId,
      organizationId,
    })
      .populate("candidateId", "candidateCode firstName lastName email userId")
      .populate("assessmentId", "title code type durationSeconds passingScore status instructions")
      .populate("candidateGroupId", "name code");

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found in this organization");
    }

    const isCandidate = callerUser?.organizationRole?.name === ORGANIZATION_ROLES.CANDIDATE;
    if (isCandidate) {
      const candidateUserMatch = assignment.candidateId?.userId?.toString() === (callerUser.id || callerUser._id)?.toString();
      if (!candidateUserMatch) {
        throw new ApiError(403, "Forbidden. You are not authorized to view another candidate's assignment.");
      }
    }

    return assignment;
  }

  static async cancelAssignment(organizationId, assignmentId, reason = "Cancelled by administrator", userId = null) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ApiError(400, "Invalid assignment ID format");
    }

    const assignment = await AssessmentAssignment.findOneAndUpdate(
      { _id: assignmentId, organizationId },
      { $set: { status: "CANCELLED", updatedBy: userId, "metadata.cancellationReason": reason } },
      { returnDocument: "after" }
    ).populate("candidateId", "userId email");

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found in this organization");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "ASSIGNMENT",
      resourceId: assignment._id,
      description: `Cancelled assessment assignment: ${reason}`,
    }).catch(() => {});

    return assignment;
  }

  static async rescheduleAssignment(organizationId, assignmentId, data, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ApiError(400, "Invalid assignment ID format");
    }

    if (data.availableFrom && data.availableUntil) {
      if (new Date(data.availableFrom) >= new Date(data.availableUntil)) {
        throw new ApiError(400, "availableFrom must be before availableUntil");
      }
    }

    const safeUpdate = { updatedBy: userId };
    if (data.availableFrom !== undefined) safeUpdate.availableFrom = data.availableFrom;
    if (data.availableUntil !== undefined) safeUpdate.availableUntil = data.availableUntil;
    if (data.scheduledAt !== undefined) safeUpdate.scheduledAt = data.scheduledAt;

    const assignment = await AssessmentAssignment.findOneAndUpdate(
      { _id: assignmentId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after" }
    );

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found in this organization");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "ASSIGNMENT",
      resourceId: assignment._id,
      description: `Rescheduled assessment assignment window`,
    }).catch(() => {});

    return assignment;
  }

  static async revokeAssignment(organizationId, assignmentId, userId = null) {
    return this.cancelAssignment(organizationId, assignmentId, "Revoked by staff", userId);
  }

  /**
   * Candidate View: Retrieves active assignments assigned to the authenticated user
   */
  static async getCandidateAssignments(userId, organizationId) {
    const candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
    if (!candidate) {
      return [];
    }

    const assignments = await AssessmentAssignment.find({
      organizationId,
      candidateId: candidate._id,
      status: { $in: ["ASSIGNED", "AVAILABLE", "INVITED", "STARTED", "IN_PROGRESS"] },
    })
      .populate("assessmentId", "title code type durationSeconds passingScore instructions")
      .sort({ assignedAt: -1 });

    return assignments;
  }

  /**
   * Candidate Authorization Boundary: Verifies that the candidate has an active assignment and is within the window
   */
  static async getAuthorizedAssessmentForCandidate(userId, organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
    if (!candidate) {
      throw new ApiError(403, "You do not have an active candidate profile in this organization");
    }

    const assignment = await AssessmentAssignment.findOne({
      organizationId,
      assessmentId,
      candidateId: candidate._id,
    });

    if (!assignment) {
      throw new ApiError(403, "You do not have an authorized assignment for this assessment");
    }

    if (assignment.status === "CANCELLED" || assignment.status === "REVOKED") {
      throw new ApiError(403, "This assessment assignment has been cancelled or revoked.");
    }
    if (assignment.status === "EXPIRED") {
      throw new ApiError(403, "This assessment assignment has expired.");
    }

    // Availability Window Verification
    const now = new Date();
    if (assignment.availableFrom && now < new Date(assignment.availableFrom)) {
      throw new ApiError(403, `Assessment is not available yet. It opens on ${new Date(assignment.availableFrom).toISOString()}`);
    }
    if (assignment.availableUntil && now > new Date(assignment.availableUntil)) {
      throw new ApiError(403, `Assessment has expired on ${new Date(assignment.availableUntil).toISOString()}`);
    }

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      organizationId,
      status: { $in: [ASSESSMENT_STATUSES.PUBLISHED, ASSESSMENT_STATUSES.ACTIVE] },
    });

    if (!assessment) {
      throw new ApiError(404, "Assessment is currently not active or published");
    }

    return {
      assignmentId: assignment._id,
      accessCode: assignment.accessCode,
      attemptLimit: assignment.attemptLimit,
      maxAttempts: assignment.maxAttempts,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        code: assessment.code,
        type: assessment.type,
        durationSeconds: assessment.durationSeconds,
        passingScore: assessment.passingScore,
        instructions: assignment.instructions || assessment.instructions,
        settings: assessment.settings,
      },
    };
  }
}
