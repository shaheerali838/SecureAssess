import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import Interview from "../../src/modules/interviews/interview.model.js";
import InterviewParticipant from "../../src/modules/interviews/interviewParticipant.model.js";
import InterviewSession from "../../src/modules/interviews/interviewSession.model.js";
import { SignalingService } from "../../src/modules/interviews/signaling/signaling.service.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { INTERVIEW_STATUSES, PARTICIPANT_ROLES } from "../../src/modules/interviews/interview.constants.js";
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

const runStep43Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 43 Interview & Live Video System Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-43", "org-alien-43"] } });
    await User.deleteMany({ email: { $in: ["interviewer43@vu.edu.pk", "panelist43@vu.edu.pk", "alice43@vu.edu.pk", "bob43@vu.edu.pk", "eve43@alien.com"] } });
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await Interview.deleteMany({});
    await InterviewParticipant.deleteMany({});
    await InterviewSession.deleteMany({});

    // 2. Setup Organization A
    const orgA = await Organization.create({
      name: "Virtual University 43",
      slug: "org-vu-43",
      code: "VU43",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const interviewerUser = await User.create({
      firstName: "Dr.",
      lastName: "Tariq",
      email: "interviewer43@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const interviewerToken = generateAccessToken({ sub: interviewerUser._id.toString() });

    await UserMembership.create({
      userId: interviewerUser._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    const panelistUser = await User.create({
      firstName: "Engr.",
      lastName: "Zahid",
      email: "panelist43@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const panelistToken = generateAccessToken({ sub: panelistUser._id.toString() });

    await UserMembership.create({
      userId: panelistUser._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    // Alice Candidate
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Interviewee",
      email: "alice43@vu.edu.pk",
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
      candidateCode: "VU-CAND-43A",
      firstName: "Alice",
      lastName: "Interviewee",
      email: "alice43@vu.edu.pk",
      status: "ACTIVE",
    });

    // Bob Candidate (Unassigned Candidate)
    const bobUser = await User.create({
      firstName: "Bob",
      lastName: "Intruder",
      email: "bob43@vu.edu.pk",
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
      candidateCode: "VU-CAND-43B",
      firstName: "Bob",
      lastName: "Intruder",
      email: "bob43@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 43",
      slug: "org-alien-43",
      code: "ALIEN43",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Outsider",
      email: "eve43@alien.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const eveToken = generateAccessToken({ sub: eveUser._id.toString() });

    await UserMembership.create({
      userId: eveUser._id,
      organizationId: orgB._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    console.log("\n[TEST 1] Creating & Scheduling Interview (Tenant Scoped)...");
    const schedRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews`,
      headers: { Authorization: `Bearer ${interviewerToken}` },
    }, {
      title: "Senior Backend Engineer Technical Live Interview",
      description: "Live coding and architectural discussion",
      type: "TECHNICAL",
      candidateId: aliceCandidate._id.toString(),
      scheduledStartAt: new Date(Date.now() + 3600000).toISOString(),
      scheduledEndAt: new Date(Date.now() + 7200000).toISOString(),
      interviewerUserIds: [interviewerUser._id.toString()],
      settings: {
        candidateCameraRequired: true,
        candidateMicrophoneRequired: true,
        screenSharingEnabled: true,
        recordingEnabled: true,
      },
    });
    console.log("Schedule Status ->", schedRes.status, "Title:", schedRes.body?.data?.title, "Status:", schedRes.body?.data?.status);
    if (schedRes.status !== 201 || schedRes.body?.data?.status !== "SCHEDULED") {
      throw new Error("Test 1 Failed: Interview creation failed!");
    }
    const interviewId = schedRes.body.data._id;

    console.log("\n[TEST 2] Cross-Tenant Candidate Scheduling Guard...");
    const alienCandRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgB._id}/interviews`,
      headers: { Authorization: `Bearer ${eveToken}` },
    }, {
      title: "Alien Interview",
      candidateId: aliceCandidate._id.toString(), // Alice belongs to Org A
      scheduledStartAt: new Date(Date.now() + 3600000).toISOString(),
      scheduledEndAt: new Date(Date.now() + 7200000).toISOString(),
    });
    console.log("Alien Candidate Scheduling Status ->", alienCandRes.status, "Message:", alienCandRes.body?.message);
    if (alienCandRes.status !== 404 && alienCandRes.status !== 400) {
      throw new Error("Test 2 Failed: Allowed scheduling interview with candidate from different tenant!");
    }

    console.log("\n[TEST 3] Adding Co-Interviewer / Panelist Participant...");
    const addPartRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/participants`,
      headers: { Authorization: `Bearer ${interviewerToken}` },
    }, {
      userId: panelistUser._id.toString(),
      role: "PANELIST",
    });
    console.log("Add Participant Status ->", addPartRes.status, "Role:", addPartRes.body?.data?.role);
    if (addPartRes.status !== 201 && addPartRes.status !== 200) {
      throw new Error("Test 3 Failed: Adding interview participant failed!");
    }

    console.log("\n[TEST 4] Participant Authorization: Authorized Join...");
    // 4.1 Candidate Alice joins room
    const aliceJoinRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/join`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Join Status ->", aliceJoinRes.status, "Session ID:", aliceJoinRes.body?.data?.sessionId, "Role:", aliceJoinRes.body?.data?.participantRole);
    if (aliceJoinRes.status !== 200 || !aliceJoinRes.body?.data?.sessionId || aliceJoinRes.body?.data?.participantRole !== PARTICIPANT_ROLES.CANDIDATE) {
      throw new Error("Test 4.1 Failed: Candidate join failed!");
    }

    // 4.2 Interviewer joins room
    const intJoinRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/join`,
      headers: { Authorization: `Bearer ${interviewerToken}` },
    });
    console.log("Interviewer Join Status ->", intJoinRes.status, "Status:", intJoinRes.body?.data?.status);
    if (intJoinRes.status !== 200 || intJoinRes.body?.data?.status !== "LIVE") {
      throw new Error("Test 4.2 Failed: Interviewer join failed or status was not set to LIVE!");
    }

    console.log("\n[TEST 5] Unauthorized Participant Access Guard...");
    // Bob (not assigned to this interview) tries to join -> blocked
    const bobJoinRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/join`,
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log("Bob Unauthorized Join Status ->", bobJoinRes.status, "Message:", bobJoinRes.body?.message);
    if (bobJoinRes.status !== 403) {
      throw new Error("Test 5 Failed: Unauthorized candidate was able to join interview!");
    }

    console.log("\n[TEST 6] Signaling Service: WebRTC Authorization & Room Verification...");
    // 6.1 Authorized candidate
    const sigAuthAlice = await SignalingService.authorizeConnection(
      interviewId,
      aliceUser._id,
      orgA._id
    );
    console.log("Alice Signaling Auth ->", sigAuthAlice.authorized, "Role:", sigAuthAlice.role);
    if (sigAuthAlice.authorized !== true || sigAuthAlice.role !== PARTICIPANT_ROLES.CANDIDATE) {
      throw new Error("Test 6.1 Failed: Signaling service rejected authorized candidate!");
    }

    // 6.2 Unauthorized candidate Bob
    const sigAuthBob = await SignalingService.authorizeConnection(
      interviewId,
      bobUser._id,
      orgA._id
    );
    console.log("Bob Signaling Auth ->", sigAuthBob.authorized, "Reason:", sigAuthBob.reason);
    if (sigAuthBob.authorized !== false) {
      throw new Error("Test 6.2 Failed: Signaling service authorized unassigned candidate!");
    }

    // 6.3 Cross-tenant user Eve
    const sigAuthEve = await SignalingService.authorizeConnection(
      interviewId,
      eveUser._id,
      orgB._id
    );
    console.log("Eve Signaling Auth ->", sigAuthEve.authorized, "Reason:", sigAuthEve.reason);
    if (sigAuthEve.authorized !== false) {
      throw new Error("Test 6.3 Failed: Signaling service allowed cross-tenant user!");
    }

    console.log("\n[TEST 7] Concluding Interview Lifecycle (End Interview)...");
    const endRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/end`,
      headers: { Authorization: `Bearer ${interviewerToken}` },
    });
    console.log("End Interview Status ->", endRes.status, "Status:", endRes.body?.data?.status);
    if (endRes.status !== 200 || endRes.body?.data?.status !== INTERVIEW_STATUSES.COMPLETED) {
      throw new Error("Test 7.1 Failed: Ending interview failed!");
    }

    // Trying to join completed interview -> blocked
    const postEndJoinRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/join`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Post-End Join Status ->", postEndJoinRes.status);
    if (postEndJoinRes.status !== 400) {
      throw new Error("Test 7.2 Failed: Allowed joining completed interview!");
    }

    console.log("\n[TEST 8] Cross-Tenant Security Isolation...");
    const alienQueryRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}`,
      headers: { Authorization: `Bearer ${eveToken}` }, // Eve belongs to Org B
    });
    console.log("Eve Alien Access Status ->", alienQueryRes.status);
    if (alienQueryRes.status !== 403) {
      throw new Error("Test 8 Failed: Cross-tenant interview query was not blocked!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 43 INTERVIEW & LIVE VIDEO SYSTEM TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 43 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep43Tests();
