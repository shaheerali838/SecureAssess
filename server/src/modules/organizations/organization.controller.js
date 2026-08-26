import { OrganizationService } from "./organization.service.js";
import { OrganizationValidator } from "./organization.validator.js";
import { ORGANIZATION_MESSAGES } from "./organization.constants.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, formatPaginatedResponse } from "../../utils/pagination.js";

export const createOrganization = asyncHandler(async (req, res) => {
  const { isValid, errors } = OrganizationValidator.validateCreate(req.body);
  if (!isValid) throw new ApiError(400, "Validation failed", errors);

  const org = await OrganizationService.createOrganization(req.body);
  return res.status(201).json(new ApiResponse(201, org, ORGANIZATION_MESSAGES.CREATED));
});

export const getOrganizationById = asyncHandler(async (req, res) => {
  const org = await OrganizationService.getOrganizationById(req.params.id);
  return res.status(200).json(new ApiResponse(200, org, ORGANIZATION_MESSAGES.RETRIEVED));
});

export const getCurrentOrganization = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId || req.user?.organizationId;
  if (!organizationId) {
    throw new ApiError(400, "No active organization associated with this session");
  }
  const org = await OrganizationService.getOrganizationById(organizationId);
  return res.status(200).json(new ApiResponse(200, org, ORGANIZATION_MESSAGES.RETRIEVED));
});

export const getPublicProfileBySlug = asyncHandler(async (req, res) => {
  const org = await OrganizationService.getOrganizationBySlug(req.params.slug);
  return res.status(200).json(new ApiResponse(200, org, ORGANIZATION_MESSAGES.RETRIEVED));
});

export const listOrganizations = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const { items, total } = await OrganizationService.listOrganizations({}, pagination);

  return res.status(200).json(
    new ApiResponse(
      200,
      formatPaginatedResponse({
        data: items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }),
      ORGANIZATION_MESSAGES.LIST_RETRIEVED
    )
  );
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const { isValid, errors } = OrganizationValidator.validateUpdate(req.body);
  if (!isValid) throw new ApiError(400, "Validation failed", errors);

  const targetId = req.params.id;
  const updated = await OrganizationService.updateOrganization(targetId, req.body);
  return res.status(200).json(new ApiResponse(200, updated, ORGANIZATION_MESSAGES.UPDATED));
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const { isValid, errors } = OrganizationValidator.validateSubscription(req.body);
  if (!isValid) throw new ApiError(400, "Validation failed", errors);

  const updated = await OrganizationService.updateSubscription(req.params.id, req.body);
  return res.status(200).json(
    new ApiResponse(200, updated, ORGANIZATION_MESSAGES.SUBSCRIPTION_UPDATED)
  );
});

export const deactivateOrganization = asyncHandler(async (req, res) => {
  const result = await OrganizationService.deactivateOrganization(req.params.id);
  return res.status(200).json(new ApiResponse(200, result, ORGANIZATION_MESSAGES.DEACTIVATED));
});
