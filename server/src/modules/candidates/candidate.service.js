import mongoose from "mongoose";
import Candidate from "./candidate.model.js";
import Department from "../departments/department.model.js";
import Program from "../programs/program.model.js";
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

export class CandidateService {
  /**
   * Creates a new candidate within an organization and links/creates user identity
   */
  static async createCandidate(organizationId, data, actorUserId = null) {
    // 1. Quota check
    await EntitlementService.checkUsageLimit(organizationId, "candidates");

    const candidateCode = data.candidateCode.trim().toUpperCase();
    const email = data.email.trim().toLowerCase();

    // 2. Verify candidateCode uniqueness in organization
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

    // 5. Resolve or Link User identity & Membership
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

    // Ensure UserMembership exists for this candidate in this organization
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

    const candidate = await Candidate.create({
      organizationId,
      userId,
      candidateCode,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      phoneNumber: data.phoneNumber || "",
      departmentId: data.departmentId || null,
      programId: data.programId || null,
      status: data.status || "ACTIVE",
      metadata: data.metadata || {},
    });

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
   * Retrieves paginated candidates in an organization
   */
  static async getCandidates(organizationId, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

    if (query.status) filter.status = query.status;
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.programId) filter.programId = query.programId;
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: "i" } },
        { lastName: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
        { candidateCode: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      Candidate.find(filter)
        .populate("departmentId", "name code")
        .populate("programId", "name code")
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
   * Retrieves single candidate record
   */
  static async getCandidate(organizationId, candidateId) {
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid candidate ID format");
    }

    const candidate = await Candidate.findOne({
      _id: candidateId,
      organizationId,
    })
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("userId", "firstName lastName email avatar");

    if (!candidate) {
      throw new ApiError(404, "Candidate not found in this organization");
    }

    return candidate;
  }

  /**
   * Updates candidate profile details
   */
  static async updateCandidate(organizationId, candidateId, updateData, actorUserId = null) {
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid candidate ID format");
    }

    const safeUpdate = {};
    if (updateData.firstName) safeUpdate.firstName = updateData.firstName.trim();
    if (updateData.lastName) safeUpdate.lastName = updateData.lastName.trim();
    if (updateData.phoneNumber !== undefined) safeUpdate.phoneNumber = updateData.phoneNumber;
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

    const candidate = await Candidate.findOneAndUpdate(
      { _id: candidateId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    );

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
   * Updates candidate status (SUSPEND / ACTIVATE)
   */
  static async updateCandidateStatus(organizationId, candidateId, status, actorUserId = null) {
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid candidate ID format");
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
      description: `Set candidate status to '${status}'`,
    }).catch(() => {});

    return candidate;
  }

  /**
   * Soft deletes / deactivates candidate
   */
  static async deleteCandidate(organizationId, candidateId, actorUserId = null) {
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid candidate ID format");
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
      .populate("organizationId", "name slug code logo settings")
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("userId", "firstName lastName email avatar");

    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found for authenticated user");
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
    if (updateData.phoneNumber !== undefined) candidate.phoneNumber = updateData.phoneNumber;
    if (updateData.metadata) candidate.metadata = { ...candidate.metadata, ...updateData.metadata };

    await candidate.save();
    return candidate;
  }

  /**
   * Retrieves candidate's assigned assessments
   */
  static async getCandidatePortalAssignments(userId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    const assignments = await AssessmentAssignment.find({
      candidateId: candidate._id,
      status: { $in: ["ASSIGNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
    })
      .populate("assessmentId", "title description durationMinutes totalPoints passingScore code instructions")
      .sort({ validFrom: -1 })
      .lean();

    return assignments;
  }

  /**
   * Retrieves candidate's attempts
   */
  static async getCandidatePortalAttempts(userId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    const attempts = await Attempt.find({
      candidateId: candidate._id,
    })
      .populate("assessmentId", "title code durationMinutes totalPoints passingScore")
      .select("-questions.correctAnswers -questions.answers.isCorrect")
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
      candidateId: candidate._id,
      published: true,
    })
      .populate("assessmentId", "title code")
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
      candidateId: candidate._id,
      status: "ISSUED",
    })
      .populate("assessmentId", "title code")
      .sort({ issuedAt: -1 })
      .lean();

    return certificates;
  }

  /**
   * Retrieves candidate interviews
   */
  static async getCandidatePortalInterviews(userId, organizationId = null) {
    const candidate = await this.getCandidatePortalProfile(userId, organizationId);

    const interviews = await Interview.find({
      candidateId: candidate._id,
      status: { $nin: ["CANCELLED"] },
    })
      .populate("assessmentId", "title code")
      .populate("createdBy", "firstName lastName email")
      .sort({ scheduledStartAt: 1 })
      .lean();

    return interviews;
  }
}
