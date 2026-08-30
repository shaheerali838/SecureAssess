import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import QuestionBank from "../../src/modules/questionBank/questionBank.model.js";
import Question from "../../src/modules/questionBank/question.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import AttemptQuestion from "../../src/modules/attemptQuestions/attemptQuestion.model.js";
import Answer from "../../src/modules/answers/answer.model.js";
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import Result from "../../src/modules/results/result.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { ASSESSMENT_STATUSES } from "../../src/constants/assessmentStatuses.js";
import { QUESTION_TYPES } from "../../src/constants/questionTypes.js";
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

const runStep40Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 40 Results & Candidate Publication Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-40", "org-alien-40"] } });
    await User.deleteMany({ email: { $in: ["examiner40@vu.edu.pk", "alice40@vu.edu.pk", "eve40@alien.com"] } });
    await QuestionBank.deleteMany({});
    await Question.deleteMany({});
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentSection.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await AttemptQuestion.deleteMany({});
    await Answer.deleteMany({});
    await Evaluation.deleteMany({});
    await Result.deleteMany({});

    // 2. Setup Organization A & Examiner
    const orgA = await Organization.create({
      name: "Virtual University 40",
      slug: "org-vu-40",
      code: "VU40",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const examinerUser = await User.create({
      firstName: "Dr.",
      lastName: "Nasir",
      email: "examiner40@vu.edu.pk",
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

    // Alice Candidate
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Smith",
      email: "alice40@vu.edu.pk",
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
      candidateCode: "VU-CAND-40A",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice40@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve Examiner
    const orgB = await Organization.create({
      name: "Alien Org 40",
      slug: "org-alien-40",
      code: "ALIEN40",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Spy",
      email: "eve40@alien.com",
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

    // 3. Create Assessment & Assignment
    const asm = await Assessment.create({
      organizationId: orgA._id,
      title: "Distributed Systems Midterm 2026",
      code: "CS701-MID-2026",
      status: ASSESSMENT_STATUSES.PUBLISHED,
      publishedAt: new Date(),
      duration: { value: 60, unit: "MINUTES" },
      durationSeconds: 3600,
      totalPoints: 100,
      passingScore: 50,
      resultSettings: {
        visibility: "AFTER_REVIEW", // Manual examiner publishing required
      },
      createdBy: examinerUser._id,
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      accessCode: "SA-4040-ALICE",
      availableFrom: new Date(Date.now() - 3600000),
      availableUntil: new Date(Date.now() + 86400000),
      maxAttempts: 1,
    });

    const attempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      assignmentId: assignment._id,
      candidateId: aliceCandidate._id,
      attemptNumber: 1,
      status: "SUBMITTED",
      startedAt: new Date(Date.now() - 1800000),
      submittedAt: new Date(),
      expiresAt: new Date(Date.now() + 1800000),
      durationSeconds: 3600,
      totalQuestions: 2,
      answeredQuestions: 2,
      totalPoints: 100,
    });

    // 4. Incomplete Evaluation Test
    const incompleteEvaluation = await Evaluation.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      attemptId: attempt._id,
      candidateId: aliceCandidate._id,
      status: "PARTIALLY_GRADED",
      gradingMethod: "HYBRID",
      objectiveScore: 40,
      subjectiveScore: 0,
      totalScore: 40,
      totalMarks: 100,
      percentage: 40,
      passed: false,
      pendingManualReview: true, // Manual review pending
    });

    console.log("\n[TEST 1] Attempting Result Generation from Incomplete Evaluation (Guarded)...");
    const failGenRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/results/evaluations/${incompleteEvaluation._id}/generate`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Incomplete Eval Generation Status ->", failGenRes.status, "Message:", failGenRes.body?.message);
    if (failGenRes.status !== 400) {
      throw new Error("Test 1 Failed: Result generation from an incomplete evaluation was not blocked!");
    }

    // 5. Complete the evaluation
    incompleteEvaluation.status = "COMPLETED";
    incompleteEvaluation.pendingManualReview = false;
    incompleteEvaluation.subjectiveScore = 48;
    incompleteEvaluation.totalScore = 88;
    incompleteEvaluation.percentage = 88;
    incompleteEvaluation.grade = "A";
    incompleteEvaluation.passed = true;
    incompleteEvaluation.evaluatedAt = new Date();
    incompleteEvaluation.evaluatedBy = examinerUser._id;
    await incompleteEvaluation.save();

    console.log("\n[TEST 2] Generating Official Result from Completed Evaluation...");
    const genRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/results/evaluations/${incompleteEvaluation._id}/generate`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Result Generation Status ->", genRes.status, "Obtained Marks:", genRes.body?.data?.obtainedMarks, "Grade:", genRes.body?.data?.grade, "Passed:", genRes.body?.data?.passed, "Published:", genRes.body?.data?.published);
    if (genRes.status !== 201 || genRes.body?.data?.obtainedMarks !== 88 || genRes.body?.data?.grade !== "A" || genRes.body?.data?.published !== false) {
      throw new Error("Test 2 Failed: Result generation failed or derived invalid values!");
    }
    const resultId = genRes.body.data._id;

    console.log("\n[TEST 3] Duplicate Result Generation Prevention (Idempotent)...");
    const duplicateGenRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/results/evaluations/${incompleteEvaluation._id}/generate`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Duplicate Result Generation Status ->", duplicateGenRes.status, "ID:", duplicateGenRes.body?.data?._id);
    const totalResultsCount = await Result.countDocuments({ attemptId: attempt._id });
    if (totalResultsCount !== 1) {
      throw new Error("Test 3 Failed: Duplicate result records were created!");
    }

    console.log("\n[TEST 4] Candidate Unpublished Result Protection & Feed Isolation...");
    // 4.1 Alice lists her results via /candidate-portal/results (should be empty because unpublished)
    const emptyListRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/results`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Unpublished Feed Count ->", emptyListRes.body?.data?.items?.length);
    if (emptyListRes.status !== 200 || emptyListRes.body?.data?.items?.length !== 0) {
      throw new Error("Test 4.1 Failed: Unpublished results leaked in candidate feed!");
    }

    // 4.2 Alice queries specific unpublished result
    const directUnpublishedRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/results/${resultId}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Direct Unpublished Query Status ->", directUnpublishedRes.status, "Message:", directUnpublishedRes.body?.message);
    if (directUnpublishedRes.status !== 403) {
      throw new Error("Test 4.2 Failed: Direct query to unpublished result was not blocked with 403!");
    }

    console.log("\n[TEST 5] Staff Result Review & Publication Workflow...");
    // 5.1 Examiner reviews all results
    const staffListRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/results`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Staff Results Count ->", staffListRes.body?.data?.items?.length);
    if (staffListRes.status !== 200 || staffListRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 5.1 Failed: Staff could not review organization results!");
    }

    // 5.2 Examiner publishes result
    const publishRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/results/${resultId}/publish`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Publish Status ->", publishRes.status, "Published:", publishRes.body?.data?.published, "Status:", publishRes.body?.data?.status);
    if (publishRes.status !== 200 || publishRes.body?.data?.published !== true || publishRes.body?.data?.status !== "PUBLISHED") {
      throw new Error("Test 5.2 Failed: Result publication failed!");
    }

    console.log("\n[TEST 6] Candidate Access to Published Result...");
    const candidateResultRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/results/${resultId}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Result Status ->", candidateResultRes.status, "Score:", candidateResultRes.body?.data?.obtainedMarks, "Grade:", candidateResultRes.body?.data?.grade, "Passed:", candidateResultRes.body?.data?.passed);
    if (candidateResultRes.status !== 200 || candidateResultRes.body?.data?.obtainedMarks !== 88 || candidateResultRes.body?.data?.grade !== "A") {
      throw new Error("Test 6 Failed: Candidate could not retrieve published result details!");
    }

    console.log("\n[TEST 7] Unpublishing Result (Rollback / Review Support)...");
    const unpublishRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/results/${resultId}/unpublish`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      reason: "Post-exam moderation audit",
    });
    console.log("Unpublish Status ->", unpublishRes.status, "Published:", unpublishRes.body?.data?.published);
    if (unpublishRes.status !== 200 || unpublishRes.body?.data?.published !== false) {
      throw new Error("Test 7.1 Failed: Result unpublishing failed!");
    }

    // Alice queries again after unpublish -> blocked
    const reQueryRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/results/${resultId}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Re-query After Unpublish Status ->", reQueryRes.status);
    if (reQueryRes.status !== 403) {
      throw new Error("Test 7.2 Failed: Candidate could still access unpublished result after unpublishing!");
    }

    console.log("\n[TEST 8] Cross-Tenant Security Isolation...");
    const eveAlienRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/results/${resultId}/publish`,
      headers: { Authorization: `Bearer ${eveToken}` }, // Eve belongs to Org B
    });
    console.log("Eve Alien Access Status ->", eveAlienRes.status);
    if (eveAlienRes.status !== 403) {
      throw new Error("Test 8 Failed: Cross-tenant result management was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 40 RESULTS & CANDIDATE PUBLICATION TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 40 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep40Tests();
