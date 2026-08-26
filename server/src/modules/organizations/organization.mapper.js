export class OrganizationMapper {
  static toDTO(org) {
    if (!org) return null;
    const doc = typeof org.toObject === "function" ? org.toObject() : org;
    return {
      id: doc._id,
      name: doc.name,
      slug: doc.slug,
      code: doc.code,
      type: doc.type,
      email: doc.email,
      phone: doc.phone,
      website: doc.website,
      logo: doc.logo,
      description: doc.description,
      address: doc.address,
      status: doc.status,
      settings: doc.settings,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
