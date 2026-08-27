import mongoose from "mongoose";
import QuestionBank from "./questionBank.model.js";
import Question from "./question.model.js";
import QuestionCategory from "../questionCategories/questionCategory.model.js";
import Subject from "../subjects/subject.model.js";
import QuestionTag from "../questionTags/questionTag.model.js";
import { QuestionMapper } from "./question.mapper.js";
import { ApiError } from "../../utils/ApiError.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";

export class QuestionBankService {
  /**
   * Question Bank Operations
   */
  static async createQuestionBank(organizationId, data, userId) {
    const code = data.code.trim().toUpperCase();

    // 1. Verify subject belongs to this organization (if provided)
    if (data.subjectId) {
      const subject = await Subject.findOne({
        _id: data.subjectId,
        organizationId,
      });
      if (!subject) {
        throw new ApiError(400, "Subject not found in this organization");
      }
    }

    // 2. Check duplicate code
    const existing = await QuestionBank.findOne({ organizationId, code });
    if (existing) {
      throw new ApiError(409, `Question bank with code '${code}' already exists in this organization`);
    }

    const questionBank = await QuestionBank.create({
      organizationId,
      name: data.name.trim(),
      code,
      description: data.description || "",
      subjectId: data.subjectId || null,
      departmentId: data.departmentId || null,
      programId: data.programId || null,
      ownerId: userId,
      status: data.status || "ACTIVE",
      visibility: data.visibility || "ORGANIZATION",
      settings: data.settings || {},
    });

    return questionBank;
  }

  static async getQuestionBanks(organizationId, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

    if (query.status) filter.status = query.status;
    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { code: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      QuestionBank.find(filter)
        .populate("subjectId", "name code")
        .populate("ownerId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QuestionBank.countDocuments(filter),
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

  static async getQuestionBank(organizationId, questionBankId) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid questionBank ID format");
    }

    const questionBank = await QuestionBank.findOne({
      _id: questionBankId,
      organizationId,
    })
      .populate("subjectId", "name code")
      .populate("ownerId", "firstName lastName email");

    if (!questionBank) {
      throw new ApiError(404, "Question bank not found in this organization");
    }

    return questionBank;
  }

  static async updateQuestionBank(organizationId, questionBankId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid questionBank ID format");
    }

    const safeUpdate = {};
    if (updateData.name) safeUpdate.name = updateData.name.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.visibility) safeUpdate.visibility = updateData.visibility;
    if (updateData.settings) safeUpdate.settings = updateData.settings;

    if (updateData.subjectId) {
      const subject = await Subject.findOne({
        _id: updateData.subjectId,
        organizationId,
      });
      if (!subject) {
        throw new ApiError(400, "Subject not found in this organization");
      }
      safeUpdate.subjectId = subject._id;
    }

    if (updateData.code) {
      const code = updateData.code.trim().toUpperCase();
      const existing = await QuestionBank.findOne({
        organizationId,
        code,
        _id: { $ne: questionBankId },
      });
      if (existing) {
        throw new ApiError(409, `Question bank with code '${code}' already exists in this organization`);
      }
      safeUpdate.code = code;
    }

    const questionBank = await QuestionBank.findOneAndUpdate(
      { _id: questionBankId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    );

    if (!questionBank) {
      throw new ApiError(404, "Question bank not found in this organization");
    }

    return questionBank;
  }

