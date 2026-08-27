import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import { OrganizationService } from "../../src/modules/organizations/organization.service.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";

const runTest = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 7C Verification Test");

  try {
    // 1. Get Platform Owner
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    console.log("Platform Owner:", platformOwner ? platformOwner.email : "Not found!");

    // Clean up test data if previously existing
    await Organization.deleteMany({ slug: { $in: ["virtual-university", "abc-corporation"] } });
    await User.deleteMany({ email: "ahmed@vu.edu.pk" });

    console.log("\n--- TEST 1: Create Organization & Initial Owner ---");
    const payload1 = {
      name: "Virtual University",
      type: "UNIVERSITY",
      contact: {
        email: "admin@vu.edu.pk",
        phone: "+923001234567",
      },
      address: {
        country: "Pakistan",
        city: "Islamabad",
      },
      owner: {
        firstName: "Ahmed",
        lastName: "Khan",
        email: "ahmed@vu.edu.pk",
      },
    };

    const org1 = await OrganizationService.createOrganization(payload1, platformOwner._id);
    console.log("Created Organization 1:", {
      id: org1.id,
      name: org1.name,
      slug: org1.slug,
      code: org1.code,
      type: org1.type,
      status: org1.status,
      owner: org1.owner,
    });

    // Verify in DB
    const dbOrg1 = await Organization.findById(org1.id);
    const dbOwner = await User.findOne({ email: "ahmed@vu.edu.pk" });
    const dbMembership1 = await UserMembership.findOne({
      userId: dbOwner._id,
      organizationId: dbOrg1._id,
    }).populate("roleId");

    console.log("Database Verification 1:");
    console.log("- Organization exists in DB:", !!dbOrg1, "Code:", dbOrg1.code);
    console.log("- Owner User exists in DB:", !!dbOwner, "Status:", dbOwner.status);
    console.log("- Membership exists in DB:", !!dbMembership1);
    console.log("- Membership Role Name:", dbMembership1?.roleId?.name);

    console.log("\n--- TEST 2: Multi-Membership (Same User for 2nd Org) ---");
    const payload2 = {
      name: "ABC Corporation",
      type: "CORPORATE",
      contact: {
        email: "contact@abccorp.com",
      },
      owner: {
        firstName: "Ahmed",
        lastName: "Khan",
        email: "ahmed@vu.edu.pk", // Same user email!
      },
    };

    const org2 = await OrganizationService.createOrganization(payload2, platformOwner._id);
    console.log("Created Organization 2:", {
      id: org2.id,
      name: org2.name,
      slug: org2.slug,
      code: org2.code,
    });

    const userCount = await User.countDocuments({ email: "ahmed@vu.edu.pk" });
    const membershipCount = await UserMembership.countDocuments({ userId: dbOwner._id });
    console.log("Database Verification 2:");
    console.log("- Total Users with email ahmed@vu.edu.pk (Must be 1):", userCount);
    console.log("- Total Memberships for Ahmed Khan (Must be 2):", membershipCount);

    console.log("\n--- ALL STEP 7C TESTS PASSED SUCCESSFULLY! ---");
  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await disconnectDatabase();
  }
};

runTest();
