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
import Candidate from "../../src/modules/candidates/candidate.model.js";
import QuestionBank from "../../src/modules/questionBank/questionBank.model.js";
import Question from "../../src/modules/questionBank/question.model.js";
import QuestionVersion from "../../src/modules/questionBank/questionVersion.model.js";
import QuestionCategory from "../../src/modules/questionCategories/questionCategory.model.js";
import QuestionTag from "../../src/modules/questionTags/questionTag.model.js";
import { QuestionMapper } from "../../src/modules/questionBank/question.mapper.js";
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

const runStep35Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 35 Question Bank Engine Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const platformOwnerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-35", "org-alien-35"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner35@test.com", "alice35@vu.edu.pk", "eve35@alien.com"] } });
    await QuestionBank.deleteMany({});
    await Question.deleteMany({});
    await QuestionVersion.deleteMany({});
    await QuestionCategory.deleteMany({});
    await QuestionTag.deleteMany({});

    // 2. Setup Organizations & Users
    const orgA = await Organization.create({
      name: "Virtual University 35",
      slug: "org-vu-35",
      code: "VU35",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS35",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Computer Science",
      code: "BSCS35",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Data Structures & Algorithms",
      code: "CS-301",
    });

    const examinerUser = await User.create({
      firstName: "Dr. Tariq",
      lastName: "Examiner",
      email: "vu.examiner35@test.com",
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
      lastName: "Candidate",
      email: "alice35@vu.edu.pk",
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
      candidateCode: "VU-CAND-35",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice35@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 35",
      slug: "org-alien-35",
      code: "ALIEN35",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve35@alien.com",
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

    console.log("\n[TEST 1] Creating Question Categories and Tags...");
    const category = await QuestionCategory.create({
      organizationId: orgA._id,
      name: "Dynamic Programming",
      code: "DP-CAT",
    });

    const tag = await QuestionTag.create({
      organizationId: orgA._id,
      name: "Algorithms",
      slug: "algorithms",
    });

    console.log("Category Created:", category.name, "Tag Created:", tag.name);

    console.log("\n[TEST 2] Creating Question Bank...");
    const qbRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      name: "Master Algorithms Bank",
      code: "ALGO-BANK-35",
      subjectId: subjA._id.toString(),
      categoryId: category._id.toString(),
      description: "Advanced DSA master question bank",
    });

    console.log("Question Bank Status ->", qbRes.status, "Code:", qbRes.body?.data?.code);
    if (qbRes.status !== 201 || !qbRes.body?.data?._id) {
      throw new Error("Test 2 Failed: Question bank creation failed!");
    }
    const qbId = qbRes.body.data._id;

    console.log("\n[TEST 3] Creating Multi-Type Questions...");
    // 3.1 Single Choice (MCQ)
    const mcqRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title: "Binary Search Time Complexity",
      prompt: "What is the worst-case time complexity of Binary Search?",
      options: [
        { id: "A", text: "O(n)", isCorrect: false },
        { id: "B", text: "O(log n)", isCorrect: true },
        { id: "C", text: "O(n log n)", isCorrect: false },
        { id: "D", text: "O(1)", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "Binary search halves the search space each step: O(log n).",
      difficulty: "EASY",
      points: 5,
      categoryId: category._id.toString(),
      tags: [tag._id.toString()],
    });
    console.log("MCQ Status ->", mcqRes.status, "Question ID:", mcqRes.body?.data?._id);
    if (mcqRes.status !== 201) throw new Error("Test 3.1 Failed: MCQ creation failed!");
    const qId = mcqRes.body.data._id;

    // 3.2 Coding Question
    const codingRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}/questions`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      type: QUESTION_TYPES.CODING,
      title: "Two Sum Problem",
      prompt: "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
      difficulty: "HARD",
      points: 20,
      coding: {
        languages: ["javascript", "python"],
        timeLimit: 1500,
        memoryLimit: 256,
        testCases: [
          { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false, points: 10 },
          { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: true, points: 10 },
        ],
      },
    });
    console.log("Coding Question Status ->", codingRes.status, "Difficulty:", codingRes.body?.data?.difficulty);
    if (codingRes.status !== 201) throw new Error("Test 3.2 Failed: Coding question creation failed!");

    console.log("\n[TEST 4] Answer Security & Candidate DTO Protection...");
    // 4.1 Examiner View (Includes correctAnswer and isCorrect)
    const examinerQRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/questions/${qId}`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Examiner View Correct Answer:", examinerQRes.body?.data?.correctAnswer, "Option B isCorrect:", examinerQRes.body?.data?.options?.find(o => o.id === "B")?.isCorrect);
    if (!examinerQRes.body?.data?.correctAnswer) {
      throw new Error("Test 4.1 Failed: Examiner should see correct answer!");
    }

    // 4.2 Candidate DTO Protection (Correct answer and isCorrect flags strictly stripped)
    const mcqDoc = await Question.findById(qId);
    const candidateDTO = QuestionMapper.toCandidateDTO(mcqDoc);
    console.log("Candidate DTO Correct Answer:", candidateDTO?.correctAnswer, "Explanation:", candidateDTO?.explanation, "Option B isCorrect:", candidateDTO?.options?.[1]?.isCorrect);
    if (candidateDTO?.correctAnswer !== undefined || candidateDTO?.explanation !== undefined || candidateDTO?.options?.some(o => o.isCorrect !== undefined)) {
      throw new Error("Test 4.2 Failed: Candidate was leaked correct answer / explanation in DTO!");
    }

    // 4.3 Direct Candidate RBAC Check (Candidates cannot access raw Question Bank endpoints)
    const candidateQRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/questions/${qId}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Direct Question Bank Access Status ->", candidateQRes.status);
    if (candidateQRes.status !== 403) {
      throw new Error("Test 4.3 Failed: Candidate should not have direct access to question bank endpoints!");
    }

    console.log("\n[TEST 5] Question Versioning & Audit Snapshots...");
    // Initial version should be 1
    const v1List = await QuestionVersion.find({ organizationId: orgA._id, questionId: qId });
    console.log("Initial Versions Count:", v1List.length, "Version:", v1List[0]?.version);
    if (v1List.length !== 1 || v1List[0]?.version !== 1) {
      throw new Error("Test 5.1 Failed: Initial question version v1 snapshot missing!");
    }

    // Update question
    const updateRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/questions/${qId}`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      prompt: "What is the worst-case time complexity of Binary Search on a sorted array of size N?",
      difficulty: "MEDIUM",
      changeReason: "Clarified prompt wording",
    });
    console.log("Update Status ->", updateRes.status, "New Version:", updateRes.body?.data?.version);
    if (updateRes.status !== 200 || updateRes.body?.data?.version !== 2) {
      throw new Error("Test 5.2 Failed: Question version increment failed!");
    }

    // Query question versions endpoint
    const versionsRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/questions/${qId}/versions`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Versions API Status ->", versionsRes.status, "Versions Count:", versionsRes.body?.data?.length);
    if (versionsRes.status !== 200 || versionsRes.body?.data?.length !== 2) {
      throw new Error("Test 5.3 Failed: Question versions history retrieval failed!");
    }

    console.log("\n[TEST 6] Question Search & Filtering...");
    const searchRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/questions?search=complexity`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Search 'complexity' Count ->", searchRes.body?.data?.items?.length);
    if (searchRes.status !== 200 || searchRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 6.1 Failed: Question search failed!");
    }

    const typeFilterRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/questions?type=CODING`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Type 'CODING' Count ->", typeFilterRes.body?.data?.items?.length);
    if (typeFilterRes.status !== 200 || typeFilterRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 6.2 Failed: Question type filtering failed!");
    }

    console.log("\n[TEST 7] Question Archiving Lifecycle...");
    const archiveRes = await request(server, {
      method: "DELETE",
      path: `/api/v1/organizations/${orgA._id}/questions/${qId}`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Archive Question Status ->", archiveRes.status, "Message:", archiveRes.body?.message);
    if (archiveRes.status !== 200) {
      throw new Error("Test 7 Failed: Question archiving failed!");
    }

    const archivedQ = await Question.findById(qId);
    if (archivedQ.status !== "ARCHIVED") {
      throw new Error("Test 7 Failed: Question was not set to ARCHIVED status!");
    }

    console.log("\n[TEST 8] Cross-Tenant Isolation Security...");
    const eveQueryRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/question-banks/${qbId}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Alien Access Status ->", eveQueryRes.status);
    if (eveQueryRes.status !== 403) {
      throw new Error("Test 8 Failed: Cross-tenant question bank access was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 35 QUESTION BANK ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 35 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep35Tests();
