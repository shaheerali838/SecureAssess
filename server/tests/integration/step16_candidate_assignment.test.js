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
import CandidateGroup from "../../src/modules/candidateGroups/candidateGroup.model.js";
import CandidateGroupMember from "../../src/modules/candidateGroups/candidateGroupMember.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
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

const runStep16Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 16 Candidate Assignment Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Setup Roles & Clean Collections
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-16", "org-saylani-16"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner16@test.com", "saylani.examiner16@test.com", "alice16@vu.edu.pk", "bob16@vu.edu.pk", "charlie16@saylani.edu.pk"] } });

    // 2. Setup Org A
    const orgA = await Organization.create({
      name: "Virtual University 16",
      slug: "org-vu-16",
      code: "VU16",
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
      name: "Algorithms",
      code: "ALGO-16",
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner16@test.com",
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

    // 3. Setup Org B
    const orgB = await Organization.create({
      name: "Saylani 16",
      slug: "org-saylani-16",
      code: "SA16",
      type: "TRAINING_INSTITUTE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const saylaniExaminer = await User.create({
      firstName: "Saylani",
      lastName: "Examiner",
      email: "saylani.examiner16@test.com",
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

    // Candidate in Org B
    const saylaniCandidate = await User.create({
      firstName: "Charlie",
      lastName: "Candidate",
      email: "charlie16@saylani.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const saylaniCandidateToken = generateAccessToken({ sub: saylaniCandidate._id.toString() });

    await UserMembership.create({
      userId: saylaniCandidate._id,
      organizationId: orgB._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    const candB = await Candidate.create({
      organizationId: orgB._id,
      userId: saylaniCandidate._id,
      candidateCode: "SA-CAND-01",
      firstName: "Charlie",
      lastName: "Candidate",
      email: "charlie16@saylani.edu.pk",
      status: "ACTIVE",
    });

    // 4. Create and Publish Assessment in Org A
    const qb = await QuestionBank.create({
      organizationId: orgA._id,
      name: "Algo Question Bank",
      code: "ALGO-QB",
      subjectId: subjA._id,
      ownerId: vuExaminer._id,
    });

    const q1 = await Question.create({
      organizationId: orgA._id,
      questionBankId: qb._id,
      subjectId: subjA._id,
      createdBy: vuExaminer._id,
      type: "SINGLE_CHOICE",
      prompt: "What is the average time complexity of QuickSort?",
      options: [
        { id: "A", text: "O(n)" },
        { id: "B", text: "O(n log n)" },
        { id: "C", text: "O(n^2)" },
      ],
      correctAnswer: ["B"],
      points: 5,
      status: "ACTIVE",
    });

    const assessmentA = await Assessment.create({
      organizationId: orgA._id,
      title: "Algorithms Final Exam 2026",
      code: "ALGO-FIN-16",
      type: "MCQ",
      subjectId: subjA._id,
      durationSeconds: 3600,
      passingScore: 60,
      createdBy: vuExaminer._id,
      status: "DRAFT",
    });

    const sectionA = await AssessmentSection.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      title: "Section 1: Sorting",
      order: 1,
    });

    await AssessmentQuestion.create({
      organizationId: orgA._id,
      assessmentId: assessmentA._id,
      sectionId: sectionA._id,
      questionId: q1._id,
      type: q1.type,
      prompt: q1.prompt,
      options: q1.options,
      correctAnswer: q1.correctAnswer,
      points: 5,
    });

    // Publish the assessment
    assessmentA.status = "PUBLISHED";
    assessmentA.publishedAt = new Date();
    assessmentA.publishedBy = vuExaminer._id;
    await assessmentA.save();

    console.log("\n[TEST 1] Create Candidates in Org A...");
    const createCand1Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidates`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateCode: "VU-CAND-01",
      firstName: "Alice",
      lastName: "Wonderland",
      email: "alice16@vu.edu.pk",
      departmentId: deptA._id.toString(),
      programId: progA._id.toString(),
    });
    console.log("Create Candidate 1 Status ->", createCand1Res.status, "(Expected: 201)");
    if (createCand1Res.status !== 201) throw new Error("Test 1.1 Failed");
    const cand1Id = createCand1Res.body.data._id;
    const cand1UserId = createCand1Res.body.data.userId;
    const aliceToken = generateAccessToken({ sub: cand1UserId.toString() });

    const createCand2Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidates`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateCode: "VU-CAND-02",
      firstName: "Bob",
      lastName: "Builder",
      email: "bob16@vu.edu.pk",
    });
    console.log("Create Candidate 2 Status ->", createCand2Res.status, "(Expected: 201)");
    const cand2Id = createCand2Res.body.data._id;

    // Duplicate code in Org A -> rejected (409)
    const dupCodeRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidates`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateCode: "VU-CAND-01",
      firstName: "Duplicate",
      lastName: "Candidate",
      email: "dup@vu.edu.pk",
    });
    console.log("Duplicate Candidate Code Status ->", dupCodeRes.status, "(Expected: 409)");
    if (dupCodeRes.status !== 409) throw new Error("Test 1.2 Failed: Duplicate code was allowed!");

    console.log("\n[TEST 2] Create Candidate Group and Add Members...");
    const createGroupRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate-groups`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      name: "BSCS Batch 2026",
      code: "BSCS-2026",
      description: "Batch 2026 candidates",
    });
    console.log("Create Candidate Group Status ->", createGroupRes.status, "(Expected: 201)");
    const groupId = createGroupRes.body.data._id;

    const addMemberRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate-groups/${groupId}/members`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateId: cand1Id,
    });
    console.log("Add Member Alice to Group ->", addMemberRes.status, "(Expected: 201)");

    const addMember2Res = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidate-groups/${groupId}/members`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateId: cand2Id,
    });
    console.log("Add Member Bob to Group ->", addMember2Res.status, "(Expected: 201)");

    console.log("\n[TEST 3] Individual Assessment Assignment & Duplicate Protection...");
    const assignAliceRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentA._id}/assignments`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateIds: [cand1Id],
      attemptLimit: 1,
    });
    console.log("Assign Assessment to Alice ->", assignAliceRes.status, "Assigned Count:", assignAliceRes.body?.data?.assignedCount);
    if (assignAliceRes.status !== 201 || assignAliceRes.body?.data?.assignedCount !== 1) throw new Error("Test 3.1 Failed");
    const aliceAssignmentId = assignAliceRes.body.data.assignments[0]._id;

    // Assign again to Alice -> duplicate active assignment prevented (assignedCount: 0)
    const dupAssignAliceRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentA._id}/assignments`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateIds: [cand1Id],
    });
    console.log("Duplicate Assign Alice -> Assigned Count:", dupAssignAliceRes.body?.data?.assignedCount, "(Expected: 0)");
    if (dupAssignAliceRes.body?.data?.assignedCount !== 0) throw new Error("Test 3.2 Failed: Duplicate assignment created!");

    console.log("\n[TEST 4] Group Assessment Assignment...");
    // Group contains Alice & Bob. Alice already assigned, Bob is new -> assignedCount should be 1 (for Bob)
    const groupAssignRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentA._id}/assignments/group`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      groupId: groupId,
    });
    console.log("Assign to Group -> Assigned Count:", groupAssignRes.body?.data?.assignedCount, "(Expected: 1 for Bob)");
    if (groupAssignRes.status !== 201 || groupAssignRes.body?.data?.assignedCount !== 1) throw new Error("Test 4 Failed");

    console.log("\n[TEST 5] Candidate Portal & Authorization Boundary...");
    // Alice requests her portal assignments
    const alicePortalAssignmentsRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assignments`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Candidate Portal Assignments ->", alicePortalAssignmentsRes.status, "Total Assignments:", alicePortalAssignmentsRes.body?.data?.length);
    if (alicePortalAssignmentsRes.status !== 200 || alicePortalAssignmentsRes.body?.data?.length < 1) throw new Error("Test 5.1 Failed");

    // Alice accesses authorized assessment details
    const aliceExamDetailsRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assessments/${assessmentA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Authorized Assessment Access ->", aliceExamDetailsRes.status, "Title:", aliceExamDetailsRes.body?.data?.assessment?.title);
    if (aliceExamDetailsRes.status !== 200 || !aliceExamDetailsRes.body?.data?.accessCode) throw new Error("Test 5.2 Failed");

    console.log("\n[TEST 6] Unassigned Candidate Access Rejection (403 Forbidden)...");
    // Saylani Candidate (Charlie) attempts to access Org A assessment
    const unauthAccessRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assessments/${assessmentA._id}`,
      headers: { Authorization: `Bearer ${saylaniCandidateToken}` },
    });
    console.log("Unauthorized Candidate Access ->", unauthAccessRes.status, "(Expected: 403)");
    if (unauthAccessRes.status !== 403) throw new Error("Test 6 Failed: Unauthorized candidate access was allowed!");

    console.log("\n[TEST 7] Assignment Revocation & Access Loss...");
    // Examiner revokes Alice's assignment
    const revokeRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/assessment-assignments/${aliceAssignmentId}/revoke`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Revoke Alice's Assignment ->", revokeRes.status, "Status:", revokeRes.body?.data?.status);
    if (revokeRes.status !== 200 || revokeRes.body?.data?.status !== "REVOKED") throw new Error("Test 7.1 Failed");

    // Alice tries to access exam after revocation -> 403 Forbidden
    const alicePostRevokeRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assessments/${assessmentA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Access Post-Revocation ->", alicePostRevokeRes.status, "(Expected: 403)");
    if (alicePostRevokeRes.status !== 403) throw new Error("Test 7.2 Failed: Revoked candidate was able to access exam!");

    console.log("\n[TEST 8] Cross-Tenant Candidate Assignment Prevention (400 Bad Request)...");
    // Org A examiner attempts to assign Candidate Charlie from Org B
    const crossAssignRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${assessmentA._id}/assignments`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      candidateIds: [candB._id.toString()], // Org B's candidate!
    });
    console.log("Org A Assigning Org B Candidate ->", crossAssignRes.status, "(Expected: 400)");
    if (crossAssignRes.status !== 400) throw new Error("Test 8 Failed: Cross-tenant candidate assignment was allowed!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 16 ASSESSMENT ASSIGNMENT & CANDIDATE MANAGEMENT TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 16 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep16Tests();
