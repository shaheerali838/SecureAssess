import express from "express";
import {
  createQuestionBank,
  getQuestionBanks,
  getQuestionBank,
  updateQuestionBank,
  deleteQuestionBank,
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  exportQuestions,
} from "./questionBank.controller.js";
import categoriesRouter from "../questionCategories/index.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Question Bank Routes ---

// POST /api/v1/organizations/:organizationId/question-banks
router.post(
  "/question-banks",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_CREATE,
    PERMISSIONS.QUESTION_BANKS_CREATE
  ),
  createQuestionBank
);

// GET /api/v1/organizations/:organizationId/question-banks
router.get(
  "/question-banks",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_VIEW,
    PERMISSIONS.QUESTION_BANKS_VIEW
  ),
  getQuestionBanks
);

// GET /api/v1/organizations/:organizationId/question-banks/:questionBankId
router.get(
  "/question-banks/:questionBankId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_VIEW,
    PERMISSIONS.QUESTION_BANKS_VIEW
  ),
  getQuestionBank
);

// PATCH /api/v1/organizations/:organizationId/question-banks/:questionBankId
router.patch(
  "/question-banks/:questionBankId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_UPDATE,
    PERMISSIONS.QUESTION_BANKS_UPDATE
  ),
  updateQuestionBank
);

// DELETE /api/v1/organizations/:organizationId/question-banks/:questionBankId
router.delete(
  "/question-banks/:questionBankId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_DELETE,
    PERMISSIONS.QUESTION_BANKS_DELETE
  ),
  deleteQuestionBank
);

// --- Bulk Import & Export ---
router.post(
  "/question-banks/:questionBankId/questions/import",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_CREATE
  ),
  importQuestions
);

router.get(
  "/question-banks/:questionBankId/questions/export",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  exportQuestions
);

// --- Nested Questions in Question Bank ---

// POST /api/v1/organizations/:organizationId/question-banks/:questionBankId/questions
router.post(
  "/question-banks/:questionBankId/questions",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_CREATE
  ),
  createQuestion
);

// GET /api/v1/organizations/:organizationId/question-banks/:questionBankId/questions
router.get(
  "/question-banks/:questionBankId/questions",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  getQuestions
);

// --- Global Organization Questions Endpoints ---

// POST /api/v1/organizations/:organizationId/questions
router.post(
  "/questions",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_CREATE
  ),
  createQuestion
);

// GET /api/v1/organizations/:organizationId/questions
router.get(
  "/questions",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  getQuestions
);

// GET /api/v1/organizations/:organizationId/questions/:questionId
router.get(
  "/questions/:questionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  getQuestion
);

// PATCH /api/v1/organizations/:organizationId/questions/:questionId
router.patch(
  "/questions/:questionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_UPDATE,
    PERMISSIONS.QUESTIONS_UPDATE
  ),
  updateQuestion
);

// DELETE /api/v1/organizations/:organizationId/questions/:questionId
router.delete(
  "/questions/:questionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_DELETE,
    PERMISSIONS.QUESTIONS_DELETE
  ),
  deleteQuestion
);

// Nested categories route
router.use("/question-banks/:questionBankId/categories", categoriesRouter);

export default router;
