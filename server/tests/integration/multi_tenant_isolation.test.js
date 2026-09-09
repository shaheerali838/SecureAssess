import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import { seedPlatformOwner } from "../../src/database/seeders/admin.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Department from "../../src/modules/departments/department.model.js";
import Program from "../../src/modules/programs/program.model.js";
import Subject from "../../src/modules/subjects/subject.model.js";
import QuestionBank from "../../src/modules/questionBank/questionBank.model.js";
import Question from "../../src/modules/questionBank/question.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import CandidateGroup from "../../src/modules/candidateGroups/candidateGroup.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import Answer from "../../src/modules/answers/answer.model.js";
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import Result from "../../src/modules/results/result.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { hashPassword } from "../../src/utils/password.js";
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
            resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

const runMultiTenantIsolationTests = async () => {
  console.log("================================================================================");
  console.log("🔒 SECUREASSESS MULTI-TENANT ISOLATION & BOUNDARY INTEGRATION SUITE");
  console.log("================================================================================");

  await connectDatabase();
  console.log("✔ Connected to MongoDB");

  await seedRBAC();
  await seedPlatformOwner();
  console.log("✔ RBAC roles & Platform Owner synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("✔ Test HTTP Server listening on port:", server.address().port);

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, message) => {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED [Test ${totalTests}]: ${message}`);
      throw new Error(`Test assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`✔ PASSED [Test ${totalTests}]: ${message}`);
  };

  try {
    const platformOwner = await User.findOne({
      $or: [
        { platformRole: PLATFORM_ROLES.PLATFORM_OWNER },
        { platformRole: PLATFORM_ROLES.PLATFORM_ADMIN },
        { platformRole: "PLATFORM_OWNER" },
        { platformRole: "PLATFORM_ADMIN" },
      ]
    });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    // Clean up test tenants
    await Organization.deleteMany({ slug: { $in: ["tenant-alpha-iso", "tenant-beta-iso"] } });
    await User.deleteMany({ email: { $in: [
      "admin.alpha@iso.test",
      "examiner.alpha@iso.test",
      "cand.alpha@iso.test",
      "admin.beta@iso.test",
      "examiner.beta@iso.test",
      "cand.beta@iso.test"
    ] } });

    // =========================================================================
    // STEP 1: Provision Two Distinct Organizations (Tenant Alpha & Tenant Beta)
    // =========================================================================
    console.log("\n--- [PHASE 1] Provisioning Tenants Alpha & Beta ---");

    const orgAlpha = await Organization.create({
      name: "Tenant Alpha University",
      slug: "tenant-alpha-iso",
      code: "ALPHA-ISO",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const orgBeta = await Organization.create({
      name: "Tenant Beta Institute",
      slug: "tenant-beta-iso",
      code: "BETA-ISO",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const defaultHash = await hashPassword("Test@123456");

    // Users for Tenant Alpha
    const adminAlphaUser = await User.create({
      firstName: "Admin", lastName: "Alpha", email: "admin.alpha@iso.test", passwordHash: defaultHash, status: "ACTIVE"
    });
    const examinerAlphaUser = await User.create({
      firstName: "Examiner", lastName: "Alpha", email: "examiner.alpha@iso.test", passwordHash: defaultHash, status: "ACTIVE"
    });
    const candAlphaUser = await User.create({
      firstName: "Candidate", lastName: "Alpha", email: "cand.alpha@iso.test", passwordHash: defaultHash, status: "ACTIVE"
    });

    await UserMembership.create({ userId: adminAlphaUser._id, organizationId: orgAlpha._id, roleId: orgAdminRole._id, status: "ACTIVE" });
    await UserMembership.create({ userId: examinerAlphaUser._id, organizationId: orgAlpha._id, roleId: examinerRole._id, status: "ACTIVE" });
    await UserMembership.create({ userId: candAlphaUser._id, organizationId: orgAlpha._id, roleId: candidateRole._id, status: "ACTIVE" });

    const adminAlphaToken = generateAccessToken({ sub: adminAlphaUser._id.toString() });
    const examinerAlphaToken = generateAccessToken({ sub: examinerAlphaUser._id.toString() });
    const candAlphaToken = generateAccessToken({ sub: candAlphaUser._id.toString() });

    // Users for Tenant Beta
    const adminBetaUser = await User.create({
      firstName: "Admin", lastName: "Beta", email: "admin.beta@iso.test", passwordHash: defaultHash, status: "ACTIVE"
    });
    const examinerBetaUser = await User.create({
      firstName: "Examiner", lastName: "Beta", email: "examiner.beta@iso.test", passwordHash: defaultHash, status: "ACTIVE"
    });
    const candBetaUser = await User.create({
      firstName: "Candidate", lastName: "Beta", email: "cand.beta@iso.test", passwordHash: defaultHash, status: "ACTIVE"
    });

    await UserMembership.create({ userId: adminBetaUser._id, organizationId: orgBeta._id, roleId: orgAdminRole._id, status: "ACTIVE" });
    await UserMembership.create({ userId: examinerBetaUser._id, organizationId: orgBeta._id, roleId: examinerRole._id, status: "ACTIVE" });
    await UserMembership.create({ userId: candBetaUser._id, organizationId: orgBeta._id, roleId: candidateRole._id, status: "ACTIVE" });

    const adminBetaToken = generateAccessToken({ sub: adminBetaUser._id.toString() });
    const examinerBetaToken = generateAccessToken({ sub: examinerBetaUser._id.toString() });
    const candBetaToken = generateAccessToken({ sub: candBetaUser._id.toString() });

    assert(orgAlpha._id && orgBeta._id, "Both tenant organizations provisioned successfully");

    // =========================================================================
    // STEP 2: Academic Hierarchy Isolation (Departments, Programs, Subjects)
    // =========================================================================
    console.log("\n--- [PHASE 2] Academic Hierarchy Isolation Tests ---");

    // Create Department in Tenant Alpha
    const deptAlphaRes = await request(server, {
      method: "POST",
      path: "/api/v1/departments",
      headers: { Authorization: `Bearer ${adminAlphaToken}`, "x-organization-id": orgAlpha._id.toString() }
    }, {
      name: "Computer Science Alpha",
      code: "CS-ALPHA",
      description: "CS Dept in Alpha"
    });
    assert(deptAlphaRes.status === 201, `Dept created in Alpha: Status ${deptAlphaRes.status}`);
    const deptAlphaId = deptAlphaRes.body?.data?.id || deptAlphaRes.body?.data?._id;

    // Tenant Beta Admin attempts to access Tenant Alpha's Department with Tenant Beta context
    const crossDeptGet = await request(server, {
      method: "GET",
      path: `/api/v1/departments/${deptAlphaId}`,
      headers: { Authorization: `Bearer ${adminBetaToken}`, "x-organization-id": orgBeta._id.toString() }
    });
    assert(crossDeptGet.status === 404 || crossDeptGet.status === 403, `Cross-tenant Department GET blocked with status ${crossDeptGet.status}`);

    // Tenant Beta Admin attempts to spoof Tenant Alpha context header
    const spoofDeptGet = await request(server, {
      method: "GET",
      path: `/api/v1/departments/${deptAlphaId}`,
      headers: { Authorization: `Bearer ${adminBetaToken}`, "x-organization-id": orgAlpha._id.toString() }
    });
    assert(spoofDeptGet.status === 403 || spoofDeptGet.status === 404, `Spoofed Tenant Context rejected with status: ${spoofDeptGet.status}`);

    // =========================================================================
    // STEP 3: Question Bank & Question Isolation
    // =========================================================================
    console.log("\n--- [PHASE 3] Question Bank & Multi-Type Questions Isolation ---");

    // Create Question Bank in Tenant Alpha
    const qbAlphaRes = await request(server, {
      method: "POST",
      path: "/api/v1/question-banks",
      headers: { Authorization: `Bearer ${examinerAlphaToken}`, "x-organization-id": orgAlpha._id.toString() }
    }, {
      name: "Alpha Secure Algorithms QB",
      code: "QB-ALPHA-01",
      description: "Top secret questions of Alpha",
      departmentId: deptAlphaId
    });
    assert(qbAlphaRes.status === 201, `Question Bank created in Alpha: Status ${qbAlphaRes.status}`);
    const qbAlphaId = qbAlphaRes.body?.data?.id || qbAlphaRes.body?.data?._id;

    // Create Question inside Alpha Question Bank
    const qAlphaRes = await request(server, {
      method: "POST",
      path: `/api/v1/question-banks/${qbAlphaId}/questions`,
      headers: { Authorization: `Bearer ${examinerAlphaToken}`, "x-organization-id": orgAlpha._id.toString() }
    }, {
      prompt: "What is the worst case time complexity of binary search?",
      type: "SINGLE_CHOICE",
      difficulty: "EASY",
      points: 5,
      options: [
        { key: "A", text: "O(log n)", isCorrect: true },
        { key: "B", text: "O(n)", isCorrect: false },
        { key: "C", text: "O(1)", isCorrect: false },
        { key: "D", text: "O(n^2)", isCorrect: false }
      ]
    });
    assert(qAlphaRes.status === 201, `Question created in Alpha QB: Status ${qAlphaRes.status}`);
    const qAlphaId = qAlphaRes.body?.data?.id || qAlphaRes.body?.data?._id;

    // Tenant Beta Examiner attempts to query Alpha Question Bank
    const crossQbRes = await request(server, {
      method: "GET",
      path: `/api/v1/question-banks/${qbAlphaId}`,
      headers: { Authorization: `Bearer ${examinerBetaToken}`, "x-organization-id": orgBeta._id.toString() }
    });
    assert(crossQbRes.status === 404 || crossQbRes.status === 403, `Cross-tenant Question Bank access blocked with status ${crossQbRes.status}`);

    // Tenant Beta Examiner attempts to list questions in Alpha QB
    const crossQListRes = await request(server, {
      method: "GET",
      path: `/api/v1/question-banks/${qbAlphaId}/questions`,
      headers: { Authorization: `Bearer ${examinerBetaToken}`, "x-organization-id": orgBeta._id.toString() }
    });
    const questionsReturned = crossQListRes.body?.data?.items?.length || crossQListRes.body?.data?.questions?.length || 0;
    assert(
      crossQListRes.status === 404 || crossQListRes.status === 403 || questionsReturned === 0,
      `Cross-tenant Question listing isolated (returned 0 questions / blocked)`
    );

    // Tenant Beta Examiner attempts to get specific Alpha Question by ID
    const crossSingleQRes = await request(server, {
      method: "GET",
      path: `/api/v1/questions/${qAlphaId}`,
      headers: { Authorization: `Bearer ${examinerBetaToken}`, "x-organization-id": orgBeta._id.toString() }
    });
    assert(
      crossSingleQRes.status === 404 || crossSingleQRes.status === 403,
      `Cross-tenant Single Question access blocked with status ${crossSingleQRes.status}`
    );

    // =========================================================================
    // STEP 4: Assessment Lifecycle & Immutable Snapshots Isolation
    // =========================================================================
    console.log("\n--- [PHASE 4] Assessment Lifecycle & Snapshots Isolation ---");

    const now = new Date();
    const startTime = new Date(now.getTime() - 10 * 60 * 1000);
    const endTime = new Date(now.getTime() + 120 * 60 * 1000);

    const examAlphaRes = await request(server, {
      method: "POST",
      path: "/api/v1/assessments",
      headers: { Authorization: `Bearer ${examinerAlphaToken}`, "x-organization-id": orgAlpha._id.toString() }
    }, {
      title: "Alpha Final Assessment 2026",
      code: "EXAM-ALPHA-01",
      type: "EXAMINATION",
      durationSeconds: 3600,
      passingScore: 50,
      departmentId: deptAlphaId
    });
    assert(examAlphaRes.status === 201, `Assessment created in Alpha: Status ${examAlphaRes.status}`);
    const examAlphaId = examAlphaRes.body?.data?.id || examAlphaRes.body?.data?._id;

    // Tenant Beta Examiner attempts to view Alpha Assessment
    const crossExamRes = await request(server, {
      method: "GET",
      path: `/api/v1/assessments/${examAlphaId}`,
      headers: { Authorization: `Bearer ${examinerBetaToken}`, "x-organization-id": orgBeta._id.toString() }
    });
    assert(crossExamRes.status === 404 || crossExamRes.status === 403, `Cross-tenant Assessment view blocked with status ${crossExamRes.status}`);

    // Tenant Beta Admin attempts to mutate Alpha Assessment
    const crossExamMutateRes = await request(server, {
      method: "PUT",
      path: `/api/v1/assessments/${examAlphaId}`,
      headers: { Authorization: `Bearer ${adminBetaToken}`, "x-organization-id": orgBeta._id.toString() }
    }, {
      title: "Hacked by Beta"
    });
    assert(crossExamMutateRes.status === 404 || crossExamMutateRes.status === 403, `Cross-tenant Assessment mutation blocked with status ${crossExamMutateRes.status}`);

    // =========================================================================
    // STEP 5: Candidate Management & Cohort Boundary Isolation
    // =========================================================================
    console.log("\n--- [PHASE 5] Candidate Profiles & Group Cohort Isolation ---");

    const candProfileAlphaRes = await request(server, {
      method: "POST",
      path: "/api/v1/candidates",
      headers: { Authorization: `Bearer ${adminAlphaToken}`, "x-organization-id": orgAlpha._id.toString() }
    }, {
      userId: candAlphaUser._id.toString(),
      candidateCode: "CAND-ALPHA-001",
      firstName: "Candidate",
      lastName: "Alpha",
      email: "cand.alpha@iso.test",
      departmentId: deptAlphaId
    });
    assert(candProfileAlphaRes.status === 201, `Candidate profile created in Alpha: Status ${candProfileAlphaRes.status}`);
    const candAlphaId = candProfileAlphaRes.body?.data?.id || candProfileAlphaRes.body?.data?._id;

    // Tenant Beta Admin attempts to query Alpha Candidate profile
    const crossCandGetRes = await request(server, {
      method: "GET",
      path: `/api/v1/candidates/${candAlphaId}`,
      headers: { Authorization: `Bearer ${adminBetaToken}`, "x-organization-id": orgBeta._id.toString() }
    });
    assert(crossCandGetRes.status === 404 || crossCandGetRes.status === 403, `Cross-tenant Candidate retrieval blocked with status ${crossCandGetRes.status}`);

    // =========================================================================
    // STEP 6: Cross-Tenant Result & Analytics Isolation
    // =========================================================================
    console.log("\n--- [PHASE 6] Cross-Tenant Analytics & Reports Isolation ---");

    const crossReportsRes = await request(server, {
      method: "GET",
      path: `/api/v1/reports/dashboard`,
      headers: { Authorization: `Bearer ${adminBetaToken}`, "x-organization-id": orgBeta._id.toString() }
    });
    assert(crossReportsRes.status === 200, `Tenant Beta Report dashboard fetched (Status ${crossReportsRes.status})`);
    if (crossReportsRes.body?.data) {
      assert(crossReportsRes.body?.data?.organizationId !== orgAlpha._id.toString(), "Tenant Beta reports do not leak Tenant Alpha metrics");
    }

    console.log("\n================================================================================");
    console.log(`🎉 MULTI-TENANT ISOLATION TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
    console.log("================================================================================");

    server.close();
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test Suite Aborted with Error:", error);
    server.close();
    await disconnectDatabase();
    process.exit(1);
  }
};

runMultiTenantIsolationTests();
