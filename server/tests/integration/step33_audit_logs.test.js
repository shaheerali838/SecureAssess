import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import AuditLog from "../../src/modules/auditLogs/auditLog.model.js";
import { AuditLogService } from "../../src/modules/auditLogs/auditLog.service.js";
import {
  ACTOR_TYPES,
  AUDIT_SCOPES,
  AUDIT_STATUSES,
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
} from "../../src/modules/auditLogs/auditLog.constants.js";
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
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runStep33Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 33 Audit Logs & Security Activity Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const platformOwnerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-33", "org-alien-33"] } });
    await User.deleteMany({ email: { $in: ["vu.admin33@test.com", "alice33@vu.edu.pk", "eve33@alien.com"] } });
    await AuditLog.deleteMany({}, { bypassImmutability: true });

    // 2. Setup Organizations & Users
    const orgA = await Organization.create({
      name: "Virtual University 33",
      slug: "org-vu-33",
      code: "VU33",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const vuAdmin = await User.create({
      firstName: "VU",
      lastName: "Admin",
      email: "vu.admin33@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const vuAdminToken = generateAccessToken({ sub: vuAdmin._id.toString() });

    await UserMembership.create({
      userId: vuAdmin._id,
      organizationId: orgA._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice33@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const aliceToken = generateAccessToken({ sub: aliceUser._id.toString() });

    await UserMembership.create({
      userId: aliceUser._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 33",
      slug: "org-alien-33",
      code: "ALIEN33",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve33@alien.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const eveToken = generateAccessToken({ sub: eveUser._id.toString() });

    await UserMembership.create({
      userId: eveUser._id,
      organizationId: orgB._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    console.log("\n[TEST 1] Creating Core, System, and Security Audit Logs with Sanitization...");
    // 1.1 Core Assessment Create Log
    const assessLog = await AuditLogService.createAuditLog({
      organizationId: orgA._id,
      actorId: vuAdmin._id,
      action: AUDIT_ACTIONS.CREATE,
      resource: AUDIT_RESOURCES.ASSESSMENT,
      resourceId: "65abc0000000000000000001",
      description: "Assessment CS601-Final created by VU Admin",
      metadata: {
        title: "CS601 Final Exam",
        password: "secretPassword123", // should be redacted
        token: "jwt.token.abc", // should be redacted
      },
      ipAddress: "192.168.1.50",
      requestId: "REQ-20260829-001",
    });

    console.log("Assessment Log Action:", assessLog.action, "Redacted token:", assessLog.metadata?.token);
    if (assessLog.action !== "CREATE" || assessLog.metadata?.password !== "[REDACTED]" || assessLog.metadata?.token !== "[REDACTED]") {
      throw new Error("Test 1.1 Failed: Sensitive metadata was not sanitized!");
    }

    // 1.2 System Audit Log
    const sysLog = await AuditLogService.createSystemAuditLog({
      organizationId: orgA._id,
      action: AUDIT_ACTIONS.TERMINATE,
      resource: AUDIT_RESOURCES.ATTEMPT,
      resourceId: "65abc0000000000000000002",
      description: "Exam attempt auto-expired by background job",
    });
    console.log("System Log ActorType:", sysLog.actorType, "Scope:", sysLog.scope);
    if (sysLog.actorType !== ACTOR_TYPES.SYSTEM || sysLog.scope !== AUDIT_SCOPES.ORGANIZATION) {
      throw new Error("Test 1.2 Failed: System audit log creation failed!");
    }

    // 1.3 Security Event Log (Token Reuse Detection)
    const secLog = await AuditLogService.createSecurityAuditLog({
      organizationId: orgA._id,
      actorId: aliceUser._id,
      action: AUDIT_ACTIONS.TOKEN_REUSE_DETECTED,
      resource: AUDIT_RESOURCES.SECURITY,
      description: "Compromised refresh token reuse detected for Alice",
      status: AUDIT_STATUSES.WARNING,
      requestId: "REQ-SEC-999",
      sendAlert: false,
    });
    console.log("Security Log Action:", secLog.action, "Status:", secLog.status);
    if (secLog.action !== "TOKEN_REUSE_DETECTED" || secLog.status !== "WARNING") {
      throw new Error("Test 1.3 Failed: Security audit log creation failed!");
    }

    console.log("\n[TEST 2] Querying and Filtering Audit Logs via API...");
    const getLogsRes = await request(server, {
      method: "GET",
      path: `/api/v1/audit-logs?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });

    console.log("Query Logs Status ->", getLogsRes.status, "Total Logs:", getLogsRes.body?.data?.pagination?.total);
    if (getLogsRes.status !== 200 || getLogsRes.body?.data?.pagination?.total !== 3) {
      throw new Error("Test 2 Failed: Audit log query failed!");
    }

    // Filter by Resource = ASSESSMENT
    const filterRes = await request(server, {
      method: "GET",
      path: `/api/v1/audit-logs?organizationId=${orgA._id}&resource=ASSESSMENT`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });
    console.log("Filtered Logs Count ->", filterRes.body?.data?.items?.length);
    if (filterRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 2 Failed: Audit log filtering by resource failed!");
    }

    // Search by Request ID
    const searchRes = await request(server, {
      method: "GET",
      path: `/api/v1/audit-logs?organizationId=${orgA._id}&search=REQ-SEC-999`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });
    console.log("Search by Request ID Count ->", searchRes.body?.data?.items?.length);
    if (searchRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 2 Failed: Audit log search by requestId failed!");
    }

    console.log("\n[TEST 3] Resource and User Specific Audit Log Lookups...");
    // 3.1 Resource Audit Logs
    const resLogs = await request(server, {
      method: "GET",
      path: `/api/v1/audit-logs/resource/ASSESSMENT/65abc0000000000000000001?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });
    console.log("Resource Lookup Status ->", resLogs.status, "Count:", resLogs.body?.data?.items?.length);
    if (resLogs.status !== 200 || resLogs.body?.data?.items?.length !== 1) {
      throw new Error("Test 3.1 Failed: Resource audit log lookup failed!");
    }

    // 3.2 Single Log Details
    const singleLog = await request(server, {
      method: "GET",
      path: `/api/v1/audit-logs/${assessLog._id}?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });
    console.log("Single Log Lookup Status ->", singleLog.status, "Action:", singleLog.body?.data?.action);
    if (singleLog.status !== 200 || singleLog.body?.data?.action !== "CREATE") {
      throw new Error("Test 3.2 Failed: Single audit log detail lookup failed!");
    }

    console.log("\n[TEST 4] Authorization Failure & Tenant Security Event Auditing...");
    // 4.1 Non-platform user accessing platform overview -> PERMISSION_DENIED
    await request(server, {
      method: "GET",
      path: `/api/v1/reports/platform/overview`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });

    // 4.2 Cross-tenant access attempt -> TENANT_ACCESS_DENIED
    await request(server, {
      method: "GET",
      path: `/api/v1/audit-logs?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });

    const deniedLogs = await AuditLog.find({ action: { $in: [AUDIT_ACTIONS.PERMISSION_DENIED, AUDIT_ACTIONS.TENANT_ACCESS_DENIED] } });
    console.log("Captured Authorization Security Audits Count:", deniedLogs.length);
    if (deniedLogs.length < 2) {
      throw new Error("Test 4 Failed: Authorization security audits were not automatically captured!");
    }

    console.log("\n[TEST 5] Audit Log Export & Self-Audit Trail...");
    const exportRes = await request(server, {
      method: "GET",
      path: `/api/v1/audit-logs/export?organizationId=${orgA._id}&format=CSV`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });

    console.log("Export Status ->", exportRes.status, "CSV Length:", exportRes.raw?.length);
    if (exportRes.status !== 200 || !exportRes.raw?.includes("Action")) {
      throw new Error("Test 5 Failed: Audit log CSV export failed!");
    }

    // Verify self-audited EXPORT log
    const exportAuditEntry = await AuditLog.findOne({ action: AUDIT_ACTIONS.EXPORT, resource: AUDIT_RESOURCES.AUDIT_LOG });
    console.log("Export Self-Audit Found:", exportAuditEntry?.action, "Resource:", exportAuditEntry?.resource);
    if (!exportAuditEntry) {
      throw new Error("Test 5 Failed: Audit log export was not self-audited!");
    }

    console.log("\n[TEST 6] Immutability & Tamper Resistance Guard...");
    let mutationBlocked = false;
    try {
      await AuditLog.updateOne({ _id: assessLog._id }, { action: "TAMPERED" });
    } catch (err) {
      mutationBlocked = true;
      console.log("Immutability Guard Caught Mutation:", err.message);
    }

    if (!mutationBlocked) {
      throw new Error("Test 6 Failed: Audit log immutability was bypassed!");
    }

    console.log("\n[TEST 7] Platform Owner Platform-Wide Audit Visibility...");
    const platformLogsRes = await request(server, {
      method: "GET",
      path: `/api/v1/audit-logs`,
      headers: { Authorization: `Bearer ${platformOwnerToken}` },
    });

    console.log("Platform Owner Audit Logs Status ->", platformLogsRes.status, "Total Platform Logs:", platformLogsRes.body?.data?.pagination?.total);
    if (platformLogsRes.status !== 200 || platformLogsRes.body?.data?.pagination?.total < 5) {
      throw new Error("Test 7 Failed: Platform owner platform audit query failed!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 33 AUDIT LOGS & SECURITY ACTIVITY TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 33 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep33Tests();
