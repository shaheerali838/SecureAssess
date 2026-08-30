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
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import Result from "../../src/modules/results/result.model.js";
import Certificate from "../../src/modules/certificates/certificate.model.js";
import { runCertificateGenerationJob } from "../../src/jobs/certificateGeneration.job.js";
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

const runStep23Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 23 Certificates & Credentials Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-23", "org-alien-23"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner23@test.com", "alice23@vu.edu.pk", "eve23@alien.com"] } });
    await Certificate.deleteMany({});

    // 2. Setup Org A
    const orgA = await Organization.create({
      name: "Virtual University 23",
      slug: "org-vu-23",
      code: "VU23",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Software Engineering",
      code: "SE",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Software Engineering",
      code: "BSSE",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      programId: progA._id,
      name: "Cloud Architecture",
      code: "CA-23",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner23@test.com",
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
      email: "alice23@vu.edu.pk",
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
      candidateCode: "VU-CAND-23",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice23@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve (For Isolation)
    const orgB = await Organization.create({
      name: "Alien Org 23",
      slug: "org-alien-23",
      code: "ALIEN23",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve23@alien.com",
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

    // 3. Setup Assessment
    const assessmentA = await Assessment.create({
      organizationId: orgA._id,
      title: "Cloud Architecture Professional Certification",
      code: "CA-PRO-23",
      type: "MCQ",
      subjectId: subjA._id,
      durationSeconds: 3600,
      passingScore: 70,
      totalPoints: 100,
      createdBy: vuExaminer._id,
      status: "PUBLISHED",
      settings: {
        certificate: {
          enabled: true,
          requirePassing: true,
          minimumPercentage: 70,
          templateId: "MODERN",
        },
      },
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      attemptLimit: 1,
    });

    // 4. Create Passed Result
    const passedAttempt = await Attempt.create({
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

    const passedEval = await Evaluation.create({
      organizationId: orgA._id,
      attemptId: passedAttempt._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      status: "COMPLETED",
      evaluationType: "AUTOMATIC",
      totalScore: 92,
      totalPoints: 100,
      percentage: 92,
      passingScore: 70,
      passed: true,
      totalQuestions: 10,
      evaluatedQuestions: 10,
    });

    const passedResult = await Result.create({
      organizationId: orgA._id,
      attemptId: passedAttempt._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      evaluationId: passedEval._id,
      totalPoints: 100,
      earnedPoints: 92,
      percentage: 92,
      grade: "A",
      passed: true,
      published: true,
      publishedAt: new Date(),
    });

    // 5. Create Failed Result
    const failedAttempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      assignmentId: assignment._id,
      attemptNumber: 2,
      status: "SUBMITTED",
      durationSeconds: 3600,
      expiresAt: new Date(Date.now() + 1800 * 1000),
      startedAt: new Date(Date.now() - 1800 * 1000),
      submittedAt: new Date(),
    });

    const failedEval = await Evaluation.create({
      organizationId: orgA._id,
      attemptId: failedAttempt._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      status: "COMPLETED",
      evaluationType: "AUTOMATIC",
      totalScore: 50,
      totalPoints: 100,
      percentage: 50,
      passingScore: 70,
      passed: false,
      totalQuestions: 10,
      evaluatedQuestions: 10,
    });

    const failedResult = await Result.create({
      organizationId: orgA._id,
      attemptId: failedAttempt._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      evaluationId: failedEval._id,
      totalPoints: 100,
      earnedPoints: 50,
      percentage: 50,
      grade: "F",
      passed: false,
      published: true,
      publishedAt: new Date(),
    });

    console.log("\n[TEST 1] Explicit Certificate Issuance for Passed Candidate...");
    const issueRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/certificates`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      resultId: passedResult._id,
    });

    console.log("Issue Status ->", issueRes.status, "Certificate Number:", issueRes.body?.data?.certificateNumber, "Verification Code:", issueRes.body?.data?.verificationCode);
    if (issueRes.status !== 201 || !issueRes.body?.data?.certificateNumber || !issueRes.body?.data?.verificationCode) {
      throw new Error("Test 1 Failed: Certificate could not be issued!");
    }
    const certId = issueRes.body.data._id;
    const vCode = issueRes.body.data.verificationCode;

    console.log("\n[TEST 2] Eligibility Guard: Reject Certificate Issuance for Failed Result...");
    const rejectRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/certificates`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      resultId: failedResult._id,
    });
    console.log("Failed Result Issuance Response -> Status:", rejectRes.status, "Success:", rejectRes.body?.success);
    if (rejectRes.status !== 400) {
      throw new Error("Test 2 Failed: Ineligible candidate was issued a certificate!");
    }

    console.log("\n[TEST 3] Public Credential Verification (Authentic Credential)...");
    const pubVerifyRes = await request(server, {
      method: "GET",
      path: `/api/v1/public/certificates/verify/${vCode}`,
    });
    console.log("Public Verify Status ->", pubVerifyRes.status, "Valid:", pubVerifyRes.body?.data?.valid, "Recipient:", pubVerifyRes.body?.data?.recipientName, "Title:", pubVerifyRes.body?.data?.title);
    if (pubVerifyRes.status !== 200 || !pubVerifyRes.body?.data?.valid || pubVerifyRes.body?.data?.recipientName !== "Alice Candidate") {
      throw new Error("Test 3 Failed: Public verification failed!");
    }

    console.log("\n[TEST 4] Public Verification with Invalid Code...");
    const fakeVerifyRes = await request(server, {
      method: "GET",
      path: `/api/v1/public/certificates/verify/FAKE-INVALID-CODE`,
    });
    console.log("Fake Code Verify Status ->", fakeVerifyRes.status, "Valid:", fakeVerifyRes.body?.data?.valid);
    if (fakeVerifyRes.status !== 404 || fakeVerifyRes.body?.data?.valid !== false) {
      throw new Error("Test 4 Failed: Invalid code returned valid response!");
    }

    console.log("\n[TEST 5] Candidate Self-Service: Retrieve Certificates & Download Link...");
    const myCertsRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/certificates`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("My Certificates Status ->", myCertsRes.status, "Total Count:", myCertsRes.body?.data?.length);
    if (myCertsRes.status !== 200 || myCertsRes.body?.data?.length !== 1) {
      throw new Error("Test 5.1 Failed: Candidate could not retrieve own certificates!");
    }

    const downloadRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/certificates/${certId}/download`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Download Link Status ->", downloadRes.status, "File URL Present:", Boolean(downloadRes.body?.data?.fileUrl));
    if (downloadRes.status !== 200 || !downloadRes.body?.data?.fileUrl) {
      throw new Error("Test 5.2 Failed: Download link retrieval failed!");
    }

    console.log("\n[TEST 6] Certificate Revocation by Authorized Examiner...");
    const revokeRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/certificates/${certId}/revoke`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      reason: "Post-evaluation proctoring audit flagged unauthorized materials.",
    });
    console.log("Revocation Status ->", revokeRes.status, "Certificate Status:", revokeRes.body?.data?.status, "RevokedAt Present:", Boolean(revokeRes.body?.data?.revokedAt));
    if (revokeRes.status !== 200 || revokeRes.body?.data?.status !== "REVOKED") {
      throw new Error("Test 6 Failed: Certificate revocation failed!");
    }

    console.log("\n[TEST 7] Public Verification of Revoked Certificate...");
    const revokedVerifyRes = await request(server, {
      method: "GET",
      path: `/api/v1/public/certificates/verify/${vCode}`,
    });
    console.log("Revoked Verify Status ->", revokedVerifyRes.status, "Valid:", revokedVerifyRes.body?.data?.valid, "Status:", revokedVerifyRes.body?.data?.status, "Message:", revokedVerifyRes.body?.data?.message);
    if (revokedVerifyRes.body?.data?.valid !== false || revokedVerifyRes.body?.data?.status !== "REVOKED") {
      throw new Error("Test 7 Failed: Public verification did not identify revoked credential!");
    }

    console.log("\n[TEST 8] Cross-Tenant & Unauthorized Revocation Guards...");
    // Eve cannot revoke Alice's certificate
    const eveRevokeRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/certificates/${certId}/revoke`,
      headers: { Authorization: `Bearer ${eveToken}` },
    }, { reason: "Malicious attempt" });
    console.log("Eve Revocation Status ->", eveRevokeRes.status, "Success:", eveRevokeRes.body?.success);
    if (eveRevokeRes.status !== 403) throw new Error("Test 8.1 Failed: Cross-tenant revocation was not blocked!");

    // Alice Candidate cannot revoke certificates
    const aliceRevokeRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/certificates/${certId}/revoke`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, { reason: "Self revoke" });
    console.log("Candidate Revocation Status ->", aliceRevokeRes.status, "Success:", aliceRevokeRes.body?.success);
    if (aliceRevokeRes.status !== 403) throw new Error("Test 8.2 Failed: Candidate was not blocked from revocation!");

    console.log("\n[TEST 9] Background Certificate Generation Job Worker...");
    // Delete existing certificate for passedResult to test worker issuance
    await Certificate.deleteMany({ resultId: passedResult._id });
    const jobResult = await runCertificateGenerationJob();
    console.log("Certificate Generation Job -> Scanned:", jobResult.scanned, "Issued:", jobResult.issued);
    if (jobResult.issued < 1) throw new Error("Test 9 Failed: Certificate worker failed to issue credential!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 23 CERTIFICATES & CREDENTIAL MANAGEMENT TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 23 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep23Tests();
