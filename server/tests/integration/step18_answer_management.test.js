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

const runStep18Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 18 Answer Management Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-18", "org-saylani-18"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner18@test.com", "alice18@vu.edu.pk", "charlie18@saylani.edu.pk"] } });

    // 2. Setup Org A
    const orgA = await Organization.create({
      name: "Virtual University 18",
      slug: "org-vu-18",
      code: "VU18",
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
      name: "Web Development",
      code: "WEB-18",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner18@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

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
      email: "alice18@vu.edu.pk",
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
      candidateCode: "VU-CAND-18",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice18@vu.edu.pk",
      status: "ACTIVE",
    });

    // 3. Setup Questions (Single Choice, Multiple Choice, Coding)
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "Web Bank",
      code: "WEB-QB",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      prompt: "What is HTML?",
      options: [{ id: "A", text: "HyperText Markup Language" }, { id: "B", text: "High Tech Tool" }],
      correctAnswer: ["A"],
      points: 5,
      status: "ACTIVE",
    });

    const q2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "MULTIPLE_CHOICE",
      prompt: "Select CSS Layout Modules:",
      options: [{ id: "A", text: "Flexbox" }, { id: "B", text: "Grid" }, { id: "C", text: "C++" }],
      correctAnswer: ["A", "B"],
      points: 5,
      status: "ACTIVE",
    });

    const q3 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "CODING",
      prompt: "Write a JavaScript function that returns 'Hello World'.",
      correctAnswer: ["function greet() { return 'Hello World'; }"],
      points: 10,
      status: "ACTIVE",
    });

    const assessmentA = await Assessment.create({
      organizationId: orgA._id,
      title: "Web Engineering Final Exam",
      code: "WEB-FIN-18",
      type: "HYBRID",
      subjectId: subjA._id,
      durationSeconds: 3600,
      passingScore: 60,
      createdBy: vuExaminer._id,
      status: "PUBLISHED",
      settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        allowBackNavigation: true,
        allowUnanswered: true,
        maxAttempts: 1,
      },
    });

    const sectionA = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      title: "Section 1: Frontend",
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
      points: 5,
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
      points: 5,
      order: 2,
    });

    const aq3 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      sectionId: sectionA._id,
      questionId: q3._id,
      type: q3.type,
      prompt: q3.prompt,
      options: q3.options,
      correctAnswer: q3.correctAnswer,
      points: 10,
      order: 3,
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      attemptLimit: 1,
    });

    // 4. Start Attempt for Alice
    const startRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/assignments/${assignment._id}/attempts`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const attemptId = startRes.body.data.id;

    // Fetch Attempt Questions
    const attemptQuestions = await AttemptQuestion.find({ attemptId }).sort({ order: 1 });
    const [attQ1, attQ2, attQ3] = attemptQuestions;

    console.log("\n[TEST 1] Save Single-Choice Answer & Autosave Versioning...");
    const saveQ1Res1 = await request(server, {
      method: "PUT",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions/${attQ1._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: { selectedOptionId: "A" },
    });
    console.log("Save Q1 Answer v1 Status ->", saveQ1Res1.status, "Version:", saveQ1Res1.body?.data?.version);
    if (saveQ1Res1.status !== 200 || saveQ1Res1.body?.data?.version !== 1) throw new Error("Test 1.1 Failed");

    // Candidate changes answer from A to B -> version becomes 2
    const saveQ1Res2 = await request(server, {
      method: "PUT",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions/${attQ1._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: { selectedOptionId: "B" },
    });
    console.log("Save Q1 Answer v2 Status ->", saveQ1Res2.status, "New Version:", saveQ1Res2.body?.data?.version, "Selected:", saveQ1Res2.body?.data?.answer?.selectedOptionId);
    if (saveQ1Res2.body?.data?.version !== 2 || saveQ1Res2.body?.data?.answer?.selectedOptionId !== "B") throw new Error("Test 1.2 Failed");

    console.log("\n[TEST 2] Save Multiple-Choice & Coding Answers...");
    const saveQ2Res = await request(server, {
      method: "PUT",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions/${attQ2._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: { selectedOptionIds: ["A", "B"] },
    });
    console.log("Save Q2 Multiple Choice Status ->", saveQ2Res.status, "isAnswered:", saveQ2Res.body?.data?.isAnswered);

    const saveQ3Res = await request(server, {
      method: "PUT",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions/${attQ3._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: { code: "function greet() { return 'Hello World'; }", language: "javascript" },
    });
    console.log("Save Q3 Coding Answer Status ->", saveQ3Res.status, "isAnswered:", saveQ3Res.body?.data?.isAnswered);

    console.log("\n[TEST 3] Retrieve Answers and Progress Tracking...");
    const getAnswersRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/answers`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Get Answers Status ->", getAnswersRes.status, "Total Answered:", getAnswersRes.body?.data?.totalAnswered);
    if (getAnswersRes.status !== 200 || getAnswersRes.body?.data?.totalAnswered !== 3) throw new Error("Test 3 Failed");

    console.log("\n[TEST 4] Grading Field Tampering Rejection (400 Bad Request)...");
    const tamperRes = await request(server, {
      method: "PUT",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions/${attQ1._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: { selectedOptionId: "A", points: 100, isCorrect: true }, // Tamper attempt!
    });
    console.log("Tampering Attempt Status ->", tamperRes.status, "(Expected: 400)");
    if (tamperRes.status !== 400) throw new Error("Test 4 Failed: Tampering was allowed!");

    console.log("\n[TEST 5] Candidate Navigation State...");
    const navRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/current-question`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      questionIndex: 2,
    });
    console.log("Update Navigation to Q3 ->", navRes.status, "Current Index:", navRes.body?.data?.currentQuestionIndex);
    if (navRes.status !== 200 || navRes.body?.data?.currentQuestionIndex !== 2) throw new Error("Test 5 Failed");

    console.log("\n[TEST 6] Atomic Final Submission...");
    const submitRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Submit Attempt Status ->", submitRes.status, "Final Status:", submitRes.body?.data?.status);
    if (submitRes.status !== 200 || submitRes.body?.data?.status !== "SUBMITTED") throw new Error("Test 6.1 Failed");

    // Attempting to modify answer post-submission -> 409 Conflict (Locked)
    const postSubmitAnswerRes = await request(server, {
      method: "PUT",
      path: `/api/v1/organizations/${orgA._id}/candidate/attempts/${attemptId}/questions/${attQ1._id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: { selectedOptionId: "A" },
    });
    console.log("Modify Answer Post-Submission ->", postSubmitAnswerRes.status, "(Expected: 409 Conflict)");
    if (postSubmitAnswerRes.status !== 409) throw new Error("Test 6.2 Failed: Post-submission modification allowed!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 18 ANSWER MANAGEMENT & SUBMISSION TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 18 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep18Tests();
