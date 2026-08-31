import crypto from "crypto";
import mongoose from "mongoose";
import Candidate from "./candidate.model.js";
import CandidateRepository from "./candidate.repository.js";
import Department from "../departments/department.model.js";
import Program from "../programs/program.model.js";
import CandidateGroup from "../candidateGroups/candidateGroup.model.js";
import User from "../users/user.model.js";
import UserMembership from "../users/userMembership.model.js";
import Role from "../roles/role.model.js";
import AssessmentAssignment from "../assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../attempts/attempt.model.js";
import Result from "../results/result.model.js";
import Certificate from "../certificates/certificate.model.js";
import Interview from "../interviews/interview.model.js";
import { EntitlementService } from "../../services/billing/entitlement.service.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword } from "../../utils/password.js";

export class CandidateService {
  /**
   * Generates a cryptographically random single-use invitation token
   */
  static generateInvitationToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Creates a new candidate within an organization and links/creates universal user identity
   */
  static async createCandidate(organizationId, data, actorUserId = null) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    // 1. Quota check
    await EntitlementService.checkUsageLimit(organizationId, "candidates");

    const candidateCode = data.candidateCode.trim().toUpperCase();
    const email = data.email.trim().toLowerCase();

    // 2. Tenant-scoped uniqueness: verify candidateCode in this organization
    const existingCode = await Candidate.findOne({ organizationId, candidateCode });
    if (existingCode) {
      throw new ApiError(409, `Candidate with code '${candidateCode}' already exists in this organization`);
    }

    // 3. Verify Department belongs to organization (if provided)
    if (data.departmentId) {
      const department = await Department.findOne({ _id: data.departmentId, organizationId });
      if (!department) {
        throw new ApiError(400, "Department not found in this organization");
      }
    }

    // 4. Verify Program belongs to organization (if provided)
    if (data.programId) {
      const program = await Program.findOne({ _id: data.programId, organizationId });
      if (!program) {
        throw new ApiError(400, "Program not found in this organization");
      }
    }

    // 5. Verify CandidateGroup belongs to organization (if provided)
    if (data.candidateGroupId) {
      const group = await CandidateGroup.findOne({ _id: data.candidateGroupId, organizationId });
      if (!group) {
        throw new ApiError(400, "Candidate group not found in this organization");
      }
    }

