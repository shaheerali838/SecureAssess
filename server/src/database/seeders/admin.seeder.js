import User from "../../modules/users/user.model.js";
import { PLATFORM_ROLES } from "../../constants/roles.js";
import { hashPassword } from "../../utils/password.js";
import { ENV } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export const seedPlatformOwner = async () => {
  const ownerEmail = ENV.ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email: ownerEmail });

  const passwordHash = await hashPassword(ENV.ADMIN_PASSWORD);

  if (!existing) {
    await User.create({
      firstName: ENV.ADMIN_FIRST_NAME,
      lastName: ENV.ADMIN_LAST_NAME,
      email: ownerEmail,
      passwordHash,
      platformRole: PLATFORM_ROLES.PLATFORM_OWNER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        phone: ENV.ADMIN_PHONE,
      },
    });
    logger.info(`[Seeder] Platform Owner user seeded: ${ownerEmail} (${ENV.ADMIN_FIRST_NAME} ${ENV.ADMIN_LAST_NAME})`);
  } else {
    // Update existing root admin to guarantee platformRole, names, and password match latest .env
    existing.firstName = ENV.ADMIN_FIRST_NAME;
    existing.lastName = ENV.ADMIN_LAST_NAME;
    existing.platformRole = PLATFORM_ROLES.PLATFORM_OWNER;
    existing.passwordHash = passwordHash;
    existing.emailVerified = true;
    if (ENV.ADMIN_PHONE) {
      existing.profile = existing.profile || {};
      existing.profile.phone = ENV.ADMIN_PHONE;
    }
    await existing.save();
    logger.info(`[Seeder] Platform Owner user updated & verified: ${ownerEmail}`);
  }
};
