import Organization from "./organization.model.js";

/**
 * Organization Repository:
 * Handles direct MongoDB database operations for the Organization model.
 */
export class OrganizationRepository {
  /**
   * Finds an organization by its unique lowercase slug.
   */
  static async findBySlug(slug, options = {}) {
    if (!slug) return null;
    return Organization.findOne({ slug: slug.toLowerCase().trim() }, null, options);
  }

  /**
   * Finds an organization by its unique uppercase code.
   */
  static async findByCode(code, options = {}) {
    if (!code) return null;
    return Organization.findOne({ code: code.toUpperCase().trim() }, null, options);
  }

  /**
   * Finds an organization by its primary key ObjectId.
   */
  static async findById(id, options = {}) {
    if (!id) return null;
    return Organization.findById(id, null, options);
  }

  /**
   * Finds organizations matching a query filter with pagination and sorting.
   */
  static async find(filter = {}, { page = 1, limit = 20, sort = { createdAt: -1 } } = {}) {
    const skip = (Math.max(1, page) - 1) * limit;
    return Organization.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  /**
   * Counts total documents matching filter.
   */
  static async count(filter = {}) {
    return Organization.countDocuments(filter);
  }

  /**
   * Creates a new organization document in the database.
   */
  static async create(data, options = {}) {
    if (options.session) {
      const docs = await Organization.create([data], options);
      return docs[0];
    }
    return Organization.create(data);
  }

  /**
   * Updates an existing organization document by ID.
   */
  static async update(id, updateData, options = {}) {
    return Organization.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true, ...options }
    );
  }

  /**
   * Updates organization status by ID.
   */
  static async updateStatus(id, status, options = {}) {
    return Organization.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: "after", runValidators: true, ...options }
    );
  }
}
