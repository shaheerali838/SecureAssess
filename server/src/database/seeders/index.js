import connectDB from "../../config/db.js";
import { seedRoles } from "./roles.seeder.js";
import { seedPermissions } from "./permissions.seeder.js";
import { seedSuperAdmin } from "./admin.seeder.js";
import { logger } from "../../config/logger.js";

export const runAllSeeders = async () => {
  try {
    logger.info("[SeederRunner] Starting database seeding process...");
    await connectDB();
    await seedRoles();
    await seedPermissions();
    await seedSuperAdmin();
    logger.info("[SeederRunner] All seeders completed successfully.");
  } catch (error) {
    logger.error("[SeederRunner] Error executing seeders:", error);
    process.exit(1);
  }
};

// Allow executing directly via: node src/database/seeders/index.js
if (process.argv[1]?.endsWith("index.js") || process.argv[1]?.includes("seeders")) {
  runAllSeeders().then(() => process.exit(0));
}
