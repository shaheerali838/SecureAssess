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
import Certificate from "../../src/modules/certificates/certificate.model.js";
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

const runStep54Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 54 Certificate & Credential Verification Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean previous test runs
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-cert-a", "org-cert-b"] } });
    await User.deleteMany({ email: { $in: ["admin54@org-a.com", "cand54@org-a.com", "alien54@org-b.com"] } });
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await Result.deleteMany({});
    await Evaluation.deleteMany({});
    await Certificate.deleteMany({});

    // 2. Setup Organization A & Admin
    const orgA = await Organization.create({
      name: "Global Quantum Computing Institute",
      slug: "org-cert-a",
      code: "CERT-A",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const adminUser = await User.create({
      firstName: "Richard",
      lastName: "Feynman",
      email: "admin54@org-a.com",
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

    // 3. Setup Organization B & Alien Admin
    const orgB = await Organization.create({
      name: "Rival Cryptography Corp",
      slug: "org-cert-b",
      code: "CERT-B",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const alienUser = await User.create({
      firstName: "Eve",
      lastName: "Intruder",
      email: "alien54@org-b.com",
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
      firstName: "Albert",
      lastName: "Einstein",
      email: "cand54@org-a.com",
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
      candidateCode: "CAND-54-EINSTEIN",
      firstName: "Albert",
      lastName: "Einstein",
      email: "cand54@org-a.com",
      status: "ACTIVE",
    });

    const candToken = generateAccessToken({ sub: candidateUser._id.toString() });

    // 5. Seed Assessment, Assignment, Attempt
    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Quantum Electrodynamics & Relativity",
      code: "PHYS-541",
      passingScore: 75,
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

    // 6. Seed Passed & Published Result
    const evaluation = await Evaluation.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentId: assessment._id,
      candidateId: candProfile._id,
      evaluatorId: adminUser._id,
      totalMarks: 100,
      obtainedMarks: 98,
      percentage: 98,
      status: "COMPLETED",
    });

    const passedResult = await Result.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentId: assessment._id,
      candidateId: candProfile._id,
      evaluationId: evaluation._id,
      totalMarks: 100,
      obtainedMarks: 98,
      percentage: 98,
      grade: "A+",
      passed: true,
      published: true,
      publishedAt: new Date(),
      status: "PUBLISHED",
    });

    // 7. Seed Ineligible (Failed) Result with distinct Attempt
    const attempt2 = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: candProfile._id,
      attemptNumber: 2,
      status: "SUBMITTED",
      startedAt: new Date(Date.now() - 7200000),
      submittedAt: new Date(Date.now() - 3600000),
      expiresAt: new Date(Date.now() + 3600000),
      durationSeconds: 3600,
      totalPoints: 100,
      totalMarks: 100,
    });

    const evaluation2 = await Evaluation.create({
      organizationId: orgA._id,
      attemptId: attempt2._id,
      assessmentId: assessment._id,
      candidateId: candProfile._id,
      evaluatorId: adminUser._id,
      totalMarks: 100,
      obtainedMarks: 40,
      percentage: 40,
      status: "COMPLETED",
    });

    const failedResult = await Result.create({
      organizationId: orgA._id,
      attemptId: attempt2._id,
      assessmentId: assessment._id,
      candidateId: candProfile._id,
      evaluationId: evaluation2._id,
      totalMarks: 100,
      obtainedMarks: 40,
      percentage: 40,
      grade: "F",
      passed: false,
      published: true,
      publishedAt: new Date(),
      status: "PUBLISHED",
    });

    // =========================================================================
    // [TEST 1] Ineligible Result Rejection
    // =========================================================================
    console.log("\n[TEST 1] Rejecting Ineligible Result Certificate Issuance...");

    const ineligRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/certificates`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { resultId: failedResult._id.toString() }
    );

    console.log("Ineligible Result Issuance -> Status:", ineligRes.status, "(Expected 400)");
    if (ineligRes.status !== 400) {
      throw new Error(`Expected 400 when attempting to issue certificate for failed result, got ${ineligRes.status}`);
    }

    // =========================================================================
    // [TEST 2] Eligible Result Certificate Issuance & Uniqueness
    // =========================================================================
    console.log("\n[TEST 2] Issuing Verifiable Credential for Eligible Result...");

    const issueRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/certificates`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { resultId: passedResult._id.toString() }
    );

    console.log("Certificate Issuance -> Status:", issueRes.status, "Cert Number:", issueRes.body?.data?.certificateNumber, "Verif Code:", issueRes.body?.data?.verificationCode);
    if (issueRes.status !== 201 || !issueRes.body?.data?.certificateNumber || !issueRes.body?.data?.verificationCode) {
      throw new Error("Failed to issue valid certificate for passed result");
    }

    const certificate = issueRes.body.data;
    const certId = certificate._id;
    const verificationCode = certificate.verificationCode;

    // =========================================================================
    // [TEST 3] Duplicate Issuance Prevention & Idempotency
    // =========================================================================
    console.log("\n[TEST 3] Testing Idempotent Issuance Guard...");

    const dupRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/certificates`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { resultId: passedResult._id.toString() }
    );

    console.log("Duplicate Request -> Returned Same Cert Number:", dupRes.body?.data?.certificateNumber === certificate.certificateNumber);
    const certCount = await Certificate.countDocuments({ resultId: passedResult._id });
    if (certCount !== 1) {
      throw new Error(`Duplicate certificate detected! Total count: ${certCount}`);
    }

    // =========================================================================
    // [TEST 4] Public Credential Verification (Unauthenticated & Sanitized)
    // =========================================================================
    console.log("\n[TEST 4] Public Credential Verification Endpoint...");

    const verifyRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/verify/certificate/${verificationCode}`,
      }
    );

    console.log("Public Verification -> Status:", verifyRes.status, "Valid:", verifyRes.body?.data?.valid, "Recipient:", verifyRes.body?.data?.recipientName, "Title:", verifyRes.body?.data?.title);
    if (verifyRes.status !== 200 || !verifyRes.body?.data?.valid || verifyRes.body?.data?.recipientName !== "Albert Einstein") {
      throw new Error("Public verification failed for authentic certificate");
    }

    // Verify sanitized payload contains NO private internal data
    if (verifyRes.body?.data?.candidateId || verifyRes.body?.data?.passwordHash || verifyRes.body?.data?.email) {
      throw new Error("CRITICAL SECURITY LEAK: Public verification exposed private candidate information!");
    }

    // =========================================================================
    // [TEST 5] Candidate Self-Service Feed & Ownership Isolation
    // =========================================================================
    console.log("\n[TEST 5] Candidate Self-Service View & Ownership Isolation...");

    const myCertsRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/certificates/my`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );

    console.log("Candidate Certificates -> Count:", myCertsRes.body?.data?.length, "Cert #:", myCertsRes.body?.data?.[0]?.certificateNumber);
    if (myCertsRes.status !== 200 || myCertsRes.body?.data?.length !== 1) {
      throw new Error("Candidate failed to retrieve own issued certificate");
    }

    // =========================================================================
    // [TEST 6] Authorized Private Document Download
    // =========================================================================
    console.log("\n[TEST 6] Authorized Document Download Reference...");

    const downloadRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/certificates/${certId}/download`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );

    console.log("Download Response -> Status:", downloadRes.status, "File URL:", downloadRes.body?.data?.fileUrl);
    if (downloadRes.status !== 200 || !downloadRes.body?.data?.fileUrl) {
      throw new Error("Failed to retrieve authorized download link");
    }

    // =========================================================================
    // [TEST 7] Cross-Tenant Security Boundary
    // =========================================================================
    console.log("\n[TEST 7] Cross-Tenant Access Rejection (Tenant B vs Tenant A)...");

    const alienAccessRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgB._id}/certificates/${certId}`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );

    console.log("Alien Access to Org A Cert -> Status:", alienAccessRes.status, "(Expected 404)");
    if (alienAccessRes.status !== 404) {
      throw new Error(`Expected 404 for cross-tenant certificate access, got ${alienAccessRes.status}`);
    }

    // =========================================================================
    // [TEST 8] Certificate Revocation & Verification Invalidation
    // =========================================================================
    console.log("\n[TEST 8] Revoking Certificate & Checking Public Verification Invalidation...");

    const revokeRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/certificates/${certId}/revoke`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { reason: "Candidate academic credentials superseded by new discovery" }
    );

    console.log("Revoke Action -> Status:", revokeRes.status, "New Status:", revokeRes.body?.data?.status);
    if (revokeRes.status !== 200 || revokeRes.body?.data?.status !== "REVOKED") {
      throw new Error("Failed to revoke certificate");
    }

    // Verification must now report invalid/revoked
    const verifyRevokedRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/verify/certificate/${verificationCode}`,
      }
    );
    console.log("Public Verification on Revoked -> Valid:", verifyRevokedRes.body?.data?.valid, "Status:", verifyRevokedRes.body?.data?.status);
    if (verifyRevokedRes.body?.data?.valid !== false || verifyRevokedRes.body?.data?.status !== "REVOKED") {
      throw new Error("Revoked certificate incorrectly validated as authentic!");
    }

    // =========================================================================
    // [TEST 9] Certificate Reissue Lifecycle
    // =========================================================================
    console.log("\n[TEST 9] Reissuing Certificate (New Identity & History Preservation)...");

    const reissueRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/certificates/${certId}/reissue`,
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { reason: "Reissuing with updated nomenclature" }
    );

    console.log("Reissue Action -> Status:", reissueRes.status, "New Cert #:", reissueRes.body?.data?.certificateNumber, "New Code:", reissueRes.body?.data?.verificationCode);
    if (reissueRes.status !== 201 || !reissueRes.body?.data?.certificateNumber) {
      throw new Error("Failed to reissue certificate");
    }

    const newCertificate = reissueRes.body.data;
    if (newCertificate.certificateNumber === certificate.certificateNumber || newCertificate.verificationCode === certificate.verificationCode) {
      throw new Error("Reissued certificate must have new unique identifiers!");
    }

    // New certificate verifies successfully
    const verifyReissuedRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/verify/certificate/${newCertificate.verificationCode}`,
      }
    );
    console.log("New Certificate Public Verification -> Valid:", verifyReissuedRes.body?.data?.valid, "Status:", verifyReissuedRes.body?.data?.status);
    if (verifyReissuedRes.status !== 200 || !verifyReissuedRes.body?.data?.valid) {
      throw new Error("Failed to verify newly reissued certificate");
    }

    // =========================================================================
    // [TEST 10] Security Audit Trail
    // =========================================================================
    console.log("\n[TEST 10] Verifying Audit Trail for Certificate Lifecycle...");

    const auditCount = await AuditLog.countDocuments({ organizationId: orgA._id, resource: "CERTIFICATE" });
    console.log("Certificate Audit Logs Recorded for Org A ->", auditCount);
    if (auditCount < 3) {
      throw new Error(`Expected at least 3 audit logs for issue, revoke, and reissue, found ${auditCount}`);
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 54 CERTIFICATE & CREDENTIAL VERIFICATION TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep54Tests().catch((err) => {
  console.error("❌ Step 54 Test Suite Failed:", err);
  process.exit(1);
});
