import mongoose from "mongoose";
import UserMembership from "./userMembership.model.js";
import User from "./user.model.js";
import Role from "../roles/role.model.js";
import Organization from "../organizations/organization.model.js";
import { UserMapper } from "./user.mapper.js";
import { PLATFORM_ROLES, ROLE_SCOPES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";

export class UserMembershipService {
  /**
   * Helper: Checks if caller is Platform Staff (Owner or Admin)
   */
  static isPlatformStaff(user) {
    return (
      user?.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      user?.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN
    );
  }

  /**
   * Helper: Asserts caller has tenant permission in the given organization
   */
  static async assertTenantPermission(organizationId, callerUser, requiredPermission) {
    if (this.isPlatformStaff(callerUser)) {
      return true;
    }

    const callerMembership = await UserMembership.findOne({
      userId: callerUser.id || callerUser._id,
      organizationId,
      status: "ACTIVE",
    }).populate({
      path: "roleId",
      populate: { path: "permissions" },
    });

    if (!callerMembership) {
      throw new ApiError(
        403,
        "Forbidden. You do not hold an active membership in this organization."
      );
    }

    const permissions = (callerMembership.roleId?.permissions || []).map((p) => p.key);
    if (requiredPermission && !permissions.includes(requiredPermission)) {
      throw new ApiError(
        403,
        `Forbidden. Missing required organization permission: '${requiredPermission}'`
      );
    }

    return callerMembership;
  }

  /**
   * Creates a new organization membership
   */
  static async createMembership({ userId, organizationId, roleId, invitedBy = null, status = "ACTIVE" }, callerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new ApiError(400, "Invalid role ID format");
    }

    // 1. Verify User exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 2. Verify Organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    // 3. Verify Role exists and belongs strictly to ORGANIZATION scope
    const role = await Role.findById(roleId);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }
    if (role.scope !== ROLE_SCOPES.ORGANIZATION) {
      throw new ApiError(
        400,
        "Only organization-scoped roles can be assigned to memberships. Platform roles cannot be assigned."
      );
    }

    // 4. Verify Caller Permission (if provided)
    if (callerUser) {
      await this.assertTenantPermission(organizationId, callerUser, "organization_users.create");
    }

    // 5. Prevent duplicate membership
    const existing = await UserMembership.findOne({ userId, organizationId });
    if (existing) {
      throw new ApiError(
        409,
        "User is already a member of this organization. Update existing membership instead."
      );
    }

    // 6. Create membership
    const membership = await UserMembership.create({
      userId,
      organizationId,
      roleId,
      status: status || "ACTIVE",
      joinedAt: status === "ACTIVE" ? new Date() : undefined,
      invitedAt: status === "INVITED" ? new Date() : undefined,
      invitedBy: invitedBy || callerUser?.id || callerUser?._id || null,
    });

    const populated = await UserMembership.findById(membership._id)
      .populate("userId", "firstName lastName email status")
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions");

    return UserMapper.toMembershipDTO(populated);
  }

  /**
   * Retrieves all active memberships of the authenticated user across all organizations
   */
  static async getMyMemberships(userId) {
    const memberships = await UserMembership.find({
      userId,
      status: { $in: ["ACTIVE", "INVITED"] },
    })
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions")
      .sort({ createdAt: -1 });

    return UserMapper.toMembershipDTOList(memberships);
  }

  /**
   * Retrieves all members belonging to an organization with tenant isolation
   */
  static async getOrganizationMembers(organizationId, callerUser, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    // Enforce Tenant Isolation & Permission
    await this.assertTenantPermission(organizationId, callerUser, "organization_users.view");

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = { organizationId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.roleId && mongoose.Types.ObjectId.isValid(query.roleId)) {
      filter.roleId = query.roleId;
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [members, total] = await Promise.all([
      UserMembership.find(filter)
        .populate("userId", "firstName lastName email status profile lastLoginAt")
        .populate("organizationId", "name slug code type status")
        .populate("roleId", "name scope isSystemRole permissions")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserMembership.countDocuments(filter),
    ]);

    return {
      items: UserMapper.toMembershipDTOList(members),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single membership by ID with tenant isolation
   */
  static async getMembership(organizationId, membershipId, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new ApiError(400, "Invalid membership ID format");
    }

    await this.assertTenantPermission(organizationId, callerUser, "organization_users.view");

    const membership = await UserMembership.findOne({
      _id: membershipId,
      organizationId,
    })
      .populate("userId", "firstName lastName email status profile")
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions");

    if (!membership) {
      throw new ApiError(404, "Membership not found in this organization");
    }

    return UserMapper.toMembershipDTO(membership);
  }

  /**
   * Updates a member's role within an organization
   */
  static async updateMembershipRole(organizationId, membershipId, roleId, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new ApiError(400, "Invalid membership ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new ApiError(400, "Invalid role ID format");
    }

    await this.assertTenantPermission(organizationId, callerUser, "organization_users.update");

    // Verify role belongs to ORGANIZATION scope
    const role = await Role.findById(roleId);
    if (!role) {
      throw new ApiError(404, "Role not found");
    }
    if (role.scope !== ROLE_SCOPES.ORGANIZATION) {
      throw new ApiError(
        400,
        "Only organization-scoped roles can be assigned to memberships. Platform roles cannot be assigned."
      );
    }

    const membership = await UserMembership.findOneAndUpdate(
      { _id: membershipId, organizationId },
      { $set: { roleId } },
      { returnDocument: "after", runValidators: true }
    )
      .populate("userId", "firstName lastName email status")
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions");

    if (!membership) {
      throw new ApiError(404, "Membership not found in this organization");
    }

    return UserMapper.toMembershipDTO(membership);
  }

  /**
   * Updates a member's status (ACTIVE, INVITED, SUSPENDED, DEACTIVATED)
   */
  static async updateMembershipStatus(organizationId, membershipId, status, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new ApiError(400, "Invalid membership ID format");
    }

    await this.assertTenantPermission(organizationId, callerUser, "organization_users.suspend");

    const validStatuses = ["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const updateFields = { status };
    if (status === "DEACTIVATED") {
      updateFields.deactivatedAt = new Date();
    } else if (status === "ACTIVE") {
      updateFields.deactivatedAt = null;
    }

    const membership = await UserMembership.findOneAndUpdate(
      { _id: membershipId, organizationId },
      { $set: updateFields },
      { returnDocument: "after", runValidators: true }
    )
      .populate("userId", "firstName lastName email status")
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions");

    if (!membership) {
      throw new ApiError(404, "Membership not found in this organization");
    }

    return UserMapper.toMembershipDTO(membership);
  }

  /**
   * Removes / deletes a membership from an organization
   */
  static async removeMembership(organizationId, membershipId, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new ApiError(400, "Invalid membership ID format");
    }

    await this.assertTenantPermission(organizationId, callerUser, "organization_users.remove");

    const deleted = await UserMembership.findOneAndDelete({
      _id: membershipId,
      organizationId,
    });

    if (!deleted) {
      throw new ApiError(404, "Membership not found in this organization");
    }

    return { success: true, message: "Membership removed successfully" };
  }
}
