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
            resolve({ status: res.statusCode, body: parsed, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, raw: data, headers: res.headers });
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

const runStep26Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 26 Assessment Engine: Question Bank Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Roles & Clean State
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-26", "org-alien-26"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner26@test.com", "alice26@vu.edu.pk", "eve26@alien.com"] } });
    await QuestionBank.deleteMany({});
    await Question.deleteMany({});
    await QuestionCategory.deleteMany({});
    await QuestionTag.deleteMany({});

    // 2. Setup Org & Users
    const orgA = await Organization.create({
      name: "Virtual University 26",
      slug: "org-vu-26",
      code: "VU26",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS26",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Software Engineering",
      code: "BSSE26",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Advanced Web Technologies",
      code: "CS-501",
    });

    const tagA = await QuestionTag.create({
      organizationId: orgA._id,
      name: "JavaScript",
      slug: "javascript",
      color: "#f7df1e",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner26@test.com",
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

    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice26@vu.edu.pk",
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

    // Alien Org B & Eve (For Isolation)
    const orgB = await Organization.create({
      name: "Alien Org 26",
      slug: "org-alien-26",
      code: "ALIEN26",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve26@alien.com",
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

    console.log("\n[TEST 1] Question Bank CRUD Operations...");
    const createBankRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      name: "Frontend Engineering Question Bank",
      code: "FE-QB-26",
      description: "Master repository of web engineering and fullstack questions",
      subjectId: subjA._id,
    });
    console.log("Create Question Bank Status ->", createBankRes.status, "Bank ID:", createBankRes.body?.data?._id);
    if (createBankRes.status !== 201 || !createBankRes.body?.data?._id) {
      throw new Error("Test 1.1 Failed: Question bank creation failed!");
    }
    const qbId = createBankRes.body.data._id;

    const getBanksRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/question-banks`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("List Question Banks Status ->", getBanksRes.status, "Count:", getBanksRes.body?.data?.items?.length);
    if (getBanksRes.status !== 200 || getBanksRes.body?.data?.items?.length < 1) {
      throw new Error("Test 1.2 Failed: List question banks failed!");
    }

    console.log("\n[TEST 2] Multi-Type Question Creation (MCQ, Multi-Select, True/False, Short Answer, Essay, Coding, File Upload)...");
    // 2.1 Single Choice MCQ
    const mcqRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      type: "SINGLE_CHOICE",
      title: "JavaScript Engine Environment",
      prompt: "Which environment natively executes JavaScript outside the browser?",
      options: [
        { id: "a", text: "Django", isCorrect: false },
        { id: "b", text: "Node.js", isCorrect: true },
        { id: "c", text: "Laravel", isCorrect: false },
        { id: "d", text: "Flask", isCorrect: false },
      ],
      correctAnswer: { optionIds: ["b"] },
      difficulty: "EASY",
      points: 2,
      tags: [tagA._id],
    });
    console.log("Create MCQ Status ->", mcqRes.status, "Type:", mcqRes.body?.data?.type);
    if (mcqRes.status !== 201 || mcqRes.body?.data?.type !== "SINGLE_CHOICE") throw new Error("Test 2.1 Failed: MCQ creation failed!");
    const mcqQuestionId = mcqRes.body.data._id;

    // 2.2 Multiple Choice Multi-Select
    const multiRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      type: "MULTIPLE_CHOICE",
      title: "Frontend Build Tools",
      prompt: "Select all modern frontend bundlers:",
      options: [
        { id: "a", text: "Vite", isCorrect: true },
        { id: "b", text: "Webpack", isCorrect: true },
        { id: "c", text: "PostgreSQL", isCorrect: false },
        { id: "d", text: "Rollup", isCorrect: true },
      ],
      correctAnswer: { optionIds: ["a", "b", "d"] },
      difficulty: "MEDIUM",
      points: 3,
    });
    console.log("Create Multi-Select Status ->", multiRes.status, "Type:", multiRes.body?.data?.type);
    if (multiRes.status !== 201) throw new Error("Test 2.2 Failed: Multi-select creation failed!");

    // 2.3 True / False
    const tfRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      type: "TRUE_FALSE",
      title: "HTTP Protocol State",
      prompt: "HTTP is a stateless protocol.",
      options: [
        { id: "true", text: "True", isCorrect: true },
        { id: "false", text: "False", isCorrect: false },
      ],
      correctAnswer: { value: true },
      difficulty: "EASY",
      points: 1,
    });
    console.log("Create True/False Status ->", tfRes.status);
    if (tfRes.status !== 201) throw new Error("Test 2.3 Failed: True/False creation failed!");

    // 2.4 Coding Question
    const codingRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      type: "CODING",
      title: "Reverse String Algorithm",
      prompt: "Write a function reverseString(str) that returns the reversed string.",
      difficulty: "HARD",
      points: 10,
      coding: {
        languages: ["javascript", "python"],
        starterCode: { javascript: "function reverseString(str) {\n  // Code here\n}" },
        timeLimit: 2000,
        memoryLimit: 256,
        testCases: [
          { input: '"hello"', expectedOutput: '"olleh"', isHidden: false, points: 5 },
          { input: '"SecureAssess"', expectedOutput: '"ssessAeruceS"', isHidden: true, points: 5 },
        ],
      },
    });
    console.log("Create Coding Question Status ->", codingRes.status, "Languages:", codingRes.body?.data?.coding?.languages);
    if (codingRes.status !== 201 || !codingRes.body?.data?.coding) throw new Error("Test 2.4 Failed: Coding question creation failed!");

    console.log("\n[TEST 3] Question Versioning Lifecycle...");
    const updateQuestionRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/questions/${mcqQuestionId}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      prompt: "Which server-side runtime natively executes JavaScript outside the web browser?",
    });
    console.log("Update Question Status ->", updateQuestionRes.status, "New Version:", updateQuestionRes.body?.data?.version);
    if (updateQuestionRes.status !== 200 || updateQuestionRes.body?.data?.version !== 2) {
      throw new Error("Test 3 Failed: Question versioning was not incremented!");
    }

    console.log("\n[TEST 4] Question Search & Multi-Criteria Filtering...");
    const searchRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/questions?q=runtime`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Search by keyword 'runtime' -> Count:", searchRes.body?.data?.items?.length);
    if (searchRes.status !== 200 || searchRes.body?.data?.items?.length < 1) {
      throw new Error("Test 4.1 Failed: Search query failed!");
    }

    const hardCodingRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/questions?type=CODING&difficulty=HARD`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Filter by type=CODING&difficulty=HARD -> Count:", hardCodingRes.body?.data?.items?.length);
    if (hardCodingRes.status !== 200 || hardCodingRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 4.2 Failed: Type and difficulty filter failed!");
    }

    console.log("\n[TEST 5] Bulk Question Import (JSON)...");
    const bulkImportRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions/import`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      questions: [
        {
          type: "SINGLE_CHOICE",
          title: "CSS Position Property",
          prompt: "Which CSS position value removes an element from the normal document flow?",
          options: [
            { id: "a", text: "static", isCorrect: false },
            { id: "b", text: "absolute", isCorrect: true },
          ],
          points: 2,
        },
        {
          type: "TRUE_FALSE",
          title: "CSS Grid vs Flexbox",
          prompt: "CSS Grid is a two-dimensional layout system.",
          options: [
            { id: "true", text: "True", isCorrect: true },
            { id: "false", text: "False", isCorrect: false },
          ],
          points: 1,
        },
      ],
    });
    console.log("Bulk Import Status ->", bulkImportRes.status, "Imported Count:", bulkImportRes.body?.data?.importedCount);
    if (bulkImportRes.status !== 201 || bulkImportRes.body?.data?.importedCount !== 2) {
      throw new Error("Test 5 Failed: Bulk question import failed!");
    }

    console.log("\n[TEST 6] Bulk Question Export (CSV & JSON)...");
    const exportCsvRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions/export?format=CSV`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Export CSV Status ->", exportCsvRes.status, "Content-Type:", exportCsvRes.headers["content-type"]);
    if (exportCsvRes.status !== 200 || !exportCsvRes.headers["content-type"]?.includes("text/csv")) {
      throw new Error("Test 6.1 Failed: CSV export failed!");
    }

    const exportJsonRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions/export?format=JSON`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Export JSON Status ->", exportJsonRes.status, "Questions Count:", exportJsonRes.body?.data?.length);
    if (exportJsonRes.status !== 200 || exportJsonRes.body?.data?.length < 5) {
      throw new Error("Test 6.2 Failed: JSON export failed!");
    }

    console.log("\n[TEST 7] Cross-Tenant & Unauthorized Access Isolation...");
    // Eve cannot view Org A questions
    const eveViewRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/questions`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Access to Org A Questions -> Status:", eveViewRes.status, "Success:", eveViewRes.body?.success);
    if (eveViewRes.status !== 403) throw new Error("Test 7.1 Failed: Cross-tenant question bank access was not blocked!");

    // Alice Candidate cannot create questions
    const aliceCreateRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/questions`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, { prompt: "Illegal Question" });
    console.log("Candidate Create Question -> Status:", aliceCreateRes.status, "Success:", aliceCreateRes.body?.success);
    if (aliceCreateRes.status !== 403) throw new Error("Test 7.2 Failed: Candidate was not blocked from creating questions!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 26 ASSESSMENT ENGINE: QUESTION BANK TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 26 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep26Tests();
