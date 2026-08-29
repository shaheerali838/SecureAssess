import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Department from "../../src/modules/departments/department.model.js";
import Program from "../../src/modules/programs/program.model.js";
import Subject from "../../src/modules/subjects/subject.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
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
            resolve({ status: res.statusCode, body: parsed });
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

const runStep30Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 30 Proctoring & Exam Security Engine Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state & Roles
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const proctorRole = await Role.findOne({ name: ORGANIZATION_ROLES.PROCTOR });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-30", "org-alien-30"] } });
    await User.deleteMany({ email: { $in: ["vu.proctor30@test.com", "alice30@vu.edu.pk", "eve30@alien.com"] } });
    await Assessment.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await ProctoringSession.deleteMany({});
    await ProctoringEvent.deleteMany({});
    await ProctoringEvidence.deleteMany({});
    await AuditLog.deleteMany({});

    // 2. Setup Organizations & Users
    const orgA = await Organization.create({
      name: "Virtual University 30",
      slug: "org-vu-30",
      code: "VU30",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS30",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Computer Science",
      code: "BSCS30",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Network Security",
      code: "CS-504",
    });

    const vuProctor = await User.create({
      firstName: "VU",
      lastName: "Proctor",
      email: "vu.proctor30@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const vuProctorToken = generateAccessToken({ sub: vuProctor._id.toString() });

    await UserMembership.create({
      userId: vuProctor._id,
      organizationId: orgA._id,
      roleId: proctorRole._id,
      status: "ACTIVE",
    });

    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice30@vu.edu.pk",
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

    const aliceCandidate = await Candidate.create({
      organizationId: orgA._id,
      userId: aliceUser._id,
      candidateCode: "VU-CAND-30",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice30@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 30",
      slug: "org-alien-30",
      code: "ALIEN30",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve30@alien.com",
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

    // 3. Proctored Assessment Setup
    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Network Security High Stakes Final",
      code: "CS504-FINAL-2026",
      type: "HYBRID",
      createdBy: vuProctor._id,
      subjectId: subjA._id,
      departmentId: deptA._id,
      programId: progA._id,
      duration: { value: 60, unit: "MINUTES" },
      durationSeconds: 3600,
      totalPoints: 50,
      status: "PUBLISHED",
      securitySettings: {
        proctoring: {
          enabled: true,
          requireCamera: true,
          requireMicrophone: true,
          requireScreenShare: true,
          detectTabSwitch: true,
          detectFullscreenExit: true,
          detectMultipleFaces: true,
        },
      },
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      attemptsAllowed: 1,
    });

    const attempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: aliceCandidate._id,
      attemptNumber: 1,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
      durationSeconds: 3600,
    });

    console.log("\n[TEST 1] Candidate Starts Proctoring Session...");
    const startProcRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/sessions/start?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      attemptId: attempt._id.toString(),
      cameraEnabled: true,
      microphoneEnabled: true,
      screenShareEnabled: true,
      browserInfo: { userAgent: "Mozilla/5.0 Test Suite", platform: "Win32" },
    });

    console.log("Start Proctoring Status ->", startProcRes.status, "Session Status:", startProcRes.body?.data?.session?.status, "Integrity Status:", startProcRes.body?.data?.session?.integrityStatus);
    if (startProcRes.status !== 201 || startProcRes.body?.data?.session?.status !== "ACTIVE" || startProcRes.body?.data?.session?.integrityStatus !== "CLEAR") {
      throw new Error("Test 1 Failed: Start proctoring session failed!");
    }
    const sessionId = startProcRes.body.data.session._id;

    console.log("\n[TEST 2] Ingest Security Events & Calculate Server Risk Score...");
    // 2.1 Tab Switch Event (+5 points)
    const tabRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/events?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      sessionId,
      type: "TAB_SWITCH",
      clientEventId: "evt_tab_001",
      metadata: { url: "https://google.com" },
    });
    console.log("Tab Switch Event -> Status:", tabRes.status, "Risk Score:", tabRes.body?.data?.sessionRiskScore, "Risk Level:", tabRes.body?.data?.sessionRiskLevel);
    if (tabRes.status !== 201 || tabRes.body?.data?.sessionRiskScore !== 5 || tabRes.body?.data?.sessionRiskLevel !== "LOW") {
      throw new Error("Test 2.1 Failed: Tab switch risk calculation failed!");
    }

    // 2.2 Fullscreen Exit (+10 points -> Total: 15)
    const fsRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/events?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      sessionId,
      type: "FULLSCREEN_EXIT",
      clientEventId: "evt_fs_001",
    });
    console.log("Fullscreen Exit -> Risk Score:", fsRes.body?.data?.sessionRiskScore, "Risk Level:", fsRes.body?.data?.sessionRiskLevel);
    if (fsRes.body?.data?.sessionRiskScore !== 15) {
      throw new Error("Test 2.2 Failed: Fullscreen exit score increment failed!");
    }

    // 2.3 Camera Disabled (+20 points -> Total: 35 -> MEDIUM)
    const camRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/events?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      sessionId,
      type: "CAMERA_DISABLED",
      clientEventId: "evt_cam_001",
    });
    console.log("Camera Disabled -> Risk Score:", camRes.body?.data?.sessionRiskScore, "Risk Level:", camRes.body?.data?.sessionRiskLevel);
    if (camRes.body?.data?.sessionRiskScore !== 35 || camRes.body?.data?.sessionRiskLevel !== "MEDIUM") {
      throw new Error("Test 2.3 Failed: Camera disabled level transition failed!");
    }

    // 2.4 Multiple Faces Detected via AI with confidence 0.95 (+29/30 points -> Total >= 64 -> HIGH)
    const aiRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/events?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      sessionId,
      type: "MULTIPLE_FACES",
      clientEventId: "evt_faces_001",
      confidence: 0.95,
      source: "AI_AGENT",
    });
    console.log("Multiple Faces (AI) -> Risk Score:", aiRes.body?.data?.sessionRiskScore, "Risk Level:", aiRes.body?.data?.sessionRiskLevel, "Integrity Status:", aiRes.body?.data?.integrityStatus);
    if (aiRes.body?.data?.sessionRiskLevel !== "HIGH" || aiRes.body?.data?.integrityStatus !== "HIGH_RISK") {
      throw new Error("Test 2.4 Failed: AI event high risk transition failed!");
    }

    console.log("\n[TEST 3] Event Deduplication & Throttling...");
    // Submitting duplicate clientEventId
    const dupRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/events?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      sessionId,
      type: "MULTIPLE_FACES",
      clientEventId: "evt_faces_001",
    });
    console.log("Duplicate Event Ingestion -> Deduplicated:", dupRes.body?.data?.deduplicated, "Risk Score:", dupRes.body?.data?.sessionRiskScore);
    if (!dupRes.body?.data?.deduplicated || dupRes.body?.data?.sessionRiskScore !== aiRes.body?.data?.sessionRiskScore) {
      throw new Error("Test 3 Failed: Deduplication failed to prevent risk score inflation!");
    }

    console.log("\n[TEST 4] Multimedia Evidence Ingestion & Query...");
    const evidence = await ProctoringEvidence.create({
      organizationId: orgA._id,
      proctoringSessionId: sessionId,
      attemptId: attempt._id,
      candidateId: aliceCandidate._id,
      type: "WEBCAM_SNAPSHOT",
      storageKey: "proctoring/evidence/snapshot_multiple_faces_01.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 145200,
    });

    const evidenceListRes = await request(server, {
      method: "GET",
      path: `/api/v1/proctoring/sessions/${sessionId}/evidence?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuProctorToken}` },
    });
    console.log("Session Evidence Count ->", evidenceListRes.body?.data?.length, "Storage Key:", evidenceListRes.body?.data?.[0]?.storageKey);
    if (evidenceListRes.status !== 200 || evidenceListRes.body?.data?.length !== 1) {
      throw new Error("Test 4 Failed: Evidence retrieval failed!");
    }

    console.log("\n[TEST 5] Proctor Live Supervision: Timeline, Warning, & Review...");
    // 5.1 Proctor inspects timeline
    const timelineRes = await request(server, {
      method: "GET",
      path: `/api/v1/proctoring/sessions/${sessionId}/timeline?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuProctorToken}` },
    });
    console.log("Timeline Events Count ->", timelineRes.body?.data?.totalEvents, "Risk Level:", timelineRes.body?.data?.riskLevel);
    if (timelineRes.status !== 200 || timelineRes.body?.data?.totalEvents < 4) {
      throw new Error("Test 5.1 Failed: Proctor timeline inspection failed!");
    }

    // 5.2 Proctor issues warning
    const warnRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/sessions/${sessionId}/warning?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuProctorToken}` },
    }, {
      message: "Please ensure unauthorized persons leave the room immediately.",
    });
    console.log("Proctor Warning Status ->", warnRes.status, "Warning Dispatched:", warnRes.body?.data?.warning?.message);
    if (warnRes.status !== 200 || !warnRes.body?.data?.warning?.message) {
      throw new Error("Test 5.2 Failed: Proctor warning dispatch failed!");
    }

    // 5.3 Candidate Heartbeat receives warning
    const hbRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/candidate/proctoring/${sessionId}/heartbeat?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Heartbeat Warnings Received ->", hbRes.body?.data?.warnings?.length);
    if (hbRes.status !== 200 || hbRes.body?.data?.warnings?.length !== 1) {
      throw new Error("Test 5.3 Failed: Candidate did not receive proctor warning in heartbeat!");
    }

    // 5.4 Proctor Reviews & Annotates Anomaly Event
    const reviewRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/proctoring/events/${aiRes.body?.data?.event?._id}/review?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuProctorToken}` },
    }, {
      reviewed: true,
      resolution: "CONFIRMED_VIOLATION",
      reviewerNote: "Confirmed second individual present during exam session.",
    });
    console.log("Event Review Status ->", reviewRes.status, "Reviewed:", reviewRes.body?.data?.reviewed, "Resolution:", reviewRes.body?.data?.resolution);
    if (reviewRes.status !== 200 || !reviewRes.body?.data?.reviewed || reviewRes.body?.data?.resolution !== "CONFIRMED_VIOLATION") {
      throw new Error("Test 5.4 Failed: Proctor event review failed!");
    }

    console.log("\n[TEST 6] Proctor Terminates Candidate Attempt for Cheating...");
    const termRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/sessions/${sessionId}/terminate?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuProctorToken}` },
    }, {
      reason: "Confirmed unauthorized assistance and multiple persons present.",
    });

    console.log("Termination Status ->", termRes.status, "Session Status:", termRes.body?.data?.status, "Integrity Status:", termRes.body?.data?.integrityStatus);
    if (termRes.status !== 200 || termRes.body?.data?.status !== "TERMINATED" || termRes.body?.data?.integrityStatus !== "CONFIRMED_VIOLATION") {
      throw new Error("Test 6 Failed: Proctor session termination failed!");
    }

    // Verify attempt also updated to TERMINATED
    const updatedAttempt = await Attempt.findById(attempt._id);
    console.log("Attempt Post-Termination Status ->", updatedAttempt.status, "Reason:", updatedAttempt.terminationReason);
    if (updatedAttempt.status !== "TERMINATED" || !updatedAttempt.terminationReason) {
      throw new Error("Test 6 Failed: Attempt status did not transition to TERMINATED!");
    }

    console.log("\n[TEST 7] Cross-Tenant & Unauthorized Access Isolation...");
    // 7.1 Candidate cannot terminate session
    const candTermRes = await request(server, {
      method: "POST",
      path: `/api/v1/proctoring/sessions/${sessionId}/terminate?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, { reason: "Self termination" });
    console.log("Candidate Termination Attempt -> Status:", candTermRes.status);
    if (candTermRes.status !== 403) {
      throw new Error("Test 7.1 Failed: Candidate was not blocked from terminating proctoring session!");
    }

    // 7.2 Alien Eve cannot view Org A proctoring session
    const eveViewRes = await request(server, {
      method: "GET",
      path: `/api/v1/proctoring/sessions/${sessionId}?organizationId=${orgB._id}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Access to Org A Session -> Status:", eveViewRes.status);
    if (eveViewRes.status !== 403 && eveViewRes.status !== 404) {
      throw new Error("Test 7.2 Failed: Cross-tenant session inspection was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 30 PROCTORING & EXAM SECURITY ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 30 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep30Tests();
