import mongoose from "mongoose";
import QuestionBank from "./questionBank.model.js";
import Question from "./question.model.js";
import QuestionVersion from "./questionVersion.model.js";
import QuestionCategory from "../questionCategories/questionCategory.model.js";
import Subject from "../subjects/subject.model.js";
import QuestionTag from "../questionTags/questionTag.model.js";
import { QuestionMapper } from "./question.mapper.js";
import { ExportService } from "../../services/export/export.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";

export class QuestionBankService {
  /**
   * Question Bank Operations
   */
  static async createQuestionBank(organizationId, data, userId) {
    const code = (data.code || `QB-${Date.now()}`).trim().toUpperCase();

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
      categoryId: data.categoryId || null,
      departmentId: data.departmentId || null,
      programId: data.programId || null,
      ownerId: userId,
      createdBy: userId,
      status: data.status || "ACTIVE",
      visibility: data.visibility || "ORGANIZATION",
      settings: data.settings || {},
      questionCount: 0,
    });

    return questionBank;
  }

  static async getQuestionBanks(organizationId, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId, status: { $ne: "DELETED" } };

    if (query.status) filter.status = query.status;
    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.search || query.q) {
      const searchStr = query.search || query.q;
      filter.$or = [
        { name: { $regex: searchStr, $options: "i" } },
        { code: { $regex: searchStr, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      QuestionBank.find(filter)
        .populate("subjectId", "name code")
        .populate("categoryId", "name")
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
      status: { $ne: "DELETED" },
    })
      .populate("subjectId", "name code")
      .populate("categoryId", "name")
      .populate("ownerId", "firstName lastName email");

    if (!questionBank) {
      throw new ApiError(404, "Question bank not found in this organization");
    }

    return questionBank;
  }

  static async updateQuestionBank(organizationId, questionBankId, updateData, userId) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid questionBank ID format");
    }

    const safeUpdate = { updatedBy: userId };
    if (updateData.name) safeUpdate.name = updateData.name.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.visibility) safeUpdate.visibility = updateData.visibility;
    if (updateData.settings) safeUpdate.settings = updateData.settings;
    if (updateData.categoryId) safeUpdate.categoryId = updateData.categoryId;

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

  static async deleteQuestionBank(organizationId, questionBankId, userId) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid questionBank ID format");
    }

    const questionBank = await QuestionBank.findOneAndUpdate(
      { _id: questionBankId, organizationId },
      { $set: { status: "DELETED", deletedAt: new Date(), deletedBy: userId } },
      { returnDocument: "after" }
    );

    if (!questionBank) {
      throw new ApiError(404, "Question bank not found in this organization");
    }

    return { success: true, message: "Question bank deleted successfully" };
  }

  /**
   * Question Item Operations
   */
  static async createQuestion(organizationId, questionBankId, data, userId) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid questionBank ID format");
    }

    const questionBank = await QuestionBank.findOne({
      _id: questionBankId,
      organizationId,
    });
    if (!questionBank) {
      throw new ApiError(404, "Question bank not found in this organization");
    }

    if (data.categoryId) {
      const category = await QuestionCategory.findOne({
        _id: data.categoryId,
        organizationId,
      });
      if (!category) {
        throw new ApiError(400, "Question category not found in this organization");
      }
    }

    if (data.subjectId) {
      const subject = await Subject.findOne({
        _id: data.subjectId,
        organizationId,
      });
      if (!subject) {
        throw new ApiError(400, "Subject not found in this organization");
      }
    }

    const question = await Question.create({
      organizationId,
      questionBankId,
      categoryId: data.categoryId || questionBank.categoryId || null,
      subjectId: data.subjectId || questionBank.subjectId || null,
      createdBy: userId,
      type: data.type || "SINGLE_CHOICE",
      title: data.title || "",
      prompt: data.prompt?.trim() || data.title || "Question",
      description: data.description || "",
      content: data.content || {},
      options: data.options || [],
      answer: data.answer || null,
      correctAnswer: data.correctAnswer !== undefined ? data.correctAnswer : (data.answer || null),
      explanation: data.explanation || "",
      difficulty: data.difficulty || "MEDIUM",
      marks: data.marks !== undefined ? data.marks : (data.points || 1),
      points: data.points !== undefined ? data.points : (data.marks || 1),
      negativeMarks: data.negativeMarks || 0,
      estimatedTime: data.estimatedTime || 60,
      coding: data.coding || null,
      fileUpload: data.fileUpload || null,
      tags: data.tags || [],
      status: data.status || "ACTIVE",
      version: 1,
      metadata: data.metadata || {},
    });

    await QuestionBank.findByIdAndUpdate(questionBankId, { $inc: { questionCount: 1 } });

    // 3. Create initial QuestionVersion (v1) snapshot
    await QuestionVersion.create({
      organizationId,
      questionId: question._id,
      version: 1,
      snapshot: question.toObject(),
      changeReason: "Initial question creation",
      changedBy: userId,
    });

    return QuestionMapper.toAdminDTO(question);
  }

  static async getQuestions(organizationId, questionBankId = null, query = {}, callerUser = null) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

    if (questionBankId && mongoose.Types.ObjectId.isValid(questionBankId)) {
      filter.questionBankId = questionBankId;
    } else if (query.questionBankId && mongoose.Types.ObjectId.isValid(query.questionBankId)) {
      filter.questionBankId = query.questionBankId;
    }

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.search || query.q) {
      const searchStr = query.search || query.q;
      filter.$or = [
        { prompt: { $regex: searchStr, $options: "i" } },
        { title: { $regex: searchStr, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      Question.find(filter)
        .populate("categoryId", "name")
        .populate("subjectId", "name code")
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

  static async getQuestion(organizationId, questionId, callerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }

    const question = await Question.findOne({
      _id: questionId,
      organizationId,
    })
      .populate("categoryId", "name")
      .populate("subjectId", "name code")
      .populate("tags", "name slug");

    if (!question) {
      throw new ApiError(404, "Question not found in this organization");
    }

    const isCandidate = callerUser?.organizationRole?.name === ORGANIZATION_ROLES.CANDIDATE;
    return isCandidate
      ? QuestionMapper.toCandidateDTO(question)
      : QuestionMapper.toAdminDTO(question);
  }

  static async updateQuestion(organizationId, questionId, updateData, userId) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }

    const safeUpdate = {
      updatedBy: userId,
      $inc: { version: 1 },
    };

    if (updateData.title !== undefined) safeUpdate.title = updateData.title;
    if (updateData.prompt) safeUpdate.prompt = updateData.prompt.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.content !== undefined) safeUpdate.content = updateData.content;
    if (updateData.options) safeUpdate.options = updateData.options;
    if (updateData.answer !== undefined) safeUpdate.answer = updateData.answer;
    if (updateData.correctAnswer !== undefined) safeUpdate.correctAnswer = updateData.correctAnswer;
    if (updateData.explanation !== undefined) safeUpdate.explanation = updateData.explanation;
    if (updateData.difficulty) safeUpdate.difficulty = updateData.difficulty;
    if (updateData.marks !== undefined) safeUpdate.marks = updateData.marks;
    if (updateData.points !== undefined) safeUpdate.points = updateData.points;
    if (updateData.negativeMarks !== undefined) safeUpdate.negativeMarks = updateData.negativeMarks;
    if (updateData.coding) safeUpdate.coding = updateData.coding;
    if (updateData.fileUpload) safeUpdate.fileUpload = updateData.fileUpload;
    if (updateData.tags) safeUpdate.tags = updateData.tags;
    if (updateData.status) safeUpdate.status = updateData.status;
    if (updateData.metadata) safeUpdate.metadata = updateData.metadata;

    const question = await Question.findOneAndUpdate(
      { _id: questionId, organizationId },
      safeUpdate,
      { returnDocument: "after", runValidators: true }
    );

    if (!question) {
      throw new ApiError(404, "Question not found in this organization");
    }

    // Record new QuestionVersion snapshot
    await QuestionVersion.create({
      organizationId,
      questionId: question._id,
      version: question.version,
      snapshot: question.toObject(),
      changeReason: updateData.changeReason || "Question update",
      changedBy: userId,
    });

    return QuestionMapper.toAdminDTO(question);
  }

  static async getQuestionVersions(organizationId, questionId) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }

    const versions = await QuestionVersion.find({ organizationId, questionId })
      .sort({ version: -1 })
      .populate("changedBy", "firstName lastName email");

    return versions;
  }

  static async deleteQuestion(organizationId, questionId) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }

    const question = await Question.findOneAndUpdate(
      { _id: questionId, organizationId },
      { $set: { status: "ARCHIVED" } },
      { returnDocument: "after" }
    );

    if (!question) {
      throw new ApiError(404, "Question not found in this organization");
    }

    return { success: true, message: "Question archived successfully" };
  }

  /**
   * Bulk Import & Export Operations
   */
  static async importQuestions(organizationId, questionBankId, questionsList, userId) {
    if (!mongoose.Types.ObjectId.isValid(questionBankId)) {
      throw new ApiError(400, "Invalid question bank ID format");
    }

    const questionBank = await QuestionBank.findOne({ _id: questionBankId, organizationId });
    if (!questionBank) {
      throw new ApiError(404, "Question bank not found");
    }

    if (!Array.isArray(questionsList) || questionsList.length === 0) {
      throw new ApiError(400, "Questions array is required for import");
    }

    const insertedDocs = [];
    for (const item of questionsList) {
      const qDoc = await Question.create({
        organizationId,
        questionBankId,
        subjectId: item.subjectId || questionBank.subjectId || null,
        categoryId: item.categoryId || questionBank.categoryId || null,
        createdBy: userId,
        type: item.type || "SINGLE_CHOICE",
        title: item.title || "",
        prompt: item.prompt || item.title || "Question",
        options: item.options || [],
        answer: item.answer || null,
        correctAnswer: item.correctAnswer || item.answer || null,
        difficulty: item.difficulty || "MEDIUM",
        marks: item.marks || item.points || 1,
        points: item.points || item.marks || 1,
        status: "ACTIVE",
        version: 1,
      });
      insertedDocs.push(qDoc);
    }

    await QuestionBank.findByIdAndUpdate(questionBankId, {
      $inc: { questionCount: insertedDocs.length },
    });

    return {
      importedCount: insertedDocs.length,
      questions: QuestionMapper.toAdminDTOList(insertedDocs),
    };
  }

  static async exportQuestions(organizationId, questionBankId, format = "JSON") {
    const questions = await Question.find({ organizationId, questionBankId, status: { $ne: "ARCHIVED" } }).lean();

    if (format === "CSV") {
      const flat = questions.map((q) => ({
        id: q._id.toString(),
        type: q.type,
        title: q.title,
        prompt: q.prompt,
        difficulty: q.difficulty,
        marks: q.marks || q.points,
        optionsCount: q.options?.length || 0,
      }));
      const fileContent = await ExportService.exportToCsv(flat);
      return { fileContent, contentType: "text/csv" };
    }

    return { data: questions, contentType: "application/json" };
  }
}
