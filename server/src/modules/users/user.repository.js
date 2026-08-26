import User from "./user.model.js";

export class UserRepository {
  static async findById(id, projection = {}) {
    return User.findById(id, projection);
  }

  static async findByEmail(email, projection = {}) {
    return User.findOne({ email: email.toLowerCase() }, projection);
  }

  static async create(userData) {
    return User.create(userData);
  }

  static async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  static async findByOrganization(organizationId, filter = {}, pagination = { skip: 0, limit: 10 }) {
    const query = { ...filter, organizationId };
    const [items, total] = await Promise.all([
      User.find(query).skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);
    return { items, total };
  }

  static async deleteById(id) {
    return User.findByIdAndDelete(id);
  }
}
