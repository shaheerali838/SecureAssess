import mongoose from "mongoose";
import Subject from "./subject.model.js";
import Program from "../programs/program.model.js";
import User from "../users/user.model.js";
import { ApiError } from "../../utils/ApiError.js";

export class SubjectService {
  static async createSubject(organizationId, data) {
    const code = data.code.trim().toUpperCase();

    // 1. Verify Program exists AND belongs to the same Organization
    const program = await Program.findOne({
      _id: data.programId,
      organizationId,
    });

    if (!program) {
      throw new ApiError(
        400,
        "Program not found in this organization. You cannot attach a program from another organization."
      );
    }

    // 2. Check duplicate subject code in this organization
    const existing = await Subject.findOne({ organizationId, code });
    if (existing) {
      throw new ApiError(409, `Subject with code '${code}' already exists in this organization`);
    }

    // 3. Optional Lead Examiner validation
    let examinerId = null;
    let assignedExaminers = [];
    if (data.examinerId && mongoose.Types.ObjectId.isValid(data.examinerId)) {
      const examiner = await User.findById(data.examinerId);
      if (examiner) {
        examinerId = examiner._id;
        assignedExaminers = [examiner._id];
      }
    }
    if (Array.isArray(data.assignedExaminers) && data.assignedExaminers.length > 0) {
      assignedExaminers = data.assignedExaminers.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
    }

    const subject = await Subject.create({
      organizationId,
      programId: program._id,
      name: data.name.trim(),
      code,
      description: data.description || "",
      credits: data.credits !== undefined ? data.credits : 3,
      examinerId,
      assignedExaminers,
      status: data.status || "ACTIVE",
      metadata: data.metadata || {},
    });

    return await Subject.findById(subject._id)
      .populate("programId", "name code level duration departmentId")
      .populate("examinerId", "firstName lastName email platformRole status")
      .populate("assignedExaminers", "firstName lastName email platformRole status");
  }

  static async getSubjects(organizationId, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

    if (query.programId && mongoose.Types.ObjectId.isValid(query.programId)) {
      filter.programId = query.programId;
    }
    if (query.examinerId && mongoose.Types.ObjectId.isValid(query.examinerId)) {
      filter.$or = [
        { examinerId: query.examinerId },
        { assignedExaminers: query.examinerId },
      ];
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { code: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      Subject.find(filter)
        .populate("programId", "name code level duration departmentId")
        .populate("examinerId", "firstName lastName email platformRole status")
        .populate("assignedExaminers", "firstName lastName email platformRole status")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Subject.countDocuments(filter),
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

  static async getSubject(organizationId, subjectId) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      throw new ApiError(400, "Invalid subject ID format");
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      organizationId,
    })
      .populate("programId", "name code level duration departmentId")
      .populate("examinerId", "firstName lastName email platformRole status")
      .populate("assignedExaminers", "firstName lastName email platformRole status");

    if (!subject) {
      throw new ApiError(404, "Subject not found in this organization");
    }

    return subject;
  }

  static async updateSubject(organizationId, subjectId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      throw new ApiError(400, "Invalid subject ID format");
    }

    const safeUpdate = {};
    if (updateData.name) safeUpdate.name = updateData.name.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.credits !== undefined) safeUpdate.credits = updateData.credits;
    if (updateData.metadata) safeUpdate.metadata = updateData.metadata;

    if (updateData.examinerId !== undefined) {
      if (updateData.examinerId && mongoose.Types.ObjectId.isValid(updateData.examinerId)) {
        safeUpdate.examinerId = updateData.examinerId;
      } else {
        safeUpdate.examinerId = null;
      }
    }

    if (updateData.assignedExaminers !== undefined) {
      if (Array.isArray(updateData.assignedExaminers)) {
        safeUpdate.assignedExaminers = updateData.assignedExaminers.filter((id) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      } else if (updateData.examinerId) {
        safeUpdate.assignedExaminers = [updateData.examinerId];
      }
    }

    if (updateData.programId) {
      const program = await Program.findOne({
        _id: updateData.programId,
        organizationId,
      });
      if (!program) {
        throw new ApiError(400, "Program not found in this organization");
      }
      safeUpdate.programId = program._id;
    }

    if (updateData.code) {
      const code = updateData.code.trim().toUpperCase();
      const existing = await Subject.findOne({
        organizationId,
        code,
        _id: { $ne: subjectId },
      });
      if (existing) {
        throw new ApiError(409, `Subject with code '${code}' already exists in this organization`);
      }
      safeUpdate.code = code;
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: subjectId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    )
      .populate("programId", "name code level duration departmentId")
      .populate("examinerId", "firstName lastName email platformRole status")
      .populate("assignedExaminers", "firstName lastName email platformRole status");

    if (!subject) {
      throw new ApiError(404, "Subject not found in this organization");
    }

    return subject;
  }

  static async updateSubjectStatus(organizationId, subjectId, status) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      throw new ApiError(400, "Invalid subject ID format");
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: subjectId, organizationId },
      { $set: { status } },
      { returnDocument: "after", runValidators: true }
    )
      .populate("programId", "name code level duration departmentId")
      .populate("examinerId", "firstName lastName email platformRole status")
      .populate("assignedExaminers", "firstName lastName email platformRole status");

    if (!subject) {
      throw new ApiError(404, "Subject not found in this organization");
    }

    return subject;
  }

  static async deleteSubject(organizationId, subjectId) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      throw new ApiError(400, "Invalid subject ID format");
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: subjectId, organizationId },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!subject) {
      throw new ApiError(404, "Subject not found in this organization");
    }

    return { success: true, message: "Subject archived successfully" };
  }
}
