export class AuthMapper {
  /**
   * Transforms raw user doc + tokens into a secure, sanitized authentication response DTO
   */
  static toAuthDTO(user, token, refreshToken = null) {
    if (!user) return null;
    const userObj = typeof user.toObject === "function" ? user.toObject() : user;

    return {
      user: {
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        organizationId: userObj.organizationId || null,
        permissions: userObj.permissions || [],
      },
      token,
      ...(refreshToken ? { refreshToken } : {}),
    };
  }

  static toUserDTO(user) {
    if (!user) return null;
    const userObj = typeof user.toObject === "function" ? user.toObject() : user;

    return {
      _id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      organizationId: userObj.organizationId || null,
      permissions: userObj.permissions || [],
      createdAt: userObj.createdAt,
    };
  }
}
