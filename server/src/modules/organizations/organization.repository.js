import Organization from "./organization.model.js";

export class OrganizationRepository {
  static async findById(id) {
    return Organization.findById(id);
  }

  static async findBySlug(slug) {
    return Organization.findOne({ slug: slug.toLowerCase() });
  }

  static async findByCode(code) {
    return Organization.findOne({ code: code.toUpperCase() });
  }

  static async create(data) {
    return Organization.create(data);
  }
}
