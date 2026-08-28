import mongoose from "mongoose";
import CandidateGroup from "./candidateGroup.model.js";
import CandidateGroupMember from "./candidateGroupMember.model.js";
import Candidate from "../candidates/candidate.model.js";
import { ApiError } from "../../utils/ApiError.js";

export class CandidateGroupService {
  static async createGroup(organizationId, data, userId = null) {
    const code = data.code.trim().toUpperCase();

    const existing = await CandidateGroup.findOne({ organizationId, code });
    if (existing) {
      throw new ApiError(409, `Candidate group with code '${code}' already exists in this organization`);
    }

    const group = await CandidateGroup.create({
      organizationId,
      name: data.name.trim(),
      code,
      description: data.description || "",
      createdBy: userId,
      status: data.status || "ACTIVE",
      metadata: data.metadata || {},
    });

    return group;
  }

  static async getGroups(organizationId, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { code: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      CandidateGroup.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      CandidateGroup.countDocuments(filter),
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

  static async getGroup(organizationId, groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new ApiError(400, "Invalid group ID format");
    }

    const group = await CandidateGroup.findOne({ _id: groupId, organizationId });
    if (!group) {
      throw new ApiError(404, "Candidate group not found in this organization");
    }

    const memberCount = await CandidateGroupMember.countDocuments({ groupId });

    return {
      ...group.toObject(),
      memberCount,
    };
  }

  static async updateGroup(organizationId, groupId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new ApiError(400, "Invalid group ID format");
    }

    const safeUpdate = {};
    if (updateData.name) safeUpdate.name = updateData.name.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.status) safeUpdate.status = updateData.status;
    if (updateData.metadata) safeUpdate.metadata = updateData.metadata;

    const group = await CandidateGroup.findOneAndUpdate(
      { _id: groupId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    );

    if (!group) {
      throw new ApiError(404, "Candidate group not found in this organization");
    }

    return group;
  }

  static async deleteGroup(organizationId, groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new ApiError(400, "Invalid group ID format");
    }

    const group = await CandidateGroup.findOneAndUpdate(
      { _id: groupId, organizationId },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!group) {
      throw new ApiError(404, "Candidate group not found in this organization");
    }

    return { success: true, message: "Candidate group archived successfully" };
  }

  static async addMemberToGroup(organizationId, groupId, candidateId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid group ID or candidate ID format");
    }

    // 1. Verify group exists in organization
    const group = await CandidateGroup.findOne({ _id: groupId, organizationId });
    if (!group) {
      throw new ApiError(404, "Candidate group not found in this organization");
    }

    // 2. Verify candidate exists in organization
    const candidate = await Candidate.findOne({ _id: candidateId, organizationId });
    if (!candidate) {
      throw new ApiError(400, "Candidate not found in this organization");
    }

    // 3. Create or find group member
    const member = await CandidateGroupMember.findOneAndUpdate(
      { organizationId, groupId, candidateId },
      {
        $setOnInsert: {
          organizationId,
          groupId,
          candidateId,
          addedBy: userId,
          addedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return member;
  }

  static async removeMemberFromGroup(organizationId, groupId, candidateId) {
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid group ID or candidate ID format");
    }

    const deleted = await CandidateGroupMember.findOneAndDelete({
      organizationId,
      groupId,
      candidateId,
    });

    if (!deleted) {
      throw new ApiError(404, "Candidate is not a member of this group");
    }

    return { success: true, message: "Candidate removed from group successfully" };
  }

  static async getGroupMembers(organizationId, groupId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new ApiError(400, "Invalid group ID format");
    }

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    const skip = (Math.max(1, page) - 1) * limit;

    const [members, total] = await Promise.all([
      CandidateGroupMember.find({ organizationId, groupId })
        .populate("candidateId", "candidateCode firstName lastName email status departmentId programId")
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(limit),
      CandidateGroupMember.countDocuments({ organizationId, groupId }),
    ]);

    return {
      items: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
