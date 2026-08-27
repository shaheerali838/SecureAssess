export class UserMapper {
  /**
   * Transforms raw user DB document to safe response DTO (strips passwordHash)
   */
  static toDTO(user, memberships = []) {
    if (!user) return null;
    const doc = typeof user.toObject === "function" ? user.toObject() : user;

    return {
      id: doc._id,
      firstName: doc.firstName,
      lastName: doc.lastName || "",
      fullName: `${doc.firstName} ${doc.lastName || ""}`.trim(),
      email: doc.email,
      platformRole: doc.platformRole || null,
      status: doc.status,
      emailVerified: doc.emailVerified,
      emailVerifiedAt: doc.emailVerifiedAt || null,
      profile: doc.profile || {},
      memberships: this.toMembershipDTOList(memberships),
      lastLoginAt: doc.lastLoginAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDTOList(users) {
    if (!Array.isArray(users)) return [];
    return users.map((u) => this.toDTO(u));
  }

  /**
   * Transforms raw UserMembership DB document to safe DTO
   */
  static toMembershipDTO(membership) {
    if (!membership) return null;
    const doc = typeof membership.toObject === "function" ? membership.toObject() : membership;

    return {
      id: doc._id,
      userId: doc.userId?._id || doc.userId,
      user: doc.userId && typeof doc.userId === "object"
        ? {
            id: doc.userId._id,
            firstName: doc.userId.firstName,
            lastName: doc.userId.lastName || "",
            email: doc.userId.email,
            status: doc.userId.status,
          }
        : undefined,
      organizationId: doc.organizationId?._id || doc.organizationId,
      organization: doc.organizationId && typeof doc.organizationId === "object"
        ? {
            id: doc.organizationId._id,
            name: doc.organizationId.name,
            slug: doc.organizationId.slug,
            code: doc.organizationId.code,
            type: doc.organizationId.type,
            status: doc.organizationId.status,
          }
        : undefined,
      roleId: doc.roleId?._id || doc.roleId,
      role: doc.roleId && typeof doc.roleId === "object"
        ? {
            id: doc.roleId._id,
            name: doc.roleId.name,
            scope: doc.roleId.scope,
            isSystemRole: doc.roleId.isSystemRole,
          }
        : undefined,
      status: doc.status,
      joinedAt: doc.joinedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toMembershipDTOList(memberships) {
    if (!Array.isArray(memberships)) return [];
    return memberships.map((m) => this.toMembershipDTO(m));
  }
}
