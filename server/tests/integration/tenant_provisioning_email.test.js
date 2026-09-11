import mongoose from "mongoose";
import app from "../../src/app.js";
import { connectDatabase } from "../../src/config/db.js";
import { OrganizationService } from "../../src/modules/organizations/organization.service.js";
import User from "../../src/modules/users/user.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import Role from "../../src/modules/roles/role.model.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import { EmailService } from "../../src/services/email/email.service.js";

async function runTenantEmailVerification() {
  console.log("Starting Tenant Provisioning & Email Verification Test...");
  await connectDatabase();
  await seedRBAC();

  const testOrgName = `Test Uni ${Date.now()}`;
  const testOwnerEmail = `testowner_${Date.now()}@example.com`;

  // Track if sendEmail gets called
  let sentEmails = [];
  const originalSendEmail = EmailService.sendEmail;
  EmailService.sendEmail = async (opts) => {
    sentEmails.push(opts);
    return originalSendEmail.call(EmailService, opts);
  };

  try {
    console.log(`\n[1] Creating organization '${testOrgName}' with new owner '${testOwnerEmail}'...`);
    const createdOrg = await OrganizationService.createOrganization({
      name: testOrgName,
      type: "UNIVERSITY",
      tenantIndustry: "academic",
      contact: {
        email: "contact@testuni.edu",
        phone: "+1234567890",
      },
      owner: {
        firstName: "Dr. Alice",
        lastName: "Smith",
        email: testOwnerEmail,
      },
    });

    console.log(`✔ Organization provisioned: ${createdOrg.name} (${createdOrg.code})`);

    // Verify owner user in DB
    const owner = await User.findOne({ email: testOwnerEmail });
    if (!owner) throw new Error("Owner user was not created in DB");
    console.log(`✔ Owner user verified: ${owner.email}, has passwordResetTokenHash: ${!!owner.passwordResetTokenHash}`);

    if (!owner.passwordResetTokenHash) {
      throw new Error("Owner missing password setup token hash!");
    }

    // Wait 500ms for async email dispatch
    await new Promise((r) => setTimeout(r, 600));

    // Verify email was sent
    console.log(`✔ Captured sent emails count: ${sentEmails.length}`);
    const provisionEmail = sentEmails.find((e) => e.to === testOwnerEmail);
    if (!provisionEmail) {
      throw new Error(`No email was dispatched to ${testOwnerEmail}`);
    }

    console.log(`✔ Provisioning email successfully captured:`);
    console.log(`   - To: ${provisionEmail.to}`);
    console.log(`   - Subject: ${provisionEmail.subject}`);
    console.log(`   - Contains Setup URL: ${provisionEmail.html.includes("token=")}`);

    // Verify notification created
    const notif = await Notification.findOne({ recipientId: owner._id, type: "ORGANIZATION_CREATED" });
    if (!notif) {
      throw new Error("No in-app notification record found for owner");
    }
    console.log(`✔ Notification record verified: '${notif.title}'`);

    console.log("\n[2] Testing uniqueness constraints...");
    // 2a. Duplicate Name check
    let nameError = null;
    try {
      await OrganizationService.createOrganization({
        name: testOrgName,
        type: "UNIVERSITY",
        tenantIndustry: "academic",
        owner: {
          firstName: "Another",
          lastName: "Person",
          email: `another_${Date.now()}@example.com`,
        },
      });
    } catch (err) {
      nameError = err;
    }
    if (!nameError || nameError.statusCode !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate organization name, got: ${nameError?.message}`);
    }
    console.log(`✔ Correctly rejected duplicate organization name with 409: '${nameError.message}'`);

    // 2b. Duplicate Owner Email check
    let ownerError = null;
    try {
      await OrganizationService.createOrganization({
        name: `Different Org ${Date.now()}`,
        type: "UNIVERSITY",
        tenantIndustry: "academic",
        owner: {
          firstName: "Dr. Alice",
          lastName: "Smith",
          email: testOwnerEmail,
        },
      });
    } catch (err) {
      ownerError = err;
    }
    if (!ownerError || ownerError.statusCode !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate owner email, got: ${ownerError?.message}`);
    }
    console.log(`✔ Correctly rejected duplicate owner email with 409: '${ownerError.message}'`);

    console.log("\n[3] Testing staff member invitation email...");
    const staffEmail = `examiner_${Date.now()}@testuni.edu`;
    await OrganizationService.inviteStaffMember(
      createdOrg.id,
      {
        email: staffEmail,
        firstName: "Bob",
        lastName: "Examiner",
        roleName: "EXAMINER",
      },
      owner._id
    );

    await new Promise((r) => setTimeout(r, 600));

    const staffInviteEmail = sentEmails.find((e) => e.to === staffEmail);
    if (!staffInviteEmail) {
      throw new Error(`No invite email was dispatched to ${staffEmail}`);
    }
    console.log(`✔ Staff invite email successfully captured:`);
    console.log(`   - To: ${staffInviteEmail.to}`);
    console.log(`   - Subject: ${staffInviteEmail.subject}`);

    // Clean up test documents
    await Organization.deleteOne({ _id: createdOrg.id });
    await User.deleteMany({ email: { $in: [testOwnerEmail, staffEmail] } });
    await UserMembership.deleteMany({ organizationId: createdOrg.id });
    await Notification.deleteMany({ organizationId: createdOrg.id });

    console.log("\n ALL TENANT PROVISIONING, EMAIL, AND UNIQUENESS TESTS PASSED SUCCESSFULLY!");
  } finally {
    EmailService.sendEmail = originalSendEmail;
    await mongoose.disconnect();
  }
}

runTenantEmailVerification().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
