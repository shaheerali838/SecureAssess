import Organization from "./organization.model.js";

export class OrganizationRepository {
  static async findById(id) {
    return Organization.findById(id);
  }

  static async findBySlug(slug) {
    return Organization.findOne({ slug: slug.toLowerCase() });
  }

  static async findByDomain(domain) {
    return Organization.findOne({ domain: domain.toLowerCase() });
  }

  static async create(orgData) {
    return Organization.create(orgData);
  }

  static async update(id, updateData) {
    return Organization.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  static async findAll(filter = {}, pagination = { skip: 0, limit: 10 }) {
    const [items, total] = await Promise.all([
      Organization.find(filter)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Organization.countDocuments(filter),
    ]);
    return { items, total };
  }

  static async delete(id) {
    return Organization.findByIdAndDelete(id);
  }
}