  static async deleteQuestionBank(organizationId, questionBankId) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid questionBank ID format");
    }

    const questionBank = await QuestionBank.findOneAndUpdate(
      { _id: questionBankId, organizationId },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!questionBank) {
      throw new ApiError(404, "Question bank not found in this organization");
    }

    return { success: true, message: "Question bank archived successfully" };
  }

  /**
   * Question Item Operations
   */
  static async createQuestion(organizationId, questionBankId, data, userId) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid questionBank ID format");
    }

    // 1. Verify QuestionBank exists in this organization
    const questionBank = await QuestionBank.findOne({
      _id: questionBankId,
      organizationId,
    });
    if (!questionBank) {
      throw new ApiError(404, "Question bank not found in this organization");
    }

    // 2. Verify Category belongs to this QuestionBank and Organization (if provided)
    if (data.categoryId) {
      const category = await QuestionCategory.findOne({
        _id: data.categoryId,
        organizationId,
        questionBankId,
      });
      if (!category) {
        throw new ApiError(
          400,
          "Question category not found in this question bank. You cannot attach a category from another bank or tenant."
        );
      }
    }

    // 3. Verify Subject belongs to this organization (if provided)
    if (data.subjectId) {
      const subject = await Subject.findOne({
        _id: data.subjectId,
        organizationId,
      });
      if (!subject) {
        throw new ApiError(400, "Subject not found in this organization");
      }
    }

    // 4. Verify tags (if provided)
    if (Array.isArray(data.tags) && data.tags.length > 0) {
      const validTags = await QuestionTag.find({
        _id: { $in: data.tags },
        organizationId,
      });
      if (validTags.length !== data.tags.length) {
        throw new ApiError(400, "One or more tag IDs are invalid for this organization");
      }
    }

    const question = await Question.create({
      organizationId,
      questionBankId,
      categoryId: data.categoryId || null,
      subjectId: data.subjectId || questionBank.subjectId || null,
      createdBy: userId,
      type: data.type,
      title: data.title || "",
      prompt: data.prompt.trim(),
      options: data.options || [],
      correctAnswer: data.correctAnswer !== undefined ? data.correctAnswer : null,
      explanation: data.explanation || "",
      difficulty: data.difficulty || "MEDIUM",
      points: data.points !== undefined ? data.points : 1,
      tags: data.tags || [],
      timeLimit: data.timeLimit || 0,
      status: data.status || "ACTIVE",
      version: 1,
      metadata: data.metadata || {},
    });

    return QuestionMapper.toAdminDTO(question);
  }

  static async getQuestions(organizationId, questionBankId, query = {}, callerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid questionBank ID format");
    }

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId, questionBankId };

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.search) {
      filter.$or = [
        { prompt: { $regex: query.search, $options: "i" } },
        { title: { $regex: query.search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      Question.find(filter)
        .populate("categoryId", "name")
        .populate("tags", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(filter),
    ]);

    const isCandidate = callerUser?.organizationRole?.name === ORGANIZATION_ROLES.CANDIDATE;
    const mappedItems = isCandidate
      ? QuestionMapper.toCandidateDTOList(items)
      : QuestionMapper.toAdminDTOList(items);

    return {
      items: mappedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getQuestion(organizationId, questionBankId, questionId, callerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }

    const question = await Question.findOne({
      _id: questionId,
      organizationId,
      questionBankId,
    })
      .populate("categoryId", "name")
      .populate("tags", "name slug");

    if (!question) {
      throw new ApiError(404, "Question not found in this question bank");
    }

    const isCandidate = callerUser?.organizationRole?.name === ORGANIZATION_ROLES.CANDIDATE;
    return isCandidate
      ? QuestionMapper.toCandidateDTO(question)
      : QuestionMapper.toAdminDTO(question);
  }

  static async updateQuestion(organizationId, questionBankId, questionId, updateData, userId) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }

    const safeUpdate = {
      updatedBy: userId,
      $inc: { version: 1 },
    };

    if (updateData.title !== undefined) safeUpdate.title = updateData.title;
    if (updateData.prompt) safeUpdate.prompt = updateData.prompt.trim();
    if (updateData.options) safeUpdate.options = updateData.options;
    if (updateData.correctAnswer !== undefined) safeUpdate.correctAnswer = updateData.correctAnswer;
    if (updateData.explanation !== undefined) safeUpdate.explanation = updateData.explanation;
    if (updateData.difficulty) safeUpdate.difficulty = updateData.difficulty;
    if (updateData.points !== undefined) safeUpdate.points = updateData.points;
    if (updateData.tags) safeUpdate.tags = updateData.tags;
    if (updateData.timeLimit !== undefined) safeUpdate.timeLimit = updateData.timeLimit;
    if (updateData.status) safeUpdate.status = updateData.status;
    if (updateData.metadata) safeUpdate.metadata = updateData.metadata;

    const question = await Question.findOneAndUpdate(
      { _id: questionId, organizationId, questionBankId },
      safeUpdate,
      { returnDocument: "after", runValidators: true }
    );

    if (!question) {
      throw new ApiError(404, "Question not found in this question bank");
    }

    return QuestionMapper.toAdminDTO(question);
  }

  static async deleteQuestion(organizationId, questionBankId, questionId) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }

    const question = await Question.findOneAndUpdate(
      { _id: questionId, organizationId, questionBankId },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!question) {
      throw new ApiError(404, "Question not found in this question bank");
    }

    return { success: true, message: "Question archived successfully" };
  }
}
