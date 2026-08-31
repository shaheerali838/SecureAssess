import { ORGANIZATION_TYPES, ORGANIZATION_STATUSES } from "./organization.constants.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class OrganizationValidator {
  /**
   * Validates organization creation payload.
   * Ensures client cannot supply internal server values (organizationId, roleId, slug, code, etc.)
   */
  static validateCreate(body) {
    const errors = [];

    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }

    // 1. Validate Organization Name
    if (!body.name || typeof body.name !== "string") {
      errors.push("Organization name is required");
    } else {
      const trimmedName = body.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 150) {
        errors.push("Organization name must be between 2 and 150 characters");
      }
    }

    // 2. Validate Organization Type
    if (body.type !== undefined) {
      if (!Object.values(ORGANIZATION_TYPES).includes(body.type)) {
        errors.push(
          `Organization type must be one of: ${Object.values(ORGANIZATION_TYPES).join(", ")}`
        );
      }
    }

    // 2.1 Validate Tenant Industry
    if (body.tenantIndustry !== undefined) {
      const validIndustries = ["academic", "corporate", "aviation", "recruitment"];
      if (!validIndustries.includes(body.tenantIndustry)) {
        errors.push(
          `Tenant industry must be one of: ${validIndustries.join(", ")}`
        );
      }
    }

    // 3. Validate Contact Information
    if (body.contact && typeof body.contact === "object") {
      if (body.contact.email) {
        if (typeof body.contact.email !== "string" || !EMAIL_REGEX.test(body.contact.email.trim())) {
          errors.push("Contact email must be a valid email address");
        }
      }
      if (body.contact.phone && typeof body.contact.phone !== "string") {
        errors.push("Contact phone must be a string");
      }
    }

    // 4. Validate Address
    if (body.address && typeof body.address === "object") {
      if (body.address.country && typeof body.address.country !== "string") {
        errors.push("Address country must be a string");
      }
      if (body.address.city && typeof body.address.city !== "string") {
        errors.push("Address city must be a string");
      }
    }

    // 5. Validate Owner Information (Required)
    if (!body.owner || typeof body.owner !== "object") {
      errors.push("Organization owner information is required");
    } else {
      if (!body.owner.firstName || typeof body.owner.firstName !== "string") {
        errors.push("Owner first name is required");
      } else if (body.owner.firstName.trim().length < 2) {
        errors.push("Owner first name must be at least 2 characters");
      }

      if (body.owner.lastName && typeof body.owner.lastName !== "string") {
        errors.push("Owner last name must be a string");
      }

      if (!body.owner.email || typeof body.owner.email !== "string") {
        errors.push("Owner email is required");
      } else if (!EMAIL_REGEX.test(body.owner.email.trim())) {
        errors.push("Owner email must be a valid email address");
      }
    }

    // 6. Security Check: Block forbidden client-injected identifiers
    const forbiddenFields = [
      "_id",
      "organizationId",
      "platformRole",
      "roleId",
      "permissions",
      "subscriptionId",
      "status",
      "slug",
      "code",
      "createdBy",
    ];

    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        errors.push(`Field '${field}' is server-managed and cannot be supplied by the client`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates organization update payload.
   * Blocks client modification of immutable and server-managed fields.
   */
  static validateUpdate(body) {
    const errors = [];

    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }

    // Disallowed immutable/server-managed fields
    const forbiddenFields = [
      "_id",
      "id",
      "slug",
      "code",
      "platformRole",
      "subscriptionId",
      "status",
      "roleId",
      "owner",
      "createdBy",
      "createdAt",
      "updatedAt",
    ];

    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        errors.push(`Field '${field}' cannot be modified through this endpoint`);
      }
    }

    // Validate Name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 150) {
        errors.push("Organization name must be a string between 2 and 150 characters");
      }
    }

    // Validate Type if provided
    if (body.type !== undefined) {
      if (!Object.values(ORGANIZATION_TYPES).includes(body.type)) {
        errors.push(
          `Organization type must be one of: ${Object.values(ORGANIZATION_TYPES).join(", ")}`
        );
      }
    }

    // Validate Tenant Industry if provided
    if (body.tenantIndustry !== undefined) {
      const validIndustries = ["academic", "corporate", "aviation", "recruitment"];
      if (!validIndustries.includes(body.tenantIndustry)) {
        errors.push(
          `Tenant industry must be one of: ${validIndustries.join(", ")}`
        );
      }
    }

    // Validate Contact Email if provided
    const contactEmail = body.contact?.email || body.email;
    if (contactEmail && (typeof contactEmail !== "string" || !EMAIL_REGEX.test(contactEmail.trim()))) {
      errors.push("Contact email must be a valid email format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates organization status update payload.
   */
  static validateStatusUpdate(body) {
    const errors = [];

    if (!body || typeof body !== "object" || !body.status) {
      return { isValid: false, errors: ["Organization status is required"] };
    }

    if (!Object.values(ORGANIZATION_STATUSES).includes(body.status)) {
      errors.push(
        `Status must be one of: ${Object.values(ORGANIZATION_STATUSES).join(", ")}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
