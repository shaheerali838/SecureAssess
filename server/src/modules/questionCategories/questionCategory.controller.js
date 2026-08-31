import { QuestionCategoryService } from "./questionCategory.service.js";
import { QuestionCategoryValidator } from "./questionCategory.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createCategory = asyncHandler(async (req, res) => {
  const { isValid, errors } = QuestionCategoryValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId } = req.params;
  const questionBankId = req.params.questionBankId || req.body.questionBankId || null;
  const userId = req.user?.id || req.user?._id;
  const category = await QuestionCategoryService.createCategory(
    organizationId,
    questionBankId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, category, "Question category created successfully"));
});

export const getCategories = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  // questionBankId may come from URL params (nested route) or query string (org-level route)
  const questionBankId = req.params.questionBankId || req.query.questionBankId;
  const categories = await QuestionCategoryService.getCategories(
    organizationId,
    questionBankId,
    req.query
  );
  return res.status(200).json(new ApiResponse(200, categories, "Categories retrieved successfully"));
});

export const getCategory = asyncHandler(async (req, res) => {
  const { organizationId, categoryId } = req.params;
  const questionBankId = req.params.questionBankId || req.query.questionBankId;
  const category = await QuestionCategoryService.getCategory(
    organizationId,
    questionBankId,
    categoryId
  );
  return res.status(200).json(new ApiResponse(200, category, "Category retrieved successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { isValid, errors } = QuestionCategoryValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, questionBankId, categoryId } = req.params;
  const category = await QuestionCategoryService.updateCategory(
    organizationId,
    questionBankId,
    categoryId,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { organizationId, questionBankId, categoryId } = req.params;
  const result = await QuestionCategoryService.deleteCategory(
    organizationId,
    questionBankId,
    categoryId
  );
  return res.status(200).json(new ApiResponse(200, result, "Category archived successfully"));
});
