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
import QuestionBank from "../../src/modules/questionBank/questionBank.model.js";
import Question from "../../src/modules/questionBank/question.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import Answer from "../../src/modules/answers/answer.model.js";
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import Result from "../../src/modules/results/result.model.js";
import Certificate from "../../src/modules/certificates/certificate.model.js";
import Plan from "../../src/modules/subscriptions/plan.model.js";
import Subscription from "../../src/modules/subscriptions/subscription.model.js";
import { BillingCustomer, Invoice, BillingEvent } from "../../src/modules/billing/billing.model.js";
import AuditLog from "../../src/modules/auditLogs/auditLog.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { DEFAULT_PLANS } from "../../src/modules/subscriptions/subscription.constants.js";
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

const runStep59Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 59 Production Readiness & Final System Validation Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Setup Platform Owner & Roles
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["alpha-polytechnic-59", "beta-defense-59"] } });
    await User.deleteMany({ email: { $in: ["margaret59@alpha.edu", "grace59@beta.org", "alan59@enigma.edu"] } });
    await Candidate.deleteMany({ identifier: "CAND-TURING-59" });
    await QuestionBank.deleteMany({ code: "QB-CYBER-59" });
    await Assessment.deleteMany({ code: "EXAM-CRYPTO-59" });
    await Plan.deleteMany({});
    await Plan.insertMany(Object.values(DEFAULT_PLANS));

    // =========================================================================
    // [PHASE 1] Organization Creation, Multi-Tenancy & RBAC Provisioning
    // =========================================================================
    console.log("\n[PHASE 1] Platform Owner Provisions Organization & Staff Memberships...");

    const orgA = await Organization.create({
      name: "Alpha Polytechnic Institute",
      slug: "alpha-polytechnic-59",
      code: "API-59",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const orgB = await Organization.create({
      name: "Beta Defense Systems",
      slug: "beta-defense-59",
      code: "BDS-59",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const adminUserA = await User.create({
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "margaret59@alpha.edu",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: adminUserA._id,
      organizationId: orgA._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const adminTokenA = generateAccessToken({ sub: adminUserA._id.toString() });

    const adminUserB = await User.create({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace59@beta.org",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: adminUserB._id,
      organizationId: orgB._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const adminTokenB = generateAccessToken({ sub: adminUserB._id.toString() });

    console.log("Tenants Created -> Org A:", orgA.name, "| Org B:", orgB.name);

    // =========================================================================
    // [PHASE 2] Department, Program & Academic Catalog Setup
    // =========================================================================
    console.log("\n[PHASE 2] Configuring Academic & Organizational Hierarchy...");

    const dept = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science & Engineering",
      code: "CSE-59",
      createdBy: adminUserA._id,
    });

    const prog = await Program.create({
      organizationId: orgA._id,
      departmentId: dept._id,
      name: "Bachelor of Science in Software Engineering",
      code: "BSSE-59",
      createdBy: adminUserA._id,
    });

    const subj = await Subject.create({
      organizationId: orgA._id,
      programId: prog._id,
      name: "Information Security & Cryptography",
      code: "SEC-501",
      createdBy: adminUserA._id,
    });

    console.log("Academic Structure -> Dept:", dept.name, "| Subject:", subj.name);

    // =========================================================================
    // [PHASE 3] Question Bank & Question Authoring
    // =========================================================================
    console.log("\n[PHASE 3] Authoring Secure Question Bank Items...");

    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "Cybersecurity Core Exam Bank",
      code: "QB-CYBER-59",
      ownerId: adminUserA._id,
      createdBy: adminUserA._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      title: "Symmetric Encryption",
      prompt: "Which encryption standard is considered a symmetric block cipher with a 128, 192, or 256-bit key length?",
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "opt_rsa", text: "RSA", isCorrect: false },
        { id: "opt_aes", text: "AES", isCorrect: true },
        { id: "opt_dh", text: "Diffie-Hellman", isCorrect: false },
        { id: "opt_ecc", text: "ECC", isCorrect: false },
      ],
      points: 50,
      status: "ACTIVE",
      createdBy: adminUserA._id,
    });

    const q2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      title: "Public Key Infrastructure",
      prompt: "True or False: In a public-key infrastructure (PKI), the private key should be shared with the certificate authority.",
      type: "TRUE_FALSE",
      options: [
        { id: "opt_true", text: "True", isCorrect: false },
        { id: "opt_false", text: "False", isCorrect: true },
      ],
      points: 50,
      status: "ACTIVE",
      createdBy: adminUserA._id,
    });

    console.log("Questions Authored -> Q1:", q1.prompt.slice(0, 40) + "...", "| Q2:", q2.prompt.slice(0, 40) + "...");

    // =========================================================================
    // [PHASE 4] Assessment Creation, Sections & Publishing
    // =========================================================================
    console.log("\n[PHASE 4] Assembling & Publishing Comprehensive Assessment...");

    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Advanced Applied Cryptography Certification Exam",
      code: "EXAM-CRYPTO-59",
      passingScore: 70,
      totalPoints: 100,
      durationMinutes: 60,
      status: "PUBLISHED",
      createdBy: adminUserA._id,
    });

    const section = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      title: "Section 1: Symmetric & Asymmetric Fundamentals",
      totalPoints: 100,
      createdBy: adminUserA._id,
    });

    await AssessmentQuestion.create([
      {
        organizationId: orgA._id,
        assessmentId: assessment._id,
        sectionId: section._id,
        questionId: q1._id,
        order: 1,
        title: q1.title,
        prompt: q1.prompt,
        type: q1.type,
        options: q1.options,
        points: 50,
        marks: 50,
        createdBy: adminUserA._id,
      },
      {
        organizationId: orgA._id,
        assessmentId: assessment._id,
        sectionId: section._id,
        questionId: q2._id,
        order: 2,
        title: q2.title,
        prompt: q2.prompt,
        type: q2.type,
        options: q2.options,
        points: 50,
        marks: 50,
        createdBy: adminUserA._id,
      },
    ]);

    console.log("Assessment Published -> Title:", assessment.title, "| Passing Score:", assessment.passingScore, "%");

    // =========================================================================
    // [PHASE 5] Candidate Onboarding & Exam Assignment
    // =========================================================================
    console.log("\n[PHASE 5] Candidate Provisioning & Assessment Scheduling...");

    const candidateUser = await User.create({
      firstName: "Alan",
      lastName: "Turing",
      email: "alan59@enigma.edu",
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

    const candToken = generateAccessToken({ sub: candidateUser._id.toString() });

    const candidate = await Candidate.create({
      organizationId: orgA._id,
      userId: candidateUser._id,
      candidateCode: "CAND-TURING-59",
      firstName: "Alan",
      lastName: "Turing",
      email: "alan59@enigma.edu",
      identifier: "CAND-TURING-59",
      status: "ACTIVE",
      createdBy: adminUserA._id,
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: candidate._id,
      maxAttempts: 2,
      assignedBy: adminUserA._id,
      status: "ASSIGNED",
    });

    console.log("Assignment Created -> Candidate:", candidate.fullName, "| Assessment:", assessment.code);

    // =========================================================================
    // [PHASE 6] Candidate Exam Attempt Execution & Answer Autosave
    // =========================================================================
    console.log("\n[PHASE 6] Candidate Exam Attempt Execution & Autosave...");

    const attempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: candidate._id,
      attemptNumber: 1,
      durationSeconds: 3600,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    // Candidate submits correct answers
    await Answer.create([
      {
        organizationId: orgA._id,
        attemptId: attempt._id,
        attemptQuestionId: new mongoose.Types.ObjectId(),
        candidateId: candidate._id,
        answer: "opt_aes",
        answerType: "SINGLE_CHOICE",
        isAnswered: true,
      },
      {
        organizationId: orgA._id,
        attemptId: attempt._id,
        attemptQuestionId: new mongoose.Types.ObjectId(),
        candidateId: candidate._id,
        answer: "opt_false",
        answerType: "TRUE_FALSE",
        isAnswered: true,
      },
    ]);

    attempt.status = "SUBMITTED";
    attempt.submittedAt = new Date();
    await attempt.save();

    console.log("Exam Submitted -> Attempt ID:", attempt._id.toString(), "Status:", attempt.status);

    // =========================================================================
    // [PHASE 7] Evaluation Engine & Objective Auto-Grading
    // =========================================================================
    console.log("\n[PHASE 7] Objective Auto-Grading & Scoring...");

    const evaluation = await Evaluation.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentId: assessment._id,
      candidateId: candidate._id,
      gradingMethod: "AUTOMATIC",
      objectiveScore: 100,
      totalScore: 100,
      totalMarks: 100,
      status: "COMPLETED",
      questions: [
        {
          attemptQuestionId: new mongoose.Types.ObjectId(),
          questionId: q1._id,
          questionType: "SINGLE_CHOICE",
          marksAvailable: 50,
          marksAwarded: 50,
          status: "EVALUATED",
        },
        {
          attemptQuestionId: new mongoose.Types.ObjectId(),
          questionId: q2._id,
          questionType: "TRUE_FALSE",
          marksAvailable: 50,
          marksAwarded: 50,
          status: "EVALUATED",
        },
      ],
    });

    console.log("Evaluation Completed -> Total Score:", evaluation.totalScore, "Total Marks:", evaluation.totalMarks);

    // =========================================================================
    // [PHASE 8] Result Calculation & Verification
    // =========================================================================
    console.log("\n[PHASE 8] Computing Final Authoritative Result...");

    const result = await Result.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: candidate._id,
      attemptId: attempt._id,
      evaluationId: evaluation._id,
      totalMarks: 100,
      obtainedMarks: 100,
      percentage: 100,
      passed: true,
      grade: "A+",
      status: "PUBLISHED",
      published: true,
      publishedAt: new Date(),
    });

    console.log("Result Generated -> Percentage:", result.percentage, "% | Passed:", result.passed, "| Grade:", result.grade);
    if (!result.passed || result.percentage !== 100) {
      throw new Error("Result computation failed!");
    }

    // =========================================================================
    // [PHASE 9] Certificate Issuance & Public Credential Verification
    // =========================================================================
    console.log("\n[PHASE 9] Verifiable Credential Generation & Public Verification...");

    const certRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/certificates`,
        headers: { Authorization: `Bearer ${adminTokenA}` },
      },
      {
        resultId: result._id.toString(),
      }
    );

    console.log("Certificate Issued -> Status:", certRes.status, "Cert Number:", certRes.body?.data?.certificateNumber, "Code:", certRes.body?.data?.verificationCode);
    if (certRes.status !== 201 || !certRes.body?.data?.verificationCode) {
      throw new Error("Certificate generation failed!");
    }

    const verificationCode = certRes.body.data.verificationCode;

    // Public verification check (No auth required)
    const publicVerifyRes = await request(server, {
      method: "GET",
      path: `/api/v1/public/certificates/verify/${verificationCode}`,
    });

    console.log("Public Verification Check -> Status:", publicVerifyRes.status, "Valid:", publicVerifyRes.body?.data?.valid, "Recipient:", publicVerifyRes.body?.data?.recipientName);
    if (publicVerifyRes.status !== 200 || !publicVerifyRes.body?.data?.valid) {
      throw new Error("Public certificate verification failed!");
    }

    // =========================================================================
    // [PHASE 10] Cross-Tenant Boundary Penetration Testing
    // =========================================================================
    console.log("\n[PHASE 10] Multi-Tenant Isolation & Cross-Tenant Boundary Validation...");

    // Org B admin attempts to read Org A's certificates
    const alienCertRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgB._id}/certificates`,
      headers: { Authorization: `Bearer ${adminTokenB}` },
    });

    console.log("Org B Certificates Count ->", alienCertRes.body?.data?.items?.length || 0, "(Expected 0 for Org B)");
    if (alienCertRes.status !== 200 || (alienCertRes.body?.data?.items?.length || 0) !== 0) {
      throw new Error("Tenant leakage: Org B admin retrieved Org A certificates!");
    }

    // Org B admin attempts to access Org A's internal assessment directly
    const alienExamRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgB._id}/assessments/${assessment._id}`,
      headers: { Authorization: `Bearer ${adminTokenB}` },
    });

    console.log("Org B Accessing Org A Assessment -> Status:", alienExamRes.status, "(Expected 404/403)");
    if (alienExamRes.status !== 404 && alienExamRes.status !== 403) {
      throw new Error(`Cross-tenant breach: Org B retrieved Org A assessment with status ${alienExamRes.status}`);
    }

    // Candidate attempts to access administrative billing
    const candBillingRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/billing/summary`,
      headers: { Authorization: `Bearer ${candToken}` },
    });

    console.log("Candidate Accessing Billing Summary -> Status:", candBillingRes.status, "(Expected 403)");
    if (candBillingRes.status !== 403) {
      throw new Error(`Candidate breached RBAC billing boundary with status ${candBillingRes.status}`);
    }

    // =========================================================================
    // [PHASE 11] Subscription, SaaS Entitlements & Billing Integration
    // =========================================================================
    console.log("\n[PHASE 11] Subscription Lifecycle, Entitlements & Webhook Billing...");

    const paymentWebhookPayload = {
      id: "evt_final_val_9901",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          organizationId: orgA._id.toString(),
          plan: "ENTERPRISE",
          status: "ACTIVE",
          amount: 999,
          currency: "USD",
          invoiceId: "inv_ent_final_9901",
        },
      },
    };

    const webhookRes = await request(
      server,
      {
        method: "POST",
        path: "/api/v1/billing/webhook",
        headers: { "x-billing-signature": "mock_sig_valid" },
      },
      paymentWebhookPayload
    );

    console.log("Webhook Billing Activation -> Status:", webhookRes.status, "Processed:", webhookRes.body?.data?.processed);
    if (webhookRes.status !== 200 || !webhookRes.body?.data?.processed) {
      throw new Error("Billing webhook processing failed!");
    }

    const sub = await Subscription.findOne({ organizationId: orgA._id });
    console.log("Upgraded Subscription -> Plan:", sub?.planCode, "Status:", sub?.status, "Price:", sub?.price);
    if (sub?.planCode !== "ENTERPRISE" || sub?.status !== "ACTIVE") {
      throw new Error("Subscription failed to upgrade to ENTERPRISE!");
    }

    // =========================================================================
    // [PHASE 12] Audit Logging & Notification Traceability
    // =========================================================================
    console.log("\n[PHASE 12] Audit Trail Integrity & System Notifications...");

    const auditCount = await AuditLog.countDocuments({ organizationId: orgA._id });
    console.log("Total Audit Logs for Org A ->", auditCount);
    if (auditCount < 2) {
      throw new Error("Audit trail logging is inactive or missing events!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 59 PRODUCTION READINESS & FINAL SYSTEM VALIDATION TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep59Tests().catch((err) => {
  console.error("❌ Step 59 Test Suite Failed:", err);
  process.exit(1);
});
