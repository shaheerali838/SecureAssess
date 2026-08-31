export class OrganizationMapper {
  /**
   * Transforms raw organization and owner documents into a safe API response DTO
   */
  static toDTO(org, ownerUser = null, membership = null) {
    if (!org) return null;
    const doc = typeof org.toObject === "function" ? org.toObject() : org;

    return {
      id: doc._id,
      name: doc.name,
      slug: doc.slug,
      code: doc.code,
      type: doc.type,
      tenantIndustry: doc.tenantIndustry || "academic",
      status: doc.status,
      contact: {
        email: doc.email || "",
        phone: doc.phone || "",
        website: doc.website || "",
      },
      address: doc.address || {},
      logo: doc.logo || { url: "", publicId: "" },
      settings: doc.settings || {},
      owner: ownerUser
        ? {
            id: ownerUser._id || ownerUser.id,
            firstName: ownerUser.firstName,
            lastName: ownerUser.lastName || "",
            email: ownerUser.email,
            status: ownerUser.status,
            membershipStatus: membership?.status || "ACTIVE",
          }
        : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDTOList(orgs) {
    if (!Array.isArray(orgs)) return [];
    return orgs.map((o) => this.toDTO(o));
  }
}
