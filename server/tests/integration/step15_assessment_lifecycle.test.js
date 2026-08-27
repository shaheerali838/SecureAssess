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

const runStep15Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 15 Assessment Lifecycle Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Roles & Users Setup
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-15", "org-saylani-15"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner15@test.com", "saylani.examiner15@test.com", "vu.candidate15@test.com"] } });

    // 2. Setup Org A
    const orgA = await Organization.create({
      name: "Virtual University 15",
      slug: "org-vu-15",
      code: "VU15",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Computer Science",
      code: "BSCS",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      programId: progA._id,
      name: "Database Systems",
      code: "DB-15",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner15@test.com",
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

    const vuCandidate = await User.create({
      firstName: "VU",
      lastName: "Candidate",
      email: "vu.candidate15@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const vuCandidateToken = generateAccessToken({ sub: vuCandidate._id.toString() });

    await UserMembership.create({
      userId: vuCandidate._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    // 3. Setup Org B
    const orgB = await Organization.create({
      name: "Saylani 15",
      slug: "org-saylani-15",
      code: "SA15",
      type: "TRAINING_INSTITUTE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const saylaniExaminer = await User.create({
      firstName: "Saylani",
      lastName: "Examiner",
      email: "saylani.examiner15@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const saylaniExaminerToken = generateAccessToken({ sub: saylaniExaminer._id.toString() });

    await UserMembership.create({
      userId: saylaniExaminer._id,
      organizationId: orgB._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    // 4. Create Question Bank & Question in Org A
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "Database Questions",
      code: "DB-QB",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const originalQuestion = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      prompt: "What uniquely identifies a record in a SQL table?",
      options: [
        { id: "A", text: "Foreign Key" },
        { id: "B", text: "Primary Key" },
        { id: "C", text: "Index" },
      ],
      correctAnswer: ["B"],
      explanation: "A primary key uniquely identifies each record in a database table.",
      points: 5,
      version: 1,
      status: "ACTIVE",
    });

    console.log("\n[TEST 1] Create Assessment in Org A (DRAFT status)...");
    const createAssessmentRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      title: "Database Systems Midterm Exam",
      code: "DB-MID-15",
      type: "MCQ",
      subjectId: subjA._id.toString(),
      durationSeconds: 5400, // 90 minutes
      passingScore: 50,
    });
    console.log("Create Assessment Status ->", createAssessmentRes.status, "(Expected: 201)");
    if (createAssessmentRes.status !== 201 || createAssessmentRes.body?.data?.status !== "DRAFT") throw new Error("Test 1 Failed");
    const assessmentId = createAssessmentRes.body.data._id;

    console.log("\n[TEST 2] Create Assessment Section in Org A...");
    const createSectionRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/sections`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      title: "SQL & Relational Concepts",
      description: "Core SQL querying questions",
      order: 1,
    });
    console.log("Create Section Status ->", createSectionRes.status, "(Expected: 201)");
    const sectionId = createSectionRes.body.data._id;

    console.log("\n[TEST 3] Add Question Snapshot & Verify Immutability...");
    const addQuestionRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      questionId: originalQuestion._id.toString(),
      sectionId: sectionId.toString(),
      points: 5,
      order: 1,
    });
    console.log("Add Question Snapshot Status ->", addQuestionRes.status, "(Expected: 201)");
    const snapshotQuestionId = addQuestionRes.body.data._id;

    // Mutate the original Question Bank Question
    await Question.findByIdAndUpdate(originalQuestion._id, {
      $set: { prompt: "MODIFIED: What is a Primary Key?", version: 2 },
    });

    // Check that Assessment Question snapshot prompt did NOT change
    const snapshotInDb = await AssessmentQuestion.findById(snapshotQuestionId);
    console.log("Snapshot Prompt in Exam:", snapshotInDb.prompt);
    if (snapshotInDb.prompt !== "What uniquely identifies a record in a SQL table?") {
      throw new Error("Test 3 Failed: Snapshot was modified when original question changed!");
    }

    console.log("\n[TEST 4] Lifecycle: Submit for Review -> Approve -> Publish...");
    // 4.1 Submit for Review
    const reviewRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/submit-for-review`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Submit For Review Status ->", reviewRes.status, "New Status:", reviewRes.body?.data?.status);

    // 4.2 Approve
    const approveRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/approve`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Approve Assessment Status ->", approveRes.status, "New Status:", approveRes.body?.data?.status);

    // 4.3 Publish
    const publishRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/publish`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Publish Assessment Status ->", publishRes.status, "New Status:", publishRes.body?.data?.status);
    if (publishRes.status !== 200 || publishRes.body?.data?.status !== "PUBLISHED") throw new Error("Test 4 Failed");

    console.log("\n[TEST 5] Published Assessment Locking (Modifications Blocked)...");
    const editPublishedRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      title: "Illegally Modified Exam Title",
    });
    console.log("Edit Published Assessment Status ->", editPublishedRes.status, "(Expected: 400)");
    if (editPublishedRes.status !== 400) throw new Error("Test 5.1 Failed: Published assessment allowed modification!");

    const addQuestionToPublishedRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      questionId: originalQuestion._id.toString(),
      sectionId: sectionId.toString(),
    });
    console.log("Add Question to Published Assessment ->", addQuestionToPublishedRes.status, "(Expected: 400)");
    if (addQuestionToPublishedRes.status !== 400) throw new Error("Test 5.2 Failed: Question added to published exam!");

    console.log("\n[TEST 6] Candidate Delivery & Answer Masking...");
    const candidateGetQuestionsRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions`,
      headers: { Authorization: `Bearer ${vuCandidateToken}` },
    });
    console.log("Candidate Get Questions Status ->", candidateGetQuestionsRes.status, "(Expected: 200)");
    const candidateQ = candidateGetQuestionsRes.body?.data?.[0];
    console.log("Candidate received correctAnswer:", candidateQ?.correctAnswer);
    console.log("Candidate received explanation:", candidateQ?.explanation);
    if (candidateQ?.correctAnswer !== undefined || candidateQ?.explanation !== undefined) {
      throw new Error("Test 6 Failed: Correct answer leaked in candidate assessment delivery!");
    }

    console.log("\n[TEST 7] Cross-Tenant Assessment Isolation (403 Forbidden)...");
    const crossAssessmentRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}`,
      headers: { Authorization: `Bearer ${saylaniExaminerToken}` }, // Saylani examiner accessing VU assessment!
    });
    console.log("Saylani Examiner accessing VU Assessment ->", crossAssessmentRes.status, "(Expected: 403)");
    if (crossAssessmentRes.status !== 403) throw new Error("Test 7 Failed: Cross-tenant access was allowed!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 15 ASSESSMENT LIFECYCLE & BUILDER TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 15 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep15Tests();
