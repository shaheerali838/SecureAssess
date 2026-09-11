import mongoose from "mongoose";
import app from "../../src/app.js";
import { connectDatabase } from "../../src/config/db.js";
import { OrganizationService } from "../../src/modules/organizations/organization.service.js";
import User from "../../src/modules/users/user.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import { PLATFORM_ROLES } from "../../src/constants/roles.js";

async function runOrgDeletionTest() {
  console.log("Starting Organization Deletion Integration Test...");
  await connectDatabase();
  await seedRBAC();

  const platformAdmin = {
    _id: new mongoose.Types.ObjectId(),
    platformRole: PLATFORM_ROLES.PLATFORM_ADMIN,
  };

  try {
    // 1. Test Soft Delete (Deactivation)
    console.log("\n[1] Testing Soft Delete (Deactivation)...");
    const softOrgName = `Soft Delete Uni ${Date.now()}`;
    const softOwnerEmail = `soft_${Date.now()}@testuni.edu`;

    const org1 = await OrganizationService.createOrganization({
      name: softOrgName,
      type: "UNIVERSITY",
      tenantIndustry: "academic",
      contact: { email: softOwnerEmail },
      owner: { firstName: "Test", lastName: "Owner", email: softOwnerEmail },
    });

    console.log(`✔ Provisioned org: ${org1.name} (${org1.id})`);
    const deactivateRes = await OrganizationService.deleteOrganization(org1.id, platformAdmin, false);
    console.log(`✔ Deactivate response: ${deactivateRes.message}`);

    const deactivatedDoc = await Organization.findById(org1.id);
    if (deactivatedDoc.status !== "DEACTIVATED") {
      throw new Error(`Expected status DEACTIVATED, got ${deactivatedDoc.status}`);
    }
    console.log(`✔ Verified status in DB is DEACTIVATED`);

    // 2. Test Hard Delete (Permanent Purge with Cascade)
    console.log("\n[2] Testing Permanent Purge (Hard Delete)...");
    const hardOrgName = `Hard Delete Uni ${Date.now()}`;
    const hardOwnerEmail = `hard_${Date.now()}@testuni.edu`;

    const org2 = await OrganizationService.createOrganization({
      name: hardOrgName,
      type: "UNIVERSITY",
      tenantIndustry: "academic",
      contact: { email: hardOwnerEmail },
      owner: { firstName: "Test", lastName: "Owner", email: hardOwnerEmail },
    });

    console.log(`✔ Provisioned org: ${org2.name} (${org2.id})`);
    const hardDeleteRes = await OrganizationService.deleteOrganization(org2.id, platformAdmin, true);
    console.log(`✔ Hard delete response: ${hardDeleteRes.message}`);

    const hardDoc = await Organization.findById(org2.id);
    if (hardDoc !== null) {
      throw new Error(`Expected null after hard delete, got doc`);
    }

    const memberships = await UserMembership.find({ organizationId: org2.id });
    if (memberships.length > 0) {
      throw new Error(`Expected 0 memberships after cascade hard delete, got ${memberships.length}`);
    }
    console.log(`✔ Verified organization and memberships completely purged from DB`);

    // Cleanup soft test org
    await Organization.deleteOne({ _id: org1.id });
    await User.deleteMany({ email: { $in: [softOwnerEmail, hardOwnerEmail] } });
    await UserMembership.deleteMany({ organizationId: org1.id });

    console.log("\n ALL ORGANIZATION DELETION TESTS PASSED SUCCESSFULLY!");
  } finally {
    await mongoose.disconnect();
  }
}

runOrgDeletionTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
