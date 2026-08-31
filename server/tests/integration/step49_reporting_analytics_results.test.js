import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import Result from "../../src/modules/results/result.model.js";
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
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runStep49Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 49 Reporting, Analytics & Results Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-reports-a", "org-reports-b"] } });
    await User.deleteMany({ email: { $in: ["admin49@org-a.com", "cand49@org-a.com", "hacker49@org-b.com"] } });
    await Assessment.deleteMany({});
    await AssessmentSection.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await Candidate.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await Evaluation.deleteMany({});
    await Result.deleteMany({});
    await Report.deleteMany({});

    // 2. Setup Organization A & Admin
    const orgA = await Organization.create({
      name: "Analytics Research Alpha",
      slug: "org-reports-a",
      code: "REP-A",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const adminUser = await User.create({
      firstName: "Prof. Alan",
      lastName: "Turing",
      email: "admin49@org-a.com",
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

    // 3. Setup Organization B & Adversary
    const orgB = await Organization.create({
      name: "Compromised Tenant Beta",
      slug: "org-reports-b",
      code: "REP-B",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const hackerUser = await User.create({
      firstName: "Mallory",
      lastName: "Rival",
      email: "hacker49@org-b.com",
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
      firstName: "Ada",
      lastName: "Lovelace",
      email: "cand49@org-a.com",
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
      candidateCode: "CAND-49-ADA",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "cand49@org-a.com",
      status: "ACTIVE",
    });

    const candidateToken = generateAccessToken({ sub: candidateUser._id.toString() });

    // 5. Create Assessment, Attempt, and Evaluation
    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Algorithmic Foundations & Complexity",
      code: "ALG-401",
      passingScore: 60,
      totalPoints: 100,
      status: "PUBLISHED",
      createdBy: adminUser._id,
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: candProfile._id,
      status: "COMPLETED",
      validFrom: new Date(Date.now() - 3600000),
      validUntil: new Date(Date.now() + 86400000),
    });

    const attempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: candProfile._id,
      attemptNumber: 1,
      status: "SUBMITTED",
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 600000),
      expiresAt: new Date(Date.now() + 3600000),
      durationSeconds: 3600,
      totalPoints: 100,
      totalMarks: 100,
    });

    const evaluation = await Evaluation.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      attemptId: attempt._id,
      candidateId: candProfile._id,
      evaluatorId: adminUser._id,
      totalScore: 85,
      totalMarks: 100,
      percentage: 85,
      grade: "A",
      passed: true,
      status: "COMPLETED",
      pendingManualReview: false,
      sectionScores: [
        { title: "Dynamic Programming", totalMarks: 50, obtainedMarks: 45, percentage: 90 },
        { title: "Graph Theory", totalMarks: 50, obtainedMarks: 40, percentage: 80 },
      ],
    });

    // =========================================================================
    // [TEST 1] Result Generation from Evaluation Pipeline
    // =========================================================================
    console.log("\n[TEST 1] Result Generation from Completed Evaluation...");

    const genResultRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/results/evaluations/${evaluation._id}/generate`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Generate Result Status ->", genResultRes.status, "Obtained:", genResultRes.body?.data?.obtainedMarks, "Grade:", genResultRes.body?.data?.grade);
    if (genResultRes.status !== 201) throw new Error(`Expected 201 for result generation, got ${genResultRes.status}`);

    const resultId = genResultRes.body.data._id;

    // =========================================================================
    // [TEST 2] Controlled Result Publication & Candidate Portal Isolation
    // =========================================================================
    console.log("\n[TEST 2] Controlled Publication & Candidate Portal Feed...");

    // 2a. Before publication, candidate cannot view result (status: READY, published: false)
    const earlyCandResultRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/results/candidate-portal/results/${resultId}`,
        headers: { Authorization: `Bearer ${candidateToken}` },
      }
    );

    console.log("Candidate Early Access Attempt (Unpublished) -> Status:", earlyCandResultRes.status, "(Expected 403 Under Review)");
    if (earlyCandResultRes.status !== 403) throw new Error(`Expected 403 for unpublished result, got ${earlyCandResultRes.status}`);

    // 2b. Organization staff publishes result
    const publishRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/results/${resultId}/publish`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Staff Publish Result -> Status:", publishRes.status, "Published:", publishRes.body?.data?.published);
    if (publishRes.status !== 200 || !publishRes.body?.data?.published) {
      throw new Error(`Expected 200 & published: true, got ${publishRes.status}`);
    }

    // 2c. Candidate now accesses result feed
    const candResultRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/results/candidate-portal/results/${resultId}`,
        headers: { Authorization: `Bearer ${candidateToken}` },
      }
    );

    console.log("Candidate Access Published Result -> Status:", candResultRes.status, "Percentage:", candResultRes.body?.data?.percentage, "Grade:", candResultRes.body?.data?.grade);
    if (candResultRes.status !== 200 || candResultRes.body?.data?.grade !== "A") {
      throw new Error(`Expected 200 & Grade A, got ${candResultRes.status}`);
    }

    // =========================================================================
    // [TEST 3] Controlled Result Score Correction & Revision Audit Trail
    // =========================================================================
    console.log("\n[TEST 3] Result Score Correction with Revision History...");

    const correctRes = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/organizations/${orgA._id}/results/${resultId}/correct`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        obtainedMarks: 92,
        reason: "Regrade of dynamic programming proofs",
      }
    );

    console.log("Correct Result Score -> Status:", correctRes.status, "New Score:", correctRes.body?.data?.obtainedMarks, "New Grade:", correctRes.body?.data?.grade);
    if (correctRes.status !== 200 || correctRes.body?.data?.grade !== "A+") {
      throw new Error(`Expected 200 & Grade A+, got ${correctRes.status}`);
    }

    const updatedResultInDb = await Result.findById(resultId);
    console.log("Correction History Count in DB ->", updatedResultInDb.correctionHistory?.length);
    if (!updatedResultInDb.correctionHistory || updatedResultInDb.correctionHistory.length === 0) {
      throw new Error("Expected revision audit history to be recorded on result correction");
    }

    // =========================================================================
    // [TEST 4] Result Voiding Lifecycle
    // =========================================================================
    console.log("\n[TEST 4] Result Voiding Lifecycle...");

    // Create a dummy second result to void
    const attempt2 = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: candProfile._id,
      attemptNumber: 2,
      status: "SUBMITTED",
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 600000),
      expiresAt: new Date(Date.now() + 3600000),
      durationSeconds: 3600,
      totalPoints: 100,
      totalMarks: 100,
    });
    const eval2 = await Evaluation.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      attemptId: attempt2._id,
      candidateId: candProfile._id,
      evaluatorId: adminUser._id,
      totalScore: 50,
      totalMarks: 100,
      percentage: 50,
      status: "COMPLETED",
      pendingManualReview: false,
    });
    const result2 = await Result.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      attemptId: attempt2._id,
      candidateId: candProfile._id,
      evaluationId: eval2._id,
      totalMarks: 100,
      obtainedMarks: 50,
      percentage: 50,
      status: "PUBLISHED",
      published: true,
    });

    const voidRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/results/${result2._id}/void`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        reason: "Unauthorized collaboration detected post-exam",
      }
    );

    console.log("Void Result -> Status:", voidRes.status, "New Status:", voidRes.body?.data?.status);
    if (voidRes.status !== 200 || voidRes.body?.data?.status !== "VOIDED") {
      throw new Error(`Expected 200 & VOIDED status, got ${voidRes.status}`);
    }

    // =========================================================================
    // [TEST 5] Organization Dashboard Analytics (MongoDB Aggregation Pipeline)
    // =========================================================================
    console.log("\n[TEST 5] Organization Analytics Dashboard (Aggregation Pipeline)...");

    const dashRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/reports/dashboard`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Organization Dashboard Status ->", dashRes.status);
    console.log("Metrics -> Assessments:", dashRes.body?.data?.totalAssessments, "Candidates:", dashRes.body?.data?.candidates, "Average Score:", dashRes.body?.data?.averageScore);
    if (dashRes.status !== 200) throw new Error(`Expected 200 for dashboard metrics, got ${dashRes.status}`);

    // =========================================================================
    // [TEST 6] Assessment Summary Analytics & Completion Funnel
    // =========================================================================
    console.log("\n[TEST 6] Assessment Summary Analytics & Funnel...");

    const asmSummaryRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/reports/assessments/${assessment._id}/summary`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Assessment Summary Status ->", asmSummaryRes.status, "Average Score:", asmSummaryRes.body?.data?.averageScore, "Pass Rate:", asmSummaryRes.body?.data?.passRate);
    if (asmSummaryRes.status !== 200) throw new Error(`Expected 200 for assessment summary, got ${asmSummaryRes.status}`);

    // =========================================================================
    // [TEST 7] Report Generation & Export Pipeline (CSV / XLSX / PDF)
    // =========================================================================
    console.log("\n[TEST 7] Report Generation & Export Request...");

    const exportRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/reports/export`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        reportType: "ASSESSMENT_SUMMARY",
        format: "CSV",
        assessmentId: assessment._id.toString(),
      }
    );

    console.log("Generate Report Export -> Status:", exportRes.status, "Download URL:", exportRes.body?.data?.downloadUrl || exportRes.body?.data?.fileReference);
    if (![200, 201].includes(exportRes.status)) {
      throw new Error(`Expected 200/201 for report export, got ${exportRes.status}`);
    }

    // =========================================================================
    // [TEST 8] Cross-Tenant Security Isolation Guards
    // =========================================================================
    console.log("\n[TEST 8] Cross-Tenant Isolation Tests (Tenant B vs Tenant A)...");

    // 8a. Tenant B cannot access Tenant A's result
    const crossResultRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/results/${resultId}`,
        headers: { Authorization: `Bearer ${hackerToken}` },
      }
    );
    console.log("Cross-Tenant Result Lookup -> Status:", crossResultRes.status, "(Expected 404)");
    if (crossResultRes.status !== 404) throw new Error(`Expected 404, got ${crossResultRes.status}`);

    // 8b. Tenant B cannot access Tenant A's dashboard analytics
    const crossDashRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/reports/dashboard`,
        headers: { Authorization: `Bearer ${hackerToken}` },
      }
    );
    console.log("Tenant B Dashboard (Clean Isolated Scope) -> Assessments:", crossDashRes.body?.data?.totalAssessments, "(Expected 0 for Org B)");
    if (crossDashRes.body?.data?.totalAssessments !== 0) {
      throw new Error("Cross-tenant leakage: Org B saw Org A assessment counts in dashboard!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 49 REPORTING, ANALYTICS & RESULTS MANAGEMENT TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep49Tests().catch((err) => {
  console.error("❌ Step 49 Test Suite Failed:", err);
  process.exit(1);
});
