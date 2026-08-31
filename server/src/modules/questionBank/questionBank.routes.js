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
  getQuestionVersions,
  importQuestions,
  exportQuestions,
} from "./questionBank.controller.js";
import categoriesRouter from "../questionCategories/index.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

export const questionBankRouter = express.Router({ mergeParams: true });
export const questionRouter = express.Router({ mergeParams: true });

// ==========================================
// QUESTION BANK ROUTES
// ==========================================

// POST /api/v1/organizations/:organizationId/question-banks
questionBankRouter.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_CREATE,
    PERMISSIONS.QUESTION_BANKS_CREATE
  ),
  createQuestionBank
);

// GET /api/v1/organizations/:organizationId/question-banks
questionBankRouter.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_VIEW,
    PERMISSIONS.QUESTION_BANKS_VIEW
  ),
  getQuestionBanks
);

// GET /api/v1/organizations/:organizationId/question-banks/:questionBankId
questionBankRouter.get(
  "/:questionBankId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_VIEW,
    PERMISSIONS.QUESTION_BANKS_VIEW
  ),
  getQuestionBank
);

// PATCH /api/v1/organizations/:organizationId/question-banks/:questionBankId
questionBankRouter.patch(
  "/:questionBankId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_UPDATE,
    PERMISSIONS.QUESTION_BANKS_UPDATE
  ),
  updateQuestionBank
);

// POST /api/v1/organizations/:organizationId/question-banks/:questionBankId/archive
questionBankRouter.post(
  "/:questionBankId/archive",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_DELETE,
    PERMISSIONS.QUESTION_BANKS_DELETE
  ),
  deleteQuestionBank
);

// DELETE /api/v1/organizations/:organizationId/question-banks/:questionBankId
questionBankRouter.delete(
  "/:questionBankId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_BANKS_DELETE,
    PERMISSIONS.QUESTION_BANKS_DELETE
  ),
  deleteQuestionBank
);

// --- Bulk Import & Export ---
questionBankRouter.post(
  "/:questionBankId/questions/import",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_CREATE
  ),
  importQuestions
);

questionBankRouter.get(
  "/:questionBankId/questions/export",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  exportQuestions
);

// --- Nested Questions in Question Bank ---
questionBankRouter.post(
  "/:questionBankId/questions",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_CREATE
  ),
  createQuestion
);

questionBankRouter.get(
  "/:questionBankId/questions",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  getQuestions
);

// --- Nested Categories ---
questionBankRouter.use("/:questionBankId/categories", categoriesRouter);

// ==========================================
// DIRECT QUESTIONS ROUTES
// ==========================================

// POST /api/v1/organizations/:organizationId/questions
questionRouter.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_CREATE
  ),
  createQuestion
);

// GET /api/v1/organizations/:organizationId/questions
questionRouter.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  getQuestions
);

// GET /api/v1/organizations/:organizationId/questions/:questionId
questionRouter.get(
  "/:questionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  getQuestion
);

// PATCH /api/v1/organizations/:organizationId/questions/:questionId
questionRouter.patch(
  "/:questionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_UPDATE,
    PERMISSIONS.QUESTIONS_UPDATE
  ),
  updateQuestion
);

// POST /api/v1/organizations/:organizationId/questions/:questionId/publish
questionRouter.post(
  "/:questionId/publish",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_UPDATE,
    PERMISSIONS.QUESTIONS_UPDATE
  ),
  (req, res, next) => {
    req.body.status = "PUBLISHED";
    updateQuestion(req, res, next);
  }
);

// POST /api/v1/organizations/:organizationId/questions/:questionId/archive
questionRouter.post(
  "/:questionId/archive",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_DELETE,
    PERMISSIONS.QUESTIONS_DELETE
  ),
  deleteQuestion
);

// GET /api/v1/organizations/:organizationId/questions/:questionId/versions
questionRouter.get(
  "/:questionId/versions",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_VIEW
  ),
  getQuestionVersions
);

// DELETE /api/v1/organizations/:organizationId/questions/:questionId
questionRouter.delete(
  "/:questionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTIONS_DELETE,
    PERMISSIONS.QUESTIONS_DELETE
  ),
  deleteQuestion
);

export default questionBankRouter;
