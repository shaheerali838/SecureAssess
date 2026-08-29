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
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import Result from "../../src/modules/results/result.model.js";
import ProctoringSession from "../../src/modules/proctoring/proctoringSession.model.js";
import ProctoringEvent from "../../src/modules/proctoring/proctoringEvent.model.js";
import Report from "../../src/modules/reports/report.model.js";
import { runReportGenerationJob } from "../../src/jobs/reportGeneration.job.js";
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

const runStep22Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 22 Reports & Analytics Test Suite");

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

    const platformToken = generateAccessToken({ sub: platformOwner._id.toString() });

    await Organization.deleteMany({ slug: { $in: ["org-vu-22", "org-alien-22"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner22@test.com", "alice22@vu.edu.pk", "eve22@alien.com"] } });
    await Report.deleteMany({});

    // 2. Setup Org A
    const orgA = await Organization.create({
      name: "Virtual University 22",
      slug: "org-vu-22",
      code: "VU22",
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
      name: "Database Systems",
      code: "DBS-22",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner22@test.com",
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
      email: "alice22@vu.edu.pk",
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
      candidateCode: "VU-CAND-22",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice22@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve (For Tenant Isolation)
    const orgB = await Organization.create({
      name: "Alien Org 22",
      slug: "org-alien-22",
      code: "ALIEN22",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve22@alien.com",
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

    // 3. Question Bank & Assessment
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "SQL Bank",
      code: "SQL-QB",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      prompt: "Which SQL clause is used to filter records?",
      options: [{ id: "A", text: "WHERE" }, { id: "B", text: "ORDER BY" }],
      correctAnswer: ["A"],
      points: 10,
      status: "ACTIVE",
    });

    const assessmentA = await Assessment.create({
      organizationId: orgA._id,
      title: "Database Systems Midterm",
      code: "DBS-MID-22",
      type: "MCQ",
      subjectId: subjA._id,
      durationSeconds: 3600,
      passingScore: 60,
      totalPoints: 10,
      createdBy: vuExaminer._id,
      status: "PUBLISHED",
    });

    const sectionA = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      title: "General SQL",
      order: 1,
    });

    const assQuestion = await AssessmentQuestion.create({
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

    // 4. Create Historical Attempt & Result for Alice
    const attempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      assignmentId: assignment._id,
      attemptNumber: 1,
      status: "SUBMITTED",
      durationSeconds: 3600,
      expiresAt: new Date(Date.now() + 1800 * 1000),
      startedAt: new Date(Date.now() - 1800 * 1000),
      submittedAt: new Date(),
    });

    await AttemptQuestion.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentId: assessmentA._id,
      assessmentQuestionId: assQuestion._id,
      questionId: q1._id,
      type: q1.type,
      prompt: q1.prompt,
      options: q1.options,
      order: 1,
      points: 10,
      status: "ANSWERED",
      isAnswered: true,
      metadata: { isCorrect: true, earnedPoints: 10 },
    });

    const evalDoc = await Evaluation.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      status: "COMPLETED",
      evaluationType: "AUTOMATIC",
      totalScore: 10,
      totalPoints: 10,
      percentage: 100,
      passingScore: 60,
      passed: true,
      totalQuestions: 1,
      evaluatedQuestions: 1,
    });

    await Result.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      evaluationId: evalDoc._id,
      totalPoints: 10,
      earnedPoints: 10,
      percentage: 100,
      grade: "A+",
      passed: true,
      published: true,
      publishedAt: new Date(),
    });

    const procSession = await ProctoringSession.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      attemptId: attempt._id,
      candidateId: aliceCandidate._id,
      status: "ENDED",
      riskScore: 25,
      riskLevel: "MEDIUM",
      violationCount: 2,
    });

    await ProctoringEvent.create([
      {
        organizationId: orgA._id,
        proctoringSessionId: procSession._id,
        attemptId: attempt._id,
        candidateId: aliceCandidate._id,
        type: "TAB_SWITCH",
        severity: "MEDIUM",
        riskPoints: 5,
      },
      {
        organizationId: orgA._id,
        proctoringSessionId: procSession._id,
        attemptId: attempt._id,
        candidateId: aliceCandidate._id,
        type: "CAMERA_DISABLED",
        severity: "HIGH",
        riskPoints: 20,
      },
    ]);

    console.log("\n[TEST 1] Organization Dashboard Analytics...");
    const dashRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/reports/dashboard`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Org Dashboard Status ->", dashRes.status, "Assessments:", dashRes.body?.data?.totalAssessments, "Pass Rate:", dashRes.body?.data?.passRate);
    if (dashRes.status !== 200 || dashRes.body?.data?.totalAssessments !== 1 || dashRes.body?.data?.passRate !== 100) {
      throw new Error("Test 1 Failed: Org dashboard calculation failed!");
    }

    console.log("\n[TEST 2] Assessment Performance Analytics...");
    const assReportRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/reports/assessments/${assessmentA._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Assessment Report Status ->", assReportRes.status, "Avg Score:", assReportRes.body?.data?.averageScore, "Completion Rate:", assReportRes.body?.data?.completionRate);
    if (assReportRes.status !== 200 || assReportRes.body?.data?.averageScore !== 10 || assReportRes.body?.data?.completionRate !== 100) {
      throw new Error("Test 2 Failed: Assessment report aggregation failed!");
    }

    console.log("\n[TEST 3] Candidate Performance Analytics (Examiner View)...");
    const candReportRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/reports/candidates/${aliceCandidate._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Candidate Report Status ->", candReportRes.status, "Pass Rate:", candReportRes.body?.data?.passRate, "Violations:", candReportRes.body?.data?.totalProctoringViolations);
    if (candReportRes.status !== 200 || candReportRes.body?.data?.totalProctoringViolations !== 2) {
      throw new Error("Test 3 Failed: Candidate analytics aggregation failed!");
    }

    console.log("\n[TEST 4] Candidate Self-Service Performance View...");
    const ownPerfRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/reports/performance`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Own Performance Status ->", ownPerfRes.status, "Average Score:", ownPerfRes.body?.data?.averageScore);
    if (ownPerfRes.status !== 200 || ownPerfRes.body?.data?.averageScore !== 10) {
      throw new Error("Test 4 Failed: Candidate own performance failed!");
    }

    console.log("\n[TEST 5] Question Analytics & Difficulty Rating...");
    const qAnalyticsRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/reports/questions/${q1._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Question Analytics Status ->", qAnalyticsRes.status, "Success Rate:", qAnalyticsRes.body?.data?.successRate, "Rating:", qAnalyticsRes.body?.data?.difficultyRating);
    if (qAnalyticsRes.status !== 200 || qAnalyticsRes.body?.data?.successRate !== 100 || qAnalyticsRes.body?.data?.difficultyRating !== "EASY") {
      throw new Error("Test 5 Failed: Question analytics failed!");
    }

    console.log("\n[TEST 6] Proctoring Analytics Report...");
    const procReportRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/reports/proctoring`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Proctoring Report Status ->", procReportRes.status, "Medium Risk Sessions:", procReportRes.body?.data?.mediumRiskAttempts, "Total Violations:", procReportRes.body?.data?.totalViolations);
    if (procReportRes.status !== 200 || procReportRes.body?.data?.mediumRiskAttempts !== 1 || procReportRes.body?.data?.totalViolations !== 2) {
      throw new Error("Test 6 Failed: Proctoring analytics failed!");
    }

    console.log("\n[TEST 7] Report Export & CSV Generation...");
    const exportRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/reports/export`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      type: "ASSESSMENT",
      format: "CSV",
      targetId: assessmentA._id,
      name: "Midterm_CSV_Export",
    });
    console.log("Export Report Status ->", exportRes.status, "Format:", exportRes.body?.data?.report?.format, "File Content Present:", Boolean(exportRes.body?.data?.fileContent));
    if (exportRes.status !== 201 || !exportRes.body?.data?.fileContent || !exportRes.body.data.fileContent.includes("Database Systems Midterm")) {
      throw new Error("Test 7 Failed: Report export generation failed!");
    }

    console.log("\n[TEST 8] Platform Owner Dashboard...");
    const platDashRes = await request(server, {
      method: "GET",
      path: `/api/v1/platform/reports/dashboard`,
      headers: { Authorization: `Bearer ${platformToken}` },
    });
    console.log("Platform Dashboard Status ->", platDashRes.status, "Organizations:", platDashRes.body?.data?.totalOrganizations, "Assessments:", platDashRes.body?.data?.totalAssessments);
    if (platDashRes.status !== 200 || platDashRes.body?.data?.totalOrganizations < 2) {
      throw new Error("Test 8 Failed: Platform dashboard failed!");
    }

    console.log("\n[TEST 9] Tenant & Authorization Isolation...");
    // Eve (Alien Org) cannot view Org A's dashboard
    const eveStealRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/reports/dashboard`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Cross-Tenant Access -> Status:", eveStealRes.status, "Success:", eveStealRes.body?.success);
    if (eveStealRes.status !== 403) throw new Error("Test 9.1 Failed: Cross-tenant isolation breach!");

    // Alice Candidate cannot view Org dashboard
    const aliceForbiddenRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/reports/dashboard`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Access to Org Dashboard -> Status:", aliceForbiddenRes.status, "Success:", aliceForbiddenRes.body?.success);
    if (aliceForbiddenRes.status !== 403) throw new Error("Test 9.2 Failed: Candidate was not forbidden from org dashboard!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 22 REPORTS & ANALYTICS TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 22 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep22Tests();
