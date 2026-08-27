import mongoose from "mongoose";
import QuestionTag from "./questionTag.model.js";
import { ApiError } from "../../utils/ApiError.js";

const normalizeTagSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export class QuestionTagService {
  static async createTag(organizationId, data, userId = null) {
    const slug = data.slug ? normalizeTagSlug(data.slug) : normalizeTagSlug(data.name);

    const existing = await QuestionTag.findOne({ organizationId, slug });
    if (existing) {
      throw new ApiError(409, `Tag '${slug}' already exists in this organization`);
    }

    const tag = await QuestionTag.create({
      organizationId,
      name: data.name.trim(),
      slug,
      description: data.description || "",
      createdBy: userId,
    });

    return tag;
  }

  static async getTags(organizationId, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    const filter = { organizationId };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { slug: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      QuestionTag.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      QuestionTag.countDocuments(filter),
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

  static async getTag(organizationId, tagId) {
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      throw new ApiError(400, "Invalid tag ID format");
    }

    const tag = await QuestionTag.findOne({ _id: tagId, organizationId });
    if (!tag) {
      throw new ApiError(404, "Tag not found in this organization");
    }

    return tag;
  }

  static async updateTag(organizationId, tagId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      throw new ApiError(400, "Invalid tag ID format");
    }

    const safeUpdate = {};
    if (updateData.name) {
      safeUpdate.name = updateData.name.trim();
      const slug = normalizeTagSlug(updateData.name);
      const existing = await QuestionTag.findOne({
        organizationId,
        slug,
        _id: { $ne: tagId },
      });
      if (existing) {
        throw new ApiError(409, `Tag '${slug}' already exists in this organization`);
      }
      safeUpdate.slug = slug;
    }
    if (updateData.description !== undefined) {
      safeUpdate.description = updateData.description;
    }

    const tag = await QuestionTag.findOneAndUpdate(
      { _id: tagId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    );

    if (!tag) {
      throw new ApiError(404, "Tag not found in this organization");
    }

    return tag;
  }

  static async deleteTag(organizationId, tagId) {
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      throw new ApiError(400, "Invalid tag ID format");
    }

    const deleted = await QuestionTag.findOneAndDelete({ _id: tagId, organizationId });
    if (!deleted) {
      throw new ApiError(404, "Tag not found in this organization");
    }

    return { success: true, message: "Tag deleted successfully" };
  }
}
