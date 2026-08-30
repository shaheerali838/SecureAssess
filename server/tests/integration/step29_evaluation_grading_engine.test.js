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
import Evaluation from "../../src/modules/evaluations/evaluation.model.js";
import Result from "../../src/modules/results/result.model.js";
import { EvaluationService } from "../../src/modules/evaluations/evaluation.service.js";
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

const runStep29Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 29 Evaluation & Grading Engine Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-29", "org-alien-29"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner29@test.com", "alice29@vu.edu.pk", "eve29@alien.com"] } });
    await Assessment.deleteMany({});
    await AssessmentSection.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Attempt.deleteMany({});
    await AttemptQuestion.deleteMany({});
    await Answer.deleteMany({});
    await Evaluation.deleteMany({});
    await Result.deleteMany({});
    await QuestionBank.deleteMany({});
    await Question.deleteMany({});

    // 2. Setup Organization & Users
    const orgA = await Organization.create({
      name: "Virtual University 29",
      slug: "org-vu-29",
      code: "VU29",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS29",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Software Engineering",
      code: "BSSE29",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Advanced Distributed Systems",
      code: "CS-603",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner29@test.com",
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
      email: "alice29@vu.edu.pk",
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
      candidateCode: "VU-CAND-29",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice29@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve (For Isolation)
    const orgB = await Organization.create({
      name: "Alien Org 29",
      slug: "org-alien-29",
      code: "ALIEN29",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve29@alien.com",
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

    // 3. Setup Hybrid Assessment with 4 Question Types
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "Distributed Systems Bank 29",
      code: "DS-QB-29",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    // Q1: Single Choice (2 marks, -0.5 negative)
    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      title: "Consensus Quorum",
      prompt: "What is the minimum quorum size for 5 nodes in Raft?",
      options: [
        { id: "a", text: "2 nodes", isCorrect: false },
        { id: "b", text: "3 nodes", isCorrect: true },
        { id: "c", text: "4 nodes", isCorrect: false },
      ],
      correctAnswer: { optionIds: ["b"] },
      points: 2,
      negativeMarks: 0.5,
      status: "ACTIVE",
      version: 1,
    });

    // Q2: True/False (1 mark)
    const q2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      createdBy: vuExaminer._id,
      type: "TRUE_FALSE",
      title: "CAP Theorem Consistency",
      prompt: "In a network partition, a system can maintain both Consistency and Availability.",
      options: [
        { id: "true", text: "True", isCorrect: false },
        { id: "false", text: "False", isCorrect: true },
      ],
      correctAnswer: { value: false },
      points: 1,
      status: "ACTIVE",
      version: 1,
    });

    // Q3: Multiple Choice with Partial Credit (2 marks)
    const q3 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      createdBy: vuExaminer._id,
      type: "MULTIPLE_CHOICE",
      title: "Byzantine Fault Tolerance",
      prompt: "Which algorithms provide Byzantine Fault Tolerance?",
      options: [
        { id: "pbft", text: "Practical Byzantine Fault Tolerance (PBFT)", isCorrect: true },
        { id: "raft", text: "Standard Raft", isCorrect: false },
        { id: "hotstuff", text: "HotStuff", isCorrect: true },
      ],
      correctAnswer: { optionIds: ["pbft", "hotstuff"] },
      points: 2,
      status: "ACTIVE",
      version: 1,
    });

    // Q4: Essay (5 marks - Manual Grading Required)
    const q4 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      createdBy: vuExaminer._id,
      type: "ESSAY",
      title: "Distributed Transactions Architecture",
      prompt: "Explain Two-Phase Commit (2PC) vs Three-Phase Commit (3PC) failure recovery mechanisms.",
      points: 5,
      status: "ACTIVE",
      version: 1,
    });

    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Distributed Systems Final Comprehensive Exam",
      code: "CS603-COMP-2026",
      type: "HYBRID",
      subjectId: subjA._id,
      departmentId: deptA._id,
      programId: progA._id,
      duration: { value: 120, unit: "MINUTES" },
      durationSeconds: 7200,
      totalPoints: 10,
      status: "PUBLISHED",
      createdBy: vuExaminer._id,
      gradingSettings: {
        passingScore: 70,
        gradingMethod: "HYBRID",
        negativeMarking: true,
        multipleChoiceGradingPolicy: "PARTIAL_CREDIT",
      },
      settings: {
        maxAttempts: 1,
        multipleChoiceGradingPolicy: "PARTIAL_CREDIT",
      },
    });

    const section = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      title: "Core Consensus & Transactions",
      order: 1,
    });

    const aq1 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      sectionId: section._id,
      questionId: q1._id,
      type: q1.type,
      order: 1,
      marks: 2,
      points: 2,
      negativeMarks: 0.5,
      prompt: q1.prompt,
      options: q1.options,
      correctAnswer: q1.correctAnswer,
      snapshot: {
        type: q1.type,
        prompt: q1.prompt,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
        marks: 2,
        negativeMarks: 0.5,
      },
    });

    const aq2 = await AssessmentQuestion.create({
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
      correctAnswer: q2.correctAnswer,
      snapshot: {
        type: q2.type,
        prompt: q2.prompt,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
        marks: 1,
      },
    });

    const aq3 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      sectionId: section._id,
      questionId: q3._id,
      type: q3.type,
      order: 3,
      marks: 2,
      points: 2,
      prompt: q3.prompt,
      options: q3.options,
      correctAnswer: q3.correctAnswer,
      snapshot: {
        type: q3.type,
        prompt: q3.prompt,
        options: q3.options,
        correctAnswer: q3.correctAnswer,
        marks: 2,
      },
    });

    const aq4 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      sectionId: section._id,
      questionId: q4._id,
      type: q4.type,
      order: 4,
      marks: 5,
      points: 5,
      prompt: q4.prompt,
      snapshot: {
        type: q4.type,
        prompt: q4.prompt,
        marks: 5,
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

    // Create Candidate Attempt
    const attempt = await Attempt.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: aliceCandidate._id,
      attemptNumber: 1,
      status: "SUBMITTED",
      startedAt: new Date(Date.now() - 3600 * 1000),
      submittedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
      durationSeconds: 7200,
      totalQuestions: 4,
      answeredQuestions: 4,
      totalPoints: 10,
      totalMarks: 10,
    });

    const attQ1 = await AttemptQuestion.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentQuestionId: aq1._id,
      questionId: q1._id,
      order: 1,
      type: q1.type,
      marks: 2,
      negativeMarks: 0.5,
      prompt: q1.prompt,
      options: q1.options,
      questionSnapshot: aq1.snapshot,
      status: "ANSWERED",
    });

    const attQ2 = await AttemptQuestion.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentQuestionId: aq2._id,
      questionId: q2._id,
      order: 2,
      type: q2.type,
      marks: 1,
      prompt: q2.prompt,
      options: q2.options,
      questionSnapshot: aq2.snapshot,
      status: "ANSWERED",
    });

    const attQ3 = await AttemptQuestion.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentQuestionId: aq3._id,
      questionId: q3._id,
      order: 3,
      type: q3.type,
      marks: 2,
      prompt: q3.prompt,
      options: q3.options,
      questionSnapshot: aq3.snapshot,
      status: "ANSWERED",
    });

    const attQ4 = await AttemptQuestion.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      assessmentQuestionId: aq4._id,
      questionId: q4._id,
      order: 4,
      type: q4.type,
      marks: 5,
      prompt: q4.prompt,
      questionSnapshot: aq4.snapshot,
      status: "ANSWERED",
    });

    // Save Candidate Answers:
    // Q1: b (correct: +2)
    await Answer.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      attemptQuestionId: attQ1._id,
      candidateId: aliceCandidate._id,
      answer: "b",
      answerType: "SINGLE_CHOICE",
      isAnswered: true,
    });

    // Q2: true (incorrect: 0)
    await Answer.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      attemptQuestionId: attQ2._id,
      candidateId: aliceCandidate._id,
      answer: true,
      answerType: "TRUE_FALSE",
      isAnswered: true,
    });

    // Q3: ["pbft"] (partially correct: 1 of 2 matches = +1)
    await Answer.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      attemptQuestionId: attQ3._id,
      candidateId: aliceCandidate._id,
      answer: ["pbft"],
      answerType: "MULTIPLE_CHOICE",
      isAnswered: true,
    });

    // Q4: Essay response
    await Answer.create({
      organizationId: orgA._id,
      attemptId: attempt._id,
      attemptQuestionId: attQ4._id,
      candidateId: aliceCandidate._id,
      answer: "In 2PC, coordinator sends Prepare then Commit. In 3PC, Pre-Commit state eliminates blocking on coordinator failure.",
      answerType: "ESSAY",
      isAnswered: true,
    });

    console.log("\n[TEST 1] Trigger Automatic Evaluation Engine...");
    const evalRes = await EvaluationService.evaluateAttempt(attempt._id, { evaluatorUserId: vuExaminer._id });

    console.log("Evaluation Status ->", evalRes.status, "Grading Method:", evalRes.gradingMethod, "Objective Score:", evalRes.objectiveScore, "Pending Manual Review:", evalRes.pendingManualReview);
    if (evalRes.status !== "PARTIALLY_GRADED" || evalRes.objectiveScore !== 3 || !evalRes.pendingManualReview) {
      throw new Error("Test 1 Failed: Automatic evaluation calculation or manual pending flag failed!");
    }
    const evaluationId = evalRes._id;

    console.log("\n[TEST 2] Examiner Views Pending Manual Evaluation Queue...");
    const pendingQueueRes = await request(server, {
      method: "GET",
      path: `/api/v1/evaluations/pending?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });

    console.log("Pending Queue Status ->", pendingQueueRes.status, "Pending Items Count:", pendingQueueRes.body?.data?.items?.length);
    if (pendingQueueRes.status !== 200 || pendingQueueRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 2 Failed: Pending evaluations queue did not return pending evaluation!");
    }

    console.log("\n[TEST 3] Examiner Inspects Evaluation Details...");
    const evalDetailsRes = await request(server, {
      method: "GET",
      path: `/api/v1/evaluations/${evaluationId}?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });

    console.log("Evaluation Details Status ->", evalDetailsRes.status, "Question Results Count:", evalDetailsRes.body?.data?.questionResults?.length);
    if (evalDetailsRes.status !== 200 || evalDetailsRes.body?.data?.questionResults?.length !== 4) {
      throw new Error("Test 3 Failed: Evaluation details retrieval failed!");
    }

    console.log("\n[TEST 4] Examiner Subjective Grading & Validation Check...");
    // 4.1 Test validation: grading exceeding available marks (6 > 5) should fail
    const invalidGradeRes = await request(server, {
      method: "POST",
      path: `/api/v1/evaluations/${evaluationId}/questions/${q4._id}/grade?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      marksAwarded: 6,
      feedback: "Over maximum marks",
    });
    console.log("Exceeding Marks Validation Status ->", invalidGradeRes.status, "Success:", invalidGradeRes.body?.success);
    if (invalidGradeRes.status !== 400) throw new Error("Test 4.1 Failed: Validation did not reject marks > available!");

    // 4.2 Valid subjective grading: 4.5 / 5
    const validGradeRes = await request(server, {
      method: "POST",
      path: `/api/v1/evaluations/${evaluationId}/questions/${q4._id}/grade?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      marksAwarded: 4.5,
      feedback: "Comprehensive explanation of 2PC vs 3PC states.",
    });

    console.log("Valid Grade Status ->", validGradeRes.status, "Subjective Score:", validGradeRes.body?.data?.subjectiveScore, "Total Score:", validGradeRes.body?.data?.totalScore, "Percentage:", validGradeRes.body?.data?.percentage, "Passed:", validGradeRes.body?.data?.passed);
    if (validGradeRes.status !== 200 || validGradeRes.body?.data?.totalScore !== 7.5 || validGradeRes.body?.data?.percentage !== 75 || !validGradeRes.body?.data?.passed) {
      throw new Error("Test 4.2 Failed: Subjective question grading failed!");
    }

    console.log("\n[TEST 5] Finalize Evaluation & Result Generation...");
    const finalizeRes = await request(server, {
      method: "POST",
      path: `/api/v1/evaluations/${evaluationId}/finalize?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });

    console.log("Finalize Status ->", finalizeRes.status, "Evaluation Status:", finalizeRes.body?.data?.evaluation?.status, "Result Obtained Marks:", finalizeRes.body?.data?.result?.obtainedMarks, "Result Grade:", finalizeRes.body?.data?.result?.grade);
    if (finalizeRes.status !== 200 || finalizeRes.body?.data?.evaluation?.status !== "COMPLETED" || finalizeRes.body?.data?.result?.obtainedMarks !== 7.5) {
      throw new Error("Test 5 Failed: Finalize evaluation failed!");
    }
    const resultId = finalizeRes.body.data.result._id;

    console.log("\n[TEST 6] Result Visibility & Publishing Workflow...");
    // 6.1 Candidate checks results before publish -> Result is not visible
    const beforePubRes = await request(server, {
      method: "GET",
      path: `/api/v1/results/my?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Results Before Publish Count ->", beforePubRes.body?.data?.items?.length);
    if (beforePubRes.body?.data?.items?.length !== 0) {
      throw new Error("Test 6.1 Failed: Unpublished result was leaked to candidate!");
    }

    // 6.2 Staff publishes result
    const publishRes = await request(server, {
      method: "POST",
      path: `/api/v1/results/${resultId}/publish?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Publish Result Status ->", publishRes.status, "Published:", publishRes.body?.data?.published);
    if (publishRes.status !== 200 || !publishRes.body?.data?.published) {
      throw new Error("Test 6.2 Failed: Staff publish result failed!");
    }

    // 6.3 Candidate checks results after publish -> Result is now visible
    const afterPubRes = await request(server, {
      method: "GET",
      path: `/api/v1/results/my?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Results After Publish Count ->", afterPubRes.body?.data?.items?.length, "Obtained:", afterPubRes.body?.data?.items?.[0]?.obtainedMarks);
    if (afterPubRes.status !== 200 || afterPubRes.body?.data?.items?.length !== 1 || afterPubRes.body?.data?.items?.[0]?.obtainedMarks !== 7.5) {
      throw new Error("Test 6.3 Failed: Candidate could not retrieve published result!");
    }

    console.log("\n[TEST 7] Cross-Tenant & Unauthorized Access Isolation...");
    // Candidate cannot grade questions
    const candGradeRes = await request(server, {
      method: "POST",
      path: `/api/v1/evaluations/${evaluationId}/questions/${q4._id}/grade?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, { marksAwarded: 5 });
    console.log("Candidate Grading Access -> Status:", candGradeRes.status);
    if (candGradeRes.status !== 403 && candGradeRes.status !== 401) {
      throw new Error("Test 7.1 Failed: Candidate was not forbidden from grading questions!");
    }

    // Alien Eve cannot view Org A results
    const eveResultRes = await request(server, {
      method: "GET",
      path: `/api/v1/results/${resultId}?organizationId=${orgB._id}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Access to Org A Result -> Status:", eveResultRes.status, "Success:", eveResultRes.body?.success);
    if (eveResultRes.status !== 403 && eveResultRes.status !== 404) {
      throw new Error("Test 7.2 Failed: Cross-tenant result access was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 29 EVALUATION & GRADING ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 29 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep29Tests();
