import User from "../users/user.model.js";

export class AuthRepository {
  static async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  static async findById(id) {
    return User.findById(id);
  }

  static async createUser(userData) {
    return User.create(userData);
  }

  static async updateLastLogin(id) {
    return User.findByIdAndUpdate(id, { $set: { updatedAt: new Date() } });
  }
}
