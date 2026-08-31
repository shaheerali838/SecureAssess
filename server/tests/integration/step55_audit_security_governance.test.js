import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import AuditLog from "../../src/modules/auditLogs/auditLog.model.js";
import { AuditLogService } from "../../src/modules/auditLogs/auditLog.service.js";
import { SecurityMonitoringService } from "../../src/modules/auditLogs/security/security.service.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITIES } from "../../src/modules/auditLogs/auditLog.constants.js";
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
            resolve({ status: res.statusCode, body: parsed, raw: data, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, raw: data, headers: res.headers });
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

const runStep55Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 55 Audit, Compliance & Security Governance Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Setup Users and Roles
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-gov-a", "org-gov-b"] } });
    await User.deleteMany({ email: { $in: ["admin55@org-a.com", "cand55@org-a.com", "alien55@org-b.com"] } });
    await AuditLog.collection.deleteMany({}); // clean raw test collection

    // 2. Setup Organization A & Admin
    const orgA = await Organization.create({
      name: "Cyber Security Center of Excellence",
      slug: "org-gov-a",
      code: "GOV-A",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const adminUser = await User.create({
      firstName: "Grace",
      lastName: "Hopper",
      email: "admin55@org-a.com",
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
      name: "External Auditing Syndicate",
      slug: "org-gov-b",
      code: "GOV-B",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const alienUser = await User.create({
      firstName: "Malory",
      lastName: "Rival",
      email: "alien55@org-b.com",
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
      firstName: "Alan",
      lastName: "Turing",
      email: "cand55@org-a.com",
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

    await Candidate.create({
      organizationId: orgA._id,
      userId: candidateUser._id,
      candidateCode: "CAND-55-TURING",
      firstName: "Alan",
      lastName: "Turing",
      email: "cand55@org-a.com",
      status: "ACTIVE",
    });

    const candToken = generateAccessToken({ sub: candidateUser._id.toString() });
    const platformToken = generateAccessToken({ sub: platformOwner._id.toString() });

    // =========================================================================
    // [TEST 1] Centralized Audit Logging with Secret Redaction & Request ID
    // =========================================================================
    console.log("\n[TEST 1] Centralized Audit Event Creation & Secret Scrubbing...");

    const audit1 = await AuditLogService.createAuditLog({
      organizationId: orgA._id,
      actorUserId: adminUser._id,
      action: AUDIT_ACTIONS.CREATE,
      resourceType: AUDIT_RESOURCES.USER,
      resourceId: candidateUser._id,
      severity: AUDIT_SEVERITIES.INFO,
      description: "Admin enrolled candidate profile",
      ipAddress: "192.168.1.100",
      userAgent: "SecureAssess-Agent/1.0",
      requestId: "req_audit_001",
      metadata: {
        candidateEmail: "cand55@org-a.com",
        passwordHash: "$2b$10$verySecretPasswordHash",
        refreshToken: "eyJhbGciOiJIUzI1NiIsIn...",
        role: "CANDIDATE",
      },
    });

    console.log("Audit Log 1 Created -> ID:", audit1._id.toString(), "Severity:", audit1.severity);
    if (!audit1 || audit1.metadata.passwordHash !== "[REDACTED]" || audit1.metadata.refreshToken !== "[REDACTED]") {
      throw new Error("CRITICAL FAILURE: Sensitive authentication secrets were not redacted in audit metadata!");
    }

    // =========================================================================
    // [TEST 2] Audit Immutability Guard (Prevent Update & Delete)
    // =========================================================================
    console.log("\n[TEST 2] Verifying Audit Immutability Hooks...");

    let updateBlocked = false;
    try {
      await AuditLog.updateOne({ _id: audit1._id }, { description: "Tampered description" });
    } catch (err) {
      updateBlocked = true;
      console.log("Mongoose updateOne blocked with error ->", err.message);
    }
    if (!updateBlocked) {
      throw new Error("CRITICAL SECURITY FLAW: AuditLog record update was permitted!");
    }

    let deleteBlocked = false;
    try {
      await AuditLog.deleteOne({ _id: audit1._id });
    } catch (err) {
      deleteBlocked = true;
      console.log("Mongoose deleteOne blocked with error ->", err.message);
    }
    if (!deleteBlocked) {
      throw new Error("CRITICAL SECURITY FLAW: AuditLog record deletion was permitted!");
    }

    // =========================================================================
    // [TEST 3] Organization Scoped Audit Feed & Filtering
    // =========================================================================
    console.log("\n[TEST 3] Querying Organization Audit Logs with Filter & Pagination...");

    // Seed additional audit logs for Org A
    await AuditLogService.createAuditLog({
      organizationId: orgA._id,
      actorUserId: adminUser._id,
      action: AUDIT_ACTIONS.LOGIN,
      resourceType: AUDIT_RESOURCES.SESSION,
      severity: AUDIT_SEVERITIES.INFO,
      description: "User logged into administrative console",
      ipAddress: "192.168.1.100",
      requestId: "req_audit_002",
    });

    await AuditLogService.createAuditLog({
      organizationId: orgA._id,
      actorUserId: adminUser._id,
      action: AUDIT_ACTIONS.WARNING,
      resourceType: AUDIT_RESOURCES.PROCTORING_EVENT,
      severity: AUDIT_SEVERITIES.HIGH,
      description: "High risk proctoring violation detected",
      ipAddress: "192.168.1.105",
      requestId: "req_audit_003",
    });

    const feedRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/audit-logs?severity=HIGH`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Filtered Audit Feed (severity=HIGH) -> Status:", feedRes.status, "Count:", feedRes.body?.data?.items?.length);
    if (feedRes.status !== 200 || feedRes.body?.data?.items?.length !== 1 || feedRes.body?.data?.items[0]?.severity !== "HIGH") {
      throw new Error("Audit filtering by severity failed");
    }

    // =========================================================================
    // [TEST 4] Candidate Authorization Rejection
    // =========================================================================
    console.log("\n[TEST 4] Candidate Audit Access Rejection (RBAC Guard)...");

    const candAccessRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/audit-logs`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );

    console.log("Candidate Audit Access -> Status:", candAccessRes.status, "(Expected 403)");
    if (candAccessRes.status !== 403) {
      throw new Error(`Expected 403 for candidate accessing audit logs, got ${candAccessRes.status}`);
    }

    // =========================================================================
    // [TEST 5] Cross-Tenant Security Isolation
    // =========================================================================
    console.log("\n[TEST 5] Cross-Tenant Audit Log Isolation (Tenant B vs Tenant A)...");

    const alienQueryRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/audit-logs`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );

    console.log("Org B Audit Count ->", alienQueryRes.body?.data?.items?.length, "(Expected 0 for Org B)");
    if (alienQueryRes.status !== 200 || alienQueryRes.body?.data?.items?.length !== 0) {
      throw new Error("Cross-tenant leakage: Org B admin retrieved Org A audit logs!");
    }

    // =========================================================================
    // [TEST 6] Platform Owner Oversight & Platform Scope
    // =========================================================================
    console.log("\n[TEST 6] Platform Owner Oversight Access...");

    const platformQueryRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/audit-logs`,
        headers: { Authorization: `Bearer ${platformToken}` },
      }
    );

    console.log("Platform Owner Audit Query -> Status:", platformQueryRes.status, "Total Logs:", platformQueryRes.body?.data?.items?.length);
    if (platformQueryRes.status !== 200 || (platformQueryRes.body?.data?.items?.length || 0) < 3) {
      throw new Error("Platform owner failed to access platform audit logs");
    }

    // =========================================================================
    // [TEST 7] Security Monitoring Engine & Automated Threat Alerts
    // =========================================================================
    console.log("\n[TEST 7] Security Monitoring Engine: Threshold Alerts...");

    // Simulate 3 failed login attempts
    await AuditLogService.createAuditLog({
      organizationId: orgA._id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resourceType: AUDIT_RESOURCES.SECURITY,
      severity: AUDIT_SEVERITIES.LOW,
      description: "Failed login attempt for user admin55@org-a.com",
      ipAddress: "203.0.113.42",
    });

    await AuditLogService.createAuditLog({
      organizationId: orgA._id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resourceType: AUDIT_RESOURCES.SECURITY,
      severity: AUDIT_SEVERITIES.LOW,
      description: "Failed login attempt for user admin55@org-a.com",
      ipAddress: "203.0.113.42",
    });

    await AuditLogService.createAuditLog({
      organizationId: orgA._id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resourceType: AUDIT_RESOURCES.SECURITY,
      severity: AUDIT_SEVERITIES.LOW,
      description: "Failed login attempt for user admin55@org-a.com",
      ipAddress: "203.0.113.42",
    });

    // Evaluate Security Monitoring Rule
    const secEval = await SecurityMonitoringService.evaluateEvent({
      organizationId: orgA._id,
      actorId: adminUser._id,
      eventType: AUDIT_ACTIONS.LOGIN_FAILED,
      ruleType: "FAILED_LOGIN",
      ipAddress: "203.0.113.42",
      description: "Brute force attack threshold reached for IP 203.0.113.42",
    });

    console.log("Security Threat Alert Triggered ->", secEval.alertTriggered, "Severity:", secEval.alertLog?.severity);
    if (!secEval.alertTriggered || secEval.alertLog?.severity !== "HIGH") {
      throw new Error("Security monitoring failed to trigger alert on threshold breach!");
    }

    // =========================================================================
    // [TEST 8] Audit Log Export & Self-Auditing
    // =========================================================================
    console.log("\n[TEST 8] Exporting Audit Logs as CSV & Self-Auditing Export Action...");

    const exportRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/audit-logs/export?format=CSV`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Audit Export Response -> Status:", exportRes.status, "Content-Type:", exportRes.headers?.["content-type"]);
    if (exportRes.status !== 200 || !exportRes.raw?.includes("Timestamp,Action,Resource")) {
      throw new Error("Audit CSV export format invalid");
    }

    // Verify export action itself generated an audit log
    const exportAudit = await AuditLog.findOne({ organizationId: orgA._id, action: AUDIT_ACTIONS.EXPORT });
    console.log("Self-Audited Export Record Found -> Action:", exportAudit?.action, "Resource:", exportAudit?.resource);
    if (!exportAudit) {
      throw new Error("Export action was not self-audited!");
    }

    // =========================================================================
    // [TEST 9] Retention Hold & Compliance Lifecycle
    // =========================================================================
    console.log("\n[TEST 9] Setting Retention Hold & Executing Retention Policy Cleanup...");

    // Mark audit1 with retention hold
    const holdRes = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/organizations/${orgA._id}/audit-logs/${audit1._id}/retention-hold`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { retentionHold: true }
    );

    console.log("Retention Hold Response -> Status:", holdRes.status, "Hold State:", holdRes.body?.data?.retentionHold);
    if (holdRes.status !== 200 || !holdRes.body?.data?.retentionHold) {
      throw new Error("Failed to set retention hold");
    }

    // Create an artificial old log with NO hold
    await AuditLog.collection.insertOne({
      organizationId: orgA._id,
      action: "READ",
      resource: "SYSTEM",
      description: "Ancient unheld routine log",
      severity: "INFO",
      retentionHold: false,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
    });

    // Execute retention purge policy (90 days)
    const purgeResult = await AuditLogService.applyRetentionPolicy(orgA._id, 90);
    console.log("Retention Policy Purge Executed -> Deleted Count:", purgeResult.deletedCount);
    if (purgeResult.deletedCount !== 1) {
      throw new Error(`Expected 1 expired non-held log deleted, found ${purgeResult.deletedCount}`);
    }

    // Verify held log is still intact
    const heldLogCheck = await AuditLog.findById(audit1._id);
    console.log("Held Log Integrity Verified -> Still Exists:", Boolean(heldLogCheck));
    if (!heldLogCheck) {
      throw new Error("CRITICAL COMPLIANCE BREACH: Retention-held audit log was erroneously deleted!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 55 AUDIT, COMPLIANCE & SECURITY GOVERNANCE TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep55Tests().catch((err) => {
  console.error("❌ Step 55 Test Suite Failed:", err);
  process.exit(1);
});
