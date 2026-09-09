import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../config/db.js";
import { seedRBAC } from "./rbac.seeder.js";
import { seedPlatformOwner } from "./admin.seeder.js";
import { logger } from "../../config/logger.js";

/**
 * Wipes all application collections in the MongoDB database for a completely clean state
 */
export const clearDatabase = async () => {
  logger.info("[Database] Purging all collections for a clean reset...");
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    try {
      await mongoose.connection.db.collection(col.name).deleteMany({});
      logger.info(`   -> Cleared collection: ${col.name}`);
    } catch (err) {
      logger.warn(`   -> Could not clear collection ${col.name}: ${err.message}`);
    }
  }
  logger.info("[Database] All collections successfully wiped clean.");
};

/**
 * Initializes the baseline system requirements:
 * 1. System RBAC roles and permissions
 * 2. Root Platform Super Admin user account
 */
export const initializeDatabase = async (options = {}) => {
  const isCleanRun =
    options.clean ||
    process.argv.includes("--clean") ||
    process.argv.includes("--fresh") ||
    process.argv.includes("-f");

  try {
    logger.info("[Database] Starting system initialization pipeline...");
    await connectDatabase();

    if (isCleanRun) {
      await clearDatabase();
    }

    // 1. Seed System RBAC (Permissions & System Roles)
    await seedRBAC();

    // 2. Seed Initial Platform Super Admin
    await seedPlatformOwner();

    logger.info("[Database] System initialization completed successfully (0 mock/demo data).");
  } catch (error) {
    logger.error(`[Database] Fatal error during initialization: ${error.message}`);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
};

// Auto-run if executed directly via CLI
if (
  process.argv[1] &&
  (process.argv[1].endsWith("seeders/index.js") ||
    process.argv[1].endsWith("seeders\\index.js") ||
    process.argv[1].includes("seeders"))
) {
  initializeDatabase().then(() => process.exit(0));
}

export default initializeDatabase;
