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
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Result from "../../src/modules/results/result.model.js";
import Certificate from "../../src/modules/certificates/certificate.model.js";
import Interview from "../../src/modules/interviews/interview.model.js";
import Subscription from "../../src/modules/subscriptions/subscription.model.js";
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

const runStep47Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 47 Candidate Management & Portal Test Suite");

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

    await Organization.deleteMany({ slug: { $in: ["org-vu-47", "org-alien-47"] } });
    await User.deleteMany({ email: { $in: ["staff47@vu.edu.pk", "alice47@vu.edu.pk", "bob47@vu.edu.pk", "eve47@alien.com"] } });
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentAssignment.deleteMany({});
    await Result.deleteMany({});
    await Certificate.deleteMany({});
    await Interview.deleteMany({});
    await Subscription.deleteMany({});

    // 2. Setup Organization A
    const orgA = await Organization.create({
      name: "Virtual University 47",
      slug: "org-vu-47",
      code: "VU47",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const staffUser = await User.create({
      firstName: "Admin",
      lastName: "Staff",
      email: "staff47@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const staffToken = generateAccessToken({ sub: staffUser._id.toString() });

    await UserMembership.create({
      userId: staffUser._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    // 3. Create Candidate Alice via API
    console.log("\n[TEST 1] Creating Candidate Alice (Tenant Scoped)...");
    const createCandRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidates`,
      headers: { Authorization: `Bearer ${staffToken}` },
    }, {
      candidateCode: "VU-CAND-47A",
      firstName: "Alice",
      lastName: "Student",
      email: "alice47@vu.edu.pk",
      phoneNumber: "+923001234567",
    });
    console.log("Create Candidate Status ->", createCandRes.status, "Code:", createCandRes.body?.data?.candidateCode, "Email:", createCandRes.body?.data?.email);
    if (createCandRes.status !== 201 || createCandRes.body?.data?.candidateCode !== "VU-CAND-47A") {
      throw new Error("Test 1 Failed: Candidate creation failed!");
    }
    const aliceCandidateId = createCandRes.body.data._id;
    const aliceUserId = createCandRes.body.data.userId;
    const aliceToken = generateAccessToken({ sub: aliceUserId.toString() });

    // 4. Duplicate Candidate Code Guard
    console.log("\n[TEST 2] Duplicate Candidate Code Uniqueness Guard...");
    const dupRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidates`,
      headers: { Authorization: `Bearer ${staffToken}` },
    }, {
      candidateCode: "VU-CAND-47A", // Duplicate code
      firstName: "Alice",
      lastName: "Clone",
      email: "alice_clone@vu.edu.pk",
    });
    console.log("Duplicate Code Status ->", dupRes.status, "Message:", dupRes.body?.message);
    if (dupRes.status !== 409) {
      throw new Error("Test 2 Failed: Allowed duplicate candidateCode in same organization!");
    }

    // 5. Candidate Bob Setup
    const bobCandRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidates`,
      headers: { Authorization: `Bearer ${staffToken}` },
    }, {
      candidateCode: "VU-CAND-47B",
      firstName: "Bob",
      lastName: "Scholar",
      email: "bob47@vu.edu.pk",
    });
    const bobUserId = bobCandRes.body.data.userId;
    const bobToken = generateAccessToken({ sub: bobUserId.toString() });

    // 6. Alien Org B Setup
    const orgB = await Organization.create({
      name: "Alien Org 47",
      slug: "org-alien-47",
      code: "ALIEN47",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Outsider",
      email: "eve47@alien.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const eveToken = generateAccessToken({ sub: eveUser._id.toString() });

    console.log("\n[TEST 3] Candidate Portal Profile Access & Self-Service Update...");
    // 3.1 Alice retrieves her own profile
    const aliceProfileRes = await request(server, {
      method: "GET",
      path: "/api/v1/candidate-portal/portal/profile",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Profile Status ->", aliceProfileRes.status, "Candidate Code:", aliceProfileRes.body?.data?.candidateCode, "Email:", aliceProfileRes.body?.data?.email);
    if (aliceProfileRes.status !== 200 || aliceProfileRes.body?.data?.candidateCode !== "VU-CAND-47A") {
      throw new Error("Test 3.1 Failed: Candidate portal profile retrieval failed!");
    }

    // 3.2 Alice updates permitted fields (phone number)
    const updateProfileRes = await request(server, {
      method: "PATCH",
      path: "/api/v1/candidate-portal/portal/profile",
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      phoneNumber: "+923009999999",
      candidateCode: "HACKED_CODE", // Should be ignored
    });
    console.log("Update Profile Status ->", updateProfileRes.status, "New Phone:", updateProfileRes.body?.data?.phoneNumber, "Code (Preserved):", updateProfileRes.body?.data?.candidateCode);
    if (updateProfileRes.status !== 200 || updateProfileRes.body?.data?.phoneNumber !== "+923009999999" || updateProfileRes.body?.data?.candidateCode === "HACKED_CODE") {
      throw new Error("Test 3.2 Failed: Profile update failed or server-controlled field was spoofed!");
    }

    console.log("\n[TEST 4] Candidate Portal Domain Feeds (Assignments, Results, Certificates, Interviews)...");
    // Setup Mock Assessment & Assignment for Alice
    const assessment = await Assessment.create({
      organizationId: orgA._id,
      title: "Data Structures & Algorithms Final",
      code: "CS301-47",
      status: "PUBLISHED",
      type: "MCQ",
      totalPoints: 100,
      passingScore: 50,
      durationMinutes: 90,
      createdBy: staffUser._id,
    });

    await AssessmentAssignment.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: aliceCandidateId,
      status: "ASSIGNED",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 86400000),
      assignedBy: staffUser._id,
    });

    // Setup Mock Result for Alice
    await Result.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: aliceCandidateId,
      attemptId: new mongoose.Types.ObjectId(),
      evaluationId: new mongoose.Types.ObjectId(),
      totalPoints: 100,
      earnedPoints: 92,
      percentage: 92,
      grade: "A+",
      passed: true,
      published: true,
      publishedAt: new Date(),
    });

    // Setup Mock Certificate for Alice
    await Certificate.create({
      organizationId: orgA._id,
      assessmentId: assessment._id,
      candidateId: aliceCandidateId,
      resultId: new mongoose.Types.ObjectId(),
      attemptId: new mongoose.Types.ObjectId(),
      title: "Certificate of Achievement",
      certificateNumber: "SA-2026-004701",
      verificationCode: "VU47-ALICE-PASS",
      recipientName: "Alice Student",
      assessmentTitle: "Data Structures & Algorithms Final",
      status: "ISSUED",
      issuedAt: new Date(),
    });

    // Setup Mock Interview for Alice
    await Interview.create({
      organizationId: orgA._id,
      title: "Algorithms Technical Interview",
      type: "TECHNICAL",
      candidateId: aliceCandidateId,
      scheduledStartAt: new Date(Date.now() + 3600000),
      scheduledEndAt: new Date(Date.now() + 7200000),
      createdBy: staffUser._id,
      status: "SCHEDULED",
    });

    // 4.1 Alice queries her assignments
    const aliceAssignRes = await request(server, {
      method: "GET",
      path: "/api/v1/candidate-portal/portal/assignments",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Assignments -> Count:", aliceAssignRes.body?.data?.length, "Title:", aliceAssignRes.body?.data?.[0]?.assessmentId?.title);
    if (aliceAssignRes.status !== 200 || aliceAssignRes.body?.data?.length !== 1) {
      throw new Error("Test 4.1 Failed: Candidate assignments retrieval failed!");
    }

    // 4.2 Bob queries assignments -> returns 0 (Bob was not assigned)
    const bobAssignRes = await request(server, {
      method: "GET",
      path: "/api/v1/candidate-portal/portal/assignments",
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log("Bob Assignments -> Count:", bobAssignRes.body?.data?.length);
    if (bobAssignRes.status !== 200 || bobAssignRes.body?.data?.length !== 0) {
      throw new Error("Test 4.2 Failed: Feed isolation failed between candidates!");
    }

    // 4.3 Alice queries results
    const aliceResRes = await request(server, {
      method: "GET",
      path: "/api/v1/candidate-portal/portal/results",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Results -> Grade:", aliceResRes.body?.data?.[0]?.grade);
    if (aliceResRes.status !== 200 || aliceResRes.body?.data?.[0]?.grade !== "A+") {
      throw new Error("Test 4.3 Failed: Candidate results retrieval failed!");
    }

    // 4.4 Alice queries certificates
    const aliceCertRes = await request(server, {
      method: "GET",
      path: "/api/v1/candidate-portal/portal/certificates",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Certificates -> Number:", aliceCertRes.body?.data?.[0]?.certificateNumber);
    if (aliceCertRes.status !== 200 || aliceCertRes.body?.data?.[0]?.certificateNumber !== "SA-2026-004701") {
      throw new Error("Test 4.4 Failed: Candidate certificates retrieval failed!");
    }

    // 4.5 Alice queries interviews
    const aliceIntRes = await request(server, {
      method: "GET",
      path: "/api/v1/candidate-portal/portal/interviews",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Interviews -> Title:", aliceIntRes.body?.data?.[0]?.title);
    if (aliceIntRes.status !== 200 || aliceIntRes.body?.data?.[0]?.title !== "Algorithms Technical Interview") {
      throw new Error("Test 4.5 Failed: Candidate interviews retrieval failed!");
    }

    console.log("\n[TEST 5] Candidate Lifecycle: Suspend & Activate...");
    // 5.1 Suspend candidate Alice
    const suspendRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidates/${aliceCandidateId}/suspend`,
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    console.log("Suspend Candidate Status ->", suspendRes.status, "Status:", suspendRes.body?.data?.status);
    if (suspendRes.status !== 200 || suspendRes.body?.data?.status !== "SUSPENDED") {
      throw new Error("Test 5.1 Failed: Candidate suspension failed!");
    }

    // 5.2 Activate candidate Alice
    const activateRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/candidates/${aliceCandidateId}/activate`,
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    console.log("Activate Candidate Status ->", activateRes.status, "Status:", activateRes.body?.data?.status);
    if (activateRes.status !== 200 || activateRes.body?.data?.status !== "ACTIVE") {
      throw new Error("Test 5.2 Failed: Candidate activation failed!");
    }

    console.log("\n[TEST 6] Cross-Tenant Security Isolation...");
    // Alien user Eve attempts to access candidate list of Org A
    const eveQueryRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/candidates`,
      headers: { Authorization: `Bearer ${eveToken}` }, // Eve belongs to Org B
    });
    console.log("Eve Alien Access Status ->", eveQueryRes.status);
    if (eveQueryRes.status !== 403) {
      throw new Error("Test 6 Failed: Cross-tenant candidate access was not blocked with 403!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 47 CANDIDATE MANAGEMENT & PORTAL TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 47 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep47Tests();
