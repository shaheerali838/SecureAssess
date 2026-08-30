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

const runStep38Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 38 Exam Attempt Engine Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-38", "org-alien-38"] } });
    await User.deleteMany({ email: { $in: ["examiner38@vu.edu.pk", "alice38@vu.edu.pk", "eve38@alien.com"] } });
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
    await Result.deleteMany({});

    // 2. Setup Organization A & Examiner
    const orgA = await Organization.create({
      name: "Virtual University 38",
      slug: "org-vu-38",
      code: "VU38",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS38",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Computer Science",
      code: "BSCS38",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Operating Systems",
      code: "CS-504",
    });

    const examinerUser = await User.create({
      firstName: "Dr.",
      lastName: "Bilal",
      email: "examiner38@vu.edu.pk",
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

    // Alice Candidate in Org A
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Wonderland",
      email: "alice38@vu.edu.pk",
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
      candidateCode: "VU-CAND-38A",
      firstName: "Alice",
      lastName: "Wonderland",
      email: "alice38@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 38",
      slug: "org-alien-38",
      code: "ALIEN38",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Intruder",
      email: "eve38@alien.com",
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

    const eveCandidate = await Candidate.create({
      organizationId: orgB._id,
      userId: eveUser._id,
      candidateCode: "ALIEN-CAND-38",
      firstName: "Eve",
      lastName: "Intruder",
      email: "eve38@alien.com",
      status: "ACTIVE",
    });

    // 3. Create Questions, Assessment, and Section in Org A
    const qBank = await QuestionBank.create({
      organizationId: orgA._id,
      name: "OS Question Bank",
      code: "OS-BANK-38",
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
      title: "Deadlock Necessary Conditions",
      prompt: "How many Coffman conditions are required simultaneously for a deadlock?",
      options: [
        { id: "A", text: "2", isCorrect: false },
        { id: "B", text: "4", isCorrect: true },
        { id: "C", text: "6", isCorrect: false },
      ],
      correctAnswer: "B",
      points: 5,
      version: 1,
    });

    const q2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qBank._id,
      subjectId: subjA._id,
      createdBy: examinerUser._id,
      type: QUESTION_TYPES.TRUE_FALSE,
      title: "Paging vs Segmentation",
      prompt: "Paging is a memory management scheme that eliminates external fragmentation.",
      options: [
        { id: "T", text: "True", isCorrect: true },
        { id: "F", text: "False", isCorrect: false },
      ],
      correctAnswer: "T",
      points: 5,
      version: 1,
    });

    const asm = await Assessment.create({
      organizationId: orgA._id,
      title: "Operating Systems Midterm 2026",
      code: "CS504-MID-2026",
      status: ASSESSMENT_STATUSES.PUBLISHED,
      publishedAt: new Date(),
      duration: { value: 60, unit: "MINUTES" },
      durationSeconds: 3600,
      totalPoints: 10,
      passingScore: 50,
      settings: {
        shuffleQuestions: true,
        shuffleOptions: true,
      },
      createdBy: examinerUser._id,
    });

    const sec = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      title: "Section 1: Core OS Concepts",
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
      title: q1.title,
      prompt: q1.prompt,
      options: q1.options,
      correctAnswer: q1.correctAnswer,
      snapshot: {
        title: q1.title,
        prompt: q1.prompt,
        options: q1.options,
        correctAnswer: q1.correctAnswer,
      },
    });

    const aq2 = await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      sectionId: sec._id,
      questionId: q2._id,
      order: 2,
      points: 5,
      marks: 5,
      type: q2.type,
      title: q2.title,
      prompt: q2.prompt,
      options: q2.options,
      correctAnswer: q2.correctAnswer,
      snapshot: {
        title: q2.title,
        prompt: q2.prompt,
        options: q2.options,
        correctAnswer: q2.correctAnswer,
      },
    });

    // 4. Assign to Alice
    const assignment = await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: asm._id,
      candidateId: aliceCandidate._id,
      status: "ASSIGNED",
      accessCode: "SA-3838-ALICE",
      availableFrom: new Date(Date.now() - 3600000), // Opened 1 hr ago
      availableUntil: new Date(Date.now() + 86400000), // Closes in 24 hrs
      maxAttempts: 1,
      attemptLimit: 1,
    });

    console.log("\n[TEST 1] Starting Examination Attempt from Assignment...");
    const startRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assignments/${assignment._id}/start`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    console.log("Start Attempt Status ->", startRes.status, "Attempt Number:", startRes.body?.data?.attemptNumber, "Status:", startRes.body?.data?.status);
    if (startRes.status !== 201 || !startRes.body?.data?.id) {
      throw new Error("Test 1 Failed: Attempt creation failed!");
    }
    const attemptId = startRes.body.data.id;
    const timeRemaining = startRes.body.data.timeRemainingSeconds;
    console.log("Initial Time Remaining (seconds):", timeRemaining);
    if (timeRemaining <= 0 || timeRemaining > 3600) {
      throw new Error("Test 1.1 Failed: Server timer calculation invalid!");
    }

    // Verify assignment transitioned to IN_PROGRESS
    const updatedAssignment = await AssessmentAssignment.findById(assignment._id);
    console.log("Assignment Status after Start ->", updatedAssignment.status, "Attempt Count:", updatedAssignment.attemptCount);
    if (updatedAssignment.status !== "IN_PROGRESS" || updatedAssignment.attemptCount !== 1) {
      throw new Error("Test 1.2 Failed: Assignment status did not transition to IN_PROGRESS!");
    }

    console.log("\n[TEST 2] Duplicate Active Attempt Protection & Resume Support...");
    const resumeRes = await request(server, {
      method: "POST",
      path: `/api/v1/attempts/start`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      assignmentId: assignment._id.toString(),
      organizationId: orgA._id.toString(),
    });

    console.log("Resume Attempt Status ->", resumeRes.status, "Returned Attempt ID:", resumeRes.body?.data?.id);
    if (resumeRes.body?.data?.id !== attemptId) {
      throw new Error("Test 2 Failed: Did not return active attempt on resume!");
    }

    console.log("\n[TEST 3] Candidate Question Palette & Answer Masking...");
    const questionsRes = await request(server, {
      method: "GET",
      path: `/api/v1/attempts/${attemptId}/questions`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    console.log("Questions Count ->", questionsRes.body?.data?.length);
    if (questionsRes.status !== 200 || questionsRes.body?.data?.length !== 2) {
      throw new Error("Test 3.1 Failed: Could not retrieve attempt questions!");
    }
    const questions = questionsRes.body.data;
    // Check answer masking
    const leakedAnswer = questions.some(q => q.options?.some(o => o.isCorrect !== undefined) || q.correctAnswer !== undefined);
    console.log("Leaked Correct Answers in Palette:", leakedAnswer);
    if (leakedAnswer) {
      throw new Error("Test 3.2 Failed: Correct answers leaked in candidate question palette!");
    }

    console.log("\n[TEST 4] Heartbeat Telemetry & Timer Synchronization...");
    const hbRes = await request(server, {
      method: "POST",
      path: `/api/v1/attempts/${attemptId}/heartbeat`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Heartbeat Status ->", hbRes.status, "Remaining Seconds:", hbRes.body?.data?.timeRemainingSeconds);
    if (hbRes.status !== 200 || hbRes.body?.data?.status !== "IN_PROGRESS") {
      throw new Error("Test 4 Failed: Heartbeat failed!");
    }

    console.log("\n[TEST 5] Answer Autosave, Versioning & Anti-Tamper...");
    const singleChoiceQ = questions.find((q) => q.type === "SINGLE_CHOICE");
    const trueFalseQ = questions.find((q) => q.type === "TRUE_FALSE");

    // Anti-Tampering test: Sending score/points
    const tamperRes = await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${singleChoiceQ.id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: "B",
      points: 100, // Tampering attempt
      score: 100,
    });
    console.log("Tampering Attempt Status ->", tamperRes.status, "Message:", tamperRes.body?.message);
    if (tamperRes.status !== 400) {
      throw new Error("Test 5.1 Failed: Client-supplied points tampering was not blocked!");
    }

    // Valid save 1 on singleChoiceQ
    const save1Res = await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${singleChoiceQ.id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: "B",
    });
    console.log("Save 1 Status ->", save1Res.status, "Version:", save1Res.body?.data?.version, "Answered Count:", save1Res.body?.data?.answeredQuestions);
    if (save1Res.status !== 200 || save1Res.body?.data?.version !== 1) {
      throw new Error("Test 5.2 Failed: Answer save version 1 failed!");
    }

    // Valid save 2 (updating answer to test version increment)
    const save2Res = await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${singleChoiceQ.id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: "B",
    });
    console.log("Save 2 Status ->", save2Res.status, "Version:", save2Res.body?.data?.version);
    if (save2Res.status !== 200 || save2Res.body?.data?.version !== 2) {
      throw new Error("Test 5.3 Failed: Answer version was not incremented on update!");
    }

    // Save second question (True/False)
    const saveQ2Res = await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${trueFalseQ.id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: "T",
    });
    console.log("Save Q2 Status ->", saveQ2Res.status, "Answered Questions:", saveQ2Res.body?.data?.answeredQuestions);
    if (saveQ2Res.status !== 200 || saveQ2Res.body?.data?.answeredQuestions !== 2) {
      throw new Error("Test 5.4 Failed: Total answered questions count mismatch!");
    }

    console.log("\n[TEST 6] Flagging Question for Review...");
    const flagRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/attempts/${attemptId}/questions/${singleChoiceQ.id}/flag`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      flagged: true,
    });
    console.log("Flag Status ->", flagRes.status, "Flagged:", flagRes.body?.data?.flagged);
    if (flagRes.status !== 200 || flagRes.body?.data?.flagged !== true) {
      throw new Error("Test 6 Failed: Question flagging failed!");
    }

    console.log("\n[TEST 7] Final Submission & Objective Scoring...");
    const submitRes = await request(server, {
      method: "POST",
      path: `/api/v1/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Submit Status ->", submitRes.status, "Earned Points:", submitRes.body?.data?.earnedPoints, "Total Points:", submitRes.body?.data?.totalPoints, "Percentage:", submitRes.body?.data?.percentage);
    if (submitRes.status !== 200 || submitRes.body?.data?.status !== "SUBMITTED" || submitRes.body?.data?.earnedPoints !== 10) {
      throw new Error("Test 7.1 Failed: Attempt submission or scoring calculation failed!");
    }

    // Verify assignment marked COMPLETED because maxAttempts = 1 was reached
    const completedAssignment = await AssessmentAssignment.findById(assignment._id);
    console.log("Final Assignment Status ->", completedAssignment.status);
    if (completedAssignment.status !== "COMPLETED") {
      throw new Error("Test 7.2 Failed: Assignment was not marked COMPLETED after all attempts consumed!");
    }

    console.log("\n[TEST 8] Post-Submission Immutability Lock Guard...");
    const tryPostSubmitSave = await request(server, {
      method: "PUT",
      path: `/api/v1/attempts/${attemptId}/questions/${singleChoiceQ.id}/answer`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      answer: "A",
    });
    console.log("Post-Submit Save Status ->", tryPostSubmitSave.status, "Message:", tryPostSubmitSave.body?.message);
    if (tryPostSubmitSave.status !== 400) {
      throw new Error("Test 8 Failed: Answers should be locked against modification after submission!");
    }

    console.log("\n[TEST 9] Max Attempts Quota Enforcement...");
    const trySecondAttemptRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assignments/${assignment._id}/start`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Second Attempt Status ->", trySecondAttemptRes.status, "Message:", trySecondAttemptRes.body?.message);
    if (trySecondAttemptRes.status !== 403) {
      throw new Error("Test 9 Failed: Candidate was able to exceed max attempts quota!");
    }

    console.log("\n[TEST 10] Cross-Tenant Security Isolation...");
    const eveAttemptRes = await request(server, {
      method: "GET",
      path: `/api/v1/attempts/${attemptId}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Alien Access Status ->", eveAttemptRes.status);
    if (eveAttemptRes.status !== 403 && eveAttemptRes.status !== 404) {
      throw new Error("Test 10 Failed: Alien user was not blocked from accessing Alice's attempt!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 38 EXAM ATTEMPT ENGINE V2 TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 38 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep38Tests();
