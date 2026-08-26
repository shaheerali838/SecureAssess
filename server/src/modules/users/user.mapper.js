export class UserMapper {
  /**
   * Transforms raw user DB document to safe response DTO (strips passwordHash)
   */
  static toDTO(user) {
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
      lastLoginAt: doc.lastLoginAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDTOList(users) {
    if (!Array.isArray(users)) return [];
    return users.map((u) => this.toDTO(u));
  }
}
