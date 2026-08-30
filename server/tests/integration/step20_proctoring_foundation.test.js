import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Subject from "../../src/modules/subjects/subject.model.js";
import Program from "../../src/modules/programs/program.model.js";
import Department from "../../src/modules/departments/department.model.js";
import QuestionBank from "../../src/modules/questionBank/questionBank.model.js";
import Question from "../../src/modules/questionBank/question.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import AttemptQuestion from "../../src/modules/attemptQuestions/attemptQuestion.model.js";
import ProctoringSession from "../../src/modules/proctoring/proctoringSession.model.js";
import ProctoringEvent from "../../src/modules/proctoring/proctoringEvent.model.js";
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

const runStep20Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 20 Proctoring Foundation Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Roles & Clean Collections
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-20", "org-alien-20"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner20@test.com", "alice20@vu.edu.pk", "eve20@alien.com"] } });

    // 2. Setup Org A (Virtual University)
    const orgA = await Organization.create({
      name: "Virtual University 20",
      slug: "org-vu-20",
      code: "VU20",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Computer Science",
      code: "BSCS",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      programId: progA._id,
      name: "Computer Networks",
      code: "CN-20",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner20@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const vuExaminerToken = generateAccessToken({ sub: vuExaminer._id.toString() });

    await UserMembership.create({
      userId: vuExaminer._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    // Alice Candidate
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice20@vu.edu.pk",
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
      candidateCode: "VU-CAND-20",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice20@vu.edu.pk",
      status: "ACTIVE",
    });

    // Org B & Malicious Eve Candidate (For Isolation Testing)
    const orgB = await Organization.create({
      name: "Alien Org",
      slug: "org-alien-20",
      code: "ALIEN20",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve20@alien.com",
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

    await Candidate.create({
      organizationId: orgB._id,
      userId: eveUser._id,
      candidateCode: "ALIEN-CAND-20",
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve20@alien.com",
      status: "ACTIVE",
    });

    // 3. Setup Questions & Assessment
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "CN Bank",
      code: "CN-QB",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      prompt: "What is the default port for HTTP?",
      options: [{ id: "A", text: "80" }, { id: "B", text: "443" }],
      correctAnswer: ["A"],
      points: 10,
      status: "ACTIVE",
    });

    const assessmentA = await Assessment.create({
      organizationId: orgA._id,
      title: "Computer Networks Midterm",
      code: "CN-MID-20",
      type: "MCQ",
      subjectId: subjA._id,
      durationSeconds: 3600,
      passingScore: 60,
      totalPoints: 10,
      createdBy: vuExaminer._id,
      status: "PUBLISHED",
      settings: {
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

    const sectionA = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      title: "General Networking",
      order: 1,
    });

    await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      sectionId: sectionA._id,
      questionId: q1._id,
      type: q1.type,
      prompt: q1.prompt,
      options: q1.options,
      correctAnswer: q1.correctAnswer,
      points: 10,
      order: 1,
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      attemptLimit: 1,
    });

    // 4. Start Attempt for Alice
    const startAttemptRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/assignments/${assignment._id}/attempts`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const attemptId = startAttemptRes.body.data.id;

    console.log("\n[TEST 1] Start Proctoring Session...");
    const startProcRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/proctoring/start`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      cameraEnabled: true,
      microphoneEnabled: true,
      screenShareEnabled: true,
      browserInfo: { name: "Chrome", version: "128" },
      deviceInfo: { platform: "Win32", cores: 8 },
    });

    console.log("Start Proctoring Status ->", startProcRes.status, "Session Status:", startProcRes.body?.data?.session?.status);
    if (startProcRes.status !== 201 || startProcRes.body?.data?.session?.status !== "ACTIVE") {
      throw new Error("Test 1 Failed: Proctoring session could not be started!");
    }
    const sessionId = startProcRes.body.data.session._id;

    console.log("\n[TEST 2] Send Proctoring Heartbeat...");
    const hbRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/proctoring/${sessionId}/heartbeat`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Heartbeat Status ->", hbRes.status, "Heartbeat Ack:", hbRes.body?.data?.success);
    if (hbRes.status !== 200 || !hbRes.body?.data?.lastHeartbeatAt) throw new Error("Test 2 Failed: Heartbeat failed!");

    console.log("\n[TEST 3] Record Multiple Integrity Events & Calculate Cumulative Risk...");
    // 3.1 Tab switch (+5 pts)
    const evt1 = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/proctoring/${sessionId}/events`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      type: "TAB_SWITCH",
      clientEventId: "evt-uuid-1",
      metadata: { visibility: "hidden" },
    });
    console.log("Event 1 (TAB_SWITCH) -> Risk Score:", evt1.body?.data?.sessionRiskScore, "Risk Level:", evt1.body?.data?.sessionRiskLevel);
    if (evt1.body?.data?.sessionRiskScore !== 5 || evt1.body?.data?.sessionRiskLevel !== "LOW") throw new Error("Test 3.1 Failed");

    // 3.2 No Face Detected (+10 pts)
    const evt2 = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/proctoring/${sessionId}/events`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      type: "NO_FACE_DETECTED",
      clientEventId: "evt-uuid-2",
    });
    console.log("Event 2 (NO_FACE_DETECTED) -> Risk Score:", evt2.body?.data?.sessionRiskScore, "Risk Level:", evt2.body?.data?.sessionRiskLevel);
    if (evt2.body?.data?.sessionRiskScore !== 15 || evt2.body?.data?.sessionRiskLevel !== "LOW") throw new Error("Test 3.2 Failed");

    // 3.3 Multiple Faces (+25 pts) -> Total: 40 -> Level: MEDIUM
    const evt3 = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/proctoring/${sessionId}/events`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      type: "MULTIPLE_FACES_DETECTED",
      clientEventId: "evt-uuid-3",
      confidence: 0.95,
    });
    console.log("Event 3 (MULTIPLE_FACES_DETECTED) -> Risk Score:", evt3.body?.data?.sessionRiskScore, "Risk Level:", evt3.body?.data?.sessionRiskLevel);
    if (evt3.body?.data?.sessionRiskScore !== 40 || evt3.body?.data?.sessionRiskLevel !== "MEDIUM") throw new Error("Test 3.3 Failed");

    // 3.4 Screen Share Stopped (+20 pts) -> Total: 60 -> Level: HIGH
    const evt4 = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/proctoring/${sessionId}/events`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      type: "SCREEN_SHARE_STOPPED",
      clientEventId: "evt-uuid-4",
    });
    console.log("Event 4 (SCREEN_SHARE_STOPPED) -> Risk Score:", evt4.body?.data?.sessionRiskScore, "Risk Level:", evt4.body?.data?.sessionRiskLevel);
    if (evt4.body?.data?.sessionRiskScore !== 60 || evt4.body?.data?.sessionRiskLevel !== "HIGH") throw new Error("Test 3.4 Failed");
    const multiFaceEventId = evt3.body.data.event._id;

    console.log("\n[TEST 4] Test Client Event Deduplication (Idempotency)...");
    const dupRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/proctoring/${sessionId}/events`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      type: "TAB_SWITCH",
      clientEventId: "evt-uuid-1", // Same clientEventId as Event 1
    });
    console.log("Duplicate Event Ingestion Status ->", dupRes.status, "Deduplicated:", dupRes.body?.data?.deduplicated, "Risk Score:", dupRes.body?.data?.sessionRiskScore);
    if (!dupRes.body?.data?.deduplicated || dupRes.body?.data?.sessionRiskScore !== 60) {
      throw new Error("Test 4 Failed: Duplicate event was double-counted!");
    }

    console.log("\n[TEST 5] Examiner View: Session Details & Chronological Timeline...");
    const timelineRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/proctoring/sessions/${sessionId}/timeline`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Timeline Status ->", timelineRes.status, "Total Events in Timeline:", timelineRes.body?.data?.totalEvents, "Risk Score:", timelineRes.body?.data?.riskScore);
    if (timelineRes.status !== 200 || timelineRes.body?.data?.timeline?.length < 5) {
      throw new Error("Test 5 Failed: Timeline could not be retrieved!");
    }

    console.log("\n[TEST 6] Examiner Violation Review & Annotation...");
    const reviewRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/proctoring/events/${multiFaceEventId}/review`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      reviewed: true,
      reviewerNote: "Candidate parent briefly entered room to deliver water.",
    });
    console.log("Review Event Status ->", reviewRes.status, "Reviewed:", reviewRes.body?.data?.reviewed, "Note:", reviewRes.body?.data?.reviewerNote);
    if (reviewRes.status !== 200 || reviewRes.body?.data?.reviewed !== true || !reviewRes.body?.data?.reviewedBy) {
      throw new Error("Test 6 Failed: Examiner review annotation failed!");
    }

    console.log("\n[TEST 7] Cross-Tenant & IDOR Protection (Eve cannot access or post to Alice's session)...");
    const idorRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/proctoring/${sessionId}/events`,
      headers: { Authorization: `Bearer ${eveToken}` },
    }, {
      type: "TAB_SWITCH",
    });
    console.log("Eve Unauthorized Event Post ->", idorRes.status, "Success:", idorRes.body?.success);
    if (idorRes.status !== 403 && idorRes.status !== 404) {
      throw new Error("Test 7 Failed: Cross-tenant IDOR exploit was not blocked!");
    }

    console.log("\n[TEST 8] End Proctoring Session...");
    const endRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/proctoring/${sessionId}/end`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      reason: "Exam completed and submitted",
    });
    console.log("End Proctoring Status ->", endRes.status, "Final Session Status:", endRes.body?.data?.status);
    if (endRes.status !== 200 || endRes.body?.data?.status !== "ENDED") {
      throw new Error("Test 8 Failed: Proctoring session could not be ended!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 20 PROCTORING & EXAM INTEGRITY FOUNDATION TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 20 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep20Tests();
