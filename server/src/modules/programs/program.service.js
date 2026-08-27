import mongoose from "mongoose";
import Program from "./program.model.js";
import Department from "../departments/department.model.js";
import { ApiError } from "../../utils/ApiError.js";

export class ProgramService {
  static async createProgram(organizationId, data) {
    const code = data.code.trim().toUpperCase();

    // 1. Verify Department exists AND belongs to the same Organization
    const department = await Department.findOne({
      _id: data.departmentId,
      organizationId,
    });

    if (!department) {
      throw new ApiError(
        400,
        "Department not found in this organization. You cannot attach a department from another organization."
      );
    }

    // 2. Check duplicate program code in this organization
    const existing = await Program.findOne({ organizationId, code });
    if (existing) {
      throw new ApiError(409, `Program with code '${code}' already exists in this organization`);
    }

    const program = await Program.create({
      organizationId,
      departmentId: department._id,
      name: data.name.trim(),
      code,
      description: data.description || "",
      level: data.level || "UNDERGRADUATE",
      duration: data.duration || "",
      status: data.status || "ACTIVE",
      metadata: data.metadata || {},
    });

    return program;
  }

  static async getPrograms(organizationId, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

    if (query.departmentId && mongoose.Types.ObjectId.isValid(query.departmentId)) {
      filter.departmentId = query.departmentId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.level) {
      filter.level = query.level;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { code: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      Program.find(filter)
        .populate("departmentId", "name code status")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Program.countDocuments(filter),
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

  static async getProgram(organizationId, programId) {
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      throw new ApiError(400, "Invalid program ID format");
    }

    const program = await Program.findOne({
      _id: programId,
      organizationId,
    }).populate("departmentId", "name code status");

    if (!program) {
      throw new ApiError(404, "Program not found in this organization");
    }

    return program;
  }

  static async updateProgram(organizationId, programId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      throw new ApiError(400, "Invalid program ID format");
    }

    const safeUpdate = {};
    if (updateData.name) safeUpdate.name = updateData.name.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.level) safeUpdate.level = updateData.level;
    if (updateData.duration !== undefined) safeUpdate.duration = updateData.duration;
    if (updateData.metadata) safeUpdate.metadata = updateData.metadata;

    if (updateData.departmentId) {
      const department = await Department.findOne({
        _id: updateData.departmentId,
        organizationId,
      });
      if (!department) {
        throw new ApiError(400, "Department not found in this organization");
      }
      safeUpdate.departmentId = department._id;
    }

    if (updateData.code) {
      const code = updateData.code.trim().toUpperCase();
      const existing = await Program.findOne({
        organizationId,
        code,
        _id: { $ne: programId },
      });
      if (existing) {
        throw new ApiError(409, `Program with code '${code}' already exists in this organization`);
      }
      safeUpdate.code = code;
    }

    const program = await Program.findOneAndUpdate(
      { _id: programId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    ).populate("departmentId", "name code status");

    if (!program) {
      throw new ApiError(404, "Program not found in this organization");
    }

    return program;
  }

  static async updateProgramStatus(organizationId, programId, status) {
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      throw new ApiError(400, "Invalid program ID format");
    }

    const program = await Program.findOneAndUpdate(
      { _id: programId, organizationId },
      { $set: { status } },
      { returnDocument: "after", runValidators: true }
    );

    if (!program) {
      throw new ApiError(404, "Program not found in this organization");
    }

    return program;
  }

  static async deleteProgram(organizationId, programId) {
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      throw new ApiError(400, "Invalid program ID format");
    }

    const program = await Program.findOneAndUpdate(
      { _id: programId, organizationId },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!program) {
      throw new ApiError(404, "Program not found in this organization");
    }

    return { success: true, message: "Program archived successfully" };
  }
}
