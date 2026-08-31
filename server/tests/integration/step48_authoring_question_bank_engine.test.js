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
import QuestionVersion from "../../src/modules/questionBank/questionVersion.model.js";
import QuestionCategory from "../../src/modules/questionCategories/questionCategory.model.js";
import QuestionTag from "../../src/modules/questionTags/questionTag.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import {
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
} from "../../src/constants/roles.js";
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
      },
    );
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runStep48Tests = async () => {
  await connectDatabase();
  console.log(
    "Connected to MongoDB for Step 48 Authoring & Question Bank Engine Test Suite",
  );

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({
      platformRole: PLATFORM_ROLES.PLATFORM_OWNER,
    });
    const examinerRole = await Role.findOne({
      name: ORGANIZATION_ROLES.EXAMINER,
    });
    const candidateRole = await Role.findOne({
      name: ORGANIZATION_ROLES.CANDIDATE,
    });

    await Organization.deleteMany({
      slug: { $in: ["org-authoring-a", "org-authoring-b"] },
    });
    await User.deleteMany({
      email: {
        $in: ["examiner48@org-a.com", "cand48@org-a.com", "hacker48@org-b.com"],
      },
    });
    await QuestionBank.deleteMany({});
    await Question.deleteMany({});
    await QuestionVersion.deleteMany({});
    await QuestionCategory.deleteMany({});
    await QuestionTag.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentSection.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await Candidate.deleteMany({});
    await AssessmentAssignment.deleteMany({});

    // 2. Setup Organization A & Examiner
    const orgA = await Organization.create({
      name: "Authoring Institute Alpha",
      slug: "org-authoring-a",
      code: "AUTH-A",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const examinerUser = await User.create({
      firstName: "Dr. Alice",
      lastName: "Examiner",
      email: "examiner48@org-a.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: examinerUser._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    const examinerToken = generateAccessToken({
      sub: examinerUser._id.toString(),
    });

    // 3. Setup Organization B & Adversary
    const orgB = await Organization.create({
      name: "Compromised Tenant Beta",
      slug: "org-authoring-b",
      code: "AUTH-B",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const hackerUser = await User.create({
      firstName: "Mallory",
      lastName: "Attacker",
      email: "hacker48@org-b.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: hackerUser._id,
      organizationId: orgB._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    const hackerToken = generateAccessToken({ sub: hackerUser._id.toString() });

    // =========================================================================
    // [TEST 1] Question Bank Management (CRUD & Lifecycle)
    // =========================================================================
    console.log("\n[TEST 1] Question Bank Creation & Lifecycle...");

    const qbRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/question-banks`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        name: "Flight Dynamics & Avionics Bank",
        code: "AV-BANK-01",
        description:
          "Official question bank for commercial aircraft instruments and aerodynamics.",
      },
    );

    console.log(
      "Create Question Bank -> Status:",
      qbRes.status,
      "ID:",
      qbRes.body?.data?._id,
    );
    if (qbRes.status !== 201)
      throw new Error(
        `Expected 201 for question bank creation, got ${qbRes.status}`,
      );

    const questionBankId = qbRes.body.data._id;

    // =========================================================================
    // [TEST 2] Question Category & Tag Management (Tenant-Scoped)
    // =========================================================================
    console.log("\n[TEST 2] Category & Tag Management...");

    const catRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/question-categories`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        name: "Avionics Telemetry",
        code: "AV-TEL",
        description: "Radar and VOR instrumentation taxonomy",
      },
    );
    console.log("Create Category -> Status:", catRes.status);
    if (![200, 201].includes(catRes.status))
      throw new Error(
        `Expected 201/200 for category creation, got ${catRes.status}`,
      );
    const categoryId = catRes.body?.data?._id || catRes.body?.data?.id;

    const tagRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/question-tags`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        name: "Radar Systems",
        slug: "radar-systems",
      },
    );
    console.log("Create Tag -> Status:", tagRes.status);
    if (![200, 201].includes(tagRes.status))
      throw new Error(
        `Expected 201/200 for tag creation, got ${tagRes.status}`,
      );

    // =========================================================================
    // [TEST 3] Type-Aware Question Authoring (MCQ, Coding, Short/Long Answer)
    // =========================================================================
    console.log(
      "\n[TEST 3] Authoring Diverse Question Types with Secret Answer Keys...",
    );

    // 3a. Single Choice MCQ
    const q1Res = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/question-banks/${questionBankId}/questions`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        type: "SINGLE_CHOICE",
        prompt:
          "What primary radio frequency band does an Instrument Landing System (ILS) localizer operate in?",
        difficulty: "HARD",
        points: 4,
        categoryId,
        options: [
          { id: "A", text: "VHF (108.10 MHz – 111.95 MHz)", isCorrect: true },
          { id: "B", text: "UHF (329.15 MHz – 335.00 MHz)", isCorrect: false },
          { id: "C", text: "HF (3 MHz – 30 MHz)", isCorrect: false },
          { id: "D", text: "LF (30 kHz – 300 kHz)", isCorrect: false },
        ],
        correctAnswer: "A",
        explanation:
          "ILS localizers operate in the VHF band between 108.10 MHz and 111.95 MHz.",
      },
    );

    console.log(
      "Create MCQ Question -> Status:",
      q1Res.status,
      "QID:",
      q1Res.body?.data?._id,
    );
    if (q1Res.status !== 201)
      throw new Error(
        `Expected 201 for question creation, got ${q1Res.status}`,
      );
    const q1Id = q1Res.body.data._id;

    // 3b. Coding Question with Hidden Evaluation Test Cases
    const q2Res = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/question-banks/${questionBankId}/questions`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        type: "CODING",
        prompt:
          "Implement an airspeed sensor outlier rejection algorithm in JavaScript.",
        difficulty: "HARD",
        points: 10,
        coding: {
          problemStatement:
            "Given an array of telemetry readings, filter out noise spikes > 50 knots/sec.",
          constraints: ["1 <= readings.length <= 10000"],
          allowedLanguages: ["javascript", "python"],
          testCases: [
            {
              input: "[100, 102, 350, 105]",
              expectedOutput: "[100, 102, 105]",
              isPublic: true,
              isHidden: false,
            },
            {
              input: "[200, 999, 202, 888, 205]",
              expectedOutput: "[200, 202, 205]",
              isPublic: false,
              isHidden: true,
            },
          ],
        },
      },
    );

    console.log(
      "Create Coding Question -> Status:",
      q2Res.status,
      "QID:",
      q2Res.body?.data?._id,
    );
    if (q2Res.status !== 201)
      throw new Error(`Expected 201 for coding question, got ${q2Res.status}`);
    const q2Id = q2Res.body.data._id;

    // =========================================================================
    // [TEST 4] Question Versioning & Immutability Verification
    // =========================================================================
    console.log(
      "\n[TEST 4] Updating Question & Verifying Immutable Versioning...",
    );

    const updateQ1Res = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/organizations/${orgA._id}/questions/${q1Id}`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        prompt:
          "What primary VHF frequency band does an ILS localizer operate in? (Refined)",
        points: 5,
      },
    );

    console.log("Update Question -> Status:", updateQ1Res.status);
    if (updateQ1Res.status !== 200)
      throw new Error(
        `Expected 200 for question update, got ${updateQ1Res.status}`,
      );

    const versionsCount = await QuestionVersion.countDocuments({
      questionId: q1Id,
    });
    console.log("Question Versions Stored in DB ->", versionsCount);
    if (versionsCount < 2)
      throw new Error(
        `Expected at least 2 versions for updated question, found ${versionsCount}`,
      );

    // =========================================================================
    // [TEST 5] Assessment Authoring & Section Composition
    // =========================================================================
    console.log(
      "\n[TEST 5] Assessment Creation, Sections, & Attaching Questions...",
    );

    // 5a. Create Assessment (DRAFT)
    const asmRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/assessments`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        title: "Avionics & Radar Certification Examination",
        code: "AV-CERT-2026",
        duration: { value: 90, unit: "MINUTES" },
        passingScore: 75,
      },
    );

    console.log(
      "Create Assessment -> Status:",
      asmRes.status,
      "ID:",
      asmRes.body?.data?._id,
    );
    if (asmRes.status !== 201)
      throw new Error(
        `Expected 201 for assessment creation, got ${asmRes.status}`,
      );
    const assessmentId = asmRes.body.data._id;

    // 5b. Create Sections
    const sec1Res = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/sections`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        title: "Section 1: Radio Navigation Fundamentals",
        description: "Multiple choice theory questions",
        order: 1,
      },
    );

    console.log("Create Section 1 -> Status:", sec1Res.status);
    const section1Id = sec1Res.body.data._id;

    const sec2Res = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/sections`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        title: "Section 2: Telemetry Data Processing",
        description: "Algorithmic coding exercises",
        order: 2,
      },
    );

    console.log("Create Section 2 -> Status:", sec2Res.status);
    const section2Id = sec2Res.body.data._id;

    // 5c. Attach Questions to Sections (Creating Immutable AssessmentQuestion Snapshots)
    const attach1Res = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        sectionId: section1Id,
        questionId: q1Id,
        marks: 5,
      },
    );
    console.log("Attach MCQ to Section 1 -> Status:", attach1Res.status);
    if (attach1Res.status !== 201)
      throw new Error(
        `Expected 201 for question attach, got ${attach1Res.status}`,
      );

    const attach2Res = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      {
        sectionId: section2Id,
        questionId: q2Id,
        marks: 15,
      },
    );
    console.log("Attach Coding to Section 2 -> Status:", attach2Res.status);
    if (attach2Res.status !== 201)
      throw new Error(
        `Expected 201 for coding attach, got ${attach2Res.status}`,
      );

    // =========================================================================
    // [TEST 6] Assessment Preview & Publishing Pipeline
    // =========================================================================
    console.log("\n[TEST 6] Assessment Preview & Publishing Pipeline...");

    const previewRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });

    console.log(
      "Assessment Total Points Computed ->",
      previewRes.body?.data?.totalPoints,
      "(Expected 20)",
    );
    if (previewRes.body?.data?.totalPoints !== 20) {
      throw new Error(
        `Expected 20 total points, got ${previewRes.body?.data?.totalPoints}`,
      );
    }

    const publishRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/publish`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });

    console.log(
      "Publish Assessment Status ->",
      publishRes.status,
      "Status in DB:",
      publishRes.body?.data?.status,
    );
    if (
      publishRes.status !== 200 ||
      publishRes.body?.data?.status !== "PUBLISHED"
    ) {
      throw new Error(
        `Expected 200 & PUBLISHED status, got ${publishRes.status}`,
      );
    }

    // Attempting to mutate published assessment without versioning must be rejected
    const illegalMutationRes = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}`,
        headers: { Authorization: `Bearer ${examinerToken}` },
      },
      { title: "Silently Mutated Title" },
    );
    console.log(
      "Illegal Mutation of Published Assessment -> Status:",
      illegalMutationRes.status,
      "(Expected 400 Locked)",
    );
    if (illegalMutationRes.status !== 400) {
      throw new Error(
        `Expected 400 on mutating published assessment, got ${illegalMutationRes.status}`,
      );
    }

    // =========================================================================
    // [TEST 7] Cross-Tenant Security Isolation Guards
    // =========================================================================
    console.log(
      "\n[TEST 7] Cross-Tenant Isolation Tests (Tenant B vs Tenant A)...",
    );

    // 7a. Tenant B cannot access Tenant A's Question Bank
    const crossBankRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgB._id}/question-banks/${questionBankId}`,
      headers: { Authorization: `Bearer ${hackerToken}` },
    });
    console.log(
      "Cross-Tenant Question Bank Access -> Status:",
      crossBankRes.status,
      "(Expected 404)",
    );
    if (crossBankRes.status !== 404)
      throw new Error(`Expected 404, got ${crossBankRes.status}`);

    // 7b. Tenant B cannot attach Tenant A's Question
    const hackerAsm = await Assessment.create({
      organizationId: orgB._id,
      title: "Hacker Assessment",
      code: "HACK-01",
      createdBy: hackerUser._id,
      status: "DRAFT",
    });
    const hackerSec = await AssessmentSection.create({
      organizationId: orgB._id,
      assessmentId: hackerAsm._id,
      title: "Exploit Section",
      order: 1,
    });

    const crossAttachRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgB._id}/assessments/${hackerAsm._id}/questions`,
        headers: { Authorization: `Bearer ${hackerToken}` },
      },
      {
        sectionId: hackerSec._id,
        questionId: q1Id, // Org A's question
      },
    );
    console.log(
      "Cross-Tenant Question Attachment -> Status:",
      crossAttachRes.status,
      "(Expected 400)",
    );
    if (crossAttachRes.status !== 400)
      throw new Error(
        `Expected 400 on cross-tenant attach, got ${crossAttachRes.status}`,
      );

    // =========================================================================
    // [TEST 8] Candidate DTO Sanitization & Step 38 Snapshot Verification
    // =========================================================================
    console.log(
      "\n[TEST 8] Candidate DTO Sanitization & Step 38 Attempt Engine Integration...",
    );

    const candidateUser = await User.create({
      firstName: "Bob",
      lastName: "Trainee",
      email: "cand48@org-a.com",
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
      candidateCode: "CAND-48-BOB",
      firstName: "Bob",
      lastName: "Trainee",
      email: "cand48@org-a.com",
      status: "ACTIVE",
    });

    const candidateToken = generateAccessToken({
      sub: candidateUser._id.toString(),
    });

    // Assign candidate
    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId,
      candidateId: candProfile._id,
      status: "ASSIGNED",
      validFrom: new Date(Date.now() - 3600000),
      validUntil: new Date(Date.now() + 86400000),
    });

    // Start Attempt (Step 38 Engine)
    const startAttemptRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/attempts/start`,
        headers: { Authorization: `Bearer ${candidateToken}` },
      },
      {
        assignmentId: assignment._id.toString(),
        organizationId: orgA._id.toString(),
      },
    );

    console.log("Start Attempt Status ->", startAttemptRes.status);
    if (startAttemptRes.status !== 201 && startAttemptRes.status !== 200) {
      throw new Error(
        `Expected 200/201 for attempt start, got ${startAttemptRes.status}`,
      );
    }

    const attemptId =
      startAttemptRes.body?.data?.id || startAttemptRes.body?.data?._id;

    // Fetch questions for this attempt
    const attemptQRes = await request(server, {
      method: "GET",
      path: `/api/v1/attempts/${attemptId}/questions`,
      headers: { Authorization: `Bearer ${candidateToken}` },
    });

    const attemptQuestions =
      attemptQRes.body?.data?.items ||
      attemptQRes.body?.data?.questions ||
      attemptQRes.body?.data ||
      [];
    console.log(
      "Candidate Received Attempt Questions -> Count:",
      attemptQuestions.length,
    );
    if (attemptQuestions.length !== 2) {
      throw new Error(
        `Expected 2 attempt questions, got ${attemptQuestions.length}`,
      );
    }

    // Verify ZERO answer leaks and ZERO hidden test cases
    for (const q of attemptQuestions) {
      if (q.correctAnswer !== undefined) {
        throw new Error(
          "CRITICAL SECURITY VIOLATION: Candidate received correctAnswer field!",
        );
      }
      if (q.options?.some((opt) => opt.isCorrect !== undefined)) {
        throw new Error(
          "CRITICAL SECURITY VIOLATION: Candidate received option.isCorrect flag!",
        );
      }
      if (q.coding?.testCases?.some((tc) => tc.isHidden)) {
        throw new Error(
          "CRITICAL SECURITY VIOLATION: Candidate received hidden coding test cases!",
        );
      }
    }
    console.log(
      "✅ Candidate Question DTOs verified 100% sanitized (No answer keys or hidden test cases leaked)",
    );

    console.log(
      "\n==========================================================================",
    );
    console.log(
      "✅ ALL STEP 48 ASSESSMENT AUTHORING & QUESTION BANK ENGINE TESTS PASSED!",
    );
    console.log(
      "==========================================================================",
    );
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep48Tests().catch((err) => {
  console.error("❌ Step 48 Test Suite Failed:", err);
  process.exit(1);
});
