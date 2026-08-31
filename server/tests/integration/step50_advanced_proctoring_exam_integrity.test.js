import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import ProctoringSession from "../../src/modules/proctoring/proctoringSession.model.js";
import ProctoringEvent from "../../src/modules/proctoring/proctoringEvent.model.js";
import ProctoringEvidence from "../../src/modules/proctoring/proctoringEvidence.model.js";
import AuditLog from "../../src/modules/auditLogs/auditLog.model.js";
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

const runStep50Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 50 Advanced Proctoring & Exam Integrity Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean State
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const proctorRole = await Role.findOne({ name: ORGANIZATION_ROLES.PROCTOR });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-proctor-a", "org-proctor-b"] } });
    await User.deleteMany({ email: { $in: ["proctor50@org-a.com", "cand50@org-a.com", "hacker50@org-b.com"] } });
    await Assessment.deleteMany({});
    await Candidate.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await ProctoringSession.deleteMany({});
    await ProctoringEvent.deleteMany({});
    await ProctoringEvidence.deleteMany({});

    // 2. Setup Organization A & Proctor User
    const orgA = await Organization.create({
      name: "High Integrity Testing Center Alpha",
      slug: "org-proctor-a",
      code: "PROC-A",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const proctorUser = await User.create({
      firstName: "Inspector",
      lastName: "Holmes",
      email: "proctor50@org-a.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: proctorUser._id,
      organizationId: orgA._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const proctorToken = generateAccessToken({ sub: proctorUser._id.toString() });

    // 3. Setup Organization B & Adversary
    const orgB = await Organization.create({
      name: "Compromised Tenant Beta",
      slug: "org-proctor-b",
      code: "PROC-B",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const hackerUser = await User.create({
      firstName: "Mallory",
      lastName: "Snooper",
      email: "hacker50@org-b.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: hackerUser._id,
      organizationId: orgB._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const hackerToken = generateAccessToken({ sub: hackerUser._id.toString() });

    // 4. Setup Candidate in Org A
    const candidateUser = await User.create({
      firstName: "Grace",
      lastName: "Hopper",
      email: "cand50@org-a.com",
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

    const candProfile = await Candidate.create({
      organizationId: orgA._id,
      userId: candidateUser._id,
      candidateCode: "CAND-50-GRACE",
      firstName: "Grace",
      lastName: "Hopper",
      email: "cand50@org-a.com",
      status: "ACTIVE",
    });

    const candidateToken = generateAccessToken({ sub: candidateUser._id.toString() });

    // 5. Setup Assessment & Attempt
    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "CompSci Security & Cryptography Certification",
      code: "SEC-501",
      passingScore: 70,
      totalPoints: 100,
      status: "PUBLISHED",
      securitySettings: {
        proctoring: {
          enabled: true,
          requireCamera: true,
          requireMicrophone: true,
          requireScreenShare: true,
        },
      },
      createdBy: proctorUser._id,
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: candProfile._id,
      status: "IN_PROGRESS",
      validFrom: new Date(Date.now() - 3600000),
      validUntil: new Date(Date.now() + 86400000),
    });

    const attempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: candProfile._id,
      attemptNumber: 1,
      status: "IN_PROGRESS",
      startedAt: new Date(Date.now() - 600000),
      expiresAt: new Date(Date.now() + 3600000),
      durationSeconds: 3600,
      totalPoints: 100,
      totalMarks: 100,
    });

    // =========================================================================
    // [TEST 1] Starting Authorized Proctoring Session
    // =========================================================================
    console.log("\n[TEST 1] Starting Candidate Proctoring Session...");

    const startRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/proctoring/sessions/start`,
        headers: {
          Authorization: `Bearer ${candidateToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      },
      {
        attemptId: attempt._id.toString(),
        cameraEnabled: true,
        microphoneEnabled: true,
        screenShareEnabled: true,
        browserInfo: { userAgent: "Chrome/130.0", platform: "Win32" },
      }
    );

    console.log("Start Proctoring -> Status:", startRes.status, "Session ID:", startRes.body?.data?.session?._id);
    if (startRes.status !== 201) throw new Error(`Expected 201 for start proctoring, got ${startRes.status}`);

    const sessionId = startRes.body.data.session._id;

    // =========================================================================
    // [TEST 2] Server-Authoritative Heartbeat & Expiration Guard
    // =========================================================================
    console.log("\n[TEST 2] Server-Authoritative Heartbeat & Expiration Rejection...");

    // 2a. Valid Heartbeat
    const hbRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/proctoring/sessions/${sessionId}/heartbeat`,
        headers: {
          Authorization: `Bearer ${candidateToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      }
    );
    console.log("Valid Heartbeat -> Status:", hbRes.status, "Success:", hbRes.body?.data?.success);
    if (hbRes.status !== 200 || !hbRes.body?.data?.success) {
      throw new Error(`Expected 200 for valid heartbeat, got ${hbRes.status}`);
    }

    // 2b. Expired Attempt Heartbeat Rejection
    const expiredAttempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: candProfile._id,
      attemptNumber: 2,
      status: "IN_PROGRESS",
      startedAt: new Date(Date.now() - 7200000),
      expiresAt: new Date(Date.now() - 1000), // Already expired
      durationSeconds: 3600,
    });
    const expiredSession = await ProctoringSession.create({
      organizationId: orgA._id,
      attemptId: expiredAttempt._id,
      candidateId: candProfile._id,
      assessmentId: assessment._id,
      status: "ACTIVE",
    });

    const expHbRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/proctoring/sessions/${expiredSession._id}/heartbeat`,
        headers: {
          Authorization: `Bearer ${candidateToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      }
    );
    console.log("Expired Attempt Heartbeat -> Status:", expHbRes.status, "(Expected 400 Expired)");
    if (expHbRes.status !== 400) throw new Error(`Expected 400 on expired heartbeat, got ${expHbRes.status}`);

    // =========================================================================
    // [TEST 3] Server-Controlled Risk Calculation & Anti-Tampering
    // =========================================================================
    console.log("\n[TEST 3] Ingesting Integrity Events with Server-Controlled Risk Rules...");

    // Candidate client attempts to claim event is "INFO" with 0 risk, but it's a MULTIPLE_FACES event (High Risk: 30 pts)
    const event1Res = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/proctoring/sessions/${sessionId}/events`,
        headers: {
          Authorization: `Bearer ${candidateToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      },
      {
        type: "MULTIPLE_FACES",
        severity: "INFO", // Client tampering attempt
        riskScore: 0,     // Client tampering attempt
        confidence: 0.95,
        source: "AI_AGENT",
      }
    );

    console.log("Event 1 Ingestion -> Status:", event1Res.status, "Calculated Severity:", event1Res.body?.data?.event?.severity, "Session Risk:", event1Res.body?.data?.sessionRiskScore);
    if (event1Res.body?.data?.event?.severity !== "HIGH" || event1Res.body?.data?.sessionRiskScore < 25) {
      throw new Error(`Anti-tampering failed: Server must override client severity and calculate server-side risk!`);
    }

    // Second Event: SCREEN_SHARE_STOPPED (High Risk: 25 pts)
    const event2Res = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/proctoring/sessions/${sessionId}/events`,
        headers: {
          Authorization: `Bearer ${candidateToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      },
      {
        type: "SCREEN_SHARE_STOPPED",
        confidence: 1.0,
      }
    );

    console.log("Event 2 Ingestion -> Cumulative Risk:", event2Res.body?.data?.sessionRiskScore, "Risk Level:", event2Res.body?.data?.sessionRiskLevel);
    if (event2Res.body?.data?.sessionRiskScore < 50) {
      throw new Error(`Expected cumulative risk score >= 50, got ${event2Res.body?.data?.sessionRiskScore}`);
    }
    const highRiskEventId = event1Res.body.data.event._id;

    // =========================================================================
    // [TEST 4] Multimedia Evidence Ingestion & Secure Access
    // =========================================================================
    console.log("\n[TEST 4] Multimedia Evidence Ingestion & Scoped Retrieval...");

    const evRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/proctoring/sessions/${sessionId}/evidence`,
        headers: {
          Authorization: `Bearer ${candidateToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      },
      {
        type: "WEBCAM_SNAPSHOT",
        storageKey: "proctoring/evidence/snap_multi_face_001.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 145020,
      }
    );

    console.log("Create Evidence -> Status:", evRes.status, "Evidence ID:", evRes.body?.data?._id);
    if (evRes.status !== 201) throw new Error(`Expected 201 for evidence creation, got ${evRes.status}`);

    const getEvRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/evidence`,
        headers: { Authorization: `Bearer ${proctorToken}` },
      }
    );
    console.log("Retrieve Session Evidence List -> Count:", getEvRes.body?.data?.length);
    if (getEvRes.status !== 200 || getEvRes.body?.data?.length === 0) {
      throw new Error(`Expected 200 and >= 1 evidence record`);
    }

    // =========================================================================
    // [TEST 5] Proctor Live Review & False-Positive Risk Recalculation
    // =========================================================================
    console.log("\n[TEST 5] Proctor Review: Marking Event as False-Positive...");

    const reviewRes = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/organizations/${orgA._id}/proctoring/events/${highRiskEventId}/review`,
        headers: { Authorization: `Bearer ${proctorToken}` },
      },
      {
        reviewed: true,
        resolution: "FALSE_POSITIVE",
        reviewerNote: "Reflection in window erroneously detected as second face.",
      }
    );

    console.log("Review Event -> Status:", reviewRes.status, "Resolution:", reviewRes.body?.data?.resolution);
    if (reviewRes.status !== 200 || reviewRes.body?.data?.resolution !== "FALSE_POSITIVE") {
      throw new Error(`Expected 200 and FALSE_POSITIVE resolution, got ${reviewRes.status}`);
    }

    // Check recalculated session risk score (should have dropped after false-positive dismissal)
    const updatedSession = await ProctoringSession.findById(sessionId);
    console.log("Recalculated Session Risk Score ->", updatedSession.riskScore, "(Expected reduced score)");
    if (updatedSession.riskScore >= 50) {
      throw new Error(`Expected risk score to decrease after false-positive dismissal, but was ${updatedSession.riskScore}`);
    }

    // =========================================================================
    // [TEST 6] Integrity Decision & Disqualification Pipeline
    // =========================================================================
    console.log("\n[TEST 6] Proctor Integrity Decision & Disqualification...");

    const decisionRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/decision`,
        headers: { Authorization: `Bearer ${proctorToken}` },
      },
      {
        decision: "DISQUALIFIED",
        note: "Candidate admitted to using unauthorized secondary display.",
      }
    );

    console.log("Set Decision Status ->", decisionRes.status, "Integrity Status:", decisionRes.body?.data?.integrityStatus, "Session Status:", decisionRes.body?.data?.status);
    if (decisionRes.status !== 200 || decisionRes.body?.data?.integrityStatus !== "DISQUALIFIED") {
      throw new Error(`Expected 200 and DISQUALIFIED integrity status, got ${decisionRes.status}`);
    }

    // Verify Attempt was automatically terminated
    const terminatedAttempt = await Attempt.findById(attempt._id);
    console.log("Attempt Status in DB ->", terminatedAttempt.status, "(Expected TERMINATED)");
    if (terminatedAttempt.status !== "TERMINATED") {
      throw new Error(`Expected attempt status TERMINATED, got ${terminatedAttempt.status}`);
    }

    // =========================================================================
    // [TEST 7] Cross-Tenant Security Isolation Guards
    // =========================================================================
    console.log("\n[TEST 7] Cross-Tenant Isolation Tests (Tenant B vs Tenant A)...");

    // Tenant B cannot view Tenant A's proctoring session
    const crossSessionRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/proctoring/sessions/${sessionId}`,
        headers: { Authorization: `Bearer ${hackerToken}` },
      }
    );
    console.log("Cross-Tenant Session Access -> Status:", crossSessionRes.status, "(Expected 404)");
    if (crossSessionRes.status !== 404) throw new Error(`Expected 404, got ${crossSessionRes.status}`);

    // =========================================================================
    // [TEST 8] Audit Log Verification
    // =========================================================================
    console.log("\n[TEST 8] Verifying Security Audit Trail...");

    const auditCount = await AuditLog.countDocuments({ organizationId: orgA._id });
    console.log("Audit Logs Recorded for Org A ->", auditCount);
    if (auditCount === 0) {
      throw new Error("Expected audit logs to be created for proctoring operations");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 50 ADVANCED PROCTORING & EXAM INTEGRITY TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep50Tests().catch((err) => {
  console.error("❌ Step 50 Test Suite Failed:", err);
  process.exit(1);
});
