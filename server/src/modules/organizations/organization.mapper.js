export class OrganizationMapper {
  /**
   * Transforms Organization database document to full admin/tenant DTO
   */
  static toDTO(org) {
    if (!org) return null;
    const doc = typeof org.toObject === "function" ? org.toObject() : org;

    return {
      id: doc._id,
      name: doc.name,
      slug: doc.slug,
      type: doc.type,
      domain: doc.domain,
      logoUrl: doc.logoUrl,
      contactEmail: doc.contactEmail,
      subscription: doc.subscription,
      settings: doc.settings,
      status: doc.status,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDTOList(orgs) {
    if (!Array.isArray(orgs)) return [];
    return orgs.map((o) => this.toDTO(o));
  }

  /**
   * Transforms Organization document to safe public-facing profile (e.g. for candidate login branding)
   */
  static toPublicProfileDTO(org) {
    if (!org) return null;
    const doc = typeof org.toObject === "function" ? org.toObject() : org;

    return {
      id: doc._id,
      name: doc.name,
      slug: doc.slug,
      type: doc.type,
      logoUrl: doc.logoUrl,
      settings: {
        enforceProctoring: doc.settings?.enforceProctoring,
        enableWebcamSnapshot: doc.settings?.enableWebcamSnapshot,
      },
    };
  }
}
