import mongoose from "mongoose";
import { RubricService } from "./rubric.service.js";
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

export const getRubrics = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  if (!organizationId) {
    throw new ApiError(400, "Organization context required");
  }
  const result = await RubricService.getRubrics(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Rubrics retrieved successfully"));
});

export const getRubric = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { rubricId } = req.params;
  const result = await RubricService.getRubricById(organizationId, rubricId);
  return res.status(200).json(new ApiResponse(200, result, "Rubric retrieved successfully"));
});

export const createRubric = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  if (!organizationId) {
    throw new ApiError(400, "Organization context required");
  }
  const userId = req.user?.id || req.user?._id;
  const result = await RubricService.createRubric(organizationId, req.body, userId);
  return res.status(201).json(new ApiResponse(201, result, "Rubric created successfully"));
});

export const updateRubric = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { rubricId } = req.params;
  const result = await RubricService.updateRubric(organizationId, rubricId, req.body);
  return res.status(200).json(new ApiResponse(200, result, "Rubric updated successfully"));
});

export const deleteRubric = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { rubricId } = req.params;
  const result = await RubricService.deleteRubric(organizationId, rubricId);
  return res.status(200).json(new ApiResponse(200, result, "Rubric archived successfully"));
});
