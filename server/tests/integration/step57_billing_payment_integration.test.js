import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Plan from "../../src/modules/subscriptions/plan.model.js";
import Subscription from "../../src/modules/subscriptions/subscription.model.js";
import { BillingCustomer, Invoice, BillingEvent } from "../../src/modules/billing/billing.model.js";
import AuditLog from "../../src/modules/auditLogs/auditLog.model.js";
import { BillingService } from "../../src/modules/billing/billing.service.js";
import { BillingReconciliationService } from "../../src/modules/billing/billing.reconciliation.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { DEFAULT_PLANS, SUBSCRIPTION_STATUSES } from "../../src/modules/subscriptions/subscription.constants.js";
import { INVOICE_STATUSES } from "../../src/modules/billing/billing.constants.js";
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

const runStep57Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 57 Billing & Payment Integration Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-bill-a", "org-bill-b"] } });
    await User.deleteMany({ email: { $in: ["admin57@org-a.com", "cand57@org-a.com", "alien57@org-b.com"] } });
    await Subscription.deleteMany({});
    await BillingCustomer.deleteMany({});
    await Invoice.deleteMany({});
    await BillingEvent.deleteMany({});
    await Plan.deleteMany({});

    // Seed default plans
    await Plan.insertMany(Object.values(DEFAULT_PLANS));

    // 2. Setup Organization A & Admin
    const orgA = await Organization.create({
      name: "FinTech Security Labs",
      slug: "org-bill-a",
      code: "BILL-A",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const adminUser = await User.create({
      firstName: "Katherine",
      lastName: "Johnson",
      email: "admin57@org-a.com",
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
      name: "Infiltrator Corporate LLC",
      slug: "org-bill-b",
      code: "BILL-B",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const alienUser = await User.create({
      firstName: "Loki",
      lastName: "Laufeyson",
      email: "alien57@org-b.com",
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
      firstName: "Hedy",
      lastName: "Lamarr",
      email: "cand57@org-a.com",
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

    // =========================================================================
    // [TEST 1] Billing Customer Identity Creation & Authoritative Checkout
    // =========================================================================
    console.log("\n[TEST 1] Billing Customer Creation & Authoritative Checkout Session...");

    const checkoutRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/billing/checkout`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        planCode: "PROFESSIONAL",
        price: 1, // Malicious client attempt to override price to $1
        currency: "EUR", // Malicious client attempt to override currency
      }
    );

    console.log("Checkout Session -> Status:", checkoutRes.status, "Session ID:", checkoutRes.body?.data?.sessionId, "Plan Price:", checkoutRes.body?.data?.plan?.price);
    if (
      checkoutRes.status !== 200 ||
      checkoutRes.body?.data?.plan?.price !== 199 || // Authoritative $199 enforced
      checkoutRes.body?.data?.plan?.currency !== "USD"
    ) {
      throw new Error("Checkout creation failed or allowed client price manipulation!");
    }

    const customer = await BillingCustomer.findOne({ organizationId: orgA._id });
    console.log("Billing Customer Created -> ID:", customer?._id.toString(), "Provider Cust ID:", customer?.providerCustomerId);
    if (!customer) {
      throw new Error("Billing customer identity was not provisioned!");
    }

    // =========================================================================
    // [TEST 2] Webhook Signature Verification & Invalid Signature Rejection
    // =========================================================================
    console.log("\n[TEST 2] Webhook Signature Verification...");

    const fakeWebhookRes = await request(
      server,
      {
        method: "POST",
        path: "/api/v1/billing/webhook",
        headers: { "x-billing-signature": "forged_malicious_signature" },
      },
      { id: "evt_fake_001", type: "invoice.payment_succeeded", data: {} }
    );

    console.log("Invalid Webhook Signature -> Status:", fakeWebhookRes.status, "(Expected 400)");
    if (fakeWebhookRes.status !== 400) {
      throw new Error(`Expected 400 for forged webhook signature, got ${fakeWebhookRes.status}`);
    }

    // =========================================================================
    // [TEST 3] Payment Success Webhook Activation & Safe Financial Precision
    // =========================================================================
    console.log("\n[TEST 3] Webhook Payment Success & Safe Financial Invoicing (Integer Minor Units)...");

    const paymentSuccessPayload = {
      id: "evt_pay_success_1001",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          organizationId: orgA._id.toString(),
          plan: "PROFESSIONAL",
          status: "ACTIVE",
          amount: 199,
          currency: "USD",
          invoiceId: "inv_prof_2026_001",
        },
      },
    };

    const validWebhookRes = await request(
      server,
      {
        method: "POST",
        path: "/api/v1/billing/webhook",
        headers: { "x-billing-signature": "mock_sig_valid" },
      },
      paymentSuccessPayload
    );

    console.log("Valid Webhook Response -> Status:", validWebhookRes.status, "Processed:", validWebhookRes.body?.data?.processed);
    if (validWebhookRes.status !== 200 || !validWebhookRes.body?.data?.processed) {
      throw new Error("Payment success webhook processing failed!");
    }

    // Verify Subscription status
    const activeSub = await Subscription.findOne({ organizationId: orgA._id });
    console.log("Subscription State -> Plan:", activeSub?.planCode, "Status:", activeSub?.status);
    if (activeSub?.status !== "ACTIVE" || activeSub?.planCode !== "PROFESSIONAL") {
      throw new Error("Subscription failed to activate after successful payment webhook!");
    }

    // Verify Invoice and minor unit precision
    const invoice = await Invoice.findOne({ providerInvoiceId: "inv_prof_2026_001" });
    console.log("Generated Invoice -> Amount ($):", invoice?.amount, "Amount in Cents:", invoice?.amountInCents, "Status:", invoice?.status);
    if (!invoice || invoice.amountInCents !== 19900 || invoice.status !== INVOICE_STATUSES.PAID) {
      throw new Error("Invoice precision or status invalid!");
    }

    // =========================================================================
    // [TEST 4] Webhook Replay Idempotency
    // =========================================================================
    console.log("\n[TEST 4] Webhook Replay & Duplicate Event Deduplication...");

    const duplicateWebhookRes = await request(
      server,
      {
        method: "POST",
        path: "/api/v1/billing/webhook",
        headers: { "x-billing-signature": "mock_sig_valid" },
      },
      paymentSuccessPayload
    );

    console.log("Duplicate Webhook Response -> Idempotency Deduplicated:", duplicateWebhookRes.body?.data?.idempotencyDeduplicated);
    if (duplicateWebhookRes.body?.data?.idempotencyDeduplicated !== true) {
      throw new Error("Webhook duplicate was not deduplicated!");
    }

    // Ensure no duplicate invoices created
    const invoiceCount = await Invoice.countDocuments({ providerInvoiceId: "inv_prof_2026_001" });
    console.log("Total Invoices with ID inv_prof_2026_001 ->", invoiceCount, "(Expected 1)");
    if (invoiceCount !== 1) {
      throw new Error(`Expected 1 invoice record, found ${invoiceCount}`);
    }

    // =========================================================================
    // [TEST 5] Payment Failure Webhook Handling (PAST_DUE Transition)
    // =========================================================================
    console.log("\n[TEST 5] Webhook Payment Failure -> PAST_DUE Transition...");

    const paymentFailedPayload = {
      id: "evt_pay_fail_2002",
      type: "invoice.payment_failed",
      data: {
        object: {
          organizationId: orgA._id.toString(),
          amount: 199,
          currency: "USD",
          invoiceId: "inv_failed_2026_002",
        },
      },
    };

    const failWebhookRes = await request(
      server,
      {
        method: "POST",
        path: "/api/v1/billing/webhook",
        headers: { "x-billing-signature": "mock_sig_valid" },
      },
      paymentFailedPayload
    );

    console.log("Payment Failure Webhook -> Status:", failWebhookRes.status);
    const pastDueSub = await Subscription.findOne({ organizationId: orgA._id });
    console.log("Past Due Subscription Status ->", pastDueSub?.status, "(Expected PAST_DUE)");
    if (pastDueSub?.status !== "PAST_DUE") {
      throw new Error("Subscription status failed to transition to PAST_DUE on payment failure!");
    }

    // =========================================================================
    // [TEST 6] Period-End Cancellation & Reactivation Lifecycle
    // =========================================================================
    console.log("\n[TEST 6] Subscription Cancel-At-Period-End & Reactivation...");

    const cancelRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/billing/subscription/cancel`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { atPeriodEnd: true }
    );

    console.log("Cancel at Period End -> Status:", cancelRes.status, "cancelAtPeriodEnd:", cancelRes.body?.data?.cancelAtPeriodEnd);
    if (cancelRes.status !== 200 || !cancelRes.body?.data?.cancelAtPeriodEnd) {
      throw new Error("Cancel at period end failed");
    }

    const reactivateRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/billing/subscription/reactivate`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Reactivate Subscription -> Status:", reactivateRes.status, "cancelAtPeriodEnd:", reactivateRes.body?.data?.cancelAtPeriodEnd);
    if (reactivateRes.status !== 200 || reactivateRes.body?.data?.cancelAtPeriodEnd !== false) {
      throw new Error("Reactivation failed to restore active state");
    }

    // =========================================================================
    // [TEST 7] Candidate Billing Access Guard (RBAC Separation)
    // =========================================================================
    console.log("\n[TEST 7] Candidate Billing Access Guard Rejection...");

    const candBillRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/billing/summary`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );

    console.log("Candidate Billing Access -> Status:", candBillRes.status, "(Expected 403)");
    if (candBillRes.status !== 403) {
      throw new Error(`Expected 403 for candidate accessing billing summary, got ${candBillRes.status}`);
    }

    // =========================================================================
    // [TEST 8] Cross-Tenant Billing History Isolation
    // =========================================================================
    console.log("\n[TEST 8] Cross-Tenant Billing History Isolation (Org B vs Org A)...");

    const alienInvoicesRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/billing/invoices`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );

    console.log("Org B Invoices Count ->", alienInvoicesRes.body?.data?.items?.length, "(Expected 0 for Org B)");
    if (alienInvoicesRes.status !== 200 || alienInvoicesRes.body?.data?.items?.length !== 0) {
      throw new Error("Cross-tenant leakage: Org B admin retrieved Org A invoices!");
    }

    // =========================================================================
    // [TEST 9] Billing Reconciliation Engine & Audit Logging
    // =========================================================================
    console.log("\n[TEST 9] Billing Reconciliation Service & Audit Logging...");

    const reconcileResult = await BillingReconciliationService.reconcileSubscription(orgA._id, adminUser._id);
    console.log("Reconciliation Executed -> Reconciled:", reconcileResult.reconciled, "Mismatch Detected:", reconcileResult.mismatchDetected);
    if (!reconcileResult.reconciled) {
      throw new Error("Billing reconciliation failed!");
    }

    const billingAudits = await AuditLog.countDocuments({ organizationId: orgA._id, resource: "BILLING" });
    console.log("Total Billing Audit Logs ->", billingAudits);
    if (billingAudits < 3) {
      throw new Error(`Expected at least 3 billing audit records, found ${billingAudits}`);
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 57 BILLING & PAYMENT INTEGRATION TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep57Tests().catch((err) => {
  console.error("❌ Step 57 Test Suite Failed:", err);
  process.exit(1);
});
