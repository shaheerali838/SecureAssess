import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Subject from "../../src/modules/subjects/subject.model.js";
import Program from "../../src/modules/programs/program.model.js";
import Department from "../../src/modules/departments/department.model.js";
import QuestionBank from "../../src/modules/questionBank/questionBank.model.js";
import Question from "../../src/modules/questionBank/question.model.js";
import QuestionCategory from "../../src/modules/questionCategories/questionCategory.model.js";
import QuestionTag from "../../src/modules/questionTags/questionTag.model.js";
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

const runStep14Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 14 Question Bank Test Suite");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Roles & Users Setup
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgOwnerRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-14", "org-saylani-14"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner14@test.com", "saylani.examiner14@test.com", "vu.candidate14@test.com"] } });

    // 2. Setup Org A
    const orgA = await Organization.create({
      name: "Virtual University 14",
      slug: "org-vu-14",
      code: "VU14",
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
      name: "Web Systems",
      code: "WEB-14",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner14@test.com",
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
      email: "vu.candidate14@test.com",
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
      name: "Saylani 14",
      slug: "org-saylani-14",
      code: "SA14",
      type: "TRAINING_INSTITUTE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const saylaniExaminer = await User.create({
      firstName: "Saylani",
      lastName: "Examiner",
      email: "saylani.examiner14@test.com",
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

    console.log("\n[TEST 1] Create Question Bank in Org A...");
    const createQBRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      name: "Web Development Question Bank",
      code: "WEB-QB",
      subjectId: subjA._id.toString(),
      description: "Comprehensive question bank for web development",
    });
    console.log("Create Question Bank Status ->", createQBRes.status, "(Expected: 201)");
    if (createQBRes.status !== 201 || createQBRes.body?.data?.code !== "WEB-QB") throw new Error("Test 1 Failed");
    const qbId = createQBRes.body.data._id;

    console.log("\n[TEST 2] Create Category & Subcategory in Question Bank...");
    const createCatRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/categories`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      name: "Frontend Development",
      description: "HTML, CSS, JS",
    });
    console.log("Create Category Status ->", createCatRes.status, "(Expected: 201)");
    const catId = createCatRes.body.data._id;

    const createSubCatRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/categories`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      name: "JavaScript",
      parentCategoryId: catId,
    });
    console.log("Create Subcategory Status ->", createSubCatRes.status, "(Expected: 201)");
    const subCatId = createSubCatRes.body.data._id;

    console.log("\n[TEST 3] Create Question Tags in Org A...");
    const createTagRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-tags`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      name: "JavaScript",
      description: "Core JS concepts",
    });
    console.log("Create Tag Status ->", createTagRes.status, "(Expected: 201)");
    const tagId = createTagRes.body.data._id;

    console.log("\n[TEST 4] Create Multiple Question Types (MCQ, Multi-Choice, True/False, Essay, Coding)...");
    // 4.1 SINGLE_CHOICE (MCQ)
    const mcqRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      type: "SINGLE_CHOICE",
      prompt: "Which language runs natively in the web browser?",
      options: [
        { id: "A", text: "Python" },
        { id: "B", text: "JavaScript" },
        { id: "C", text: "C++" },
        { id: "D", text: "Java" },
      ],
      correctAnswer: ["B"],
      explanation: "JavaScript is the native programming language executed by web browser engines.",
      difficulty: "EASY",
      points: 2,
      categoryId: subCatId,
      tags: [tagId],
    });
    console.log("Create SINGLE_CHOICE Status ->", mcqRes.status, "(Expected: 201)");
    if (mcqRes.status !== 201 || mcqRes.body?.data?.type !== "SINGLE_CHOICE") throw new Error("Test 4.1 Failed");
    const mcqQuestionId = mcqRes.body.data._id;

    // 4.2 TRUE_FALSE
    const tfRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      type: "TRUE_FALSE",
      prompt: "HTTP is a stateful protocol.",
      correctAnswer: false,
      explanation: "HTTP is stateless by design.",
      difficulty: "MEDIUM",
      points: 1,
    });
    console.log("Create TRUE_FALSE Status ->", tfRes.status, "(Expected: 201)");
    if (tfRes.status !== 201) throw new Error("Test 4.2 Failed");

    // 4.3 CODING
    const codingRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      type: "CODING",
      prompt: "Write a function reverseString(str) that returns the reversed string.",
      difficulty: "MEDIUM",
      points: 10,
      metadata: {
        allowedLanguages: ["javascript", "python"],
        timeLimitMs: 2000,
      },
    });
    console.log("Create CODING Status ->", codingRes.status, "(Expected: 201)");
    if (codingRes.status !== 201) throw new Error("Test 4.3 Failed");

    console.log("\n[TEST 5] Candidate Answer Protection Verification...");
    // Candidate viewing question -> must NOT receive correctAnswer or explanation
    const candidateViewRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions/${mcqQuestionId}`,
      headers: { Authorization: `Bearer ${vuCandidateToken}` },
    });
    console.log("Candidate View Question Status ->", candidateViewRes.status, "(Expected: 200)");
    console.log("Candidate received correctAnswer:", candidateViewRes.body?.data?.correctAnswer);
    console.log("Candidate received explanation:", candidateViewRes.body?.data?.explanation);
    if (candidateViewRes.body?.data?.correctAnswer !== undefined || candidateViewRes.body?.data?.explanation !== undefined) {
      throw new Error("Test 5 Failed: Correct answer or explanation leaked to candidate!");
    }

    console.log("\n[TEST 6] Cross-Tenant Question Bank Isolation (403 Forbidden)...");
    const crossQBRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}`,
      headers: { Authorization: `Bearer ${saylaniExaminerToken}` }, // Saylani examiner accessing VU QB!
    });
    console.log("Saylani Examiner accessing VU Question Bank ->", crossQBRes.status, "(Expected: 403)");
    if (crossQBRes.status !== 403) throw new Error("Test 6 Failed: Cross-tenant question bank access was allowed!");

    console.log("\n[TEST 7] Question Update & Version Increment...");
    const updateQuestionRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions/${mcqQuestionId}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      prompt: "Which modern programming language runs natively in modern web browsers?",
    });
    console.log("Update Question Status ->", updateQuestionRes.status, "New Version:", updateQuestionRes.body?.data?.version);
    if (updateQuestionRes.status !== 200 || updateQuestionRes.body?.data?.version !== 2) throw new Error("Test 7 Failed");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 14 QUESTION BANK & QUESTION MANAGEMENT TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 14 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep14Tests();
