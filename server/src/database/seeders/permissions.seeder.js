import { PERMISSIONS } from "../../constants/permissions.js";
import { logger } from "../../config/logger.js";

export const seedPermissions = async () => {
  const permList = Object.values(PERMISSIONS);
  logger.info(`[Seeder] Seeding ${permList.length} permissions`);
  return permList;
};
