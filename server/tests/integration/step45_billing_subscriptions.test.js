import mongoose from "mongoose";
import crypto from "crypto";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Subscription from "../../src/modules/subscriptions/subscription.model.js";
import { EntitlementService } from "../../src/services/billing/entitlement.service.js";
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } from "../../src/constants/subscriptionPlans.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
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

const runStep45Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 45 Billing, Subscriptions & Entitlements Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgOwnerRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });

    const platformOwnerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    await Organization.deleteMany({ slug: { $in: ["org-vu-45", "org-alien-45"] } });
    await User.deleteMany({ email: { $in: ["owner45@vu.edu.pk", "eve45@alien.com"] } });
    await Candidate.deleteMany({});
    await Subscription.deleteMany({});

    // 2. Setup Organization A & Owner
    const orgA = await Organization.create({
      name: "Virtual University 45",
      slug: "org-vu-45",
      code: "VU45",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const ownerUser = await User.create({
      firstName: "Rector",
      lastName: "VU",
      email: "owner45@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const ownerToken = generateAccessToken({ sub: ownerUser._id.toString() });

    await UserMembership.create({
      userId: ownerUser._id,
      organizationId: orgA._id,
      roleId: orgOwnerRole._id,
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 45",
      slug: "org-alien-45",
      code: "ALIEN45",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Competitor",
      email: "eve45@alien.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const eveToken = generateAccessToken({ sub: eveUser._id.toString() });

    await UserMembership.create({
      userId: eveUser._id,
      organizationId: orgB._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    console.log("\n[TEST 1] Subscription Model & Default Trial Auto-Initialization...");
    const sub = await EntitlementService.getOrganizationSubscription(orgA._id);
    console.log("Auto-initialized Plan ->", sub.plan, "Status:", sub.status, "Candidates Limit:", sub.limits?.candidates, "Proctoring Feature:", sub.features?.proctoring);
    if (sub.plan !== SUBSCRIPTION_PLANS.FREE_TRIAL || sub.status !== SUBSCRIPTION_STATUSES.TRIALING || sub.limits?.candidates !== 25 || sub.features?.proctoring !== false) {
      throw new Error("Test 1 Failed: Subscription auto-initialization with free trial limits failed!");
    }

    console.log("\n[TEST 2] Feature Entitlement Enforcement (Proctoring Guard)...");
    // Free Trial does NOT have AI proctoring
    let featureBlocked = false;
    try {
      await EntitlementService.checkFeatureEntitlement(orgA._id, "proctoring");
    } catch (err) {
      featureBlocked = true;
      console.log("Proctoring Feature Check -> Blocked (Expected):", err.message);
    }
    if (!featureBlocked) {
      throw new Error("Test 2 Failed: Free trial was allowed to access unentitled proctoring feature!");
    }

    console.log("\n[TEST 3] Resource Usage Quota Enforcement (Candidate Limit)...");
    // Create 25 candidates (allowed)
    const candDocs = [];
    for (let i = 1; i <= 25; i++) {
      candDocs.push({
        organizationId: orgA._id,
        candidateCode: `CAND-45-${i}`,
        firstName: `Candidate`,
        lastName: `${i}`,
        email: `cand45_${i}@vu.edu.pk`,
        status: "ACTIVE",
      });
    }
    await Candidate.insertMany(candDocs);

    // Check usage overview
    const overview = await EntitlementService.getUsageOverview(orgA._id);
    console.log("Current Usage -> Candidates:", overview.usage.candidates.used, "/", overview.usage.candidates.limit);
    if (overview.usage.candidates.used !== 25) {
      throw new Error("Test 3.1 Failed: Authoritative usage count derivation failed!");
    }

    // 26th candidate quota check -> rejected
    let quotaBlocked = false;
    try {
      await EntitlementService.checkUsageLimit(orgA._id, "candidates");
    } catch (err) {
      quotaBlocked = true;
      console.log("26th Candidate Quota Check -> Blocked (Expected):", err.message, "Details:", err.data);
    }
    if (!quotaBlocked) {
      throw new Error("Test 3.2 Failed: Organization was able to exceed candidate quota limit!");
    }

    console.log("\n[TEST 4] Plan Upgrade Workflow (Upgrade to PROFESSIONAL)...");
    const upgradeRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/subscriptions/change-plan`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      plan: SUBSCRIPTION_PLANS.PROFESSIONAL,
    });
    console.log("Upgrade Status ->", upgradeRes.status, "New Plan:", upgradeRes.body?.data?.plan, "New Candidate Limit:", upgradeRes.body?.data?.limits?.candidates, "Proctoring:", upgradeRes.body?.data?.features?.proctoring);
    if (upgradeRes.status !== 200 || upgradeRes.body?.data?.plan !== SUBSCRIPTION_PLANS.PROFESSIONAL || upgradeRes.body?.data?.limits?.candidates !== 2000 || upgradeRes.body?.data?.features?.proctoring !== true) {
      throw new Error("Test 4 Failed: Plan upgrade failed to expand limits and features!");
    }

    // Now proctoring feature check succeeds
    const proctorCheck = await EntitlementService.checkFeatureEntitlement(orgA._id, "proctoring");
    if (!proctorCheck.allowed) {
      throw new Error("Test 4.2 Failed: Proctoring feature was not enabled after upgrade to PROFESSIONAL!");
    }

    // Now 26th candidate quota check succeeds
    const quotaCheckAfterUpgrade = await EntitlementService.checkUsageLimit(orgA._id, "candidates");
    if (!quotaCheckAfterUpgrade.allowed) {
      throw new Error("Test 4.3 Failed: Candidate quota was still blocked after upgrade!");
    }

    console.log("\n[TEST 5] Platform Owner Custom Enterprise Limits Configuration...");
    const currentSub = await Subscription.findOne({ organizationId: orgA._id });
    const enterpriseRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/subscriptions/platform/${currentSub._id}/enterprise-limits`,
      headers: { Authorization: `Bearer ${platformOwnerToken}` },
    }, {
      limits: { candidates: 75000, storageGb: 2000 },
      features: { whiteLabeling: true },
    });
    console.log("Enterprise Config Status ->", enterpriseRes.status, "Custom Limit:", enterpriseRes.body?.data?.limits?.candidates, "WhiteLabeling:", enterpriseRes.body?.data?.features?.whiteLabeling);
    if (enterpriseRes.status !== 200 || enterpriseRes.body?.data?.limits?.candidates !== 75000 || enterpriseRes.body?.data?.features?.whiteLabeling !== true) {
      throw new Error("Test 5 Failed: Custom enterprise limits configuration failed!");
    }

    console.log("\n[TEST 6] Billing Webhook Processing, Signature Verification & Idempotency...");
    const webhookSecret = "mock_webhook_secret_key_123";
    const webhookPayload = JSON.stringify({
      id: "evt_mock_payment_45_001",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          organizationId: orgA._id.toString(),
          plan: SUBSCRIPTION_PLANS.PROFESSIONAL,
          status: "ACTIVE",
        },
      },
    });

    const validSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    // 6.1 Process valid webhook
    const validHookRes = await request(server, {
      method: "POST",
      path: "/api/v1/subscriptions/webhooks/provider",
      headers: { "x-billing-signature": validSignature },
    }, webhookPayload);
    console.log("Valid Webhook Status ->", validHookRes.status, "Processed:", validHookRes.body?.data?.processed);
    if (validHookRes.status !== 200 || validHookRes.body?.data?.processed !== true) {
      throw new Error("Test 6.1 Failed: Webhook processing failed!");
    }

    // 6.2 Duplicate Webhook -> Idempotently deduplicated
    const dupHookRes = await request(server, {
      method: "POST",
      path: "/api/v1/subscriptions/webhooks/provider",
      headers: { "x-billing-signature": validSignature },
    }, webhookPayload);
    console.log("Duplicate Webhook Status ->", dupHookRes.status, "Deduplicated:", dupHookRes.body?.data?.idempotencyDeduplicated);
    if (dupHookRes.status !== 200 || dupHookRes.body?.data?.idempotencyDeduplicated !== true) {
      throw new Error("Test 6.2 Failed: Webhook idempotency deduplication failed!");
    }

    // 6.3 Invalid signature -> Rejected
    const fakeHookRes = await request(server, {
      method: "POST",
      path: "/api/v1/subscriptions/webhooks/provider",
      headers: { "x-billing-signature": "invalid_forged_signature_123" },
    }, webhookPayload);
    console.log("Invalid Webhook Status ->", fakeHookRes.status);
    if (fakeHookRes.status !== 400) {
      throw new Error("Test 6.3 Failed: Webhook with forged signature was not rejected with 400!");
    }

    console.log("\n[TEST 7] Cross-Tenant Billing Isolation...");
    const eveBillingRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/subscriptions/current`,
      headers: { Authorization: `Bearer ${eveToken}` }, // Eve belongs to Org B
    });
    console.log("Eve Alien Billing Access Status ->", eveBillingRes.status);
    if (eveBillingRes.status !== 403) {
      throw new Error("Test 7 Failed: Cross-tenant billing access was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 45 BILLING, SUBSCRIPTIONS & ENTITLEMENTS TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 45 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep45Tests();
