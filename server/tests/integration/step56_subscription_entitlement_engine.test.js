import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import Question from "../../src/modules/questionBank/question.model.js";
import Plan from "../../src/modules/subscriptions/plan.model.js";
import Subscription from "../../src/modules/subscriptions/subscription.model.js";
import AuditLog from "../../src/modules/auditLogs/auditLog.model.js";
import { EntitlementService } from "../../src/modules/subscriptions/entitlement.service.js";
import { SubscriptionService } from "../../src/modules/subscriptions/subscription.service.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { DEFAULT_PLANS, SUBSCRIPTION_STATUSES } from "../../src/modules/subscriptions/subscription.constants.js";
import { generateAccessToken } from "../../src/utils/token.js";
import http from "http";

const request = (server, options, body = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: server.address().port,
        method: options.method || "GET",
        path: options.path,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, body: parsed, raw: data });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runStep56Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 56 Subscription, Plans & SaaS Entitlement Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Setup Users, Roles, Organizations
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-saas-a", "org-saas-b"] } });
    await User.deleteMany({ email: { $in: ["admin56@org-a.com", "cand56@org-a.com", "alien56@org-b.com"] } });
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await Question.deleteMany({});
    await Subscription.deleteMany({});
    await Plan.deleteMany({});

    // Seed default plans
    await Plan.insertMany(Object.values(DEFAULT_PLANS));

    // 2. Setup Organization A & Admin
    const orgA = await Organization.create({
      name: "Stanford Quantum Computing Academy",
      slug: "org-saas-a",
      code: "SAAS-A",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const adminUser = await User.create({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "admin56@org-a.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: adminUser._id,
      organizationId: orgA._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const adminToken = generateAccessToken({ sub: adminUser._id.toString() });

    // 3. Setup Organization B & Alien Admin
    const orgB = await Organization.create({
      name: "Rival AI Institute",
      slug: "org-saas-b",
      code: "SAAS-B",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const alienUser = await User.create({
      firstName: "Victor",
      lastName: "Von Doom",
      email: "alien56@org-b.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: alienUser._id,
      organizationId: orgB._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const alienToken = generateAccessToken({ sub: alienUser._id.toString() });

    // 4. Setup Candidate in Org A
    const candidateUser = await User.create({
      firstName: "Claude",
      lastName: "Shannon",
      email: "cand56@org-a.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: candidateUser._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    const candToken = generateAccessToken({ sub: candidateUser._id.toString() });
    const platformToken = generateAccessToken({ sub: platformOwner._id.toString() });

    // =========================================================================
    // [TEST 1] Plan Management & Duplicate Code Rejection
    // =========================================================================
    console.log("\n[TEST 1] Plan Management & Duplicate Prevention...");

    const plansRes = await request(server, { method: "GET", path: "/api/v1/plans" });
    console.log("Public Plans List -> Status:", plansRes.status, "Count:", plansRes.body?.data?.length);
    if (plansRes.status !== 200 || (plansRes.body?.data?.length || 0) < 4) {
      throw new Error("Failed to retrieve public subscription plans");
    }

    // Try creating duplicate plan code
    const dupPlanRes = await request(
      server,
      {
        method: "POST",
        path: "/api/v1/plans",
        headers: { Authorization: `Bearer ${platformToken}` },
      },
      { name: "Duplicate Free", code: "FREE", price: 0 }
    );
    console.log("Duplicate Plan Creation -> Status:", dupPlanRes.status, "(Expected 409)");
    if (dupPlanRes.status !== 409) {
      throw new Error(`Expected 409 for duplicate plan code, got ${dupPlanRes.status}`);
    }

    // =========================================================================
    // [TEST 2] Organization Subscription Provisioning & Auto-Initialization
    // =========================================================================
    console.log("\n[TEST 2] Organization Subscription Resolution & Current Plan...");

    const subRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/subscriptions/current`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Current Subscription -> Status:", subRes.status, "Plan:", subRes.body?.data?.planCode || subRes.body?.data?.plan, "Status:", subRes.body?.data?.status);
    if (subRes.status !== 200 || !subRes.body?.data?.limits) {
      throw new Error("Failed to resolve organization subscription");
    }

    // =========================================================================
    // [TEST 3] Feature Entitlement Check (Starter vs Professional)
    // =========================================================================
    console.log("\n[TEST 3] Testing Feature Entitlements Enforcement...");

    // On STARTER plan, proctoring is FALSE
    await SubscriptionService.changePlan(orgA._id, "STARTER", null, adminUser._id);
    const starterCanProctor = await EntitlementService.canUseFeature(orgA._id, "proctoring");
    console.log("Starter Plan Proctoring Entitlement ->", starterCanProctor, "(Expected false)");
    if (starterCanProctor !== false) {
      throw new Error("Starter plan incorrectly permitted proctoring feature!");
    }

    // Upgrade to PROFESSIONAL plan, proctoring is TRUE
    await SubscriptionService.changePlan(orgA._id, "PROFESSIONAL", null, adminUser._id);
    const proCanProctor = await EntitlementService.canUseFeature(orgA._id, "proctoring");
    console.log("Professional Plan Proctoring Entitlement ->", proCanProctor, "(Expected true)");
    if (proCanProctor !== true) {
      throw new Error("Professional plan failed to entitle proctoring feature!");
    }

    // =========================================================================
    // [TEST 4] Server-Authoritative Usage Limit Enforcement (maxAssessments)
    // =========================================================================
    console.log("\n[TEST 4] Enforcing Authoritative Resource Limits...");

    // Set custom limit of maxAssessments = 2
    const customSub = await Subscription.findOne({ organizationId: orgA._id });
    customSub.limits.maxAssessments = 2;
    customSub.limits.assessments = 2;
    await customSub.save();

    // Create 2 assessments
    await Assessment.create({
      organizationId: orgA._id,
      title: "Quantum Physics 101",
      code: "PHYS-101",
      passingScore: 60,
      totalPoints: 100,
      status: "DRAFT",
      createdBy: adminUser._id,
    });

    await Assessment.create({
      organizationId: orgA._id,
      title: "Quantum Electrodynamics 201",
      code: "PHYS-201",
      passingScore: 70,
      totalPoints: 100,
      status: "DRAFT",
      createdBy: adminUser._id,
    });

    // Check limit assertion
    let limitBlocked = false;
    try {
      await EntitlementService.assertWithinLimit(orgA._id, "maxAssessments");
    } catch (err) {
      limitBlocked = true;
      console.log("Usage limit check blocked with ->", err.message);
    }

    if (!limitBlocked) {
      throw new Error("Resource limit enforcement failed when maxAssessments threshold was reached!");
    }

    // =========================================================================
    // [TEST 5] Usage Metrics Dashboard Overview
    // =========================================================================
    console.log("\n[TEST 5] Organization Usage Dashboard Overview...");

    const usageRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/subscriptions/usage`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Usage Overview -> Status:", usageRes.status, "Assessments Used:", usageRes.body?.data?.usage?.assessments?.used, "Limit:", usageRes.body?.data?.usage?.assessments?.limit);
    if (usageRes.status !== 200 || usageRes.body?.data?.usage?.assessments?.used !== 2) {
      throw new Error("Usage metrics calculation failed");
    }

    // =========================================================================
    // [TEST 6] Subscription Lifecycle: Cancel & Reactivate
    // =========================================================================
    console.log("\n[TEST 6] Subscription Lifecycle: Cancel & Reactivate...");

    const cancelRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/subscriptions/cancel`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { atPeriodEnd: false }
    );
    console.log("Cancel Subscription -> Status:", cancelRes.status, "Sub Status:", cancelRes.body?.data?.status);
    if (cancelRes.status !== 200 || cancelRes.body?.data?.status !== "CANCELLED") {
      throw new Error("Failed to cancel subscription");
    }

    const reactivateRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/subscriptions/reactivate`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("Reactivate Subscription -> Status:", reactivateRes.status, "Sub Status:", reactivateRes.body?.data?.status);
    if (reactivateRes.status !== 200 || reactivateRes.body?.data?.status !== "ACTIVE") {
      throw new Error("Failed to reactivate subscription");
    }

    // =========================================================================
    // [TEST 7] Candidate Access Guard (RBAC Separation)
    // =========================================================================
    console.log("\n[TEST 7] Candidate Subscription Access Rejection...");

    const candSubRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/subscriptions/current`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );
    console.log("Candidate Access -> Status:", candSubRes.status, "(Expected 403)");
    if (candSubRes.status !== 403) {
      throw new Error(`Expected 403 for candidate accessing subscription data, got ${candSubRes.status}`);
    }

    // =========================================================================
    // [TEST 8] Cross-Tenant Subscription Isolation
    // =========================================================================
    console.log("\n[TEST 8] Cross-Tenant Subscription Isolation...");

    const alienSubRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/subscriptions/current`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );
    console.log("Alien Tenant B Sub -> Status:", alienSubRes.status, "Org ID in Sub:", alienSubRes.body?.data?.organizationId);
    if (alienSubRes.status !== 200 || alienSubRes.body?.data?.organizationId?.toString() === orgA._id.toString()) {
      throw new Error("Cross-tenant leakage: Org B retrieved Org A subscription!");
    }

    // =========================================================================
    // [TEST 9] Idempotent Webhook Processing
    // =========================================================================
    console.log("\n[TEST 9] Billing Webhook Processing with Deduplication...");

    const webhookPayload = {
      id: "evt_webhook_test_001",
      type: "customer.subscription.updated",
      data: {
        object: {
          organizationId: orgA._id.toString(),
          plan: "ENTERPRISE",
          status: "ACTIVE",
        },
      },
    };

    const webhook1 = await request(
      server,
      {
        method: "POST",
        path: "/api/v1/subscriptions/webhook",
        headers: { "x-billing-signature": "mock_sig_valid" },
      },
      webhookPayload
    );
    console.log("Webhook First Delivery -> Status:", webhook1.status, "Processed:", webhook1.body?.data?.processed);

    const webhook2 = await request(
      server,
      {
        method: "POST",
        path: "/api/v1/subscriptions/webhook",
        headers: { "x-billing-signature": "mock_sig_valid" },
      },
      webhookPayload
    );
    console.log("Webhook Duplicate Delivery -> Idempotency Deduplicated:", webhook2.body?.data?.idempotencyDeduplicated);
    if (webhook2.body?.data?.idempotencyDeduplicated !== true) {
      throw new Error("Webhook duplicate event was not deduplicated!");
    }

    // =========================================================================
    // [TEST 10] Security Audit Trail Integration
    // =========================================================================
    console.log("\n[TEST 10] Verifying Audit Trail for Subscription Changes...");

    const subAudits = await AuditLog.countDocuments({ organizationId: orgA._id, resource: "SUBSCRIPTION" });
    console.log("Subscription Audit Logs Count ->", subAudits);
    if (subAudits < 2) {
      throw new Error(`Expected at least 2 subscription audit logs, found ${subAudits}`);
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 56 SUBSCRIPTION & ENTITLEMENT ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep56Tests().catch((err) => {
  console.error("❌ Step 56 Test Suite Failed:", err);
  process.exit(1);
});
