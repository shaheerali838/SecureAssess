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
import Result from "../../src/modules/results/result.model.js";
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import ProctoringSession from "../../src/modules/proctoring/proctoringSession.model.js";
import ProctoringEvent from "../../src/modules/proctoring/proctoringEvent.model.js";
import Interview from "../../src/modules/interviews/interview.model.js";
import InterviewSession from "../../src/modules/interviews/interviewSession.model.js";
import Report from "../../src/modules/reports/report.model.js";
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

const runStep53Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 53 Analytics, Reporting & Business Intelligence Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean State
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-analytics-a", "org-analytics-b"] } });
    await User.deleteMany({ email: { $in: ["admin53@org-a.com", "cand53@org-a.com", "alien53@org-b.com"] } });
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await Result.deleteMany({});
    await Evaluation.deleteMany({});
    await ProctoringSession.deleteMany({});
    await ProctoringEvent.deleteMany({});
    await Interview.deleteMany({});
    await InterviewSession.deleteMany({});
    await Report.deleteMany({});

    // 2. Setup Organization A & Users
    const orgA = await Organization.create({
      name: "Oxford Institute of Advanced Analytics",
      slug: "org-analytics-a",
      code: "BI-A",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const adminUser = await User.create({
      firstName: "Professor",
      lastName: "Hawking",
      email: "admin53@org-a.com",
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
    const platformToken = generateAccessToken({ sub: platformOwner._id.toString() });

    // 3. Setup Organization B & Alien User
    const orgB = await Organization.create({
      name: "Compromised Alien Tenant Beta",
      slug: "org-analytics-b",
      code: "BI-B",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const alienUser = await User.create({
      firstName: "Eve",
      lastName: "Intruder",
      email: "alien53@org-b.com",
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
      firstName: "Rosalind",
      lastName: "Franklin",
      email: "cand53@org-a.com",
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
      candidateCode: "CAND-53-ROSALIND",
      firstName: "Rosalind",
      lastName: "Franklin",
      email: "cand53@org-a.com",
      status: "ACTIVE",
    });

    const candToken = generateAccessToken({ sub: candidateUser._id.toString() });

    // 5. Seed Assessment, Assignment, Attempt, Result, Interview, Proctoring data
    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Molecular Genetics & DNA Crystallography",
      code: "BIO-531",
      passingScore: 70,
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
      startedAt: new Date(Date.now() - 7200000),
      submittedAt: new Date(Date.now() - 3600000),
      expiresAt: new Date(Date.now() + 3600000),
      durationSeconds: 3600,
      totalPoints: 100,
      totalMarks: 100,
    });

    const evaluation = await Evaluation.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentId: assessment._id,
      candidateId: candProfile._id,
      evaluatorId: adminUser._id,
      totalMarks: 100,
      obtainedMarks: 94,
      percentage: 94,
      status: "COMPLETED",
    });

    const result = await Result.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentId: assessment._id,
      candidateId: candProfile._id,
      evaluationId: evaluation._id,
      totalMarks: 100,
      obtainedMarks: 94,
      percentage: 94,
      grade: "A+",
      passed: true,
      published: true,
      publishedAt: new Date(),
      status: "PUBLISHED",
    });

    // Seed Proctoring Session
    const procSession = await ProctoringSession.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      candidateId: candProfile._id,
      assessmentId: assessment._id,
      status: "ENDED",
      riskScore: 15,
      riskLevel: "LOW",
      integrityStatus: "CLEAR",
    });

    // Seed Live Interview
    const interview = await Interview.create({
      organizationId: orgA._id,
      title: "Biophysics Panel Defense",
      status: "COMPLETED",
      scheduledStartAt: new Date(Date.now() - 86400000),
      scheduledEndAt: new Date(Date.now() - 82800000),
      createdBy: adminUser._id,
      candidateId: candProfile._id,
    });

    await InterviewSession.create({
      organizationId: orgA._id,
      interviewId: interview._id,
      sessionId: "sess_bi_interview_001",
      status: "ENDED",
      hostUserId: adminUser._id,
    });

    // =========================================================================
    // [TEST 1] Organization Overview Analytics Dashboard
    // =========================================================================
    console.log("\n[TEST 1] Organization Overview Analytics Dashboard...");

    const dashRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/reports/dashboard`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Org Dashboard -> Status:", dashRes.status, "Assessments:", dashRes.body?.data?.totalAssessments, "Candidates:", dashRes.body?.data?.totalCandidates, "Avg Score:", dashRes.body?.data?.averageScore);
    if (dashRes.status !== 200 || dashRes.body?.data?.totalAssessments !== 1 || dashRes.body?.data?.averageScore !== 94) {
      throw new Error(`Expected 200 with 1 assessment & 94 avg score, got status ${dashRes.status}, score ${dashRes.body?.data?.averageScore}`);
    }

    // =========================================================================
    // [TEST 2] Platform-Wide Dashboard (Platform Owner Scope)
    // =========================================================================
    console.log("\n[TEST 2] Platform-Wide Executive Dashboard...");

    const platDashRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/reports/platform/overview`,
        headers: { Authorization: `Bearer ${platformToken}` },
      }
    );

    console.log("Platform Dashboard -> Status:", platDashRes.status, "Total Orgs:", platDashRes.body?.data?.totalOrganizations, "Total Users:", platDashRes.body?.data?.totalUsers);
    if (platDashRes.status !== 200 || platDashRes.body?.data?.totalOrganizations < 2) {
      throw new Error(`Expected >= 2 organizations on platform dashboard, got ${platDashRes.body?.data?.totalOrganizations}`);
    }

    // =========================================================================
    // [TEST 3] Assessment Summary Analytics & Score Breakdown
    // =========================================================================
    console.log("\n[TEST 3] Assessment Summary Analytics Breakdown...");

    const assSummaryRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/reports/assessments/${assessment._id}/summary`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Assessment Summary -> Status:", assSummaryRes.status, "Pass Rate:", assSummaryRes.body?.data?.passRate, "Completed Attempts:", assSummaryRes.body?.data?.completedAttempts);
    if (assSummaryRes.status !== 200 || assSummaryRes.body?.data?.passRate !== 100 || assSummaryRes.body?.data?.completedAttempts !== 1) {
      throw new Error(`Expected 100% pass rate & 1 completed attempt`);
    }

    // =========================================================================
    // [TEST 4] Candidate Performance Reporting & Ownership Privacy
    // =========================================================================
    console.log("\n[TEST 4] Candidate Performance Reporting & Privacy Separation...");

    // 4a. Candidate self-service performance feed
    const candSelfRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/reports/candidate/performance`,
        headers: {
          Authorization: `Bearer ${candToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      }
    );
    console.log("Candidate Self Performance -> Status:", candSelfRes.status, "Total Completed:", candSelfRes.body?.data?.totalCompleted, "Avg Score:", candSelfRes.body?.data?.averageScore);
    if (candSelfRes.status !== 200 || candSelfRes.body?.data?.averageScore !== 94) {
      throw new Error(`Expected 94 avg score for candidate self-view, got ${candSelfRes.body?.data?.averageScore}`);
    }

    // 4b. Staff candidate performance report
    const staffCandRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/reports/candidates/${candProfile._id}/performance`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("Staff Candidate Report -> Status:", staffCandRes.status, "Candidate Code:", staffCandRes.body?.data?.candidate?.candidateCode);
    if (staffCandRes.status !== 200 || staffCandRes.body?.data?.candidate?.candidateCode !== "CAND-53-ROSALIND") {
      throw new Error("Failed to retrieve staff candidate report");
    }

    // =========================================================================
    // [TEST 5] Live Interview & WebRTC Analytics Integration (Step 51)
    // =========================================================================
    console.log("\n[TEST 5] Live Interview Analytics Integration...");

    const intAnalyticsRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/reports/interviews`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Interview Analytics -> Status:", intAnalyticsRes.status, "Total Interviews:", intAnalyticsRes.body?.data?.totalInterviews, "Completed:", intAnalyticsRes.body?.data?.completed, "Sessions:", intAnalyticsRes.body?.data?.totalSessions);
    if (intAnalyticsRes.status !== 200 || intAnalyticsRes.body?.data?.totalInterviews !== 1 || intAnalyticsRes.body?.data?.completed !== 1) {
      throw new Error("Failed to aggregate live interview metrics");
    }

    // =========================================================================
    // [TEST 6] Proctoring & Exam Integrity Analytics Integration (Step 50)
    // =========================================================================
    console.log("\n[TEST 6] Proctoring & Exam Integrity Analytics Integration...");

    const procAnalyticsRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/reports/proctoring`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("Proctoring Analytics -> Status:", procAnalyticsRes.status, "Proctored Attempts:", procAnalyticsRes.body?.data?.totalProctoredAttempts, "Low Risk:", procAnalyticsRes.body?.data?.lowRisk);
    if (procAnalyticsRes.status !== 200 || procAnalyticsRes.body?.data?.totalProctoredAttempts !== 1) {
      throw new Error("Failed to aggregate proctoring metrics");
    }

    // =========================================================================
    // [TEST 7] Report Generation, Private File Reference & Secure Download
    // =========================================================================
    console.log("\n[TEST 7] Report Generation, Private Storage & Secure Download...");

    // 7a. Generate / Export Report
    const genReportRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/reports/export`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        type: "ASSESSMENT_PERFORMANCE",
        format: "CSV",
        targetId: assessment._id.toString(),
        name: "Q3_Genetics_Certification_Report",
      }
    );

    console.log("Generate Report -> Status:", genReportRes.status, "Report ID:", genReportRes.body?.data?._id, "File URL:", genReportRes.body?.data?.fileUrl);
    if (genReportRes.status !== 201 || !genReportRes.body?.data?._id) {
      throw new Error(`Expected 201 for report export, got ${genReportRes.status}`);
    }

    const reportId = genReportRes.body.data._id;

    // 7b. Secure Authorized Download
    const downloadRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/reports/${reportId}/download`,
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("Authorized Report Download -> Status:", downloadRes.status, "Download URL:", downloadRes.body?.data?.downloadUrl);
    if (downloadRes.status !== 200 || !downloadRes.body?.data?.downloadUrl) {
      throw new Error("Failed to get authorized report download reference");
    }

    // =========================================================================
    // [TEST 8] Cross-Tenant Security Isolation Guards
    // =========================================================================
    console.log("\n[TEST 8] Cross-Tenant Security Isolation (Tenant B vs Tenant A)...");

    // Alien user from Org B attempts to download Org A's report (Must 404)
    const alienDownRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/reports/${reportId}/download`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );
    console.log("Alien Cross-Tenant Report Access -> Status:", alienDownRes.status, "(Expected 404)");
    if (alienDownRes.status !== 404) {
      throw new Error(`Expected 404 for cross-tenant report download, got ${alienDownRes.status}`);
    }

    // Alien user checks Org B dashboard (must be empty 0)
    const alienDashRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/reports/dashboard`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );
    console.log("Tenant B Clean Dashboard -> Total Candidates:", alienDashRes.body?.data?.totalCandidates, "(Expected 0 for Org B)");
    if (alienDashRes.body?.data?.totalCandidates !== 0) {
      throw new Error("Cross-tenant leak: Alien dashboard aggregated foreign data!");
    }

    // =========================================================================
    // [TEST 9] Audit Log Verification
    // =========================================================================
    console.log("\n[TEST 9] Verifying Security Audit Trail for BI Reports...");

    const auditCount = await AuditLog.countDocuments({ organizationId: orgA._id });
    console.log("Audit Logs Recorded for Org A ->", auditCount);
    if (auditCount === 0) {
      throw new Error("Expected audit logs to be created for report generation");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 53 ANALYTICS, REPORTING & BI ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep53Tests().catch((err) => {
  console.error("❌ Step 53 Test Suite Failed:", err);
  process.exit(1);
});
