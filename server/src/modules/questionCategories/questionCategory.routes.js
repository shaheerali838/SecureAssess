import express from "express";
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "./questionCategory.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/question-banks/:questionBankId/categories
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_CATEGORIES_CREATE,
    PERMISSIONS.QUESTION_CATEGORIES_CREATE
  ),
  createCategory
);

// GET /api/v1/organizations/:organizationId/question-banks/:questionBankId/categories
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_CATEGORIES_VIEW,
    PERMISSIONS.QUESTION_CATEGORIES_VIEW
  ),
  getCategories
);

// GET /api/v1/organizations/:organizationId/question-banks/:questionBankId/categories/:categoryId
router.get(
  "/:categoryId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_CATEGORIES_VIEW,
    PERMISSIONS.QUESTION_CATEGORIES_VIEW
  ),
  getCategory
);

// PATCH /api/v1/organizations/:organizationId/question-banks/:questionBankId/categories/:categoryId
router.patch(
  "/:categoryId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_CATEGORIES_UPDATE,
    PERMISSIONS.QUESTION_CATEGORIES_UPDATE
  ),
  updateCategory
);

// DELETE /api/v1/organizations/:organizationId/question-banks/:questionBankId/categories/:categoryId
router.delete(
  "/:categoryId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_CATEGORIES_DELETE,
    PERMISSIONS.QUESTION_CATEGORIES_DELETE
  ),
  deleteCategory
);

export default router;
