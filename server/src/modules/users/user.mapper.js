export class UserMapper {
  /**
   * Transforms raw user DB document to safe response DTO
   */
  static toDTO(user) {
    if (!user) return null;
    const userObj = typeof user.toObject === "function" ? user.toObject() : user;

    return {
      id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      status: userObj.status,
      organizationId: userObj.organizationId,
      permissions: userObj.permissions || [],
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt,
    };
  }

  static toDTOList(users) {
    if (!Array.isArray(users)) return [];
    return users.map((u) => this.toDTO(u));
  }
}
