import express from "express";
import {
  addQuestionToAssessment,
  getAssessmentQuestions,
  updateAssessmentQuestion,
  removeAssessmentQuestion,
} from "./assessmentQuestion.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/questions
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_QUESTIONS_ADD,
    PERMISSIONS.ASSESSMENT_QUESTIONS_ADD
  ),
  addQuestionToAssessment
);

// GET /api/v1/organizations/:organizationId/assessments/:assessmentId/questions
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_QUESTIONS_VIEW,
    PERMISSIONS.ASSESSMENT_QUESTIONS_VIEW
  ),
  getAssessmentQuestions
);

// PATCH /api/v1/organizations/:organizationId/assessments/:assessmentId/questions/:assessmentQuestionId
router.patch(
  "/:assessmentQuestionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_QUESTIONS_UPDATE,
    PERMISSIONS.ASSESSMENT_QUESTIONS_UPDATE
  ),
  updateAssessmentQuestion
);

// DELETE /api/v1/organizations/:organizationId/assessments/:assessmentId/questions/:assessmentQuestionId
router.delete(
  "/:assessmentQuestionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_QUESTIONS_REMOVE,
    PERMISSIONS.ASSESSMENT_QUESTIONS_REMOVE
  ),
  removeAssessmentQuestion
);

export default router;
