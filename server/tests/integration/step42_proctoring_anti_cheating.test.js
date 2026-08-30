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
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import ProctoringSession from "../../src/modules/proctoring/proctoringSession.model.js";
import ProctoringEvent from "../../src/modules/proctoring/proctoringEvent.model.js";
import ProctoringEvidence from "../../src/modules/proctoring/proctoringEvidence.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { ASSESSMENT_STATUSES } from "../../src/constants/assessmentStatuses.js";
import { PROCTORING_EVENT_TYPES, PROCTORING_STATUSES } from "../../src/constants/proctoringConstants.js";
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

const runStep42Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 42 Proctoring & Anti-Cheating Engine Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const proctorRole = await Role.findOne({ name: ORGANIZATION_ROLES.PROCTOR });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-42", "org-alien-42"] } });
    await User.deleteMany({ email: { $in: ["proctor42@vu.edu.pk", "alice42@vu.edu.pk", "bob42@vu.edu.pk", "eve42@alien.com"] } });
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await ProctoringSession.deleteMany({});
    await ProctoringEvent.deleteMany({});
    await ProctoringEvidence.deleteMany({});

    // 2. Setup Organization A & Proctor/Examiner
    const orgA = await Organization.create({
      name: "Virtual University 42",
      slug: "org-vu-42",
      code: "VU42",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const proctorUser = await User.create({
      firstName: "Chief",
      lastName: "Proctor",
      email: "proctor42@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const proctorToken = generateAccessToken({ sub: proctorUser._id.toString() });

    await UserMembership.create({
      userId: proctorUser._id,
      organizationId: orgA._id,
      roleId: proctorRole._id,
      status: "ACTIVE",
    });

    // Alice Candidate
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Testtaker",
      email: "alice42@vu.edu.pk",
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
      candidateCode: "VU-CAND-42A",
      firstName: "Alice",
      lastName: "Testtaker",
      email: "alice42@vu.edu.pk",
      status: "ACTIVE",
    });

    // Bob Candidate (Unauthorized Impersonator)
    const bobUser = await User.create({
      firstName: "Bob",
      lastName: "Impostor",
      email: "bob42@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const bobToken = generateAccessToken({ sub: bobUser._id.toString() });

    await UserMembership.create({
      userId: bobUser._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    const bobCandidate = await Candidate.create({
      organizationId: orgA._id,
      userId: bobUser._id,
      candidateCode: "VU-CAND-42B",
      firstName: "Bob",
      lastName: "Impostor",
      email: "bob42@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 42",
      slug: "org-alien-42",
      code: "ALIEN42",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Snooper",
      email: "eve42@alien.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const eveToken = generateAccessToken({ sub: eveUser._id.toString() });

    await UserMembership.create({
      userId: eveUser._id,
      organizationId: orgB._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    // 3. Assessment & Active Attempt
    const asm = await Assessment.create({
      organizationId: orgA._id,
      title: "Advanced Cryptography & Security 42",
      code: "CS801-42",
      status: ASSESSMENT_STATUSES.PUBLISHED,
      publishedAt: new Date(),
      duration: { value: 60, unit: "MINUTES" },
      durationSeconds: 3600,
      totalPoints: 100,
      passingScore: 50,
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

    const aliceAssignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      accessCode: "SA-4242-ALICE",
      maxAttempts: 1,
    });

    const aliceAttempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      assignmentId: aliceAssignment._id,
      candidateId: aliceCandidate._id,
      attemptNumber: 1,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      durationSeconds: 3600,
      totalQuestions: 5,
      answeredQuestions: 0,
      totalPoints: 100,
    });

    console.log("\n[TEST 1] Candidate Ownership & Unauthorized Attempt Guard...");
    // Bob tries to start proctoring for Alice's attempt -> blocked
    const bobStartRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/start`,
      headers: { Authorization: `Bearer ${bobToken}` },
    }, {
      attemptId: aliceAttempt._id.toString(),
      cameraEnabled: true,
      microphoneEnabled: true,
      screenShareEnabled: true,
    });
    console.log("Bob Unauthorized Attempt Start Status ->", bobStartRes.status, "Message:", bobStartRes.body?.message);
    if (bobStartRes.status !== 404 && bobStartRes.status !== 403) {
      throw new Error("Test 1 Failed: Unauthorized candidate was able to start session for Alice's attempt!");
    }

    console.log("\n[TEST 2] Starting Proctoring Session & Hardware State Initialization...");
    const aliceStartRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/start`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      attemptId: aliceAttempt._id.toString(),
      cameraEnabled: true,
      microphoneEnabled: true,
      screenShareEnabled: true,
      browserInfo: { name: "Chrome", version: "128.0" },
      deviceInfo: { os: "Windows 11", platform: "Win32" },
    });
    console.log("Alice Start Status ->", aliceStartRes.status, "Session ID:", aliceStartRes.body?.data?.session?._id, "Camera:", aliceStartRes.body?.data?.session?.cameraEnabled);
    if (aliceStartRes.status !== 201 || !aliceStartRes.body?.data?.session?._id || aliceStartRes.body?.data?.session?.cameraEnabled !== true) {
      throw new Error("Test 2 Failed: Proctoring session creation failed!");
    }
    const sessionId = aliceStartRes.body.data.session._id;

    console.log("\n[TEST 3] Proctoring Heartbeat Keep-Alive...");
    const heartbeatRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/heartbeat`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Heartbeat Status ->", heartbeatRes.status, "Success:", heartbeatRes.body?.data?.success, "Last Heartbeat:", heartbeatRes.body?.data?.lastHeartbeatAt);
    if (heartbeatRes.status !== 200 || !heartbeatRes.body?.data?.lastHeartbeatAt) {
      throw new Error("Test 3 Failed: Proctoring heartbeat failed!");
    }

    console.log("\n[TEST 4] Integrity Event Ingestion & Server-Authoritative Risk Scoring...");
    // 4.1 Ingest Tab Switch (Low risk)
    const tabSwitchRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/events`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      type: PROCTORING_EVENT_TYPES.TAB_SWITCH,
      clientEventId: "EVT-42-01",
      duration: 3,
      metadata: { targetUrl: "https://google.com" },
    });
    console.log("Tab Switch Event Ingest Status ->", tabSwitchRes.status, "Severity:", tabSwitchRes.body?.data?.event?.severity, "Risk Score:", tabSwitchRes.body?.data?.sessionRiskScore);
    if (tabSwitchRes.status !== 201 || tabSwitchRes.body?.data?.event?.severity !== "LOW") {
      throw new Error("Test 4.1 Failed: Tab switch event ingestion or severity calculation failed!");
    }

    // 4.2 Ingest Multiple Faces Detected (High risk)
    const multiFaceRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/events`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      type: PROCTORING_EVENT_TYPES.MULTIPLE_FACES,
      clientEventId: "EVT-42-02",
      confidence: 0.95,
      metadata: { facesDetected: 2 },
    });
    console.log("Multiple Faces Event Status ->", multiFaceRes.status, "Severity:", multiFaceRes.body?.data?.event?.severity, "Risk Score:", multiFaceRes.body?.data?.sessionRiskScore, "Risk Level:", multiFaceRes.body?.data?.sessionRiskLevel);
    if (multiFaceRes.status !== 201 || multiFaceRes.body?.data?.event?.severity !== "HIGH" || multiFaceRes.body?.data?.sessionRiskScore <= 0) {
      throw new Error("Test 4.2 Failed: Multiple faces event severity or risk score calculation failed!");
    }
    const highRiskEventId = multiFaceRes.body.data.event._id;

    // 4.3 Hardware state transition via event (Camera disabled)
    const camDisableRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/events`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      type: PROCTORING_EVENT_TYPES.CAMERA_DISABLED,
      clientEventId: "EVT-42-03",
    });
    console.log("Camera Disabled Event Status ->", camDisableRes.status);
    const updatedSession = await ProctoringSession.findById(sessionId);
    if (updatedSession.cameraEnabled !== false) {
      throw new Error("Test 4.3 Failed: Session cameraEnabled state did not update on CAMERA_DISABLED event!");
    }

    console.log("\n[TEST 5] Evidence Ingestion & Secure Attachment...");
    const evidenceRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/evidence`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      eventId: highRiskEventId,
      type: "WEBCAM_SNAPSHOT",
      storageKey: "proctoring/snapshots/alice_42_multiface.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 104850,
      metadata: { resolution: "1280x720", confidence: 0.95 },
    });
    console.log("Evidence Ingestion Status ->", evidenceRes.status, "Evidence ID:", evidenceRes.body?.data?._id, "Storage Key:", evidenceRes.body?.data?.storageKey);
    if (evidenceRes.status !== 201 || !evidenceRes.body?.data?._id) {
      throw new Error("Test 5 Failed: Evidence ingestion failed!");
    }

    console.log("\n[TEST 6] Proctor Dashboard & Timeline Monitoring...");
    // 6.1 Proctor views session timeline
    const timelineRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/timeline`,
      headers: { Authorization: `Bearer ${proctorToken}` },
    });
    console.log("Proctor Timeline Status ->", timelineRes.status, "Total Events:", timelineRes.body?.data?.totalEvents, "Risk Score:", timelineRes.body?.data?.riskScore);
    if (timelineRes.status !== 200 || timelineRes.body?.data?.totalEvents < 3) {
      throw new Error("Test 6.1 Failed: Proctor could not retrieve session timeline!");
    }

    // 6.2 Candidate tries to access proctor timeline -> blocked
    const candTimelineRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/timeline`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Unauthorized Timeline Status ->", candTimelineRes.status);
    if (candTimelineRes.status !== 403) {
      throw new Error("Test 6.2 Failed: Candidate was able to access proctor timeline!");
    }

    console.log("\n[TEST 7] Live Proctor Interventions: Warnings & Session Control...");
    // 7.1 Send Warning
    const warnRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/warning`,
      headers: { Authorization: `Bearer ${proctorToken}` },
    }, {
      warningMessage: "Please ensure only one person is visible in front of the camera.",
    });
    console.log("Warning Status ->", warnRes.status, "Message:", warnRes.body?.data?.warning?.message);
    if (warnRes.status !== 200 || !warnRes.body?.data?.warning?.message) {
      throw new Error("Test 7.1 Failed: Proctor warning failed!");
    }

    // 7.2 Review Event (annotate & dismiss/resolve)
    const reviewRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/proctoring/events/${highRiskEventId}/review`,
      headers: { Authorization: `Bearer ${proctorToken}` },
    }, {
      reviewed: true,
      reviewerNote: "False alarm: Poster in background detected as second face.",
      resolution: "DISMISSED",
    });
    console.log("Review Event Status ->", reviewRes.status, "Reviewed:", reviewRes.body?.data?.reviewed, "Resolution:", reviewRes.body?.data?.resolution);
    if (reviewRes.status !== 200 || reviewRes.body?.data?.reviewed !== true) {
      throw new Error("Test 7.2 Failed: Event review failed!");
    }

    console.log("\n[TEST 8] Session Termination upon Exam Submission / Ending...");
    const endRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/end`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      reason: "Candidate submitted examination",
    });
    console.log("End Session Status ->", endRes.status, "Status:", endRes.body?.data?.status);
    if (endRes.status !== 200 || endRes.body?.data?.status !== PROCTORING_STATUSES.ENDED) {
      throw new Error("Test 8 Failed: Ending proctoring session failed!");
    }

    console.log("\n[TEST 9] Cross-Tenant Security Isolation...");
    const eveAlienRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}`,
      headers: { Authorization: `Bearer ${eveToken}` }, // Eve belongs to Org B
    });
    console.log("Eve Alien Access Status ->", eveAlienRes.status);
    if (eveAlienRes.status !== 403) {
      throw new Error("Test 9 Failed: Cross-tenant proctoring session access was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 42 PROCTORING & ANTI-CHEATING TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 42 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep42Tests();
