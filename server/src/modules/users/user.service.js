import { UserRepository } from "./user.repository.js";
import { UserMapper } from "./user.mapper.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword } from "../../utils/password.js";

export class UserService {
  static async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) throw new ApiError(404, "User not found");
    return UserMapper.toDTO(user);
  }

  static async getUsersByOrganization(organizationId, filter, pagination) {
    const { items, total } = await UserRepository.findByOrganization(organizationId, filter, pagination);
    return {
      items: UserMapper.toDTOList(items),
      total,
    };
  }

  static async updateUser(id, updateData) {
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }
    const updated = await UserRepository.updateById(id, updateData);
    if (!updated) throw new ApiError(404, "User not found");
    return UserMapper.toDTO(updated);
  }

  static async deleteUser(id) {
    const deleted = await UserRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, "User not found");
    return { success: true, message: "User deleted successfully" };
  }
}
