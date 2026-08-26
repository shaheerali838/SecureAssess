import { ROLE_LIST } from "../../constants/roles.js";
import { logger } from "../../config/logger.js";

export const seedRoles = async () => {
  logger.info(`[Seeder] Seeding default roles: ${ROLE_LIST.join(", ")}`);
  return ROLE_LIST;
};
