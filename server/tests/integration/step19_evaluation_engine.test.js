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
import Candidate from "../../src/modules/candidates/candidate.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import AttemptQuestion from "../../src/modules/attemptQuestions/attemptQuestion.model.js";
import Answer from "../../src/modules/answers/answer.model.js";
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
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

const runStep19Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 19 Evaluation Engine Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Roles & Clean Collections
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-19", "org-saylani-19"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner19@test.com", "alice19@vu.edu.pk", "charlie19@saylani.edu.pk"] } });

    // 2. Setup Org A
    const orgA = await Organization.create({
      name: "Virtual University 19",
      slug: "org-vu-19",
      code: "VU19",
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
      name: "Operating Systems",
      code: "OS-19",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner19@test.com",
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

    // Alice Candidate
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice19@vu.edu.pk",
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
      candidateCode: "VU-CAND-19",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice19@vu.edu.pk",
      status: "ACTIVE",
    });

    // 3. Setup Questions
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "OS Bank",
      code: "OS-QB",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      prompt: "Which scheduler selects from pool of jobs and loads them into memory?",
      options: [{ id: "A", text: "Long-term scheduler" }, { id: "B", text: "Short-term scheduler" }],
      correctAnswer: ["A"],
      points: 10,
      status: "ACTIVE",
    });

    const q2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "MULTIPLE_CHOICE",
      prompt: "Select process states:",
      options: [{ id: "A", text: "Ready" }, { id: "B", text: "Running" }, { id: "C", text: "Rebooting" }],
      correctAnswer: ["A", "B"],
      points: 10,
      status: "ACTIVE",
    });

    const assessmentA = await Assessment.create({
      organizationId: orgA._id,
      title: "Operating Systems Final Exam",
      code: "OS-FIN-19",
      type: "MCQ",
      subjectId: subjA._id,
      durationSeconds: 3600,
      passingScore: 60,
      totalPoints: 20,
      createdBy: vuExaminer._id,
      status: "PUBLISHED",
      settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        showResultImmediately: false, // Examiner must review & publish!
        allowPartialCredit: true,
        maxAttempts: 1,
      },
    });

    const sectionA = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      title: "Section 1: Core OS",
      order: 1,
    });

    const aq1 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      sectionId: sectionA._id,
      questionId: q1._id,
      type: q1.type,
      prompt: q1.prompt,
      options: q1.options,
      correctAnswer: q1.correctAnswer,
      points: 10,
      order: 1,
    });

    const aq2 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      sectionId: sectionA._id,
      questionId: q2._id,
      type: q2.type,
      prompt: q2.prompt,
      options: q2.options,
      correctAnswer: q2.correctAnswer,
      points: 10,
      order: 2,
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      attemptLimit: 1,
    });

    // 4. Start Attempt for Alice & Submit Answers
    const startRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/assignments/${assignment._id}/attempts`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const attemptId = startRes.body.data.id;

    const attemptQuestions = await AttemptQuestion.find({ attemptId }).sort({ order: 1 });
    const [attQ1, attQ2] = attemptQuestions;

    // Answer Q1 Correctly ("A") -> 10 pts
    await request(server, {
      method: "PUT",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions/${attQ1._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: { selectedOptionId: "A" },
    });

    // Answer Q2 Correctly (["A", "B"]) -> 10 pts
    await request(server, {
      method: "PUT",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions/${attQ2._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: { selectedOptionIds: ["A", "B"] },
    });

    // Submit Attempt
    await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    console.log("\n[TEST 1] Trigger Attempt Evaluation...");
    const evalRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/attempts/${attemptId}/evaluate`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Evaluate Status ->", evalRes.status, "Earned Points:", evalRes.body?.data?.evaluation?.earnedPoints, "Percentage:", evalRes.body?.data?.evaluation?.percentage);
    if (evalRes.status !== 200 || evalRes.body?.data?.evaluation?.percentage !== 100) throw new Error("Test 1 Failed: Evaluation score calculation failed!");

    console.log("\n[TEST 2] Verify Unpublished Result Withholding...");
    const unpubResultRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/result`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Unpublished Result Status for Candidate ->", unpubResultRes.body?.data?.status, "Published:", unpubResultRes.body?.data?.published);
    if (unpubResultRes.body?.data?.status !== "WITHHELD" || unpubResultRes.body?.data?.published !== false) {
      throw new Error("Test 2 Failed: Unpublished result was leaked to candidate!");
    }

    console.log("\n[TEST 3] Publish Result & Verify Candidate Delivery...");
    const pubRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/attempts/${attemptId}/publish-result`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Examiner Publish Result Status ->", pubRes.status, "Published:", pubRes.body?.data?.published);
    if (pubRes.status !== 200 || pubRes.body?.data?.published !== true) throw new Error("Test 3.1 Failed");

    // Candidate re-queries result post-publication
    const candResultRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/result`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Result After Publication ->", candResultRes.body?.data?.status, "Percentage:", candResultRes.body?.data?.percentage, "Grade:", candResultRes.body?.data?.grade, "Passed:", candResultRes.body?.data?.passed);
    if (
      candResultRes.body?.data?.status !== "PUBLISHED" ||
      candResultRes.body?.data?.percentage !== 100 ||
      candResultRes.body?.data?.passed !== true
    ) {
      throw new Error("Test 3.2 Failed");
    }

    console.log("\n[TEST 4] Examiner Detailed Evaluation View...");
    const examinerEvalRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/attempts/${attemptId}/evaluation`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Examiner View Evaluation Status ->", examinerEvalRes.status, "Total Items Evaluated:", examinerEvalRes.body?.data?.items?.length);
    if (examinerEvalRes.status !== 200 || examinerEvalRes.body?.data?.items?.length !== 2) throw new Error("Test 4 Failed");

    console.log("\n[TEST 5] Regrading with Version Tracking...");
    const regradeRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/attempts/${attemptId}/regrade`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Regrade Status ->", regradeRes.status, "New Version:", regradeRes.body?.data?.evaluation?.version);
    if (regradeRes.status !== 200 || regradeRes.body?.data?.evaluation?.version !== 2) throw new Error("Test 5 Failed: Regrade version was not incremented!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 19 EVALUATION & AUTOMATED GRADING TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 19 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep19Tests();
