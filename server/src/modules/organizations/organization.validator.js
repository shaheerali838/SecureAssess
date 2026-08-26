import { ORGANIZATION_TYPES } from "./organization.constants.js";
import { SUBSCRIPTION_PLAN_LIST } from "../../constants/subscriptionPlans.js";

export class OrganizationValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.push("Organization name is required (minimum 2 characters)");
    }
    if (!body.slug || typeof body.slug !== "string" || !/^[a-z0-9-]+$/.test(body.slug)) {
      errors.push("Slug is required and must contain only lowercase letters, numbers, and hyphens");
    }
    if (body.type && !Object.values(ORGANIZATION_TYPES).includes(body.type)) {
      errors.push(`Type must be one of: ${Object.values(ORGANIZATION_TYPES).join(", ")}`);
    }
    if (body.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail)) {
      errors.push("Contact email must be a valid email format");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdate(body) {
    const errors = [];
    if (body.name && (typeof body.name !== "string" || body.name.trim().length < 2)) {
      errors.push("Organization name must be at least 2 characters");
    }
    if (body.type && !Object.values(ORGANIZATION_TYPES).includes(body.type)) {
      errors.push(`Type must be one of: ${Object.values(ORGANIZATION_TYPES).join(", ")}`);
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateSubscription(body) {
    const errors = [];
    if (!body.plan || !SUBSCRIPTION_PLAN_LIST.includes(body.plan)) {
      errors.push(`Plan is required and must be one of: ${SUBSCRIPTION_PLAN_LIST.join(", ")}`);
    }
    return { isValid: errors.length === 0, errors };
  }
}
