import mongoose from "mongoose";
import QuestionCategory from "./questionCategory.model.js";
import QuestionBank from "../questionBank/questionBank.model.js";
import { ApiError } from "../../utils/ApiError.js";

export class QuestionCategoryService {
  static async createCategory(organizationId, questionBankId = null, data, userId = null) {
    if (questionBankId) {
      if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
        throw new ApiError(400, "Invalid questionBank ID format");
      }

      // Verify QuestionBank exists in this organization
      const questionBank = await QuestionBank.findOne({
        _id: questionBankId,
        organizationId,
      });
      if (!questionBank) {
        throw new ApiError(404, "Question bank not found in this organization");
      }
    }

    // Verify parentCategoryId if provided
    if (data.parentCategoryId) {
      const parentFilter = {
        _id: data.parentCategoryId,
        organizationId,
      };
      if (questionBankId) parentFilter.questionBankId = questionBankId;

      const parent = await QuestionCategory.findOne(parentFilter);
      if (!parent) {
        throw new ApiError(400, "Parent category not found in this organization");
      }
    }

    const name = data.name.trim();
    const existing = await QuestionCategory.findOne({
      organizationId,
      questionBankId: questionBankId || null,
      name,
    });
    if (existing) {
      throw new ApiError(409, `Category '${name}' already exists in this scope`);
    }

    const category = await QuestionCategory.create({
      organizationId,
      questionBankId: questionBankId || null,
      name,
      description: data.description || "",
      parentCategoryId: data.parentCategoryId || null,
      status: data.status || "ACTIVE",
      createdBy: userId,
    });

    return category;
  }

  static async getCategories(organizationId, questionBankId, query = {}) {
    // questionBankId is optional — when absent, list all categories for the org
    const filter = { organizationId };
    if (questionBankId && mongoose.Types.ObjectId.isValid(questionBankId)) {
      filter.questionBankId = questionBankId;
    }
    if (query.status) filter.status = query.status;
    if (query.parentCategoryId) filter.parentCategoryId = query.parentCategoryId;
    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    const limit = parseInt(query.limit || "200", 10);
    const categories = await QuestionCategory.find(filter)
      .populate("parentCategoryId", "name")
      .sort({ name: 1 })
      .limit(limit);

    return categories;
  }

  static async getCategory(organizationId, questionBankId, categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new ApiError(400, "Invalid category ID format");
    }

    // questionBankId is optional for cross-bank category lookup
    const filter = { _id: categoryId, organizationId };
    if (questionBankId && mongoose.Types.ObjectId.isValid(questionBankId)) {
      filter.questionBankId = questionBankId;
    }

    const category = await QuestionCategory.findOne(filter)
      .populate("parentCategoryId", "name");

    if (!category) {
      throw new ApiError(404, "Category not found in this organization");
    }

    return category;
  }

  static async updateCategory(organizationId, questionBankId, categoryId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new ApiError(400, "Invalid category ID format");
    }

    const safeUpdate = {};
    if (updateData.name) {
      const name = updateData.name.trim();
      const existing = await QuestionCategory.findOne({
        organizationId,
        questionBankId,
        name,
        _id: { $ne: categoryId },
      });
      if (existing) {
        throw new ApiError(409, `Category '${name}' already exists in this question bank`);
      }
      safeUpdate.name = name;
    }
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.parentCategoryId !== undefined) safeUpdate.parentCategoryId = updateData.parentCategoryId;
    if (updateData.status) safeUpdate.status = updateData.status;

    const category = await QuestionCategory.findOneAndUpdate(
      { _id: categoryId, organizationId, questionBankId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    );

    if (!category) {
      throw new ApiError(404, "Category not found in this question bank");
    }

    return category;
  }

  static async deleteCategory(organizationId, questionBankId, categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new ApiError(400, "Invalid category ID format");
    }

    const category = await QuestionCategory.findOneAndUpdate(
      { _id: categoryId, organizationId, questionBankId },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!category) {
      throw new ApiError(404, "Category not found in this question bank");
    }

    return { success: true, message: "Category archived successfully" };
  }
}
