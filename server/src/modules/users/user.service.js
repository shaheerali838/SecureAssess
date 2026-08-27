import mongoose from "mongoose";
import { UserRepository } from "./user.repository.js";
import { UserMapper } from "./user.mapper.js";
import { PLATFORM_ROLES, ROLE_SCOPES } from "../../constants/roles.js";
import { USER_STATUS_LIST } from "../../constants/userStatuses.js";
import { MEMBERSHIP_STATUSES, MEMBERSHIP_STATUS_LIST } from "../../constants/membershipStatuses.js";
import { ApiError } from "../../utils/ApiError.js";
import Role from "../roles/role.model.js";
import Organization from "../organizations/organization.model.js";
import UserMembership from "./userMembership.model.js";

export class UserService {
  /**
   * Lists universal users with platform/tenant scoping
   */
  static async listUsers(callerUser, query = {}) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "20", 10);
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: "i" } },
        { lastName: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }

    const isPlatformStaff =
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      // Tenant Admin: Only view users belonging to caller's active organizations
      const callerMemberships = await UserMembership.find({
        userId: callerUser.id || callerUser._id,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      });

      const allowedOrgIds = callerMemberships.map((m) => m.organizationId);
      const orgMemberships = await UserMembership.find({
        organizationId: { $in: allowedOrgIds },
      });

      const allowedUserIds = orgMemberships.map((m) => m.userId);
      filter._id = { $in: allowedUserIds };
    }

    const [items, total] = await Promise.all([
      UserRepository.find(filter, { page, limit }),
      UserRepository.count(filter),
    ]);

    return {
      items: UserMapper.toDTOList(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single user with their accessible memberships
   */
  static async getUserById(userId, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID format");
    }

    const isPlatformStaff =
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    const isSelf = (callerUser.id || callerUser._id).toString() === userId.toString();

    let membershipFilter = {};

    if (!isPlatformStaff && !isSelf) {
      // Check shared organization membership
      const callerMemberships = await UserMembership.find({
        userId: callerUser.id || callerUser._id,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      });
      const callerOrgIds = callerMemberships.map((m) => m.organizationId.toString());

      const targetMemberships = await UserMembership.find({ userId });
      const targetOrgIds = targetMemberships.map((m) => m.organizationId.toString());

      const hasSharedOrg = callerOrgIds.some((id) => targetOrgIds.includes(id));
      if (!hasSharedOrg) {
        throw new ApiError(403, "Forbidden. You do not have access to this user profile.");
      }

      membershipFilter = { organizationId: { $in: callerOrgIds } };
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const memberships = await UserRepository.findMembershipsByUserId(userId, membershipFilter);
    return UserMapper.toDTO(user, memberships);
  }

  /**
   * Updates user profile (Self or Platform Owner)
   */
  static async updateUser(userId, updateData, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID format");
    }

    const isPlatformOwner = callerUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER;
    const isSelf = (callerUser.id || callerUser._id).toString() === userId.toString();

    if (!isPlatformOwner && !isSelf) {
      throw new ApiError(403, "Forbidden. You can only update your own user profile.");
    }

    const safeUpdate = {};
    if (updateData.firstName) safeUpdate.firstName = updateData.firstName.trim();
    if (updateData.lastName !== undefined) safeUpdate.lastName = updateData.lastName.trim();
    if (updateData.profile) safeUpdate.profile = updateData.profile;

    const updatedUser = await UserRepository.updateById(userId, safeUpdate);
    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return UserMapper.toDTO(updatedUser);
  }

  /**
   * Updates universal user status (Platform Staff only)
   */
  static async updateUserStatus(userId, status, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID format");
    }

    const isPlatformStaff =
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      throw new ApiError(403, "Forbidden. Only platform administrators can change user status.");
    }

    if (!USER_STATUS_LIST.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${USER_STATUS_LIST.join(", ")}`);
    }

    const updatedUser = await UserRepository.updateStatus(userId, status);
    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return UserMapper.toDTO(updatedUser);
  }

  /**
   * Assigns user to an organization with a specific role
   */
  static async createMembership(targetUserId, data, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new ApiError(400, "Invalid user ID format");
    }

    const { organizationId, roleId, status } = data;

    // 1. Verify User exists
    const user = await UserRepository.findById(targetUserId);
    if (!user) {
      throw new ApiError(404, "Target user not found");
    }

    // 2. Verify Organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Target organization not found");
    }

    // 3. Verify Role exists and has scope === "ORGANIZATION"
    const role = await Role.findById(roleId);
    if (!role) {
      throw new ApiError(404, "Target role not found");
    }
    if (role.scope !== ROLE_SCOPES.ORGANIZATION) {
      throw new ApiError(
        400,
        `Invalid role assignment: Role must have scope '${ROLE_SCOPES.ORGANIZATION}'. Platform roles cannot be assigned to organization memberships.`
      );
    }

    // 4. Authorization check: Caller must be Platform Staff OR Org Admin/Owner of target organization
    const isPlatformStaff =
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      const callerMembership = await UserMembership.findOne({
        userId: callerUser.id || callerUser._id,
        organizationId,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      }).populate({
        path: "roleId",
        populate: { path: "permissions" },
      });

      if (!callerMembership) {
        throw new ApiError(403, "Forbidden. You do not belong to this organization.");
      }

      const callerPerms = (callerMembership.roleId?.permissions || []).map((p) => p.key);
      if (!callerPerms.includes("organization_users.create")) {
        throw new ApiError(
          403,
          "Forbidden. Missing 'organization_users.create' permission in this organization."
        );
      }
    }

    // 5. Duplicate membership check
    const existingMembership = await UserRepository.findMembershipByUserAndOrg(
      targetUserId,
      organizationId
    );
    if (existingMembership) {
      throw new ApiError(409, "User already holds a membership in this organization.");
    }

    // 6. Create membership
    const membership = await UserRepository.createMembership({
      userId: targetUserId,
      organizationId,
      roleId,
      status: status || MEMBERSHIP_STATUSES.ACTIVE,
      invitedBy: callerUser.id || callerUser._id,
    });

    const populated = await UserRepository.findMembershipById(membership._id);
    return UserMapper.toMembershipDTO(populated);
  }

  /**
   * Lists memberships of a user
   */
  static async listMemberships(targetUserId, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new ApiError(400, "Invalid user ID format");
    }

    const isPlatformStaff =
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    const isSelf = (callerUser.id || callerUser._id).toString() === targetUserId.toString();

    let filter = {};
    if (!isPlatformStaff && !isSelf) {
      const callerMemberships = await UserMembership.find({
        userId: callerUser.id || callerUser._id,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      });
      const allowedOrgIds = callerMemberships.map((m) => m.organizationId);
      filter.organizationId = { $in: allowedOrgIds };
    }

    const memberships = await UserRepository.findMembershipsByUserId(targetUserId, filter);
    return UserMapper.toMembershipDTOList(memberships);
  }

  /**
   * Updates an organization membership (Role or Status)
   */
  static async updateMembership(targetUserId, membershipId, updateData, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new ApiError(400, "Invalid membership ID format");
    }

    const membership = await UserRepository.findMembershipById(membershipId);
    if (!membership) {
      throw new ApiError(404, "Membership not found");
    }

    if (membership.userId._id.toString() !== targetUserId.toString()) {
      throw new ApiError(400, "Membership does not belong to the specified user");
    }

    const isPlatformStaff =
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      const callerMembership = await UserMembership.findOne({
        userId: callerUser.id || callerUser._id,
        organizationId: membership.organizationId._id,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      }).populate({
        path: "roleId",
        populate: { path: "permissions" },
      });

      if (!callerMembership) {
        throw new ApiError(403, "Forbidden. You do not belong to this organization.");
      }

      const callerPerms = (callerMembership.roleId?.permissions || []).map((p) => p.key);
      if (!callerPerms.includes("organization_users.update")) {
        throw new ApiError(
          403,
          "Forbidden. Missing 'organization_users.update' permission in this organization."
        );
      }
    }

    const safeUpdate = {};
    if (updateData.roleId) {
      const newRole = await Role.findById(updateData.roleId);
      if (!newRole) {
        throw new ApiError(404, "Role not found");
      }
      if (newRole.scope !== ROLE_SCOPES.ORGANIZATION) {
        throw new ApiError(
          400,
          `Invalid role assignment: Role must have scope '${ROLE_SCOPES.ORGANIZATION}'. Platform roles cannot be assigned to organization memberships.`
        );
      }
      safeUpdate.roleId = updateData.roleId;
    }

    if (updateData.status) {
      if (!MEMBERSHIP_STATUS_LIST.includes(updateData.status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${MEMBERSHIP_STATUS_LIST.join(", ")}`);
      }
      safeUpdate.status = updateData.status;
    }

    const updated = await UserRepository.updateMembership(membershipId, safeUpdate);
    return UserMapper.toMembershipDTO(updated);
  }

  /**
   * Deletes / removes a membership
   */
  static async deleteMembership(targetUserId, membershipId, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new ApiError(400, "Invalid membership ID format");
    }

    const membership = await UserRepository.findMembershipById(membershipId);
    if (!membership) {
      throw new ApiError(404, "Membership not found");
    }

    if (membership.userId._id.toString() !== targetUserId.toString()) {
      throw new ApiError(400, "Membership does not belong to the specified user");
    }

    const isPlatformStaff =
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      callerUser.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!isPlatformStaff) {
      const callerMembership = await UserMembership.findOne({
        userId: callerUser.id || callerUser._id,
        organizationId: membership.organizationId._id,
        status: MEMBERSHIP_STATUSES.ACTIVE,
      }).populate({
        path: "roleId",
        populate: { path: "permissions" },
      });

      if (!callerMembership) {
        throw new ApiError(403, "Forbidden. You do not belong to this organization.");
      }

      const callerPerms = (callerMembership.roleId?.permissions || []).map((p) => p.key);
      if (!callerPerms.includes("organization_users.remove")) {
        throw new ApiError(
          403,
          "Forbidden. Missing 'organization_users.remove' permission in this organization."
        );
      }
    }

    await UserRepository.deleteMembership(membershipId);
    return { success: true, message: "Membership removed successfully" };
  }
}
