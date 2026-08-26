import User from "../../modules/users/user.model.js";
import { ROLES } from "../../constants/roles.js";
import { hashPassword } from "../../utils/password.js";
import { logger } from "../../config/logger.js";

export const seedSuperAdmin = async () => {
  const adminEmail = "admin@secureassess.com";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const hashedPassword = await hashPassword("AdminSecure#2026");
    await User.create({
      name: "System Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
    });
    logger.info(`[Seeder] SuperAdmin user seeded: ${adminEmail}`);
  } else {
    logger.info("[Seeder] SuperAdmin user already exists.");
  }
};
