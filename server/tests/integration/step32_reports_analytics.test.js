import mongoose from "mongoose";
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
import AttemptQuestion from "../../src/modules/attemptQuestions/attemptQuestion.model.js";
import Result from "../../src/modules/results/result.model.js";
import ProctoringSession from "../../src/modules/proctoring/proctoringSession.model.js";
import ProctoringEvent from "../../src/modules/proctoring/proctoringEvent.model.js";
import Report from "../../src/modules/reports/report.model.js";
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

const runStep32Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 32 Reports & Analytics Engine Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state & Roles
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const platformOwnerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-32", "org-alien-32"] } });
    await User.deleteMany({ email: { $in: ["vu.admin32@test.com", "alice32@vu.edu.pk", "eve32@alien.com"] } });
    await Assessment.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await AttemptQuestion.deleteMany({});
    await Result.deleteMany({});
    await ProctoringSession.deleteMany({});
    await ProctoringEvent.deleteMany({});
    await Report.deleteMany({});

    // 2. Setup Organizations & Users
    const orgA = await Organization.create({
      name: "Virtual University 32",
      slug: "org-vu-32",
      code: "VU32",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Software Engineering",
      code: "SE32",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Software Engineering",
      code: "BSSE32",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Cloud Security",
      code: "CS-601",
    });

    const vuAdmin = await User.create({
      firstName: "VU",
      lastName: "Admin",
      email: "vu.admin32@test.com",
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
      email: "alice32@vu.edu.pk",
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
      candidateCode: "VU-CAND-32",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice32@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 32",
      slug: "org-alien-32",
      code: "ALIEN32",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve32@alien.com",
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

    // 3. Assessment, Attempt, Result, Proctoring Seeding
    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Cloud Computing & Security Comprehensive Exam",
      code: "CS601-FINAL",
      type: "HYBRID",
      createdBy: vuAdmin._id,
      subjectId: subjA._id,
      departmentId: deptA._id,
      programId: progA._id,
      duration: { value: 90, unit: "MINUTES" },
      durationSeconds: 5400,
      totalPoints: 100,
      status: "PUBLISHED",
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
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 3600 * 1000),
      submittedAt: new Date(),
      expiresAt: new Date(Date.now() + 5400 * 1000),
      durationSeconds: 3600,
      totalPoints: 100,
    });

    // Seed 2 Attempt Questions (Q1: Correct -> Easy, Q2: Incorrect -> Hard)
    await AttemptQuestion.create([
      {
        organizationId: orgA._id,
        assessmentId: assessment._id,
        attemptId: attempt._id,
        assessmentQuestionId: new mongoose.Types.ObjectId(),
        questionId: new mongoose.Types.ObjectId(),
        order: 1,
        prompt: "What is Cloud Computing?",
        type: "SINGLE_CHOICE",
        status: "ANSWERED",
        marks: 10,
        points: 10,
        metadata: {
          isCorrect: true,
          isAnswered: true,
          earnedPoints: 10,
        },
      },
      {
        organizationId: orgA._id,
        assessmentId: assessment._id,
        attemptId: attempt._id,
        assessmentQuestionId: new mongoose.Types.ObjectId(),
        questionId: new mongoose.Types.ObjectId(),
        order: 2,
        prompt: "Explain Zero Trust Architecture.",
        type: "SINGLE_CHOICE",
        status: "ANSWERED",
        marks: 10,
        points: 10,
        metadata: {
          isCorrect: false,
          isAnswered: true,
          earnedPoints: 0,
        },
      },
    ]);

    // Seed Result
    await Result.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      attemptId: attempt._id,
      evaluationId: new mongoose.Types.ObjectId(),
      candidateId: aliceCandidate._id,
      earnedPoints: 85,
      totalPoints: 100,
      percentage: 85,
      passed: true,
      grade: "A",
      published: true,
    });

    // Seed Proctoring Session & Event
    const procSession = await ProctoringSession.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      attemptId: attempt._id,
      candidateId: aliceCandidate._id,
      status: "ENDED",
      integrityStatus: "CLEAR",
      riskScore: 15,
      riskLevel: "LOW",
      violationCount: 1,
    });

    await ProctoringEvent.create({
      organizationId: orgA._id,
      proctoringSessionId: procSession._id,
      assessmentId: assessment._id,
      attemptId: attempt._id,
      candidateId: aliceCandidate._id,
      type: "PROCTOR_WARNING",
      severity: "LOW",
      riskPoints: 0,
    });

    console.log("\n[TEST 1] Assessment Summary Analytics...");
    const summaryRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/assessments/${assessment._id}/summary?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });

    console.log("Summary Status ->", summaryRes.status, "Pass Rate:", summaryRes.body?.data?.passRate, "Avg Score:", summaryRes.body?.data?.averageScore);
    if (summaryRes.status !== 200 || summaryRes.body?.data?.assigned !== 1 || summaryRes.body?.data?.passRate !== 100) {
      throw new Error("Test 1 Failed: Assessment summary analytics failed!");
    }

    console.log("\n[TEST 2] Question & Item Analysis Breakdown...");
    const questionsRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/assessments/${assessment._id}/questions?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });

    console.log("Question Analytics Status ->", questionsRes.status, "Questions Count:", questionsRes.body?.data?.totalQuestions);
    if (questionsRes.status !== 200 || questionsRes.body?.data?.totalQuestions !== 2) {
      throw new Error("Test 2 Failed: Question analysis analytics failed!");
    }

    console.log("\n[TEST 3] Result Analytics & Score Distribution...");
    const resultsRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/assessments/${assessment._id}/results?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });

    console.log("Result Analytics Status ->", resultsRes.status, "80-89 Distribution:", resultsRes.body?.data?.scoreDistribution?.["80-89"]);
    if (resultsRes.status !== 200 || resultsRes.body?.data?.scoreDistribution?.["80-89"] !== 1) {
      throw new Error("Test 3 Failed: Result score distribution analytics failed!");
    }

    console.log("\n[TEST 4] Proctoring & Exam Integrity Analytics...");
    const procRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/assessments/${assessment._id}/proctoring?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });

    console.log("Proctoring Analytics Status ->", procRes.status, "Low Risk Count:", procRes.body?.data?.lowRisk, "Warnings:", procRes.body?.data?.warnings);
    if (procRes.status !== 200 || procRes.body?.data?.totalProctoredAttempts !== 1 || procRes.body?.data?.warnings !== 1) {
      throw new Error("Test 4 Failed: Proctoring analytics failed!");
    }

    console.log("\n[TEST 5] Candidate Performance Analytics (Admin & Self-Service)...");
    // 5.1 Admin query
    const candPerfRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/candidates/${aliceCandidate._id}/performance?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });
    console.log("Admin Candidate Perf Status ->", candPerfRes.status, "Pass Rate:", candPerfRes.body?.data?.passRate);
    if (candPerfRes.status !== 200 || candPerfRes.body?.data?.passedCount !== 1) {
      throw new Error("Test 5.1 Failed: Admin candidate performance report failed!");
    }

    // 5.2 Alice self-service query
    const aliceSelfRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/candidate/performance?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Self Perf Status ->", aliceSelfRes.status, "Passed Count:", aliceSelfRes.body?.data?.passedCount);
    if (aliceSelfRes.status !== 200 || aliceSelfRes.body?.data?.passedCount !== 1) {
      throw new Error("Test 5.2 Failed: Candidate self-service performance report failed!");
    }

    console.log("\n[TEST 6] Platform Owner Overview Analytics...");
    const platformRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/platform/overview`,
      headers: { Authorization: `Bearer ${platformOwnerToken}` },
    });

    console.log("Platform Analytics Status ->", platformRes.status, "Total Orgs:", platformRes.body?.data?.totalOrganizations, "Assessments:", platformRes.body?.data?.totalAssessments);
    if (platformRes.status !== 200 || platformRes.body?.data?.totalOrganizations < 2) {
      throw new Error("Test 6 Failed: Platform overview analytics failed!");
    }

    // Non-platform user blocked from platform overview
    const blockedPlatformRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/platform/overview`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });
    console.log("Blocked Platform Query Status ->", blockedPlatformRes.status);
    if (blockedPlatformRes.status !== 403) {
      throw new Error("Test 6 Failed: Non-platform user was not blocked from platform analytics!");
    }

    console.log("\n[TEST 7] Report Exports (CSV & Async Document Export)...");
    // 7.1 CSV Export
    const csvExportRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/assessments/${assessment._id}/export?format=CSV&organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });
    console.log("CSV Export Status ->", csvExportRes.status, "CSV Data Length:", csvExportRes.raw?.length);
    if (csvExportRes.status !== 200 || !csvExportRes.raw) {
      throw new Error("Test 7.1 Failed: CSV export failed!");
    }

    // 7.2 Async Document Export
    const docExportRes = await request(server, {
      method: "POST",
      path: `/api/v1/reports/export?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    }, {
      type: "ASSESSMENT",
      format: "PDF",
      targetId: assessment._id.toString(),
    });
    console.log("Document Export Status ->", docExportRes.status, "Report Status:", docExportRes.body?.data?.status);
    if (docExportRes.status !== 201 || docExportRes.body?.data?.status !== "COMPLETED") {
      throw new Error("Test 7.2 Failed: Report document export failed!");
    }

    console.log("\n[TEST 8] Cross-Tenant & Unauthorized Access Isolation...");
    const eveSummaryRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/assessments/${assessment._id}/summary?organizationId=${orgB._id}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Access to Org A Assessment Summary -> Status:", eveSummaryRes.status);
    if (eveSummaryRes.status !== 403 && eveSummaryRes.status !== 404) {
      throw new Error("Test 8 Failed: Cross-tenant report access was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 32 REPORTS & ANALYTICS ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 32 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep32Tests();
