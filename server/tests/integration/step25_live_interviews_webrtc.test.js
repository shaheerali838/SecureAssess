import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Interview from "../../src/modules/interviews/interview.model.js";
import InterviewParticipant from "../../src/modules/interviews/interviewParticipant.model.js";
import InterviewSession from "../../src/modules/interviews/interviewSession.model.js";
import InterviewEvent from "../../src/modules/interviews/interviewEvent.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import { attachInterviewSignaling } from "../../src/modules/interviews/index.js";
import { SIGNALING_EVENTS } from "../../src/modules/interviews/signaling/signaling.events.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO } from "socket.io-client";
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

const runStep25Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 25 Live Video Interviews & WebRTC Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  // Create HTTP Server & Socket.IO server with /interviews namespace attached
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: "*" } });
  attachInterviewSignaling(io);

  await new Promise((res) => server.listen(0, res));
  const serverPort = server.address().port;
  console.log("Test HTTP & Socket.IO Server running on port:", serverPort);

  try {
    // 1. Roles & Clean State
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-25", "org-alien-25"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner25@test.com", "alice25@vu.edu.pk", "eve25@alien.com", "panelist25@vu.edu.pk"] } });
    await Interview.deleteMany({});
    await InterviewParticipant.deleteMany({});
    await InterviewSession.deleteMany({});
    await InterviewEvent.deleteMany({});

    // 2. Setup Org & Users
    const orgA = await Organization.create({
      name: "Virtual University 25",
      slug: "org-vu-25",
      code: "VU25",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner25@test.com",
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
      email: "alice25@vu.edu.pk",
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
      candidateCode: "VU-CAND-25",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice25@vu.edu.pk",
      status: "ACTIVE",
    });

    // Panelist User
    const panelistUser = await User.create({
      firstName: "Panelist",
      lastName: "Expert",
      email: "panelist25@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    // Alien Org B & Eve (For Isolation)
    const orgB = await Organization.create({
      name: "Alien Org 25",
      slug: "org-alien-25",
      code: "ALIEN25",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve25@alien.com",
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

    console.log("\n[TEST 1] Schedule Live Technical Video Interview...");
    const scheduleRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      title: "Senior Cloud Architect Technical Panel Interview",
      description: "Live system design and hands-on coding interview",
      type: "TECHNICAL",
      scheduledStartAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scheduledEndAt: new Date(Date.now() + 7200 * 1000).toISOString(),
      candidateId: aliceCandidate._id,
      settings: {
        maxParticipants: 4,
        screenSharingEnabled: true,
        recordingEnabled: true,
        chatEnabled: true,
      },
    });

    console.log("Schedule Status ->", scheduleRes.status, "Interview ID:", scheduleRes.body?.data?._id, "Status:", scheduleRes.body?.data?.status);
    if (scheduleRes.status !== 201 || !scheduleRes.body?.data?._id) {
      throw new Error("Test 1 Failed: Interview could not be scheduled!");
    }
    const interviewId = scheduleRes.body.data._id;

    // Check participants and notification
    const participants = await InterviewParticipant.find({ interviewId });
    const scheduledNotif = await Notification.findOne({ recipientId: aliceUser._id, type: "INTERVIEW_SCHEDULED" });
    console.log("Registered Participants Count:", participants.length, "Notification Created:", Boolean(scheduledNotif));
    if (participants.length < 2 || !scheduledNotif) {
      throw new Error("Test 1.1 Failed: Initial participants or candidate notification missing!");
    }

    console.log("\n[TEST 2] Manage Participants (Add & Remove Panelist)...");
    const addPartRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/participants`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      userId: panelistUser._id,
      role: "PANELIST",
    });
    console.log("Add Panelist Status ->", addPartRes.status, "Role:", addPartRes.body?.data?.role);
    if (addPartRes.status !== 201 || addPartRes.body?.data?.role !== "PANELIST") {
      throw new Error("Test 2.1 Failed: Could not add panelist to interview!");
    }

    const removePartRes = await request(server, {
      method: "DELETE",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/participants/${panelistUser._id}`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Remove Panelist Status ->", removePartRes.status);
    if (removePartRes.status !== 200) {
      throw new Error("Test 2.2 Failed: Could not remove panelist!");
    }

    console.log("\n[TEST 3] Candidate Self-Service: View Scheduled Interviews...");
    const myInterviewsRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidate/interviews`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Interviews Status ->", myInterviewsRes.status, "Count:", myInterviewsRes.body?.data?.items?.length);
    if (myInterviewsRes.status !== 200 || myInterviewsRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 3 Failed: Candidate could not retrieve scheduled interviews!");
    }

    console.log("\n[TEST 4] Candidate & Examiner Join Interview (Session Authorization)...");
    const candidateJoinRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/join`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Join Status ->", candidateJoinRes.status, "Session ID:", candidateJoinRes.body?.data?.sessionId, "Role:", candidateJoinRes.body?.data?.participantRole, "STUN URLs:", candidateJoinRes.body?.data?.iceServers?.length);
    if (candidateJoinRes.status !== 200 || !candidateJoinRes.body?.data?.sessionId || candidateJoinRes.body?.data?.participantRole !== "CANDIDATE") {
      throw new Error("Test 4.1 Failed: Candidate join authorization failed!");
    }

    const examinerJoinRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/join`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Examiner Join Status ->", examinerJoinRes.status, "Session ID:", examinerJoinRes.body?.data?.sessionId, "Status:", examinerJoinRes.body?.data?.status);
    if (examinerJoinRes.status !== 200 || examinerJoinRes.body?.data?.status !== "LIVE") {
      throw new Error("Test 4.2 Failed: Examiner join failed to advance interview status to LIVE!");
    }

    console.log("\n[TEST 5] WebRTC P2P Signaling via Socket.IO (/interviews namespace)...");
    const socketUrl = `http://127.0.0.1:${serverPort}/interviews`;

    // Connect Examiner Socket
    const examinerSocket = ClientIO(socketUrl, {
      auth: { token: vuExaminerToken },
      transports: ["websocket"],
    });

    // Connect Candidate Socket
    const candidateSocket = ClientIO(socketUrl, {
      auth: { token: aliceToken },
      transports: ["websocket"],
    });

    await new Promise((resolve) => {
      let readyCount = 0;
      const checkReady = () => {
        readyCount++;
        if (readyCount === 2) resolve();
      };
      examinerSocket.on("connect", checkReady);
      candidateSocket.on("connect", checkReady);
    });
    console.log("Examiner & Candidate WebRTC Sockets Connected Successfully");

    // 5.1 Join Room
    const joinPromise = new Promise((resolve) => {
      examinerSocket.on(SIGNALING_EVENTS.PARTICIPANT_JOINED, (data) => {
        console.log("Examiner received participant:joined event ->", data.name, `(${data.role})`);
        resolve(data);
      });
    });

    examinerSocket.emit(SIGNALING_EVENTS.INTERVIEW_JOIN, {
      interviewId,
      organizationId: orgA._id.toString(),
    });

    candidateSocket.emit(SIGNALING_EVENTS.INTERVIEW_JOIN, {
      interviewId,
      organizationId: orgA._id.toString(),
    });

    await joinPromise;

    // 5.2 WebRTC Offer & Answer Relay
    const offerPromise = new Promise((resolve) => {
      examinerSocket.on(SIGNALING_EVENTS.WEBRTC_OFFER, (data) => {
        console.log("Examiner received webrtc:offer from candidate socket:", data.senderSocketId);
        resolve(data);
      });
    });

    candidateSocket.emit(SIGNALING_EVENTS.WEBRTC_OFFER, {
      targetSocketId: examinerSocket.id,
      sdp: "v=0\r\no=- 461173 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF",
    });

    const receivedOffer = await offerPromise;

    const answerPromise = new Promise((resolve) => {
      candidateSocket.on(SIGNALING_EVENTS.WEBRTC_ANSWER, (data) => {
        console.log("Candidate received webrtc:answer from examiner socket:", data.senderSocketId);
        resolve(data);
      });
    });

    examinerSocket.emit(SIGNALING_EVENTS.WEBRTC_ANSWER, {
      targetSocketId: receivedOffer.senderSocketId,
      sdp: "v=0\r\no=- 461174 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF",
    });

    await answerPromise;

    // 5.3 Screen Sharing & Chat Broadcast
    const screenSharePromise = new Promise((resolve) => {
      examinerSocket.on(SIGNALING_EVENTS.SCREEN_SHARE_STARTED, (data) => {
        console.log("Examiner received media:screen-share-started from user:", data.userId);
        resolve(data);
      });
    });

    candidateSocket.emit(SIGNALING_EVENTS.SCREEN_SHARE_STARTED);
    await screenSharePromise;

    const chatPromise = new Promise((resolve) => {
      examinerSocket.on(SIGNALING_EVENTS.CHAT_MESSAGE, (data) => {
        console.log("Examiner received in-interview chat ->", data.senderName, ":", data.message);
        resolve(data);
      });
    });

    candidateSocket.emit(SIGNALING_EVENTS.CHAT_MESSAGE, {
      message: "Hello Examiner, I have started sharing my architectural diagrams.",
    });

    await chatPromise;

    examinerSocket.disconnect();
    candidateSocket.disconnect();

    console.log("\n[TEST 6] Conclude Interview Session (POST /end)...");
    const endRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/end`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("End Interview Status ->", endRes.status, "Status:", endRes.body?.data?.status);
    if (endRes.status !== 200 || endRes.body?.data?.status !== "COMPLETED") {
      throw new Error("Test 6 Failed: Could not conclude interview!");
    }

    const sessionDoc = await InterviewSession.findOne({ interviewId });
    console.log("Interview Session Closed -> Status:", sessionDoc.status, "EndedAt:", Boolean(sessionDoc.endedAt));
    if (sessionDoc.status !== "ENDED") {
      throw new Error("Test 6.1 Failed: Active session was not closed!");
    }

    console.log("\n[TEST 7] Cross-Tenant & Unauthorized Access Isolation...");
    // Eve cannot join Alice's interview
    const eveJoinRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/join`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Access to Org A Interview -> Status:", eveJoinRes.status, "Success:", eveJoinRes.body?.success);
    if (eveJoinRes.status !== 403 && eveJoinRes.status !== 404) {
      throw new Error("Test 7.1 Failed: Cross-tenant join was not blocked!");
    }

    // Alice Candidate cannot create arbitrary interviews
    const aliceCreateRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/interviews`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      title: "Unauthorized Interview",
      scheduledStartAt: new Date().toISOString(),
      scheduledEndAt: new Date().toISOString(),
      candidateId: aliceCandidate._id,
    });
    console.log("Candidate Create Interview -> Status:", aliceCreateRes.status, "Success:", aliceCreateRes.body?.success);
    if (aliceCreateRes.status !== 403) {
      throw new Error("Test 7.2 Failed: Candidate was not blocked from creating interviews!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 25 LIVE VIDEO INTERVIEWS & WEBRTC TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 25 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep25Tests();
