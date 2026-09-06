import mongoose from "mongoose";
import { QuestionBankService } from "./questionBank.service.js";
import { QuestionBankValidator } from "./questionBank.validation.js";
import Organization from "../organizations/organization.model.js";
import UserMembership from "../users/userMembership.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getOrgId = async (req) => {
  const rawOrgId =
    req.params.organizationId ||
    req.headers["x-organization-id"] ||
    req.headers["x-tenant-id"] ||
    req.query?.organizationId ||
    req.organizationId ||
    req.tenantId ||
    req.user?.activeOrganizationId ||
    req.user?.organizationId;

  if (rawOrgId && mongoose.Types.ObjectId.isValid(rawOrgId)) {
    return rawOrgId;
  }

  const uId = req.user?._id || req.user?.id;
  if (uId) {
    const membership = await UserMembership.findOne({
      userId: uId,
      status: "ACTIVE",
    }).lean();
    if (membership?.organizationId) {
      return membership.organizationId;
    }
  }

  const firstOrg = await Organization.findOne({ status: { $ne: "DELETED" } }).select("_id").lean();
  return firstOrg?._id || null;
};

/**
 * Question Bank Handlers
 */
export const createQuestionBank = asyncHandler(async (req, res) => {
  const { isValid, errors } = QuestionBankValidator.validateQuestionBank(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = await getOrgId(req);
  const userId = req.user?.id || req.user?._id;
  const questionBank = await QuestionBankService.createQuestionBank(
    organizationId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, questionBank, "Question bank created successfully"));
});

export const getQuestionBanks = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const result = await QuestionBankService.getQuestionBanks(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Question banks retrieved successfully"));
});

export const getQuestionBank = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { questionBankId } = req.params;
  const questionBank = await QuestionBankService.getQuestionBank(organizationId, questionBankId);
  return res.status(200).json(new ApiResponse(200, questionBank, "Question bank retrieved successfully"));
});

export const updateQuestionBank = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { questionBankId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const questionBank = await QuestionBankService.updateQuestionBank(
    organizationId,
    questionBankId,
    req.body,
    userId
  );
  return res.status(200).json(new ApiResponse(200, questionBank, "Question bank updated successfully"));
});

export const deleteQuestionBank = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { questionBankId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await QuestionBankService.deleteQuestionBank(organizationId, questionBankId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Question bank deleted successfully"));
});

/**
 * Question Item Handlers
 */
export const createQuestion = asyncHandler(async (req, res) => {
  const { isValid, errors } = QuestionBankValidator.validateQuestion(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = await getOrgId(req);
  const questionBankId = req.params.questionBankId || req.body.questionBankId;
  const userId = req.user?.id || req.user?._id;

  const question = await QuestionBankService.createQuestion(
    organizationId,
    questionBankId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, question, "Question created successfully"));
});

export const getQuestions = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const questionBankId = req.params.questionBankId || req.query.questionBankId || null;

  const result = await QuestionBankService.getQuestions(
    organizationId,
    questionBankId,
    req.query,
    req.user
  );
  return res.status(200).json(new ApiResponse(200, result, "Questions retrieved successfully"));
});

export const getQuestion = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const questionId = req.params.questionId || req.params.id;

  const question = await QuestionBankService.getQuestion(
    organizationId,
    questionId,
    req.user
  );
  return res.status(200).json(new ApiResponse(200, question, "Question retrieved successfully"));
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const questionId = req.params.questionId || req.params.id;
  const userId = req.user?.id || req.user?._id;

  const question = await QuestionBankService.updateQuestion(
    organizationId,
    questionId,
    req.body,
    userId
  );
  return res.status(200).json(new ApiResponse(200, question, "Question updated successfully"));
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const questionId = req.params.questionId || req.params.id;

  const result = await QuestionBankService.deleteQuestion(
    organizationId,
    questionId
  );
  return res.status(200).json(new ApiResponse(200, result, "Question archived successfully"));
});

export const importQuestions = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const questionBankId = req.params.questionBankId || req.body.questionBankId;
  const userId = req.user?.id || req.user?._id;

  const questionsList = Array.isArray(req.body) ? req.body : req.body.questions;
  const result = await QuestionBankService.importQuestions(
    organizationId,
    questionBankId,
    questionsList,
    userId
  );
  return res.status(201).json(new ApiResponse(201, result, "Questions imported successfully"));
});

export const exportQuestions = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { questionBankId } = req.params;
  const { format = "json" } = req.query;

  const fileData = await QuestionBankService.exportQuestions(organizationId, questionBankId, format);
  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=question-bank-${questionBankId}.csv`);
    return res.send(fileData);
  }

  return res.status(200).json(new ApiResponse(200, fileData, "Export generated successfully"));
});

export const getQuestionVersions = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { questionId } = req.params;
  const versions = await QuestionBankService.getQuestionVersions(organizationId, questionId);
  return res.status(200).json(new ApiResponse(200, versions, "Question versions retrieved successfully"));
});
