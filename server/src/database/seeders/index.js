import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../config/db.js";
import { seedRBAC } from "./rbac.seeder.js";
import { seedPlatformOwner } from "./admin.seeder.js";
import { seedDemoAccounts } from "./demo.seeder.js";
import { seedAssessmentsAndQuestions } from "./assessment.seeder.js";
import { seedCandidatesAndAcademicStructure } from "./candidate.seeder.js";
import { seedInterviews } from "./interview.seeder.js";
import { logger } from "../../config/logger.js";

/**
 * Wipes all collections in the MongoDB database for a completely fresh seed
 */
export const clearDatabase = async () => {
  logger.info("[Seeder] Purging all database collections for a clean reset...");
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
      logger.info(`   -> Cleared collection: ${key}`);
    } catch (err) {
      logger.warn(`   -> Could not clear collection ${key}: ${err.message}`);
    }
  }
  logger.info("[Seeder] All database collections successfully wiped clean.");
};

export const runSeeders = async (options = {}) => {
  const isCleanRun =
    options.clean ||
    process.argv.includes("--clean") ||
    process.argv.includes("--fresh") ||
    process.argv.includes("-f");

  try {
    logger.info("[Seeder] Starting database seeder pipeline...");
    await connectDatabase();

    // If requested, wipe all existing data first
    if (isCleanRun) {
      await clearDatabase();
    }

    // 1. Seed RBAC (Permissions -> Roles -> Role-Permission links)
    await seedRBAC();

    // 2. Seed Initial Platform Owner (Root administrator account)
    await seedPlatformOwner();

    // 3. Seed Demo Tenant Organization & Multi-Role Persona Accounts
    await seedDemoAccounts();

    // 4. Seed Live Assessments & Question Bank
    await seedAssessmentsAndQuestions();

    // 5. Seed Academic Departments, Programs, Cohorts & Candidate Roster
    await seedCandidatesAndAcademicStructure();

    // 6. Seed Live Technical & Panel Interviews
    await seedInterviews();

    logger.info("[Seeder] Database seeding completed successfully!");
  } catch (error) {
    logger.error(`[Seeder] Fatal error during seeding: ${error.message}`);
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
  runSeeders().then(() => process.exit(0));
}

export default runSeeders;
