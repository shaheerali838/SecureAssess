import mongoose from "mongoose";
import Rubric from "./rubric.model.js";
import { ApiError } from "../../utils/ApiError.js";

export class RubricService {
  /**
   * Retrieves rubrics for an organization
   */
  static async getRubrics(organizationId, query = {}) {
    const filter = { organizationId, status: { $ne: "ARCHIVED" } };
    if (query.status) filter.status = query.status;
    if (query.discipline) filter.discipline = query.discipline;
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { code: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
    }

    const items = await Rubric.find(filter)
      .populate("departmentId", "name code")
      .sort({ updatedAt: -1 });

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Retrieves a single rubric
   */
  static async getRubricById(organizationId, rubricId) {
    if (!mongoose.Types.ObjectId.isValid(rubricId)) {
      throw new ApiError(400, "Invalid rubric ID format");
    }

    const rubric = await Rubric.findOne({ _id: rubricId, organizationId })
      .populate("departmentId", "name code");

    if (!rubric) {
      throw new ApiError(404, "Rubric not found in this organization");
    }

    return rubric;
  }

  /**
   * Creates a new rubric
   */
  static async createRubric(organizationId, data, userId = null) {
    const code = (data.code || `RUB-${Date.now().toString().slice(-4)}`).toUpperCase().trim();

    const existing = await Rubric.findOne({ organizationId, code, status: { $ne: "ARCHIVED" } });
    if (existing) {
      throw new ApiError(409, `Rubric with code '${code}' already exists`);
    }

    const rubric = await Rubric.create({
      ...data,
      code,
      organizationId,
      createdBy: userId,
    });

    return rubric;
  }

  /**
   * Updates an existing rubric
   */
  static async updateRubric(organizationId, rubricId, data) {
    if (!mongoose.Types.ObjectId.isValid(rubricId)) {
      throw new ApiError(400, "Invalid rubric ID format");
    }

    const rubric = await Rubric.findOneAndUpdate(
      { _id: rubricId, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!rubric) {
      throw new ApiError(404, "Rubric not found");
    }

    return rubric;
  }

  /**
   * Deletes / archives a rubric
   */
  static async deleteRubric(organizationId, rubricId) {
    if (!mongoose.Types.ObjectId.isValid(rubricId)) {
      throw new ApiError(400, "Invalid rubric ID format");
    }

    const rubric = await Rubric.findOneAndUpdate(
      { _id: rubricId, organizationId },
      { $set: { status: "ARCHIVED" } },
      { new: true }
    );

    if (!rubric) {
      throw new ApiError(404, "Rubric not found");
    }

    return rubric;
  }
}

export default RubricService;
