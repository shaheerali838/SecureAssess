import User from "./user.model.js";
import UserMembership from "./userMembership.model.js";

export class UserRepository {
  /**
   * User Identity Lookups & Queries
   */
  static async findById(id, projection = {}) {
    return User.findById(id, projection);
  }

  static async findByEmail(email, projection = {}) {
    return User.findOne({ email: email.toLowerCase().trim() }, projection);
  }

  static async find(filter = {}, { page = 1, limit = 20, sort = { createdAt: -1 } } = {}) {
    const skip = (Math.max(1, page) - 1) * limit;
    return User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  static async count(filter = {}) {
    return User.countDocuments(filter);
  }

  static async create(userData, options = {}) {
    if (options.session) {
      const docs = await User.create([userData], options);
      return docs[0];
    }
    return User.create(userData);
  }

  static async updateById(id, updateData, options = {}) {
    return User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true, ...options }
    );
  }

  static async updateStatus(id, status, options = {}) {
    return User.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: "after", runValidators: true, ...options }
    );
  }

  /**
   * User Membership Operations
   */
  static async findMembershipsByUserId(userId, filter = {}) {
    return UserMembership.find({ userId, ...filter })
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions")
      .sort({ createdAt: -1 });
  }

  static async findMembershipById(membershipId) {
    return UserMembership.findById(membershipId)
      .populate("userId", "firstName lastName email status")
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions");
  }

  static async findMembershipByUserAndOrg(userId, organizationId) {
    return UserMembership.findOne({ userId, organizationId })
      .populate("roleId", "name scope isSystemRole permissions");
  }

  static async createMembership(membershipData, options = {}) {
    if (options.session) {
      const docs = await UserMembership.create([membershipData], options);
      return docs[0];
    }
    return UserMembership.create(membershipData);
  }

  static async updateMembership(membershipId, updateData, options = {}) {
    return UserMembership.findByIdAndUpdate(
      membershipId,
      { $set: updateData },
      { returnDocument: "after", runValidators: true, ...options }
    )
      .populate("userId", "firstName lastName email status")
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions");
  }

  static async deleteMembership(membershipId) {
    return UserMembership.findByIdAndDelete(membershipId);
  }
}