    // 6. Universal User Identity resolution: reuse existing global user if present, or create
    let userId = data.userId || null;
    if (!userId) {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email,
          passwordHash: "$2b$10$unassignedCandidateTempHash12345",
          status: "ACTIVE",
          emailVerified: false,
        });
      }
      userId = user._id;
    }

    // 7. Ensure UserMembership exists for this candidate in this organization
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });
    if (candidateRole) {
      await UserMembership.findOneAndUpdate(
        { userId, organizationId },
        {
          $setOnInsert: {
            userId,
            organizationId,
            roleId: candidateRole._id,
            status: "ACTIVE",
          },
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    // 8. Invitation token setup if status is INVITED
    let invitationToken = null;
    let invitationExpiresAt = null;
    if (data.status === "INVITED") {
      invitationToken = this.generateInvitationToken();
      invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    const candidate = await Candidate.create({
      organizationId,
      userId,
      candidateCode,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      phone: data.phone || data.phoneNumber || "",
      phoneNumber: data.phoneNumber || data.phone || "",
      departmentId: data.departmentId || null,
      programId: data.programId || null,
      candidateGroupId: data.candidateGroupId || null,
      status: data.status || "ACTIVE",
      invitationToken,
      invitationExpiresAt,
      metadata: data.metadata || {},
    });

    // If candidateGroupId is assigned, increment group member count
    if (candidate.candidateGroupId) {
      await CandidateGroup.findByIdAndUpdate(candidate.candidateGroupId, {
        $inc: { memberCount: 1 },
      }).catch(() => {});
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: actorUserId,
      action: "CREATE",
      resource: "CANDIDATE",
      resourceId: candidate._id,
      description: `Created candidate '${candidateCode}' (${email})`,
    }).catch(() => {});

    return candidate;
  }

  /**
   * Retrieves paginated candidates in an organization (Strictly tenant-scoped)
   */
  static async getCandidates(organizationId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    const filter = { organizationId };

    if (query.status) filter.status = query.status;
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.programId) filter.programId = query.programId;
    if (query.candidateGroupId) filter.candidateGroupId = query.candidateGroupId;

    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: "i" } },
        { lastName: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
        { candidateCode: { $regex: query.search, $options: "i" } },
        { phone: { $regex: query.search, $options: "i" } },
        { phoneNumber: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      Candidate.find(filter)
        .populate("departmentId", "name code")
        .populate("programId", "name code")
        .populate("candidateGroupId", "name code")
        .sort({ lastName: 1, firstName: 1 })
        .skip(skip)
        .limit(limit),
      Candidate.countDocuments(filter),
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

  /**
   * Retrieves single candidate record with comprehensive portfolio counts
   */
  static async getCandidate(organizationId, candidateId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid identifier format");
    }

    const candidate = await Candidate.findOne({
      _id: candidateId,
      organizationId,
    })
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("candidateGroupId", "name code")
      .populate("userId", "firstName lastName email avatar status");

    if (!candidate) {
      throw new ApiError(404, "Candidate not found in this organization");
    }

    // Aggregate portfolio metrics for staff view
    const [assignmentsCount, attemptsCount, resultsCount, certsCount, interviewsCount] = await Promise.all([
      AssessmentAssignment.countDocuments({ candidateId: candidate._id }),
      Attempt.countDocuments({ candidateId: candidate._id }),
      Result.countDocuments({ candidateId: candidate._id }),
      Certificate.countDocuments({ candidateId: candidate._id, status: "ISSUED" }),
      Interview.countDocuments({ candidateId: candidate._id }),
    ]);

    const resultObj = candidate.toObject();
    resultObj.metrics = {
      assignmentsCount,
      attemptsCount,
      resultsCount,
      certsCount,
      interviewsCount,
    };

    return resultObj;
  }

  /**
   * Updates candidate profile details
   */
  static async updateCandidate(organizationId, candidateId, updateData, actorUserId = null) {
    if (!mongoose.Types.ObjectId.isValid(organizationId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid identifier format");
    }

    const safeUpdate = {};
    if (updateData.firstName) safeUpdate.firstName = updateData.firstName.trim();
    if (updateData.lastName) safeUpdate.lastName = updateData.lastName.trim();
    if (updateData.phone !== undefined) {
      safeUpdate.phone = updateData.phone;
      safeUpdate.phoneNumber = updateData.phone;
    }
    if (updateData.phoneNumber !== undefined) {
      safeUpdate.phoneNumber = updateData.phoneNumber;
      safeUpdate.phone = updateData.phoneNumber;
    }
    if (updateData.metadata) safeUpdate.metadata = updateData.metadata;

    if (updateData.departmentId) {
      const department = await Department.findOne({ _id: updateData.departmentId, organizationId });
      if (!department) {
        throw new ApiError(400, "Department not found in this organization");
      }
      safeUpdate.departmentId = department._id;
    }

    if (updateData.programId) {
      const program = await Program.findOne({ _id: updateData.programId, organizationId });
      if (!program) {
        throw new ApiError(400, "Program not found in this organization");
      }
      safeUpdate.programId = program._id;
    }

    if (updateData.candidateGroupId) {
      const group = await CandidateGroup.findOne({ _id: updateData.candidateGroupId, organizationId });
      if (!group) {
        throw new ApiError(400, "Candidate group not found in this organization");
      }
      safeUpdate.candidateGroupId = group._id;
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: candidateId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    )
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("candidateGroupId", "name code");

    if (!candidate) {
      throw new ApiError(404, "Candidate not found in this organization");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: actorUserId,
      action: "UPDATE",
      resource: "CANDIDATE",
      resourceId: candidate._id,
      description: `Updated candidate '${candidate.candidateCode}'`,
    }).catch(() => {});

    return candidate;
  }

  /**
   * Updates candidate status (SUSPEND / ACTIVATE / INACTIVE)
   */
  static async updateCandidateStatus(organizationId, candidateId, status, actorUserId = null) {
    if (!mongoose.Types.ObjectId.isValid(organizationId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid identifier format");
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: candidateId, organizationId },
      { $set: { status } },
      { returnDocument: "after", runValidators: true }
    );

    if (!candidate) {
      throw new ApiError(404, "Candidate not found in this organization");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: actorUserId,
      action: "UPDATE_STATUS",
      resource: "CANDIDATE",
      resourceId: candidate._id,
      description: `Set candidate '${candidate.candidateCode}' status to '${status}'`,
    }).catch(() => {});

    return candidate;
  }

  /**
   * Soft deletes / deactivates candidate
   */
  static async deleteCandidate(organizationId, candidateId, actorUserId = null) {
    if (!mongoose.Types.ObjectId.isValid(organizationId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid identifier format");
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: candidateId, organizationId },
      { $set: { status: "DEACTIVATED" } },
      { returnDocument: "after" }
    );

    if (!candidate) {
      throw new ApiError(404, "Candidate not found in this organization");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: actorUserId,
      action: "DEACTIVATE",
      resource: "CANDIDATE",
      resourceId: candidate._id,
      description: `Deactivated candidate '${candidate.candidateCode}'`,
    }).catch(() => {});

    return { success: true, message: "Candidate deactivated successfully" };
  }

  /**
   * Generates and dispatches single-use invitation token for candidate
   */
  static async inviteCandidate(organizationId, candidateId, actorUserId = null) {
    const candidate = await Candidate.findOne({ _id: candidateId, organizationId });
    if (!candidate) {
      throw new ApiError(404, "Candidate not found in this organization");
    }

    const token = this.generateInvitationToken();
    candidate.invitationToken = token;
    candidate.invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    candidate.status = "INVITED";
    await candidate.save();

    NotificationService.sendNotification({
      organizationId,
      recipientId: candidate.userId,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: "Invitation to Examination Portal",
      message: `You have been invited as candidate ${candidate.candidateCode}. Complete activation to access assessments.`,
      metadata: { candidateId: candidate._id, token },
    }).catch(() => {});

    return {
      success: true,
      message: `Invitation generated for candidate ${candidate.candidateCode}`,
      invitationToken: token,
      expiresAt: candidate.invitationExpiresAt,
    };
  }

  /**
   * Activates candidate account using invitation token
   */
  static async activateCandidateByToken(token, password) {
    if (!token || typeof token !== "string") {
      throw new ApiError(400, "Invitation token is required");
    }

    const candidate = await Candidate.findOne({
      invitationToken: token,
      invitationExpiresAt: { $gt: new Date() },
    });

    if (!candidate) {
      throw new ApiError(400, "Invalid or expired invitation token");
    }

    // Set new password on linked User
    if (password) {
      const passwordHash = await hashPassword(password);
      await User.findByIdAndUpdate(candidate.userId, {
        passwordHash,
        status: "ACTIVE",
        emailVerified: true,
      });
    }

    candidate.status = "ACTIVE";
    candidate.invitationToken = null;
    candidate.invitationExpiresAt = null;
    await candidate.save();

    return {
      success: true,
      message: "Candidate account activated successfully. You can now log in.",
      candidate: {
        id: candidate._id,
        candidateCode: candidate.candidateCode,
        email: candidate.email,
      },
    };
  }

  /**
   * Bulk candidate import pipeline (Validate -> Deduplicate -> Ingest)
   */
  static async bulkImportCandidates(organizationId, items, actorUserId = null) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "Invalid import payload: items array is required");
    }

    const results = {
      total: items.length,
      imported: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      try {
        await this.createCandidate(organizationId, row, actorUserId);
        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          candidateCode: row.candidateCode || "N/A",
          email: row.email || "N/A",
          reason: err.message,
        });
      }
    }

    return results;
  }

  // ==========================================
  // CANDIDATE PORTAL SELF-SERVICE METHODS
  // ==========================================

  /**
   * Resolves active candidate profile for authenticated user
   */
  static async getCandidatePortalProfile(userId, organizationId = null) {
    const filter = { userId, status: { $ne: "DEACTIVATED" } };
    if (organizationId) filter.organizationId = organizationId;

    const candidate = await Candidate.findOne(filter)
      .populate("organizationId", "name slug code logo settings tenantIndustry")
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("candidateGroupId", "name code")
      .populate("userId", "firstName lastName email avatar");

    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found for authenticated user in this organization");
    }

    return candidate;
  }

  /**
   * Allows candidate to update permitted profile fields
   */
  static async updateCandidatePortalProfile(userId, organizationId, updateData) {
    const filter = { userId, status: { $ne: "DEACTIVATED" } };
    if (organizationId) filter.organizationId = organizationId;

    const candidate = await Candidate.findOne(filter);
    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found");
    }

    // Only allow updating non-authoritative profile fields
    if (updateData.firstName) candidate.firstName = updateData.firstName.trim();
    if (updateData.lastName) candidate.lastName = updateData.lastName.trim();
    if (updateData.phone !== undefined) {
      candidate.phone = updateData.phone;
      candidate.phoneNumber = updateData.phone;
    }
    if (updateData.phoneNumber !== undefined) {
      candidate.phoneNumber = updateData.phoneNumber;
      candidate.phone = updateData.phoneNumber;
    }
    if (updateData.metadata) candidate.metadata = { ...candidate.metadata, ...updateData.metadata };

    await candidate.save();
    return candidate;
  }

  /**
   * Retrieves candidate's assigned assessments (Strict isolation, zero answer leaks)
   */
  static async getCandidatePortalAssignments(userId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    const assignments = await AssessmentAssignment.find({
      organizationId: candidate.organizationId._id || candidate.organizationId,
      candidateId: candidate._id,
      status: { $in: ["ASSIGNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
    })
      .populate("assessmentId", "title description durationMinutes totalPoints passingScore code instructions settings.allowCandidatePause settings.enforceFullscreen")
      .sort({ validFrom: -1 })
      .lean();

    return assignments;
  }

  /**
   * Retrieves candidate's single assignment detail
   */
  static async getCandidatePortalAssignmentById(userId, assignmentId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ApiError(400, "Invalid assignment ID format");
    }

    const assignment = await AssessmentAssignment.findOne({
      _id: assignmentId,
      organizationId: candidate.organizationId._id || candidate.organizationId,
      candidateId: candidate._id,
    })
      .populate("assessmentId", "title description durationMinutes totalPoints passingScore code instructions settings")
      .lean();

    if (!assignment) {
      throw new ApiError(404, "Assignment not found or does not belong to your candidate account");
    }

    return assignment;
  }

  /**
   * Retrieves candidate's historical attempts (Stripped of answer keys & correct indicators)
   */
  static async getCandidatePortalAttempts(userId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    const attempts = await Attempt.find({
      organizationId: candidate.organizationId._id || candidate.organizationId,
      candidateId: candidate._id,
    })
      .populate("assessmentId", "title code durationMinutes totalPoints passingScore")
      .select("-questions.correctAnswers -questions.answers.isCorrect -evaluationDetails.answerKey")
      .sort({ createdAt: -1 })
      .lean();

    return attempts;
  }

  /**
   * Retrieves published candidate results
   */
  static async getCandidatePortalResults(userId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    const results = await Result.find({
      organizationId: candidate.organizationId._id || candidate.organizationId,
      candidateId: candidate._id,
      published: true,
    })
      .populate("assessmentId", "title code passingScore totalPoints")
      .select("assessmentId score percentage grade passed publishedAt totalMarks obtainedMarks breakdown")
      .sort({ publishedAt: -1 })
      .lean();

    return results;
  }

  /**
   * Retrieves issued certificates
   */
  static async getCandidatePortalCertificates(userId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    const certificates = await Certificate.find({
      organizationId: candidate.organizationId._id || candidate.organizationId,
      candidateId: candidate._id,
      status: "ISSUED",
    })
      .populate("assessmentId", "title code")
      .sort({ issuedAt: -1 })
      .lean();

    return certificates;
  }

  /**
   * Retrieves candidate interviews with dynamic join window calculation
   */
  static async getCandidatePortalInterviews(userId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    const interviews = await Interview.find({
      organizationId: candidate.organizationId._id || candidate.organizationId,
      candidateId: candidate._id,
      status: { $nin: ["CANCELLED"] },
    })
      .populate("assessmentId", "title code")
      .populate("createdBy", "firstName lastName email")
      .sort({ scheduledStartAt: 1 })
      .lean();

    const now = Date.now();

    // Compute join availability window per interview
    const enriched = interviews.map((interview) => {
      const startTime = new Date(interview.scheduledStartAt || interview.scheduledAt).getTime();
      const durationMs = (interview.durationMinutes || 45) * 60 * 1000;
      const endTime = startTime + durationMs;
      const earlyJoinWindowMs = 15 * 60 * 1000; // 15 minutes before start

      let joinStatus = "ALLOW";
      if (now < startTime - earlyJoinWindowMs) {
        joinStatus = "JOIN_NOT_YET_AVAILABLE";
      } else if (now > endTime || interview.status === "COMPLETED") {
        joinStatus = "JOIN_CLOSED";
      }

      return {
        ...interview,
        joinStatus,
        joinWindowOpensAt: new Date(startTime - earlyJoinWindowMs),
        joinWindowClosesAt: new Date(endTime),
      };
    });

    return enriched;
  }
}

export default CandidateService;
