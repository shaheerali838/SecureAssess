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
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import AttemptQuestion from "../../src/modules/attemptQuestions/attemptQuestion.model.js";
import Answer from "../../src/modules/answers/answer.model.js";
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import EvaluationItem from "../../src/modules/evaluationItems/evaluationItem.model.js";
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

const runStep39Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 39 Evaluation & Grading Engine Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-39", "org-alien-39"] } });
    await User.deleteMany({ email: { $in: ["examiner39@vu.edu.pk", "alice39@vu.edu.pk", "eve39@alien.com"] } });
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
    await EvaluationItem.deleteMany({});
    await Result.deleteMany({});

    // 2. Setup Organization A & Examiner
    const orgA = await Organization.create({
      name: "Virtual University 39",
      slug: "org-vu-39",
      code: "VU39",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const examinerUser = await User.create({
      firstName: "Prof.",
      lastName: "Zahid",
      email: "examiner39@vu.edu.pk",
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
      lastName: "Wonder",
      email: "alice39@vu.edu.pk",
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
      candidateCode: "VU-CAND-39A",
      firstName: "Alice",
      lastName: "Wonder",
      email: "alice39@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 39",
      slug: "org-alien-39",
      code: "ALIEN39",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Hacker",
      email: "eve39@alien.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const eveToken = generateAccessToken({ sub: eveUser._id.toString() });

    await UserMembership.create({
      userId: eveUser._id,
      organizationId: orgB._id,
      roleId: examinerRole._id, // Eve is examiner in Org B
      status: "ACTIVE",
    });

    // 3. Create Multi-Type Questions & Assessment
    const qBank = await QuestionBank.create({
      organizationId: orgA._id,
      name: "Compilers Bank",
      code: "COMP-BANK-39",
      ownerId: examinerUser._id,
      createdBy: examinerUser._id,
    });

    // Q1: Single Choice (5 pts)
    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qBank._id,
      createdBy: examinerUser._id,
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title: "Lexical Analyzer Output",
      prompt: "What is the primary output of the lexical analysis phase?",
      options: [
        { id: "A", text: "Parse Tree", isCorrect: false },
        { id: "B", text: "Tokens", isCorrect: true },
        { id: "C", text: "Intermediate Code", isCorrect: false },
      ],
      correctAnswer: "B",
      points: 5,
      version: 1,
    });

    // Q2: Multiple Choice (10 pts)
    const q2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qBank._id,
      createdBy: examinerUser._id,
      type: QUESTION_TYPES.MULTIPLE_CHOICE,
      title: "Compiler Front-End Phases",
      prompt: "Select all phases that belong to the front-end of a compiler.",
      options: [
        { id: "A", text: "Lexical Analysis", isCorrect: true },
        { id: "B", text: "Syntax Analysis", isCorrect: true },
        { id: "C", text: "Target Code Generation", isCorrect: false },
        { id: "D", text: "Semantic Analysis", isCorrect: true },
      ],
      correctAnswer: ["A", "B", "D"],
      points: 10,
      version: 1,
    });

    // Q3: Essay (Manual Review Required, 15 pts)
    const q3 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qBank._id,
      createdBy: examinerUser._id,
      type: QUESTION_TYPES.ESSAY,
      title: "LR Parsing vs LL Parsing",
      prompt: "Explain the architectural differences between LL(1) and LR(1) parsing algorithms.",
      points: 15,
      version: 1,
    });

    const asm = await Assessment.create({
      organizationId: orgA._id,
      title: "Compiler Construction Final Exam 2026",
      code: "CS602-FINAL-2026",
      status: ASSESSMENT_STATUSES.PUBLISHED,
      publishedAt: new Date(),
      duration: { value: 90, unit: "MINUTES" },
      durationSeconds: 5400,
      totalPoints: 30,
      passingScore: 60,
      resultSettings: {
        visibility: "AFTER_REVIEW", // Results require examiner publication
      },
      createdBy: examinerUser._id,
    });

    const sec = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      title: "Main Section",
      order: 1,
    });

    const aq1 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      sectionId: sec._id,
      questionId: q1._id,
      order: 1,
      points: 5,
      marks: 5,
      type: q1.type,
      prompt: q1.prompt,
      options: q1.options,
      correctAnswer: q1.correctAnswer,
      snapshot: { prompt: q1.prompt, options: q1.options, correctAnswer: q1.correctAnswer, type: q1.type },
    });

    const aq2 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      sectionId: sec._id,
      questionId: q2._id,
      order: 2,
      points: 10,
      marks: 10,
      type: q2.type,
      prompt: q2.prompt,
      options: q2.options,
      correctAnswer: q2.correctAnswer,
      snapshot: { prompt: q2.prompt, options: q2.options, correctAnswer: q2.correctAnswer, type: q2.type },
    });

    const aq3 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      sectionId: sec._id,
      questionId: q3._id,
      order: 3,
      points: 15,
      marks: 15,
      type: q3.type,
      prompt: q3.prompt,
      snapshot: { prompt: q3.prompt, type: q3.type },
    });

    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      accessCode: "SA-3939-ALICE",
      availableFrom: new Date(Date.now() - 3600000),
      availableUntil: new Date(Date.now() + 86400000),
      maxAttempts: 1,
    });

    // 4. Candidate Starts Attempt and Submits Answers
    const startRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assignments/${assignment._id}/start`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const attemptId = startRes.body.data.id;

    const questionsRes = await request(server, {
      method: "GET",
      path: `/api/v1/attempts/${attemptId}/questions`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const questions = questionsRes.body.data;
    const singleQ = questions.find(q => q.type === QUESTION_TYPES.SINGLE_CHOICE);
    const multiQ = questions.find(q => q.type === QUESTION_TYPES.MULTIPLE_CHOICE);
    const essayQ = questions.find(q => q.type === QUESTION_TYPES.ESSAY);

    // Answer Q1 (Correct: B) -> 5/5
    await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${singleQ.id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, { answer: "B" });

    // Answer Q2 (Correct: ["A", "B", "D"]) -> 10/10
    await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${multiQ.id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, { answer: ["A", "B", "D"] });

    // Answer Q3 (Essay) -> Submitted text for manual grading
    await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${essayQ.id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, { answer: "LL(1) is top-down recursive descent while LR(1) is bottom-up shift-reduce." });

    // Submit attempt
    await request(server, {
      method: "POST",
      path: `/api/v1/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    console.log("\n[TEST 1] Triggering Automatic Evaluation Pipeline...");
    const evalRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/evaluations/attempts/${attemptId}/evaluate`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });

    console.log("Evaluation Status ->", evalRes.status, "Evaluation State:", evalRes.body?.data?.status, "Objective Score:", evalRes.body?.data?.objectiveScore);
    if (evalRes.status !== 200 || evalRes.body?.data?.status !== "PARTIALLY_GRADED") {
      throw new Error("Test 1.1 Failed: Evaluation did not detect pending manual review for essay question!");
    }
    if (evalRes.body?.data?.objectiveScore !== 15) {
      throw new Error(`Test 1.2 Failed: Objective score mismatch (expected 15, got ${evalRes.body?.data?.objectiveScore})`);
    }
    const evaluationId = evalRes.body.data._id;

    console.log("\n[TEST 2] Fetching Pending Review Queue...");
    const pendingRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/evaluations/pending`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Pending Review Queue Count ->", pendingRes.body?.data?.items?.length);
    if (pendingRes.status !== 200 || pendingRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 2 Failed: Pending evaluations queue did not return pending attempt!");
    }

    console.log("\n[TEST 3] Examiner Manual Grading & Validation Upper Bounds...");
    // 3.1 Try awarding marks exceeding maximum available (15 available, trying 20)
    const invalidGradeRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/evaluations/${evaluationId}/questions/${essayQ.id}/grade`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      marksAwarded: 20, // Exceeds 15
      feedback: "Over maximum points",
    });
    console.log("Exceeding Marks Status ->", invalidGradeRes.status, "Message:", invalidGradeRes.body?.message);
    if (invalidGradeRes.status !== 400) {
      throw new Error("Test 3.1 Failed: Awarding marks exceeding maximum available was not blocked!");
    }

    // 3.2 Award valid manual marks (12/15)
    const validGradeRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/evaluations/${evaluationId}/questions/${essayQ.id}/grade`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      marksAwarded: 12,
      feedback: "Solid explanation of LL vs LR parser differences.",
    });
    console.log("Valid Grade Status ->", validGradeRes.status, "Subjective Score:", validGradeRes.body?.data?.subjectiveScore, "Total Score:", validGradeRes.body?.data?.totalScore);
    if (validGradeRes.status !== 200 || validGradeRes.body?.data?.totalScore !== 27) {
      throw new Error(`Test 3.2 Failed: Total score calculation mismatch (expected 27, got ${validGradeRes.body?.data?.totalScore})`);
    }

    console.log("\n[TEST 4] Finalizing Evaluation & Result Generation...");
    const finalizeRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/evaluations/${evaluationId}/finalize`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Finalize Status ->", finalizeRes.status, "Grade:", finalizeRes.body?.data?.result?.grade, "Passed:", finalizeRes.body?.data?.result?.passed);
    if (finalizeRes.status !== 200 || finalizeRes.body?.data?.result?.grade !== "A+" || finalizeRes.body?.data?.result?.passed !== true) {
      throw new Error("Test 4 Failed: Evaluation finalization failed!");
    }

    console.log("\n[TEST 5] Candidate Result Visibility Boundary & Publishing...");
    // 5.1 Alice queries result before publication -> blocked
    const tryViewUnpublished = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/evaluations/attempts/${attemptId}/result`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Unpublished Result Access Status ->", tryViewUnpublished.status, "Message:", tryViewUnpublished.body?.message);
    if (tryViewUnpublished.status !== 403) {
      throw new Error("Test 5.1 Failed: Unpublished result was leaked to candidate!");
    }

    // 5.2 Examiner publishes result
    const pubResultRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/evaluations/attempts/${attemptId}/publish`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Publish Result Status ->", pubResultRes.status, "Result Published:", pubResultRes.body?.data?.published);
    if (pubResultRes.status !== 200 || !pubResultRes.body?.data?.published) {
      throw new Error("Test 5.2 Failed: Result publishing failed!");
    }

    // 5.3 Alice queries result after publication -> success
    const candidateResultRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/evaluations/attempts/${attemptId}/result`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Published Result Query Status ->", candidateResultRes.status, "Obtained Marks:", candidateResultRes.body?.data?.obtainedMarks, "Grade:", candidateResultRes.body?.data?.grade);
    if (candidateResultRes.status !== 200 || candidateResultRes.body?.data?.obtainedMarks !== 27) {
      throw new Error("Test 5.3 Failed: Candidate could not retrieve published result!");
    }

    console.log("\n[TEST 6] Re-evaluation & Regrading Audit History...");
    const regradeRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/evaluations/attempts/${attemptId}/regrade`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    });
    console.log("Regrade Status ->", regradeRes.status, "New Version:", regradeRes.body?.data?.version);
    if (regradeRes.status !== 200 || regradeRes.body?.data?.version < 2) {
      throw new Error("Test 6 Failed: Re-evaluation version incrementation failed!");
    }

    console.log("\n[TEST 7] Cross-Tenant Security Isolation...");
    const eveAttemptRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/evaluations/${evaluationId}/questions/${essayQ.id}/grade`,
      headers: { Authorization: `Bearer ${eveToken}` }, // Eve is examiner in Org B
    }, {
      marksAwarded: 5,
    });
    console.log("Eve Alien Evaluation Access Status ->", eveAttemptRes.status);
    if (eveAttemptRes.status !== 403) {
      throw new Error("Test 7 Failed: Cross-tenant evaluation modification was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 39 EVALUATION & GRADING ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 39 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep39Tests();
