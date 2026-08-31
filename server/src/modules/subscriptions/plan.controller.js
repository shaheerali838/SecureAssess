import Plan from "./plan.model.js";
import { DEFAULT_PLANS, PLAN_STATUSES } from "./subscription.constants.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";

export const getPlans = asyncHandler(async (req, res) => {
  const isPlatformUser = req.user?.platformRole === "PLATFORM_OWNER" || req.user?.platformRole === "PLATFORM_ADMIN";
  const filter = isPlatformUser ? {} : { status: PLAN_STATUSES.ACTIVE, isPublic: true };

  let plans = await Plan.find(filter).sort({ sortOrder: 1, price: 1 });

  // Auto-seed default plans if empty
  if (plans.length === 0) {
    await Plan.insertMany(Object.values(DEFAULT_PLANS));
    plans = await Plan.find(filter).sort({ sortOrder: 1, price: 1 });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, plans, "Subscription plans retrieved successfully"));
});

export const getPlanById = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, plan, "Plan details retrieved successfully"));
});

export const createPlan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { name, code, description, price, currency, billingInterval, limits, features, isPublic, sortOrder } = req.body;

  if (!name || !code) {
    throw new ApiError(400, "Plan name and code are required");
  }

  const existing = await Plan.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new ApiError(409, `Plan with code '${code}' already exists`);
  }

  const plan = await Plan.create({
    name,
    code: code.toUpperCase(),
    description,
    price: price || 0,
    currency: currency || "USD",
    billingInterval: billingInterval || "MONTHLY",
    limits: limits || {},
    features: features || {},
    isPublic: isPublic !== undefined ? isPublic : true,
    sortOrder: sortOrder || 0,
  });

  AuditLogService.createAuditLog({
    actorId: userId,
    action: "CREATE",
    resource: "PLAN",
    resourceId: plan._id,
    description: `Platform Administrator created plan '${plan.name}' (${plan.code})`,
  }).catch(() => {});

  return res
    .status(201)
    .json(new ApiResponse(201, plan, "Plan created successfully"));
});

export const updatePlan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { planId } = req.params;
  const updates = req.body;

  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  if (updates.name) plan.name = updates.name;
  if (updates.description !== undefined) plan.description = updates.description;
  if (updates.price !== undefined) plan.price = updates.price;
  if (updates.status) plan.status = updates.status;
  if (updates.limits) plan.limits = { ...plan.limits, ...updates.limits };
  if (updates.features) plan.features = { ...plan.features, ...updates.features };
  if (updates.isPublic !== undefined) plan.isPublic = updates.isPublic;
  if (updates.sortOrder !== undefined) plan.sortOrder = updates.sortOrder;

  await plan.save();

  AuditLogService.createAuditLog({
    actorId: userId,
    action: "UPDATE",
    resource: "PLAN",
    resourceId: plan._id,
    description: `Platform Administrator updated plan '${plan.name}' (${plan.code})`,
  }).catch(() => {});

  return res
    .status(200)
    .json(new ApiResponse(200, plan, "Plan updated successfully"));
});
