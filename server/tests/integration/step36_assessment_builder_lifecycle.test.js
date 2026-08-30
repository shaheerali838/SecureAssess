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
import { AssessmentQuestionMapper } from "../../src/modules/assessmentQuestions/assessmentQuestion.mapper.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
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

const runStep36Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 36 Assessment Builder Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-36", "org-alien-36"] } });
    await User.deleteMany({ email: { $in: ["examiner36@vu.edu.pk", "alice36@vu.edu.pk", "eve36@alien.com"] } });
    await QuestionBank.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentSection.deleteMany({});
    await AssessmentQuestion.deleteMany({});

    // 2. Setup Organizations & Users
    const orgA = await Organization.create({
      name: "Virtual University 36",
      slug: "org-vu-36",
      code: "VU36",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Software Engineering",
      code: "SE36",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Software Engineering",
      code: "BSSE36",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Database Systems",
      code: "CS-401",
    });

    const examinerUser = await User.create({
      firstName: "Prof.",
      lastName: "Ahmed",
      email: "examiner36@vu.edu.pk",
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

    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Student",
      email: "alice36@vu.edu.pk",
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

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 36",
      slug: "org-alien-36",
      code: "ALIEN36",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve36@alien.com",
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

    // Seed Question Bank and Questions in Org A
    const qBank = await QuestionBank.create({
      organizationId: orgA._id,
      name: "Database Master Bank",
      code: "DB-BANK-36",
      subjectId: subjA._id,
      ownerId: examinerUser._id,
      createdBy: examinerUser._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qBank._id,
      subjectId: subjA._id,
      createdBy: examinerUser._id,
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title: "SQL Primary Key",
      prompt: "Which constraint uniquely identifies each record in a database table?",
      options: [
        { id: "A", text: "FOREIGN KEY", isCorrect: false },
        { id: "B", text: "PRIMARY KEY", isCorrect: true },
        { id: "C", text: "UNIQUE INDEX", isCorrect: false },
        { id: "D", text: "CHECK", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "PRIMARY KEY enforces uniqueness and non-null values.",
      points: 5,
      version: 1,
    });

    const q2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qBank._id,
      subjectId: subjA._id,
      createdBy: examinerUser._id,
      type: QUESTION_TYPES.MULTIPLE_CHOICE,
      title: "ACID Properties",
      prompt: "Which of the following belong to ACID properties?",
      options: [
        { id: "A", text: "Atomicity", isCorrect: true },
        { id: "B", text: "Consistency", isCorrect: true },
        { id: "C", text: "Concurrency", isCorrect: false },
        { id: "D", text: "Durability", isCorrect: true },
      ],
      correctAnswer: ["A", "B", "D"],
      points: 10,
      version: 1,
    });

    console.log("\n[TEST 1] Creating Assessment Blueprint (DRAFT)...");
    const asmRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      title: "Fall 2026 Midterm Exam - Database Systems",
      code: "CS401-MID-2026",
      subjectId: subjA._id.toString(),
      description: "Midterm examination covering relational algebra and SQL",
      duration: { value: 90, unit: "MINUTES" },
      passingScore: 50,
      securitySettings: {
        proctoringEnabled: true,
        fullscreenRequired: true,
        cameraRequired: true,
      },
    });

    console.log("Assessment Status ->", asmRes.status, "Code:", asmRes.body?.data?.code, "Initial Status:", asmRes.body?.data?.status);
    if (asmRes.status !== 201 || !asmRes.body?.data?._id) {
      throw new Error("Test 1 Failed: Assessment creation failed!");
    }
    const assessmentId = asmRes.body.data._id;

    console.log("\n[TEST 2] Creating and Reordering Assessment Sections...");
    // Section 1
    const sec1Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/sections`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      title: "Section 1 — Relational Model & SQL",
      order: 1,
      duration: 45,
    });
    console.log("Section 1 Status ->", sec1Res.status, "Title:", sec1Res.body?.data?.title);
    if (sec1Res.status !== 201) throw new Error("Test 2.1 Failed: Section 1 creation failed!");
    const sec1Id = sec1Res.body.data._id;

    // Section 2
    const sec2Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/sections`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      title: "Section 2 — Transaction Management",
      order: 2,
      duration: 45,
    });
    console.log("Section 2 Status ->", sec2Res.status, "Title:", sec2Res.body?.data?.title);
    if (sec2Res.status !== 201) throw new Error("Test 2.2 Failed: Section 2 creation failed!");
    const sec2Id = sec2Res.body.data._id;

    console.log("\n[TEST 3] Adding Question Snapshots and Calculating Total Marks...");
    // Add Q1 to Section 1
    const aq1Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      sectionId: sec1Id,
      questionId: q1._id.toString(),
      marks: 5,
    });
    console.log("Add Question 1 Status ->", aq1Res.status, "Snapshot Prompt:", aq1Res.body?.data?.prompt);
    if (aq1Res.status !== 201) throw new Error("Test 3.1 Failed: Adding question 1 snapshot failed!");

    // Bulk Add Q2 to Section 2
    const bulkRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions/bulk`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      sectionId: sec2Id,
      questionIds: [q2._id.toString()],
    });
    console.log("Bulk Add Question 2 Status ->", bulkRes.status, "Added Count:", bulkRes.body?.data?.length);
    if (bulkRes.status !== 201 || bulkRes.body?.data?.length !== 1) {
      throw new Error("Test 3.2 Failed: Bulk adding question 2 failed!");
    }

    // Verify Server-Side Total Marks Recalculation (5 + 10 = 15)
    const updatedAsm = await Assessment.findById(assessmentId);
    console.log("Server-Calculated Total Points:", updatedAsm.totalPoints);
    if (updatedAsm.totalPoints !== 15) {
      throw new Error(`Test 3.3 Failed: Total points calculation mismatch (expected 15, got ${updatedAsm.totalPoints})`);
    }

    console.log("\n[TEST 4] Candidate DTO Sanitization & Assessment Preview...");
    const previewRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/preview`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Preview Status ->", previewRes.status, "Total Points:", previewRes.body?.data?.assessment?.totalPoints);
    const previewQuestions = previewRes.body?.data?.questions || [];
    const hasLeakedAnswer = previewQuestions.some(q => q.snapshot?.correctAnswer !== undefined || q.snapshot?.explanation !== undefined || q.snapshot?.options?.some(o => o.isCorrect !== undefined));
    console.log("Candidate Preview Has Leaked Answers:", hasLeakedAnswer);
    if (hasLeakedAnswer) {
      throw new Error("Test 4 Failed: Preview leaked correct answers or explanation!");
    }

    console.log("\n[TEST 5] Publishing Lifecycle & Validation Guard...");
    const pubRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/publish`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Publish Status ->", pubRes.status, "New Assessment Status:", pubRes.body?.data?.status);
    if (pubRes.status !== 200 || pubRes.body?.data?.status !== "PUBLISHED") {
      throw new Error("Test 5 Failed: Assessment publishing failed!");
    }

    console.log("\n[TEST 6] Immutability Guard on Published Assessment...");
    const tryModifyRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      title: "Modified After Publish Title",
    });
    console.log("Modify Published Assessment Status ->", tryModifyRes.status, "Message:", tryModifyRes.body?.message);
    if (tryModifyRes.status !== 400) {
      throw new Error("Test 6 Failed: Modifications to published assessment should be rejected!");
    }

    console.log("\n[TEST 7] Assessment Duplication Engine...");
    const dupRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/duplicate`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Duplicate Status ->", dupRes.status, "Cloned Title:", dupRes.body?.data?.title, "Cloned Status:", dupRes.body?.data?.status);
    if (dupRes.status !== 201 || dupRes.body?.data?.status !== "DRAFT") {
      throw new Error("Test 7.1 Failed: Duplication failed or status is not DRAFT!");
    }
    const clonedId = dupRes.body.data._id;
    const clonedQuestionsCount = await AssessmentQuestion.countDocuments({ assessmentId: clonedId });
    console.log("Cloned Assessment Question Count:", clonedQuestionsCount);
    if (clonedQuestionsCount !== 2) {
      throw new Error("Test 7.2 Failed: Cloned question snapshots count mismatch!");
    }

    console.log("\n[TEST 8] Cross-Tenant Isolation Security...");
    const eveAttemptRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Alien Access Status ->", eveAttemptRes.status);
    if (eveAttemptRes.status !== 403) {
      throw new Error("Test 8 Failed: Cross-tenant assessment access was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 36 ASSESSMENT BUILDER & LIFECYCLE TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 36 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep36Tests();
