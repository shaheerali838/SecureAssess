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
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import Result from "../../src/modules/results/result.model.js";
import Certificate from "../../src/modules/certificates/certificate.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { ASSESSMENT_STATUSES } from "../../src/constants/assessmentStatuses.js";
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

const runStep41Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 41 Certificates & Credentials Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-41", "org-alien-41"] } });
    await User.deleteMany({ email: { $in: ["examiner41@vu.edu.pk", "alice41@vu.edu.pk", "bob41@vu.edu.pk", "eve41@alien.com"] } });
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await Evaluation.deleteMany({});
    await Result.deleteMany({});
    await Certificate.deleteMany({});

    // 2. Setup Organization A & Examiner
    const orgA = await Organization.create({
      name: "Virtual University 41",
      slug: "org-vu-41",
      code: "VU41",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const examinerUser = await User.create({
      firstName: "Prof.",
      lastName: "Kareem",
      email: "examiner41@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const examinerToken = generateAccessToken({ sub: examinerUser._id.toString() });

    await UserMembership.create({
      userId: examinerUser._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    // Alice Candidate (Passed)
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice41@vu.edu.pk",
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
      candidateCode: "VU-CAND-41A",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice41@vu.edu.pk",
      status: "ACTIVE",
    });

    // Bob Candidate (Failed)
    const bobUser = await User.create({
      firstName: "Bob",
      lastName: "Miller",
      email: "bob41@vu.edu.pk",
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
      candidateCode: "VU-CAND-41B",
      firstName: "Bob",
      lastName: "Miller",
      email: "bob41@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve Examiner
    const orgB = await Organization.create({
      name: "Alien Org 41",
      slug: "org-alien-41",
      code: "ALIEN41",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Interloper",
      email: "eve41@alien.com",
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

    // 3. Assessment & Attempts
    const asm = await Assessment.create({
      organizationId: orgA._id,
      title: "Cloud Architecture Professional Certificate",
      code: "CLOUD-PRO-41",
      status: ASSESSMENT_STATUSES.PUBLISHED,
      publishedAt: new Date(),
      duration: { value: 60, unit: "MINUTES" },
      durationSeconds: 3600,
      totalPoints: 100,
      passingScore: 60,
      createdBy: examinerUser._id,
    });

    const aliceAssignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      candidateId: aliceCandidate._id,
      status: "COMPLETED",
      accessCode: "SA-4141-ALICE",
      maxAttempts: 1,
    });

    const aliceAttempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      assignmentId: aliceAssignment._id,
      candidateId: aliceCandidate._id,
      attemptNumber: 1,
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
      expiresAt: new Date(),
      durationSeconds: 3600,
      totalPoints: 100,
    });

    const aliceEvaluation = await Evaluation.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      attemptId: aliceAttempt._id,
      candidateId: aliceCandidate._id,
      status: "COMPLETED",
      totalScore: 92,
      totalMarks: 100,
      percentage: 92,
      passed: true,
      grade: "A+",
      pendingManualReview: false,
    });

    // Alice Result (Initially Unpublished)
    const aliceResult = await Result.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      attemptId: aliceAttempt._id,
      candidateId: aliceCandidate._id,
      evaluationId: aliceEvaluation._id,
      totalMarks: 100,
      obtainedMarks: 92,
      percentage: 92,
      grade: "A+",
      passed: true,
      status: "READY",
      published: false, // Unpublished initially
    });

    // Bob Result (Published but Failed)
    const bobAssignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      candidateId: bobCandidate._id,
      status: "COMPLETED",
      accessCode: "SA-4141-BOB",
      maxAttempts: 1,
    });

    const bobAttempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      assignmentId: bobAssignment._id,
      candidateId: bobCandidate._id,
      attemptNumber: 1,
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
      expiresAt: new Date(),
      durationSeconds: 3600,
      totalPoints: 100,
    });

    const bobEvaluation = await Evaluation.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      attemptId: bobAttempt._id,
      candidateId: bobCandidate._id,
      status: "COMPLETED",
      totalScore: 42,
      totalMarks: 100,
      percentage: 42,
      passed: false,
      grade: "F",
      pendingManualReview: false,
    });

    const bobResult = await Result.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      attemptId: bobAttempt._id,
      candidateId: bobCandidate._id,
      evaluationId: bobEvaluation._id,
      totalMarks: 100,
      obtainedMarks: 42,
      percentage: 42,
      grade: "F",
      passed: false,
      status: "PUBLISHED",
      published: true,
    });

    console.log("\n[TEST 1] Certificate Eligibility: Unpublished Result Guard...");
    const unpubRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/certificates`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      resultId: aliceResult._id.toString(),
    });
    console.log("Unpublished Result Issuance Status ->", unpubRes.status, "Message:", unpubRes.body?.message);
    if (unpubRes.status !== 400) {
      throw new Error("Test 1 Failed: Certificate was issued for an unpublished result!");
    }

    console.log("\n[TEST 2] Certificate Eligibility: Failed Result Guard...");
    const failedRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/certificates`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      resultId: bobResult._id.toString(),
    });
    console.log("Failed Result Issuance Status ->", failedRes.status, "Message:", failedRes.body?.message);
    if (failedRes.status !== 400) {
      throw new Error("Test 2 Failed: Certificate was issued for a failed assessment result!");
    }

    // Publish Alice's result
    aliceResult.published = true;
    aliceResult.status = "PUBLISHED";
    aliceResult.publishedAt = new Date();
    await aliceResult.save();

    console.log("\n[TEST 3] Generating & Issuing Official Certificate...");
    const issueRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/certificates`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      resultId: aliceResult._id.toString(),
    });
    console.log("Certificate Issue Status ->", issueRes.status, "Cert Number:", issueRes.body?.data?.certificateNumber, "Verification Code:", issueRes.body?.data?.verificationCode, "Status:", issueRes.body?.data?.status);
    if (issueRes.status !== 201 || !issueRes.body?.data?.certificateNumber || !issueRes.body?.data?.verificationCode) {
      throw new Error("Test 3.1 Failed: Certificate generation failed!");
    }
    const certificateId = issueRes.body.data._id;
    const verificationCode = issueRes.body.data.verificationCode;
    const certNumber = issueRes.body.data.certificateNumber;

    console.log("\n[TEST 4] Idempotency: Duplicate Certificate Prevention...");
    const dupIssueRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/certificates`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      resultId: aliceResult._id.toString(),
    });
    console.log("Duplicate Issue Status ->", dupIssueRes.status, "Returned ID:", dupIssueRes.body?.data?._id);
    const totalCerts = await Certificate.countDocuments({ resultId: aliceResult._id });
    if (totalCerts !== 1) {
      throw new Error("Test 4 Failed: Duplicate certificate records created!");
    }

    console.log("\n[TEST 5] Candidate Portal: View Own Certificate & Download Link...");
    // 5.1 Alice queries her certificates
    const aliceListRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/certificates`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Cert Count ->", aliceListRes.body?.data?.length);
    if (aliceListRes.status !== 200 || aliceListRes.body?.data?.length !== 1) {
      throw new Error("Test 5.1 Failed: Candidate could not retrieve own certificate!");
    }

    // 5.2 Alice downloads certificate
    const downloadRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/certificates/${certificateId}/download`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Download Status ->", downloadRes.status, "File URL:", downloadRes.body?.data?.fileUrl);
    if (downloadRes.status !== 200 || !downloadRes.body?.data?.fileUrl) {
      throw new Error("Test 5.2 Failed: Candidate could not obtain certificate download URL!");
    }

    // 5.3 Bob (different candidate) tries to download Alice's certificate -> blocked
    const bobSpyRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/certificates/${certificateId}/download`,
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log("Bob Unauthorized Access Status ->", bobSpyRes.status);
    if (bobSpyRes.status !== 403) {
      throw new Error("Test 5.3 Failed: Unauthorized candidate was able to access Alice's certificate!");
    }

    console.log("\n[TEST 6] Public Unauthenticated Certificate Verification...");
    // 6.1 Valid verification code
    const pubVerifyRes = await request(server, {
      method: "GET",
      path: `/api/v1/public/certificates/verify/${verificationCode}`,
    });
    console.log("Public Verify Status ->", pubVerifyRes.status, "Valid:", pubVerifyRes.body?.data?.valid, "Recipient:", pubVerifyRes.body?.data?.recipientName, "Issuer:", pubVerifyRes.body?.data?.issuerName);
    if (pubVerifyRes.status !== 200 || pubVerifyRes.body?.data?.valid !== true || pubVerifyRes.body?.data?.recipientName !== "Alice Johnson") {
      throw new Error("Test 6.1 Failed: Public certificate verification failed for valid code!");
    }

    // Ensure no private candidate data leaked
    if (pubVerifyRes.body?.data?.email !== undefined || pubVerifyRes.body?.data?.password !== undefined) {
      throw new Error("Test 6.2 Failed: Private candidate information leaked in public verification!");
    }

    // 6.3 Invalid verification code
    const invalidVerifyRes = await request(server, {
      method: "GET",
      path: `/api/v1/public/certificates/verify/INVALID-CODE-9999`,
    });
    console.log("Invalid Verify Status ->", invalidVerifyRes.status, "Valid:", invalidVerifyRes.body?.data?.valid);
    if (invalidVerifyRes.status !== 404 || invalidVerifyRes.body?.data?.valid !== false) {
      throw new Error("Test 6.3 Failed: Invalid verification code did not return false!");
    }

    console.log("\n[TEST 7] Certificate Revocation Workflow & Verification Update...");
    // 7.1 Examiner revokes certificate
    const revokeRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/certificates/${certificateId}/revoke`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      reason: "Academic integrity breach discovered post-issuance",
    });
    console.log("Revoke Status ->", revokeRes.status, "Cert Status:", revokeRes.body?.data?.status);
    if (revokeRes.status !== 200 || revokeRes.body?.data?.status !== "REVOKED") {
      throw new Error("Test 7.1 Failed: Certificate revocation failed!");
    }

    // 7.2 Public verification of revoked certificate returns invalid/revoked
    const verifyRevokedRes = await request(server, {
      method: "GET",
      path: `/api/v1/public/certificates/verify/${verificationCode}`,
    });
    console.log("Revoked Verify Status ->", verifyRevokedRes.status, "Valid:", verifyRevokedRes.body?.data?.valid, "Status:", verifyRevokedRes.body?.data?.status);
    if (verifyRevokedRes.body?.data?.valid !== false || verifyRevokedRes.body?.data?.status !== "REVOKED") {
      throw new Error("Test 7.2 Failed: Public verification did not report revoked certificate as invalid!");
    }

    console.log("\n[TEST 8] Cross-Tenant Security Isolation...");
    const eveAlienRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/certificates/${certificateId}`,
      headers: { Authorization: `Bearer ${eveToken}` }, // Eve belongs to Org B
    });
    console.log("Eve Alien Access Status ->", eveAlienRes.status);
    if (eveAlienRes.status !== 403) {
      throw new Error("Test 8 Failed: Cross-tenant certificate management was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 41 CERTIFICATE & CREDENTIAL MANAGEMENT TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 41 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep41Tests();
