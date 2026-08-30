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
import CandidateGroup from "../../src/modules/candidateGroups/candidateGroup.model.js";
import CandidateGroupMember from "../../src/modules/candidateGroups/candidateGroupMember.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentSection from "../../src/modules/assessmentSections/assessmentSection.model.js";
import AssessmentQuestion from "../../src/modules/assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import AuditLog from "../../src/modules/auditLogs/auditLog.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { ASSESSMENT_STATUSES } from "../../src/constants/assessmentStatuses.js";
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

const runStep37Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 37 Assessment Assignment & Scheduling Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-37", "org-alien-37"] } });
    await User.deleteMany({ email: { $in: ["examiner37@vu.edu.pk", "alice37@vu.edu.pk", "bob37@vu.edu.pk", "eve37@alien.com"] } });
    await Candidate.deleteMany({});
    await CandidateGroup.deleteMany({});
    await CandidateGroupMember.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentSection.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await AssessmentAssignment.deleteMany({});

    // 2. Setup Organizations & Users
    const orgA = await Organization.create({
      name: "Virtual University 37",
      slug: "org-vu-37",
      code: "VU37",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const examinerUser = await User.create({
      firstName: "Dr.",
      lastName: "Kashif",
      email: "examiner37@vu.edu.pk",
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
      lastName: "Smith",
      email: "alice37@vu.edu.pk",
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
      candidateCode: "VU-CAND-37A",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice37@vu.edu.pk",
      status: "ACTIVE",
    });

    // Bob Candidate
    const bobUser = await User.create({
      firstName: "Bob",
      lastName: "Jones",
      email: "bob37@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const bobToken = generateAccessToken({ sub: bobUser._id.toString() });

    await UserMembership.create({
      userId: bobUser._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    const bobCandidate = await Candidate.create({
      organizationId: orgA._id,
      userId: bobUser._id,
      candidateCode: "VU-CAND-37B",
      firstName: "Bob",
      lastName: "Jones",
      email: "bob37@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 37",
      slug: "org-alien-37",
      code: "ALIEN37",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve37@alien.com",
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
      candidateCode: "ALIEN-CAND-37",
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve37@alien.com",
      status: "ACTIVE",
    });

    // Create Published Assessment in Org A
    const publishedAsm = await Assessment.create({
      organizationId: orgA._id,
      title: "Algorithms Final Exam 2026",
      code: "CS501-FINAL-2026",
      status: ASSESSMENT_STATUSES.PUBLISHED,
      publishedAt: new Date(),
      duration: { value: 120, unit: "MINUTES" },
      durationSeconds: 7200,
      totalPoints: 100,
      passingScore: 50,
      createdBy: examinerUser._id,
    });

    // Create Draft Assessment in Org A
    const draftAsm = await Assessment.create({
      organizationId: orgA._id,
      title: "Unpublished Draft Exam",
      code: "CS501-DRAFT-2026",
      status: ASSESSMENT_STATUSES.DRAFT,
      duration: { value: 60, unit: "MINUTES" },
      durationSeconds: 3600,
      totalPoints: 50,
      createdBy: examinerUser._id,
    });

    console.log("\n[TEST 1] Assigning Published Assessment to Candidate...");
    const assignRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${publishedAsm._id}/assignments`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      candidateIds: [aliceCandidate._id.toString()],
      availableFrom: new Date(Date.now() - 3600000).toISOString(), // Opened 1 hr ago
      availableUntil: new Date(Date.now() + 86400000).toISOString(), // Closes in 24 hrs
      maxAttempts: 1,
    });

    console.log("Assignment Status ->", assignRes.status, "Assigned Count:", assignRes.body?.data?.assignedCount);
    if (assignRes.status !== 201 || assignRes.body?.data?.assignedCount !== 1) {
      throw new Error("Test 1 Failed: Assessment assignment failed!");
    }
    const aliceAssignmentId = assignRes.body.data.assignments[0]._id;

    console.log("\n[TEST 2] Enforcing Published Status Rule...");
    const draftAssignRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${draftAsm._id}/assignments`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      candidateIds: [aliceCandidate._id.toString()],
    });

    console.log("Draft Assignment Status ->", draftAssignRes.status, "Message:", draftAssignRes.body?.message);
    if (draftAssignRes.status !== 400) {
      throw new Error("Test 2 Failed: Draft assessment should not be assignable!");
    }

    console.log("\n[TEST 3] Duplicate Active Assignment Protection...");
    const dupAssignRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${publishedAsm._id}/assignments`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      candidateIds: [aliceCandidate._id.toString()],
    });

    console.log("Duplicate Assignment Status ->", dupAssignRes.status, "Message:", dupAssignRes.body?.message);
    if (dupAssignRes.status !== 409) {
      throw new Error("Test 3 Failed: Duplicate active assignment should be blocked with 409!");
    }

    console.log("\n[TEST 4] Cross-Tenant Candidate Assignment Rejection...");
    const crossTenantRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${publishedAsm._id}/assignments`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      candidateIds: [eveCandidate._id.toString()], // Alien Org B Candidate
    });

    console.log("Cross-Tenant Assign Status ->", crossTenantRes.status, "Message:", crossTenantRes.body?.message);
    if (crossTenantRes.status !== 400) {
      throw new Error("Test 4 Failed: Cross-tenant candidate assignment should be rejected!");
    }

    console.log("\n[TEST 5] Candidate Group Bulk Assignment...");
    const group = await CandidateGroup.create({
      organizationId: orgA._id,
      name: "Batch 2026 CS Group",
      code: "GRP-CS-2026",
    });

    await CandidateGroupMember.create({
      organizationId: orgA._id,
      groupId: group._id,
      candidateId: bobCandidate._id,
    });

    const groupAssignRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/assessments/${publishedAsm._id}/assignments/group`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      groupId: group._id.toString(),
    });

    console.log("Group Assignment Status ->", groupAssignRes.status, "Group Assigned Count:", groupAssignRes.body?.data?.assignedCount);
    if (groupAssignRes.status !== 201 || groupAssignRes.body?.data?.assignedCount !== 1) {
      throw new Error("Test 5 Failed: Candidate group bulk assignment failed!");
    }

    console.log("\n[TEST 6] Candidate Portal Self-Service & Availability Boundary...");
    // 6.1 Alice views her assignments
    const alicePortalRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assignments`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Assignments Status ->", alicePortalRes.status, "Count:", alicePortalRes.body?.data?.length);
    if (alicePortalRes.status !== 200 || alicePortalRes.body?.data?.length !== 1) {
      throw new Error("Test 6.1 Failed: Candidate self assignment query failed!");
    }

    // 6.2 Alice retrieves authorized assessment context
    const aliceExamRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assessments/${publishedAsm._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Authorized Assessment Status ->", aliceExamRes.status, "Access Code:", aliceExamRes.body?.data?.accessCode);
    if (aliceExamRes.status !== 200 || !aliceExamRes.body?.data?.accessCode) {
      throw new Error("Test 6.2 Failed: Candidate authorized assessment retrieval failed!");
    }

    console.log("\n[TEST 7] Cancellation & Rescheduling Operations...");
    // Reschedule
    const reschedRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/assessment-assignments/${aliceAssignmentId}/reschedule`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      availableUntil: new Date(Date.now() + 172800000).toISOString(),
    });
    console.log("Reschedule Status ->", reschedRes.status);
    if (reschedRes.status !== 200) throw new Error("Test 7.1 Failed: Reschedule failed!");

    // Cancel
    const cancelRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/assessment-assignments/${aliceAssignmentId}/cancel`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      reason: "Medical leave granted",
    });
    console.log("Cancel Status ->", cancelRes.status, "Status:", cancelRes.body?.data?.status);
    if (cancelRes.status !== 200 || cancelRes.body?.data?.status !== "CANCELLED") {
      throw new Error("Test 7.2 Failed: Assignment cancellation failed!");
    }

    // Alice attempting to start cancelled assessment
    const tryCancelledRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate-portal/assessments/${publishedAsm._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Cancelled Access Status ->", tryCancelledRes.status, "Message:", tryCancelledRes.body?.message);
    if (tryCancelledRes.status !== 403) {
      throw new Error("Test 7.3 Failed: Cancelled assignment should be rejected with 403!");
    }

    console.log("\n[TEST 8] Cross-Tenant Security Isolation...");
    const eveAttemptRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/assessment-assignments/${aliceAssignmentId}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Alien Access Status ->", eveAttemptRes.status);
    if (eveAttemptRes.status !== 403) {
      throw new Error("Test 8 Failed: Cross-tenant assignment access was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 37 ASSESSMENT ASSIGNMENT & SCHEDULING TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 37 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep37Tests();
