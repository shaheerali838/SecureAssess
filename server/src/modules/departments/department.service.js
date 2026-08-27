import mongoose from "mongoose";
import Department from "./department.model.js";
import { ApiError } from "../../utils/ApiError.js";

export class DepartmentService {
  static async createDepartment(organizationId, data) {
    const code = data.code.trim().toUpperCase();

    // Check duplicate code in this organization
    const existing = await Department.findOne({ organizationId, code });
    if (existing) {
      throw new ApiError(409, `Department with code '${code}' already exists in this organization`);
    }

    const department = await Department.create({
      organizationId,
      name: data.name.trim(),
      code,
      description: data.description || "",
      headUserId: data.headUserId || null,
      status: data.status || "ACTIVE",
      metadata: data.metadata || {},
    });

    return department;
  }

  static async getDepartments(organizationId, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

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
      Department.find(filter)
        .populate("headUserId", "firstName lastName email")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Department.countDocuments(filter),
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

  static async getDepartment(organizationId, departmentId) {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new ApiError(400, "Invalid department ID format");
    }

    const department = await Department.findOne({
      _id: departmentId,
      organizationId,
    }).populate("headUserId", "firstName lastName email");

    if (!department) {
      throw new ApiError(404, "Department not found in this organization");
    }

    return department;
  }

  static async updateDepartment(organizationId, departmentId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new ApiError(400, "Invalid department ID format");
    }

    const safeUpdate = {};
    if (updateData.name) safeUpdate.name = updateData.name.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.headUserId !== undefined) safeUpdate.headUserId = updateData.headUserId;
    if (updateData.metadata) safeUpdate.metadata = updateData.metadata;

    if (updateData.code) {
      const code = updateData.code.trim().toUpperCase();
      const existing = await Department.findOne({
        organizationId,
        code,
        _id: { $ne: departmentId },
      });
      if (existing) {
        throw new ApiError(409, `Department with code '${code}' already exists in this organization`);
      }
      safeUpdate.code = code;
    }

    const department = await Department.findOneAndUpdate(
      { _id: departmentId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    ).populate("headUserId", "firstName lastName email");

    if (!department) {
      throw new ApiError(404, "Department not found in this organization");
    }

    return department;
  }

  static async updateDepartmentStatus(organizationId, departmentId, status) {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new ApiError(400, "Invalid department ID format");
    }

    const department = await Department.findOneAndUpdate(
      { _id: departmentId, organizationId },
      { $set: { status } },
      { returnDocument: "after", runValidators: true }
    );

    if (!department) {
      throw new ApiError(404, "Department not found in this organization");
    }

    return department;
  }

  static async deleteDepartment(organizationId, departmentId) {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new ApiError(400, "Invalid department ID format");
    }

    const department = await Department.findOneAndUpdate(
      { _id: departmentId, organizationId },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!department) {
      throw new ApiError(404, "Department not found in this organization");
    }

    return { success: true, message: "Department archived successfully" };
  }
}
