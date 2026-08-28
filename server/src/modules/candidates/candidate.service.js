import mongoose from "mongoose";
import Candidate from "./candidate.model.js";
import Department from "../departments/department.model.js";
import Program from "../programs/program.model.js";
import User from "../users/user.model.js";
import UserMembership from "../users/userMembership.model.js";
import Role from "../roles/role.model.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";

export class CandidateService {
  static async createCandidate(organizationId, data) {
    const candidateCode = data.candidateCode.trim().toUpperCase();
    const email = data.email.trim().toLowerCase();

    // 1. Verify candidateCode uniqueness in organization
    const existingCode = await Candidate.findOne({ organizationId, candidateCode });
    if (existingCode) {
      throw new ApiError(409, `Candidate with code '${candidateCode}' already exists in this organization`);
    }

    // 2. Verify Department belongs to organization (if provided)
    if (data.departmentId) {
      const department = await Department.findOne({ _id: data.departmentId, organizationId });
      if (!department) {
        throw new ApiError(400, "Department not found in this organization");
      }
    }

    // 3. Verify Program belongs to organization (if provided)
    if (data.programId) {
      const program = await Program.findOne({ _id: data.programId, organizationId });
      if (!program) {
        throw new ApiError(400, "Program not found in this organization");
      }
    }

    // 4. Resolve or Link User identity & Membership
    let userId = data.userId || null;
    if (!userId) {
      let user = await User.findOne({ email });
      if (!user) {
        // Create user identity for candidate with invited state
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

    return candidate;
  }

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

  static async updateCandidate(organizationId, candidateId, updateData) {
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

    return candidate;
  }

  static async updateCandidateStatus(organizationId, candidateId, status) {
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

    return candidate;
  }

  static async deleteCandidate(organizationId, candidateId) {
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

    return { success: true, message: "Candidate deactivated successfully" };
  }
}
