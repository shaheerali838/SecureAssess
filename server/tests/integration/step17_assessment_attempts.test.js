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

const runStep17Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 17 Assessment Attempts Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-17", "org-saylani-17"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner17@test.com", "alice17@vu.edu.pk", "charlie17@saylani.edu.pk"] } });

    // 2. Setup Org A
    const orgA = await Organization.create({
      name: "Virtual University 17",
      slug: "org-vu-17",
      code: "VU17",
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
      name: "Data Structures",
      code: "DS-17",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner17@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: vuExaminer._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    // Alice (Candidate in Org A)
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice17@vu.edu.pk",
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
      candidateCode: "VU-CAND-17",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice17@vu.edu.pk",
      status: "ACTIVE",
    });

    // 3. Setup Org B & Charlie
    const orgB = await Organization.create({
      name: "Saylani 17",
      slug: "org-saylani-17",
      code: "SA17",
      type: "TRAINING_INSTITUTE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const charlieUser = await User.create({
      firstName: "Charlie",
      lastName: "Saylani",
      email: "charlie17@saylani.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const charlieToken = generateAccessToken({ sub: charlieUser._id.toString() });

    await UserMembership.create({
      userId: charlieUser._id,
      organizationId: orgB._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    await Candidate.create({
      organizationId: orgB._id,
      userId: charlieUser._id,
      candidateCode: "SA-CAND-17",
      firstName: "Charlie",
      lastName: "Saylani",
      email: "charlie17@saylani.edu.pk",
      status: "ACTIVE",
    });

    // 4. Create Assessment, Section, Questions, and Assignment
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "DS Bank",
      code: "DS-QB",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      prompt: "Which data structure follows FIFO principle?",
      options: [
        { id: "A", text: "Stack" },
        { id: "B", text: "Queue" },
        { id: "C", text: "Tree" },
      ],
      correctAnswer: ["B"],
      points: 5,
      status: "ACTIVE",
    });

    const assessmentA = await Assessment.create({
      organizationId: orgA._id,
      title: "Data Structures Final 2026",
      code: "DS-FIN-17",
      type: "MCQ",
      subjectId: subjA._id,
      durationSeconds: 3600, // 1 hour
      passingScore: 60,
      createdBy: vuExaminer._id,
      status: "PUBLISHED",
      settings: {
        shuffleQuestions: true,
        shuffleOptions: true,
        maxAttempts: 1,
      },
    });

    const sectionA = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      title: "Section 1: Linear DS",
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
      points: 5,
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      attemptLimit: 1,
    });

    console.log("\n[TEST 1] Start Attempt & Materialize Attempt Questions...");
    const startAttemptRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/assignments/${assignment._id}/attempts`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Start Attempt Status ->", startAttemptRes.status, "Attempt ID:", startAttemptRes.body?.data?.id);
    if (startAttemptRes.status !== 201 || startAttemptRes.body?.data?.status !== "IN_PROGRESS") throw new Error("Test 1.1 Failed");
    const attemptId = startAttemptRes.body.data.id;

    // Verify AttemptQuestions were created
    const attemptQuestionsInDb = await AttemptQuestion.find({ attemptId });
    console.log("Materialized Attempt Questions Count:", attemptQuestionsInDb.length);
    if (attemptQuestionsInDb.length !== 1) throw new Error("Test 1.2 Failed: Attempt questions were not created!");

    console.log("\n[TEST 2] Duplicate Active Attempt Protection & Resume Support...");
    // Calling start attempt again while IN_PROGRESS -> returns same attempt (resumes, does not create 2nd attempt)
    const resumeAttemptRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/assignments/${assignment._id}/attempts`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Resume Attempt Status ->", resumeAttemptRes.status, "Returned Attempt ID:", resumeAttemptRes.body?.data?.id);
    const totalAttemptsInDb = await Attempt.countDocuments({ assignmentId: assignment._id });
    console.log("Total Attempts In DB:", totalAttemptsInDb, "(Expected: 1)");
    if (resumeAttemptRes.body?.data?.id !== attemptId || totalAttemptsInDb !== 1) {
      throw new Error("Test 2 Failed: Duplicate active attempt was created!");
    }

    console.log("\n[TEST 3] Fetch Attempt & Attempt Questions (Candidate Answer Protection)...");
    const getAttemptRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Get Attempt Status ->", getAttemptRes.status, "Status:", getAttemptRes.body?.data?.status);
    if (getAttemptRes.status !== 200) throw new Error("Test 3.1 Failed");

    const getQuestionsRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Get Attempt Questions Status ->", getQuestionsRes.status);
    const candidateQuestion = getQuestionsRes.body?.data?.[0];
    console.log("Candidate Question prompt:", candidateQuestion?.prompt);
    console.log("Candidate Question correctAnswer leaked?", candidateQuestion?.correctAnswer !== undefined);
    if (candidateQuestion?.correctAnswer !== undefined) {
      throw new Error("Test 3.2 Failed: Answer leaked in candidate attempt question delivery!");
    }

    console.log("\n[TEST 4] Heartbeat Activity Tracking...");
    const heartbeatRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/heartbeat`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Heartbeat Status ->", heartbeatRes.status, "Time Remaining (s):", heartbeatRes.body?.data?.timeRemainingSeconds);
    if (heartbeatRes.status !== 200 || heartbeatRes.body?.data?.timeRemainingSeconds <= 0) throw new Error("Test 4 Failed");

    console.log("\n[TEST 5] Submit Attempt & Locking...");
    const submitRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Submit Attempt Status ->", submitRes.status, "New Status:", submitRes.body?.data?.status);
    if (submitRes.status !== 200 || submitRes.body?.data?.status !== "SUBMITTED") throw new Error("Test 5.1 Failed");

    // Submitting again -> 400 Bad Request (Locked)
    const reSubmitRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Re-Submit Attempt Status ->", reSubmitRes.status, "(Expected: 400)");
    if (reSubmitRes.status !== 400) throw new Error("Test 5.2 Failed: Re-submitting was allowed!");

    console.log("\n[TEST 6] Attempt Limit Enforcement After Submission...");
    // AttemptLimit was 1. Alice has submitted attempt 1. Starting attempt 2 -> 403 Forbidden
    const startAttempt2Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/assignments/${assignment._id}/attempts`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Start Attempt 2 (Exceeding Limit) ->", startAttempt2Res.status, "(Expected: 403)");
    if (startAttempt2Res.status !== 403) throw new Error("Test 6 Failed: Attempt limit was not enforced!");

    console.log("\n[TEST 7] IDOR Prevention & Tenant Isolation...");
    // Charlie from Org B attempts to access Alice's attempt
    const idorRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}`,
      headers: { Authorization: `Bearer ${charlieToken}` },
    });
    console.log("Charlie accessing Alice's Attempt ->", idorRes.status, "(Expected: 403 or 404)");
    if (idorRes.status !== 403 && idorRes.status !== 404) throw new Error("Test 7 Failed: IDOR vulnerability detected!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 17 ASSESSMENT ATTEMPTS TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 17 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep17Tests();
