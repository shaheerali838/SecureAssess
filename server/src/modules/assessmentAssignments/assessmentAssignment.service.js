import mongoose from "mongoose";
import crypto from "crypto";
import AssessmentAssignment from "./assessmentAssignment.model.js";
import Assessment from "../assessments/assessment.model.js";
import Candidate from "../candidates/candidate.model.js";
import CandidateGroup from "../candidateGroups/candidateGroup.model.js";
import CandidateGroupMember from "../candidateGroups/candidateGroupMember.model.js";
import { ASSESSMENT_STATUSES } from "../../constants/assessmentStatuses.js";
import { ApiError } from "../../utils/ApiError.js";

const generateAccessCode = () => {
  const bytes = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `SA-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`;
};

export class AssessmentAssignmentService {
  /**
   * Helper: Asserts that assessment exists and is published/active
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

    // 1. Verify all candidateIds exist in this organization and are active
    const candidates = await Candidate.find({
      _id: { $in: data.candidateIds },
      organizationId,
      status: "ACTIVE",
    });

    if (candidates.length !== data.candidateIds.length) {
      throw new ApiError(
        400,
        "One or more candidate IDs are invalid, do not belong to this organization, or are not ACTIVE."
      );
    }

    const createdAssignments = [];
    for (const candidate of candidates) {
      // 2. Prevent duplicate active assignments
      const existing = await AssessmentAssignment.findOne({
        organizationId,
        assessmentId,
        candidateId: candidate._id,
        status: { $in: ["ASSIGNED", "INVITED", "STARTED"] },
      });

      if (!existing) {
        const assignment = await AssessmentAssignment.create({
          organizationId,
          assessmentId,
          candidateId: candidate._id,
          assignedBy: userId,
          status: "ASSIGNED",
          accessCode: generateAccessCode(),
          assignedAt: new Date(),
          availableFrom: data.availableFrom || assessment.scheduling?.startAt || null,
          availableUntil: data.availableUntil || assessment.scheduling?.endAt || null,
          attemptLimit: data.attemptLimit || assessment.settings?.maxAttempts || 1,
          instructions: data.instructions || assessment.instructions || "",
          metadata: data.metadata || {},
        });
        createdAssignments.push(assignment);
      }
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

    // Retrieve group members in batches
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
        status: { $in: ["ASSIGNED", "INVITED", "STARTED"] },
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
          availableFrom: data.availableFrom || assessment.scheduling?.startAt || null,
          availableUntil: data.availableUntil || assessment.scheduling?.endAt || null,
          attemptLimit: data.attemptLimit || assessment.settings?.maxAttempts || 1,
          instructions: data.instructions || assessment.instructions || "",
          metadata: data.metadata || {},
        });
        createdAssignments.push(assignment);
      }
    }

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

  static async getAssignmentById(organizationId, assignmentId) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ApiError(400, "Invalid assignment ID format");
    }

    const assignment = await AssessmentAssignment.findOne({
      _id: assignmentId,
      organizationId,
    })
      .populate("candidateId", "candidateCode firstName lastName email")
      .populate("assessmentId", "title code type durationSeconds passingScore status")
      .populate("candidateGroupId", "name code");

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found in this organization");
    }

    return assignment;
  }

  static async revokeAssignment(organizationId, assignmentId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ApiError(400, "Invalid assignment ID format");
    }

    const assignment = await AssessmentAssignment.findOneAndUpdate(
      { _id: assignmentId, organizationId },
      { $set: { status: "REVOKED" } },
      { returnDocument: "after" }
    );

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found in this organization");
    }

    return assignment;
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
      status: { $in: ["ASSIGNED", "INVITED", "STARTED"] },
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
      status: { $in: ["ASSIGNED", "INVITED", "STARTED"] },
    });

    if (!assignment) {
      throw new ApiError(403, "You do not have an authorized active assignment for this assessment");
    }

    // Availability Window Verification
    const now = new Date();
    if (assignment.availableFrom && now < new Date(assignment.availableFrom)) {
      throw new ApiError(403, `Assessment is not available yet. It opens on ${assignment.availableFrom.toISOString()}`);
    }
    if (assignment.availableUntil && now > new Date(assignment.availableUntil)) {
      throw new ApiError(403, `Assessment has expired on ${assignment.availableUntil.toISOString()}`);
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
