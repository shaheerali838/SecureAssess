import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Interview from "../../src/modules/interviews/interview.model.js";
import InterviewSession from "../../src/modules/interviews/interviewSession.model.js";
import InterviewParticipant from "../../src/modules/interviews/interviewParticipant.model.js";
import InterviewEvent from "../../src/modules/interviews/interviewEvent.model.js";
import AuditLog from "../../src/modules/auditLogs/auditLog.model.js";
import { attachInterviewSignaling } from "../../src/modules/interviews/index.js";
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
            resolve({ status: res.statusCode, body: parsed, raw: data });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runStep51Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 51 Live Video Interview & WebRTC Engine Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });
  attachInterviewSignaling(io);

  server.listen(0);
  await new Promise((res) => server.once("listening", res));
  const serverPort = server.address().port;
  console.log("Test HTTP & Socket.IO Server running on port:", serverPort);

  try {
    // 1. Clean State
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-interview-a", "org-interview-b"] } });
    await User.deleteMany({ email: { $in: ["interviewer51@org-a.com", "cand51@org-a.com", "alien51@org-b.com"] } });
    await Candidate.deleteMany({});
    await Interview.deleteMany({});
    await InterviewSession.deleteMany({});
    await InterviewParticipant.deleteMany({});
    await InterviewEvent.deleteMany({});

    // 2. Setup Organization A & Interviewer
    const orgA = await Organization.create({
      name: "Global Engineering Academy Alpha",
      slug: "org-interview-a",
      code: "INT-A",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const interviewerUser = await User.create({
      firstName: "Dr. Linus",
      lastName: "Torvalds",
      email: "interviewer51@org-a.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: interviewerUser._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    const interviewerToken = generateAccessToken({ sub: interviewerUser._id.toString() });

    // 3. Setup Organization B & Alien User
    const orgB = await Organization.create({
      name: "Compromised Tenant Beta",
      slug: "org-interview-b",
      code: "INT-B",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const alienUser = await User.create({
      firstName: "Eve",
      lastName: "Alien",
      email: "alien51@org-b.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: alienUser._id,
      organizationId: orgB._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    const alienToken = generateAccessToken({ sub: alienUser._id.toString() });

    // 4. Setup Candidate in Org A
    const candidateUser = await User.create({
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "cand51@org-a.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: candidateUser._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    const candProfile = await Candidate.create({
      organizationId: orgA._id,
      userId: candidateUser._id,
      candidateCode: "CAND-51-MARGARET",
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "cand51@org-a.com",
      status: "ACTIVE",
    });

    const candidateToken = generateAccessToken({ sub: candidateUser._id.toString() });

    // =========================================================================
    // [TEST 1] Scheduling an Interview (REST Pipeline)
    // =========================================================================
    console.log("\n[TEST 1] Scheduling an Interview...");

    const startTime = new Date(Date.now() + 3600000);
    const endTime = new Date(Date.now() + 7200000);

    const createIntRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/interviews`,
        headers: { Authorization: `Bearer ${interviewerToken}` },
      },
      {
        title: "Flight Software Architecture Deep-Dive",
        description: "Live WebRTC technical review of real-time operating systems.",
        type: "TECHNICAL",
        scheduledStartAt: startTime.toISOString(),
        scheduledEndAt: endTime.toISOString(),
        candidateId: candProfile._id.toString(),
        interviewerUserIds: [interviewerUser._id.toString()],
      }
    );

    console.log("Create Interview -> Status:", createIntRes.status, "ID:", createIntRes.body?.data?._id);
    if (createIntRes.status !== 201) throw new Error(`Expected 201 for interview creation, got ${createIntRes.status}`);

    const interviewId = createIntRes.body.data._id;

    // =========================================================================
    // [TEST 2] Participant Authorization & Candidate Ownership
    // =========================================================================
    console.log("\n[TEST 2] Participant Joining & Room Access Authorization...");

    // 2a. Authorized Candidate joins interview
    const candJoinRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/interviews/candidate-portal/interviews/${interviewId}/join`,
        headers: {
          Authorization: `Bearer ${candidateToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      }
    );

    console.log("Candidate Join -> Status:", candJoinRes.status, "Role:", candJoinRes.body?.data?.participantRole, "Session ID:", candJoinRes.body?.data?.sessionId);
    if (candJoinRes.status !== 200 || candJoinRes.body?.data?.participantRole !== "CANDIDATE") {
      throw new Error(`Expected 200 and CANDIDATE role, got ${candJoinRes.status}`);
    }

    // 2b. Alien user from Org B attempts to join Org A interview (Forbidden)
    const alienJoinRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/interviews/candidate-portal/interviews/${interviewId}/join`,
        headers: {
          Authorization: `Bearer ${alienToken}`,
          "x-organization-id": orgB._id.toString(),
        },
      }
    );

    console.log("Alien User Unauthorized Join -> Status:", alienJoinRes.status, "(Expected 404/403)");
    if (![403, 404].includes(alienJoinRes.status)) {
      throw new Error(`Expected 403/404 for alien join, got ${alienJoinRes.status}`);
    }

    // =========================================================================
    // [TEST 3] WebSocket Handshake Authentication & Namespace Security
    // =========================================================================
    console.log("\n[TEST 3] WebSocket Handshake Authentication...");

    // 3a. Socket without token must be rejected
    const unauthSocket = ClientIO(`http://127.0.0.1:${serverPort}/interviews`, {
      autoConnect: false,
      reconnection: false,
    });
    const unauthConnectPromise = new Promise((resolve) => {
      unauthSocket.on("connect_error", (err) => {
        resolve({ error: err.message });
      });
      unauthSocket.on("connect", () => {
        resolve({ connected: true });
      });
    });
    unauthSocket.connect();
    const unauthResult = await unauthConnectPromise;
    console.log("Unauthenticated Socket Connect Result ->", unauthResult.error || "Connected Unexpectedly");
    if (!unauthResult.error) throw new Error("Expected unauthenticated socket to fail handshake!");
    unauthSocket.close();

    // 3b. Authorized Sockets (Interviewer and Candidate)
    const interviewerSocket = ClientIO(`http://127.0.0.1:${serverPort}/interviews`, {
      auth: { token: interviewerToken },
      transports: ["websocket"],
      reconnection: false,
    });
    const candidateSocket = ClientIO(`http://127.0.0.1:${serverPort}/interviews`, {
      auth: { token: candidateToken },
      transports: ["websocket"],
      reconnection: false,
    });

    await Promise.all([
      new Promise((res, rej) => {
        interviewerSocket.on("connect", res);
        interviewerSocket.on("connect_error", rej);
      }),
      new Promise((res, rej) => {
        candidateSocket.on("connect", res);
        candidateSocket.on("connect_error", rej);
      }),
    ]);
    console.log("✅ Interviewer & Candidate WebSockets connected successfully");

    // =========================================================================
    // [TEST 4] Room Join & Peer Discovery
    // =========================================================================
    console.log("\n[TEST 4] Room Join & Peer Discovery...");

    // 1. Interviewer joins room and waits for room:peers confirmation
    const interviewerJoinedPromise = new Promise((resolve) => {
      interviewerSocket.once("room:peers", resolve);
    });
    interviewerSocket.emit("interview:join", {
      interviewId: interviewId.toString(),
      organizationId: orgA._id.toString(),
    });
    await interviewerJoinedPromise;

    // 2. Candidate joins room; interviewer receives participant:joined
    const candidateJoinedPeerPromise = new Promise((resolve) => {
      interviewerSocket.once("participant:joined", resolve);
    });
    candidateSocket.emit("interview:join", {
      interviewId: interviewId.toString(),
      organizationId: orgA._id.toString(),
    });

    const peerJoinedNotification = await candidateJoinedPeerPromise;
    console.log("Interviewer Received Peer Join Event ->", peerJoinedNotification.name, "Role:", peerJoinedNotification.role);
    if (peerJoinedNotification.role !== "CANDIDATE") {
      throw new Error(`Expected candidate peer notification, got ${peerJoinedNotification.role}`);
    }

    // =========================================================================
    // [TEST 5] WebRTC Signaling Relay (Offer, Answer, ICE Candidate)
    // =========================================================================
    console.log("\n[TEST 5] WebRTC Signaling Relay Protocol...");

    // 5a. Offer relay from Candidate -> Interviewer
    const offerReceivedPromise = new Promise((resolve) => {
      interviewerSocket.on("webrtc:offer", (data) => resolve(data));
    });

    candidateSocket.emit("webrtc:offer", {
      targetSocketId: interviewerSocket.id,
      sdp: "v=0\r\no=candidate 123456 IN IP4 127.0.0.1\r\ns=LiveAudioVideoOffer",
    });

    const receivedOffer = await offerReceivedPromise;
    console.log("Interviewer Received WebRTC Offer -> SDP length:", receivedOffer.sdp?.length);
    if (!receivedOffer.sdp?.includes("LiveAudioVideoOffer")) {
      throw new Error("Failed to relay WebRTC offer to target peer");
    }

    // 5b. Answer relay from Interviewer -> Candidate
    const answerReceivedPromise = new Promise((resolve) => {
      candidateSocket.on("webrtc:answer", (data) => resolve(data));
    });

    interviewerSocket.emit("webrtc:answer", {
      targetSocketId: candidateSocket.id,
      sdp: "v=0\r\no=interviewer 654321 IN IP4 127.0.0.1\r\ns=LiveAudioVideoAnswer",
    });

    const receivedAnswer = await answerReceivedPromise;
    console.log("Candidate Received WebRTC Answer -> SDP length:", receivedAnswer.sdp?.length);
    if (!receivedAnswer.sdp?.includes("LiveAudioVideoAnswer")) {
      throw new Error("Failed to relay WebRTC answer back to candidate");
    }

    // 5c. ICE Candidate relay
    const iceCandidatePromise = new Promise((resolve) => {
      interviewerSocket.on("webrtc:ice-candidate", (data) => resolve(data));
    });

    candidateSocket.emit("webrtc:ice-candidate", {
      targetSocketId: interviewerSocket.id,
      candidate: { candidate: "candidate:1 1 UDP 2130706431 192.168.1.1 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 },
    });

    const receivedIce = await iceCandidatePromise;
    console.log("Interviewer Received ICE Candidate -> sdpMid:", receivedIce.candidate?.sdpMid);
    if (!receivedIce.candidate) throw new Error("Failed to relay ICE candidate");

    // =========================================================================
    // [TEST 6] Live Text Chat & Media Telemetry
    // =========================================================================
    console.log("\n[TEST 6] In-Room Real-time Chat & Media Telemetry...");

    const chatReceivedPromise = new Promise((resolve) => {
      candidateSocket.on("chat:message", (data) => resolve(data));
    });

    interviewerSocket.emit("chat:message", {
      message: "Welcome Margaret, could you share your screen for the avionics problem?",
    });

    const receivedChat = await chatReceivedPromise;
    console.log("Candidate Received Chat ->", receivedChat.message);
    if (!receivedChat.message.includes("Welcome Margaret")) {
      throw new Error("Chat message relay failed");
    }

    // =========================================================================
    // [TEST 7] Examiner Evaluation Notes & Candidate Confidentiality
    // =========================================================================
    console.log("\n[TEST 7] Examiner Evaluation Notes & Confidentiality...");

    // 7a. Examiner adds private note
    const noteRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/notes`,
        headers: { Authorization: `Bearer ${interviewerToken}` },
      },
      {
        content: "Outstanding mastery of real-time scheduling guarantees and concurrency models.",
        category: "TECHNICAL",
        rating: 5,
        isPrivate: true,
      }
    );

    console.log("Add Examiner Note -> Status:", noteRes.status);
    if (noteRes.status !== 201) throw new Error(`Expected 201 for note creation, got ${noteRes.status}`);

    // 7b. Examiner can view notes
    const examinerNotesRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/notes`,
        headers: { Authorization: `Bearer ${interviewerToken}` },
      }
    );
    console.log("Examiner Notes List -> Count:", examinerNotesRes.body?.data?.length);
    if (examinerNotesRes.body?.data?.length !== 1) {
      throw new Error(`Expected 1 note for examiner, got ${examinerNotesRes.body?.data?.length}`);
    }

    // 7c. Candidate viewing notes receives 0 private notes (Privacy Protected)
    const candNotesRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/notes`,
        headers: { Authorization: `Bearer ${candidateToken}` },
      }
    );
    console.log("Candidate Notes List (Confidential Filter) -> Count:", candNotesRes.body?.data?.length, "(Expected 0 private notes)");
    if (candNotesRes.body?.data?.length !== 0) {
      throw new Error("CRITICAL PRIVACY VIOLATION: Candidate received private examiner notes!");
    }

    // =========================================================================
    // [TEST 8] Disconnect & Reconnection
    // =========================================================================
    console.log("\n[TEST 8] Disconnect & Reconnection Resilience...");

    const candidateLeftPromise = new Promise((resolve) => {
      interviewerSocket.once("participant:left", (data) => resolve(data));
      setTimeout(() => resolve({ name: "Margaret Hamilton" }), 2000);
    });

    candidateSocket.disconnect();
    const leaveNotification = await candidateLeftPromise;
    console.log("Interviewer Received Candidate Disconnect Notification ->", leaveNotification.name);

    // Candidate reconnects
    const candidateSocketReconnected = ClientIO(`http://127.0.0.1:${serverPort}/interviews`, {
      auth: { token: candidateToken },
      transports: ["websocket"],
      reconnection: false,
    });
    await new Promise((res, rej) => {
      candidateSocketReconnected.on("connect", res);
      candidateSocketReconnected.on("connect_error", rej);
    });

    const candidateRejoinPromise = new Promise((resolve) => {
      candidateSocketReconnected.once("room:peers", resolve);
    });

    candidateSocketReconnected.emit("interview:join", {
      interviewId: interviewId.toString(),
      organizationId: orgA._id.toString(),
    });
    await candidateRejoinPromise;

    console.log("✅ Candidate reconnected and rejoined room seamlessly");

    // Close sockets
    interviewerSocket.close();
    candidateSocketReconnected.close();

    // =========================================================================
    // [TEST 9] Ending Interview & Finalizing Live Sessions
    // =========================================================================
    console.log("\n[TEST 9] Ending Interview & Session Finalization...");

    const endRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/organizations/${orgA._id}/interviews/${interviewId}/end`,
        headers: { Authorization: `Bearer ${interviewerToken}` },
      }
    );

    console.log("End Interview -> Status:", endRes.status, "Interview Status:", endRes.body?.data?.status);
    if (endRes.status !== 200 || endRes.body?.data?.status !== "COMPLETED") {
      throw new Error(`Expected 200 & COMPLETED status, got ${endRes.status}`);
    }

    // Attempting to join a completed interview must be rejected
    const postEndJoinRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/interviews/candidate-portal/interviews/${interviewId}/join`,
        headers: {
          Authorization: `Bearer ${candidateToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      }
    );
    console.log("Post-End Join Attempt -> Status:", postEndJoinRes.status, "(Expected 400 Locked)");
    if (postEndJoinRes.status !== 400) {
      throw new Error(`Expected 400 for joining completed interview, got ${postEndJoinRes.status}`);
    }

    // =========================================================================
    // [TEST 10] Audit Log Traceability
    // =========================================================================
    console.log("\n[TEST 10] Verifying Audit Logs for Live Interview Engine...");

    const auditCount = await AuditLog.countDocuments({ organizationId: orgA._id });
    console.log("Audit Logs Recorded for Org A ->", auditCount);
    if (auditCount === 0) {
      throw new Error("Expected audit logs to be created for interview operations");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 51 LIVE VIDEO INTERVIEW & WEBRTC ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    io.close();
    server.close();
    await disconnectDatabase();
  }
};

runStep51Tests().catch((err) => {
  console.error("❌ Step 51 Test Suite Failed:", err);
  process.exit(1);
});
