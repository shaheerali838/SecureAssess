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
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import AttemptQuestion from "../../src/modules/attemptQuestions/attemptQuestion.model.js";
import Answer from "../../src/modules/answers/answer.model.js";
import Result from "../../src/modules/results/result.model.js";
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

const runStep28Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 28 Candidate Attempt / Exam Engine Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-28", "org-alien-28"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner28@test.com", "alice28@vu.edu.pk", "eve28@alien.com"] } });
    await Assessment.deleteMany({});
    await AssessmentSection.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await AttemptQuestion.deleteMany({});
    await Answer.deleteMany({});
    await Result.deleteMany({});
    await QuestionBank.deleteMany({});
    await Question.deleteMany({});

    // 2. Setup Organization & Users
    const orgA = await Organization.create({
      name: "Virtual University 28",
      slug: "org-vu-28",
      code: "VU28",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS28",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Software Engineering",
      code: "BSSE28",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Distributed Operating Systems",
      code: "CS-602",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner28@test.com",
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
      email: "alice28@vu.edu.pk",
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
      candidateCode: "VU-CAND-28",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice28@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve (For Isolation)
    const orgB = await Organization.create({
      name: "Alien Org 28",
      slug: "org-alien-28",
      code: "ALIEN28",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve28@alien.com",
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

    // 3. Setup Assessment, Questions, and Assignment
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "OS Questions Master Bank",
      code: "OS-QB-28",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      title: "Deadlock Necessary Conditions",
      prompt: "How many Coffman conditions must hold simultaneously for a deadlock to occur?",
      options: [
        { id: "a", text: "Two", isCorrect: false },
        { id: "b", text: "Three", isCorrect: false },
        { id: "c", text: "Four", isCorrect: true },
        { id: "d", text: "Five", isCorrect: false },
      ],
      correctAnswer: { optionIds: ["c"] },
      points: 2,
      status: "ACTIVE",
      version: 1,
    });

    const q2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      createdBy: vuExaminer._id,
      type: "TRUE_FALSE",
      title: "Virtual Memory Paging",
      prompt: "Paging completely eliminates external fragmentation.",
      options: [
        { id: "true", text: "True", isCorrect: true },
        { id: "false", text: "False", isCorrect: false },
      ],
      correctAnswer: { value: true },
      points: 1,
      status: "ACTIVE",
      version: 1,
    });

    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Distributed Operating Systems Final Exam 2026",
      code: "CS602-FINAL-2026",
      type: "MCQ",
      subjectId: subjA._id,
      departmentId: deptA._id,
      programId: progA._id,
      duration: { value: 60, unit: "MINUTES" },
      durationSeconds: 3600,
      totalPoints: 3,
      status: "PUBLISHED",
      createdBy: vuExaminer._id,
      settings: {
        maxAttempts: 1,
        allowResume: true,
        shuffleQuestions: true,
        shuffleOptions: true,
      },
    });

    const section = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      title: "Core OS Architecture",
      order: 1,
    });

    await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      sectionId: section._id,
      questionId: q1._id,
      type: q1.type,
      order: 1,
      marks: 2,
      points: 2,
      prompt: q1.prompt,
      options: q1.options,
      snapshot: {
        type: q1.type,
        prompt: q1.prompt,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
        marks: 2,
      },
    });

    await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      sectionId: section._id,
      questionId: q2._id,
      type: q2.type,
      order: 2,
      marks: 1,
      points: 1,
      prompt: q2.prompt,
      options: q2.options,
      snapshot: {
        type: q2.type,
        prompt: q2.prompt,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        marks: 1,
      },
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: aliceCandidate._id,
      assignedBy: vuExaminer._id,
      status: "ASSIGNED",
      attemptsAllowed: 1,
    });

    console.log("\n[TEST 1] Candidate Starts Attempt (Timer & Questions Generation)...");
    const startRes = await request(server, {
      method: "POST",
      path: "/api/v1/attempts/start",
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      assignmentId: assignment._id,
      organizationId: orgA._id,
    });

    console.log("Start Attempt Status ->", startRes.status, "Attempt ID:", startRes.body?.data?.id, "Status:", startRes.body?.data?.status, "Total Questions:", startRes.body?.data?.totalQuestions, "Time Remaining (s):", startRes.body?.data?.timeRemainingSeconds);
    if (startRes.status !== 201 || !startRes.body?.data?.id) {
      throw new Error("Test 1 Failed: Attempt could not be started!");
    }
    const attemptId = startRes.body.data.id;

    console.log("\n[TEST 2] Retrieve Candidate Attempt Questions (Answer Security Verification)...");
    const questionsRes = await request(server, {
      method: "GET",
      path: `/api/v1/attempts/${attemptId}/questions`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    console.log("Get Questions Status ->", questionsRes.status, "Questions Count:", questionsRes.body?.data?.length);
    if (questionsRes.status !== 200 || questionsRes.body?.data?.length !== 2) {
      throw new Error("Test 2.1 Failed: Could not retrieve attempt questions!");
    }

    const firstQ = questionsRes.body.data[0];
    console.log("Question 1 Prompt:", firstQ.prompt, "Has CorrectAnswer:", Boolean(firstQ.correctAnswer || firstQ.answer));
    if (firstQ.correctAnswer !== undefined || firstQ.answer !== undefined) {
      throw new Error("Test 2.2 Failed: Answer Security Violated! Correct answer leaked to candidate!");
    }
    // Find MCQ and True/False questions dynamically from attempt questions
    const mcqQuestion = questionsRes.body.data.find((q) => q.type === "SINGLE_CHOICE");
    const tfQuestion = questionsRes.body.data.find((q) => q.type === "TRUE_FALSE");

    console.log("\n[TEST 3] Autosave & Update Candidate Answer...");
    const saveAnsRes = await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${mcqQuestion._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: "c",
    });

    console.log("Save Answer Status ->", saveAnsRes.status, "Answered Questions Count:", saveAnsRes.body?.data?.answeredQuestions);
    if (saveAnsRes.status !== 200 || !saveAnsRes.body?.data?.isAnswered) {
      throw new Error("Test 3 Failed: Answer autosave failed!");
    }

    console.log("\n[TEST 4] Question Flagging & Heartbeat...");
    const flagRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/attempts/${attemptId}/questions/${tfQuestion._id}/flag`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      flagged: true,
    });
    console.log("Flag Question Status ->", flagRes.status, "Flagged:", flagRes.body?.data?.flagged);
    if (flagRes.status !== 200 || !flagRes.body?.data?.flagged) {
      throw new Error("Test 4.1 Failed: Question flagging failed!");
    }

    const heartbeatRes = await request(server, {
      method: "POST",
      path: `/api/v1/attempts/${attemptId}/heartbeat`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Heartbeat Status ->", heartbeatRes.status, "Remaining Seconds:", heartbeatRes.body?.data?.timeRemainingSeconds);
    if (heartbeatRes.status !== 200 || !heartbeatRes.body?.data?.timeRemainingSeconds) {
      throw new Error("Test 4.2 Failed: Heartbeat failed!");
    }

    console.log("\n[TEST 5] Attempt Resume Capability (Close/Reopen Session)...");
    const resumeRes = await request(server, {
      method: "POST",
      path: "/api/v1/attempts/start",
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      assignmentId: assignment._id,
      organizationId: orgA._id,
    });
    console.log("Resume Attempt Status ->", resumeRes.status, "Same Attempt ID:", resumeRes.body?.data?.id === attemptId);
    if (resumeRes.status !== 201 || resumeRes.body?.data?.id !== attemptId) {
      throw new Error("Test 5 Failed: Active attempt was not safely resumed!");
    }

    console.log("\n[TEST 6] Submit Attempt & Automated Objective Evaluation...");
    // Answer True/False question correctly with true
    await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${tfQuestion._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: true,
    });

    const submitRes = await request(server, {
      method: "POST",
      path: `/api/v1/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Submit Status ->", submitRes.status, "Status:", submitRes.body?.data?.status, "Earned Points:", submitRes.body?.data?.earnedPoints, "Total Points:", submitRes.body?.data?.totalPoints, "Percentage:", submitRes.body?.data?.percentage);
    if (submitRes.status !== 200 || submitRes.body?.data?.status !== "SUBMITTED" || submitRes.body?.data?.earnedPoints !== 3) {
      throw new Error("Test 6.1 Failed: Final submission and auto-grading failed!");
    }

    // Double Submission Protection
    const doubleSubmitRes = await request(server, {
      method: "POST",
      path: `/api/v1/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Double Submission Status ->", doubleSubmitRes.status, "Status:", doubleSubmitRes.body?.data?.status);
    if (doubleSubmitRes.status !== 200) {
      throw new Error("Test 6.2 Failed: Double submission was not safely guarded!");
    }

    console.log("\n[TEST 7] Cross-Candidate & Tenant Isolation...");
    // Eve cannot view or submit Alice's attempt
    const eveAttemptRes = await request(server, {
      method: "GET",
      path: `/api/v1/attempts/${attemptId}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Access to Alice Attempt -> Status:", eveAttemptRes.status, "Success:", eveAttemptRes.body?.success);
    if (eveAttemptRes.status !== 403 && eveAttemptRes.status !== 404) {
      throw new Error("Test 7.1 Failed: Cross-candidate attempt access was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 28 CANDIDATE ATTEMPT & EXAM ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 28 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep28Tests();
