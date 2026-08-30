import { connectDatabase, disconnectDatabase } from "../../config/db.js";
import { seedRBAC } from "./rbac.seeder.js";
import { seedPlatformOwner } from "./admin.seeder.js";
import { seedDemoAccounts } from "./demo.seeder.js";
import { seedAssessmentsAndQuestions } from "./assessment.seeder.js";
import { logger } from "../../config/logger.js";

export const runSeeders = async () => {
  try {
    logger.info("[Seeder] Starting database seeder pipeline...");
    await connectDatabase();

    // 1. Seed RBAC (Permissions -> Roles -> Role-Permission links)
    await seedRBAC();

    // 2. Seed Initial Platform Owner (Root administrator account)
    await seedPlatformOwner();

    // 3. Seed Demo Tenant Organization & Multi-Role Persona Accounts
    await seedDemoAccounts();

    // 4. Seed Live Assessments & Question Bank
    await seedAssessmentsAndQuestions();

    logger.info("[Seeder] Database seeding completed successfully!");
  } catch (error) {
    logger.error(`[Seeder] Fatal error during seeding: ${error.message}`);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
};

// Auto-run if executed directly via CLI
if (process.argv[1] && (process.argv[1].endsWith("seeders/index.js") || process.argv[1].endsWith("seeders\\index.js") || process.argv[1].includes("seeders"))) {
  runSeeders().then(() => process.exit(0));
}
