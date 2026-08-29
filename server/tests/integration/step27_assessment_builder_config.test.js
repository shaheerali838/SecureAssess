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
import Notification from "../../src/modules/notifications/notification.model.js";
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

const runStep27Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 27 Assessment Builder & Configuration Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-27", "org-alien-27"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner27@test.com", "alice27@vu.edu.pk", "eve27@alien.com"] } });
    await Assessment.deleteMany({});
    await AssessmentSection.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await QuestionBank.deleteMany({});
    await Question.deleteMany({});

    // 2. Setup Org, Hierarchy & Users
    const orgA = await Organization.create({
      name: "Virtual University 27",
      slug: "org-vu-27",
      code: "VU27",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const deptA = await Department.create({
      organizationId: orgA._id,
      name: "Computer Science",
      code: "CS27",
    });

    const progA = await Program.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      name: "BS Software Engineering",
      code: "BSSE27",
    });

    const subjA = await Subject.create({
      organizationId: orgA._id,
      departmentId: deptA._id,
      programId: progA._id,
      name: "Cloud Application Engineering",
      code: "CS-601",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner27@test.com",
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
      email: "alice27@vu.edu.pk",
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
      candidateCode: "VU-CAND-27",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice27@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve (For Isolation)
    const orgB = await Organization.create({
      name: "Alien Org 27",
      slug: "org-alien-27",
      code: "ALIEN27",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve27@alien.com",
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

    // Create Master Question Bank & Questions
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "Cloud Computing Master Bank",
      code: "CC-QB-27",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const masterQ1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      title: "Stateless Microservices",
      prompt: "Which architectural characteristic enables horizontal scalability in cloud microservices?",
      options: [
        { id: "a", text: "Session state affinity", isCorrect: false },
        { id: "b", text: "Stateless request handling", isCorrect: true },
        { id: "c", text: "Single shared memory", isCorrect: false },
      ],
      correctAnswer: { optionIds: ["b"] },
      points: 2,
      status: "ACTIVE",
      version: 1,
    });

    const masterQ2 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      createdBy: vuExaminer._id,
      type: "CODING",
      title: "Rate Limiter Token Bucket",
      prompt: "Implement a token bucket rate limiter algorithm in JavaScript.",
      points: 10,
      status: "ACTIVE",
      version: 1,
      coding: {
        languages: ["javascript"],
        starterCode: { javascript: "function isAllowed(clientId) {\n  // Code\n}" },
        timeLimit: 2000,
        memoryLimit: 256,
      },
    });

    console.log("\n[TEST 1] Create Assessment with Full Configuration (Duration, Security, Scheduling, Grading)...");
    const createAsmRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      title: "Cloud Software Architecture Midterm 2026",
      code: "CS601-MID-2026",
      description: "Midterm examination covering distributed systems, containerization, and cloud algorithms.",
      type: "HYBRID",
      subjectId: subjA._id,
      departmentId: deptA._id,
      programId: progA._id,
      duration: { value: 90, unit: "MINUTES" },
      instructions: "Ensure your camera and microphone are active. Leaving fullscreen triggers integrity flags.",
      scheduling: {
        mode: "WINDOW",
        startAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        endAt: new Date(Date.now() + 86400 * 1000).toISOString(),
        timezone: "UTC",
      },
      securitySettings: {
        proctoringEnabled: true,
        proctoringMode: "AI_ASSISTED",
        fullscreenRequired: true,
        tabSwitchDetection: true,
        copyPasteBlocked: true,
        cameraRequired: true,
        microphoneRequired: true,
      },
      gradingSettings: {
        passingScore: 65,
        gradingMethod: "HYBRID",
        negativeMarking: true,
      },
      attemptSettings: {
        maxAttempts: 1,
        allowResume: true,
        autoSubmitOnTimeout: true,
      },
    });

    console.log("Create Assessment Status ->", createAsmRes.status, "ID:", createAsmRes.body?.data?._id, "Duration Seconds:", createAsmRes.body?.data?.durationSeconds);
    if (createAsmRes.status !== 201 || !createAsmRes.body?.data?._id) {
      throw new Error("Test 1 Failed: Assessment creation failed!");
    }
    const assessmentId = createAsmRes.body.data._id;

    console.log("\n[TEST 2] Create Assessment Sections & Reorder...");
    const sec1Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/sections`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      title: "Section 1: Distributed Systems Core",
      description: "Multiple choice and conceptual knowledge",
      order: 1,
    });
    console.log("Create Section 1 Status ->", sec1Res.status, "Section 1 ID:", sec1Res.body?.data?._id);
    if (sec1Res.status !== 201) throw new Error("Test 2.1 Failed: Section 1 creation failed!");
    const sec1Id = sec1Res.body.data._id;

    const sec2Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/sections`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      title: "Section 2: Cloud Algorithms & Implementation",
      description: "Hands-on coding challenges",
      order: 2,
    });
    console.log("Create Section 2 Status ->", sec2Res.status, "Section 2 ID:", sec2Res.body?.data?._id);
    if (sec2Res.status !== 201) throw new Error("Test 2.2 Failed: Section 2 creation failed!");
    const sec2Id = sec2Res.body.data._id;

    // Reorder Sections
    const reorderSecRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/sections/reorder`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      sections: [
        { id: sec2Id, order: 1 },
        { id: sec1Id, order: 2 },
      ],
    });
    console.log("Reorder Sections Status ->", reorderSecRes.status);
    if (reorderSecRes.status !== 200) throw new Error("Test 2.3 Failed: Reorder sections failed!");

    console.log("\n[TEST 3] Add Questions to Sections & Immutable Snapshot Protection...");
    const addQ1Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      questionId: masterQ1._id,
      sectionId: sec1Id,
      marks: 3,
      negativeMarks: 1,
      isRequired: true,
    });
    console.log("Add Question 1 Status ->", addQ1Res.status, "Snapshot Prompt:", addQ1Res.body?.data?.prompt);
    if (addQ1Res.status !== 201 || !addQ1Res.body?.data?.snapshot) throw new Error("Test 3.1 Failed: Question 1 addition failed!");
    const aq1Id = addQ1Res.body.data._id;

    const addQ2Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/questions`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      questionId: masterQ2._id,
      sectionId: sec2Id,
      marks: 10,
      isRequired: true,
    });
    console.log("Add Question 2 Status ->", addQ2Res.status, "Snapshot Coding:", Boolean(addQ2Res.body?.data?.snapshot?.coding));
    if (addQ2Res.status !== 201) throw new Error("Test 3.2 Failed: Question 2 addition failed!");

    // Mutate Master Question in Bank to test Snapshot Immutability
    await Question.findByIdAndUpdate(masterQ1._id, { prompt: "MODIFIED MASTER QUESTION PROMPT" });
    const snapshotCheck = await AssessmentQuestion.findById(aq1Id);
    console.log("Immutable Snapshot Prompt preserved ->", snapshotCheck.snapshot.prompt);
    if (snapshotCheck.snapshot.prompt === "MODIFIED MASTER QUESTION PROMPT") {
      throw new Error("Test 3.3 Failed: Question snapshot was mutated by master question update!");
    }

    console.log("\n[TEST 4] Preview Assessment (Candidate Structure Representation)...");
    const previewRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/preview`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Preview Status ->", previewRes.status, "Total Points:", previewRes.body?.data?.assessment?.totalPoints, "Questions Count:", previewRes.body?.data?.questions?.length);
    if (previewRes.status !== 200 || previewRes.body?.data?.questions?.length !== 2) {
      throw new Error("Test 4 Failed: Assessment preview failed!");
    }

    console.log("\n[TEST 5] Publish Assessment Workflow...");
    const publishRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/publish`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Publish Status ->", publishRes.status, "New Status:", publishRes.body?.data?.status, "PublishedAt:", Boolean(publishRes.body?.data?.publishedAt));
    if (publishRes.status !== 200 || publishRes.body?.data?.status !== "PUBLISHED") {
      throw new Error("Test 5 Failed: Assessment publish failed!");
    }

    console.log("\n[TEST 6] Duplicate Assessment...");
    const duplicateRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/duplicate`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Duplicate Status ->", duplicateRes.status, "Cloned ID:", duplicateRes.body?.data?._id, "Cloned Code:", duplicateRes.body?.data?.code);
    if (duplicateRes.status !== 201 || !duplicateRes.body?.data?._id || duplicateRes.body?.data?.status !== "DRAFT") {
      throw new Error("Test 6 Failed: Assessment duplication failed!");
    }

    console.log("\n[TEST 7] Candidate Assignment & Notification...");
    const assignRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentId}/assign`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateIds: [aliceCandidate._id],
      attemptsAllowed: 1,
    });
    console.log("Assign Status ->", assignRes.status, "Assigned Count:", assignRes.body?.data?.assignedCount);
    if (assignRes.status !== 200 || assignRes.body?.data?.assignedCount !== 1) {
      throw new Error("Test 7.1 Failed: Candidate assignment failed!");
    }

    const assignedNotif = await Notification.findOne({ recipientId: aliceUser._id, type: "ASSESSMENT_ASSIGNED" });
    console.log("Candidate Notification Dispatched ->", Boolean(assignedNotif));
    if (!assignedNotif) {
      throw new Error("Test 7.2 Failed: Assessment assigned notification was not dispatched!");
    }

    console.log("\n[TEST 8] Cross-Tenant & Unauthorized Access Isolation...");
    // Eve cannot view Org A assessments
    const eveViewRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/assessments`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Access to Org A Assessments -> Status:", eveViewRes.status, "Success:", eveViewRes.body?.success);
    if (eveViewRes.status !== 403) throw new Error("Test 8.1 Failed: Cross-tenant assessment access was not blocked!");

    // Alice Candidate cannot create assessments
    const aliceCreateRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, { title: "Illegal Assessment" });
    console.log("Candidate Create Assessment -> Status:", aliceCreateRes.status, "Success:", aliceCreateRes.body?.success);
    if (aliceCreateRes.status !== 403) throw new Error("Test 8.2 Failed: Candidate was not blocked from creating assessments!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 27 ASSESSMENT BUILDER & CONFIGURATION TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 27 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep27Tests();
