import mongoose from "mongoose";
import Organization from "./organization.model.js";
import { OrganizationRepository } from "./organization.repository.js";
import { OrganizationMapper } from "./organization.mapper.js";
import { ORGANIZATION_TYPES, ORGANIZATION_STATUSES } from "./organization.constants.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES, ROLE_SCOPES } from "../../constants/roles.js";
import { USER_STATUSES } from "../../constants/userStatuses.js";
import { MEMBERSHIP_STATUSES } from "../../constants/membershipStatuses.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateRandomCode } from "../../utils/generateCode.js";
import { generateAccessToken } from "../../utils/token.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import { EntitlementService } from "../../services/billing/entitlement.service.js";
import Role from "../roles/role.model.js";
import User from "../users/user.model.js";
import UserMembership from "../users/userMembership.model.js";
import Subscription from "../subscriptions/subscription.model.js";

/**
 * Normalizes text to a clean URL-friendly slug
 */
export const normalizeSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export class OrganizationService {
  /**
   * Generates a unique slug, appending a numeric suffix in case of collision
   */
  static async generateUniqueSlug(name, session = null) {
    const baseSlug = normalizeSlug(name) || "organization";
    let candidateSlug = baseSlug;
    let counter = 2;

    while (await OrganizationRepository.findBySlug(candidateSlug, { session })) {
      candidateSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return candidateSlug;
  }

  /**
   * Generates a unique uppercase organization code (e.g. VU-8F4K2)
   */
  static async generateUniqueCode(name, session = null) {
    const words = name.trim().split(/\s+/);
    let prefix = words
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 3);

    if (prefix.length < 2) {
      prefix = name.slice(0, 2).toUpperCase() || "OR";
    }

    let candidateCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const suffix = generateRandomCode(5).toUpperCase();
      candidateCode = `${prefix}-${suffix}`;
      const existing = await OrganizationRepository.findByCode(candidateCode, { session });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      candidateCode = `ORG-${Date.now().toString().slice(-6)}`;
    }

    return candidateCode;
  }

  /**
   * Creates a new organization with initial owner and subscription inside a MongoDB transaction
   */
  static async createOrganization(data, creatorId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Generate unique slug & code
      const slug = await this.generateUniqueSlug(data.name, session);
      const code = await this.generateUniqueCode(data.name, session);

      // 2. Verify ORGANIZATION_OWNER system role exists
      const ownerRole = await Role.findOne({
        name: ORGANIZATION_ROLES.ORGANIZATION_OWNER,
        scope: ROLE_SCOPES.ORGANIZATION,
        isSystemRole: true,
      }).session(session);

      if (!ownerRole) {
        throw new ApiError(
          500,
          "System configuration error: ORGANIZATION_OWNER system role is missing. Please run database seeders."
        );
      }

      // 3. Find or create Owner User
      const ownerEmail = data.owner.email.toLowerCase().trim();
      let ownerUser = await User.findOne({ email: ownerEmail }).session(session);

      if (!ownerUser) {
        const createdUsers = await User.create(
          [
            {
              firstName: data.owner.firstName.trim(),
              lastName: data.owner.lastName?.trim() || "",
              email: ownerEmail,
              passwordHash: "INVITED_ACCOUNT",
              status: USER_STATUSES.ACTIVE,
              platformRole: null,
              emailVerified: true,
            },
          ],
          { session }
        );
        ownerUser = createdUsers[0];
      }

      // 4. Create Organization
      const orgType = data.type || ORGANIZATION_TYPES.CORPORATE;
      const orgEmail = data.contact?.email || data.email || "";
      const orgPhone = data.contact?.phone || data.phone || "";
      const orgWebsite = data.contact?.website || data.website || "";

      const organization = await OrganizationRepository.create(
        {
          name: data.name.trim(),
          slug,
          code,
          type: orgType,
          description: data.description || "",
          contact: {
            email: orgEmail,
            phone: orgPhone,
            website: orgWebsite,
          },
          address: data.address || {},
          status: ORGANIZATION_STATUSES.ACTIVE,
          settings: data.settings || {},
          createdBy: creatorId || ownerUser._id,
        },
        { session }
      );

      // 5. Create Organization Owner Membership
      const createdMemberships = await UserMembership.create(
        [
          {
            userId: ownerUser._id,
            organizationId: organization._id,
            roleId: ownerRole._id,
            status: MEMBERSHIP_STATUSES.ACTIVE,
            invitedBy: creatorId,
          },
        ],
        { session }
      );
      const membership = createdMemberships[0];

      // 6. Initialize Subscription in same transaction
      await EntitlementService.getOrganizationSubscription(organization._id);

      // 7. Commit transaction
      await session.commitTransaction();

      AuditLogService.createAuditLog({
        organizationId: organization._id,
        actorId: creatorId,
        action: "CREATE",
        resource: "ORGANIZATION",
        resourceId: organization._id,
        description: `Provisioned organization '${organization.name}' with owner '${ownerEmail}'`,
      }).catch(() => {});

      return OrganizationMapper.toDTO(organization, ownerUser, membership);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Lists organizations according to user scope (Platform vs Tenant)
   */
  static async listOrganizations(user, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { slug: { $regex: query.search, $options: "i" } },
        { code: { $regex: query.search, $options: "i" } },
      ];
    }

    const isPlatformStaff =
      user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      const userMemberships = await UserMembership.find({
        userId: user.id || user._id,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      });

      const allowedOrgIds = userMemberships.map((m) => m.organizationId);
      filter._id = { $in: allowedOrgIds };
    }

    const [items, total] = await Promise.all([
      OrganizationRepository.find(filter, { page, limit }),
      OrganizationRepository.count(filter),
    ]);

    return {
      items: OrganizationMapper.toDTOList(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getOrganizations(user, query = {}) {
    return this.listOrganizations(user, query);
  }

  /**
   * Retrieves an organization by ID with tenant scope verification
   */
  static async getOrganizationById(organizationId, user) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    const isPlatformStaff =
      user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      const membership = await UserMembership.findOne({
        userId: user.id || user._id,
        organizationId,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      });

      if (!membership) {
        throw new ApiError(403, "Forbidden. You do not have access to this organization.");
      }
    }

    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    // Resolve owner information
    const ownerRole = await Role.findOne({
      name: ORGANIZATION_ROLES.ORGANIZATION_OWNER,
      scope: ROLE_SCOPES.ORGANIZATION,
    });

    let ownerUser = null;
    let ownerMembership = null;
    if (ownerRole) {
      ownerMembership = await UserMembership.findOne({
        organizationId: organization._id,
        roleId: ownerRole._id,
      }).populate("userId");

      if (ownerMembership?.userId) {
        ownerUser = ownerMembership.userId;
      }
    }

    return OrganizationMapper.toDTO(organization, ownerUser, ownerMembership);
  }

  static async getOrganization(organizationId, user) {
    return this.getOrganizationById(organizationId, user);
  }

  /**
   * Updates organization details (name, contact, address, logo, settings, branding)
   */
  static async updateOrganization(organizationId, updateData, user) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    const isPlatformStaff =
      user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      const membership = await UserMembership.findOne({
        userId: user.id || user._id,
        organizationId,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      }).populate({
        path: "roleId",
        populate: { path: "permissions" },
      });

      if (!membership) {
        throw new ApiError(403, "Forbidden. You do not have access to this organization.");
      }

      const rolePerms = (membership.roleId?.permissions || []).map((p) => p.key);
      if (!rolePerms.includes("organizations.profile.update") && !rolePerms.includes("organizations.update")) {
        throw new ApiError(403, "Forbidden. Missing organization update permission.");
      }
    }

    // Prepare safe update object - Protect server-controlled fields
    const safeUpdate = {};
    if (updateData.name) safeUpdate.name = updateData.name.trim();
    if (updateData.type) safeUpdate.type = updateData.type;
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.address) safeUpdate.address = updateData.address;
    if (updateData.logo) safeUpdate.logo = updateData.logo;
    if (updateData.settings) safeUpdate.settings = updateData.settings;
    if (updateData.contact) safeUpdate.contact = updateData.contact;

    const updatedOrg = await OrganizationRepository.update(organizationId, safeUpdate);
    if (!updatedOrg) {
      throw new ApiError(404, "Organization not found");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: user.id || user._id,
      action: "UPDATE",
      resource: "ORGANIZATION",
      resourceId: organizationId,
      description: `Updated profile & settings for organization '${updatedOrg.name}'`,
    }).catch(() => {});

    return OrganizationMapper.toDTO(updatedOrg);
  }

  /**
   * Updates organization status (Platform Owner/Admin only)
   */
  static async updateOrganizationStatus(organizationId, status, user) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    const isPlatformStaff =
      user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      throw new ApiError(403, "Forbidden. Only platform administrators can change organization status.");
    }

    if (!Object.values(ORGANIZATION_STATUSES).includes(status)) {
      throw new ApiError(
        400,
        `Invalid status. Must be one of: ${Object.values(ORGANIZATION_STATUSES).join(", ")}`
      );
    }

    const updatedOrg = await OrganizationRepository.updateStatus(organizationId, status);
    if (!updatedOrg) {
      throw new ApiError(404, "Organization not found");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: user.id || user._id,
      action: "UPDATE_STATUS",
      resource: "ORGANIZATION",
      resourceId: organizationId,
      description: `Updated organization status to '${status}'`,
    }).catch(() => {});

    return OrganizationMapper.toDTO(updatedOrg);
  }

  /**
   * Soft deletes / deactivates organization (Platform Owner only)
   */
  static async deleteOrganization(organizationId, user) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    const isPlatformOwner = user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER;
    if (!isPlatformOwner) {
      throw new ApiError(403, "Forbidden. Only platform owner can delete an organization.");
    }

    const updatedOrg = await OrganizationRepository.updateStatus(
      organizationId,
      ORGANIZATION_STATUSES.DEACTIVATED
    );

    if (!updatedOrg) {
      throw new ApiError(404, "Organization not found");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: user.id || user._id,
      action: "DEACTIVATE",
      resource: "ORGANIZATION",
      resourceId: organizationId,
      description: `Deactivated organization '${updatedOrg.name}'`,
    }).catch(() => {});

    return { success: true, message: "Organization deactivated successfully" };
  }

  /**
   * Invites a new staff member to the organization
   */
  static async inviteStaffMember(organizationId, { email, firstName, lastName, roleName }, inviterUserId) {
    if (!email || !firstName) {
      throw new ApiError(400, "Email and firstName are required for staff invitation");
    }

    const targetEmail = email.toLowerCase().trim();

    // Verify role exists
    const role = await Role.findOne({
      name: roleName || ORGANIZATION_ROLES.EXAMINER,
      scope: ROLE_SCOPES.ORGANIZATION,
    });
    if (!role) {
      throw new ApiError(400, `Invalid organization role: '${roleName}'`);
    }

    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      user = await User.create({
        email: targetEmail,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || "",
        passwordHash: "INVITED_ACCOUNT",
        status: USER_STATUSES.INVITED,
        emailVerified: false,
      });
    }

    // Verify no existing active membership in this org
    const existingMembership = await UserMembership.findOne({
      userId: user._id,
      organizationId,
    });

    if (existingMembership) {
      if (existingMembership.status === MEMBERSHIP_STATUSES.ACTIVE) {
        throw new ApiError(400, "User is already an active member of this organization");
      }
      existingMembership.status = MEMBERSHIP_STATUSES.INVITED;
      existingMembership.roleId = role._id;
      existingMembership.invitedBy = inviterUserId;
      existingMembership.invitedAt = new Date();
      await existingMembership.save();
    } else {
      await UserMembership.create({
        userId: user._id,
        organizationId,
        roleId: role._id,
        status: MEMBERSHIP_STATUSES.INVITED,
        invitedBy: inviterUserId,
        invitedAt: new Date(),
      });
    }

    NotificationService.createNotification({
      organizationId,
      recipientId: user._id,
      type: NOTIFICATION_TYPES.ORGANIZATION_INVITATION,
      title: "Organization Staff Invitation",
      message: `You have been invited to join as '${role.name}'.`,
    }).catch(() => {});

    AuditLogService.createAuditLog({
      organizationId,
      actorId: inviterUserId,
      action: "INVITE",
      resource: "STAFF_MEMBERSHIP",
      resourceId: user._id,
      description: `Invited '${targetEmail}' with role '${role.name}'`,
    }).catch(() => {});

    return { success: true, email: targetEmail, role: role.name, status: "INVITED" };
  }

  /**
   * Lists staff memberships in an organization
   */
  static async listMembers(organizationId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { organizationId };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      UserMembership.find(filter)
        .populate("userId", "firstName lastName email status")
        .populate("roleId", "name scope description")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserMembership.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Updates staff membership role or status
   */
  static async updateMember(organizationId, membershipId, { roleName, status }, actorUserId) {
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new ApiError(400, "Invalid membership ID format");
    }

    const membership = await UserMembership.findOne({
      _id: membershipId,
      organizationId,
    });

    if (!membership) {
      throw new ApiError(404, "Membership not found in this organization");
    }

    if (roleName) {
      const role = await Role.findOne({ name: roleName, scope: ROLE_SCOPES.ORGANIZATION });
      if (!role) throw new ApiError(400, `Invalid organization role: '${roleName}'`);
      membership.roleId = role._id;
    }

    if (status) {
      membership.status = status;
    }

    await membership.save();

    AuditLogService.createAuditLog({
      organizationId,
      actorId: actorUserId,
      action: "UPDATE",
      resource: "STAFF_MEMBERSHIP",
      resourceId: membership._id,
      description: `Updated member role/status to '${roleName || "unchanged"}' / '${status || "unchanged"}'`,
    }).catch(() => {});

    return membership;
  }

  /**
   * Removes staff membership from an organization
   */
  static async removeMember(organizationId, membershipId, actorUserId) {
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new ApiError(400, "Invalid membership ID format");
    }

    const membership = await UserMembership.findOneAndDelete({
      _id: membershipId,
      organizationId,
    });

    if (!membership) {
      throw new ApiError(404, "Membership not found in this organization");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: actorUserId,
      action: "REMOVE",
      resource: "STAFF_MEMBERSHIP",
      resourceId: membership._id,
      description: `Removed staff membership`,
    }).catch(() => {});

    return { success: true, message: "Member removed successfully" };
  }

  /**
   * Organization Context Switcher
   */
  static async switchOrganization(organizationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    const organization = await Organization.findById(organizationId);
    if (!organization || organization.status !== ORGANIZATION_STATUSES.ACTIVE) {
      throw new ApiError(400, "Target organization is not active or does not exist");
    }

    const membership = await UserMembership.findOne({
      userId,
      organizationId,
      status: MEMBERSHIP_STATUSES.ACTIVE,
    }).populate("roleId");

    if (!membership) {
      throw new ApiError(403, "Forbidden. You do not hold an active membership in this organization.");
    }

    const scopedToken = generateAccessToken({
      sub: userId.toString(),
      orgId: organizationId.toString(),
      role: membership.roleId?.name,
    });

    return {
      organizationId: organization._id,
      organizationName: organization.name,
      role: membership.roleId?.name,
      accessToken: scopedToken,
    };
  }
}
