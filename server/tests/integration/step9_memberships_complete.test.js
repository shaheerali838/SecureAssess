import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
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

const runStep9CompleteTests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 9 Full Checklist Verification");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server listening on port:", server.address().port);

  try {
    // Setup Platform Owner & Roles
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const ownerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    const orgOwnerRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const proctorRole = await Role.findOne({ name: ORGANIZATION_ROLES.PROCTOR });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });
    const platformAdminRole = await Role.findOne({ name: PLATFORM_ROLES.PLATFORM_ADMIN });

    // Setup Test Organizations
    await Organization.deleteMany({ slug: { $in: ["org-alpha-9", "org-beta-9"] } });

    const orgAlpha = await Organization.create({
      name: "Org Alpha 9",
      slug: "org-alpha-9",
      code: "OA901",
      type: "UNIVERSITY",
      status: "ACTIVE",
    });

    const orgBeta = await Organization.create({
      name: "Org Beta 9",
      slug: "org-beta-9",
      code: "OB902",
      type: "CORPORATE",
      status: "ACTIVE",
    });

    // Setup Org Alpha Owner
    await User.deleteMany({ email: { $in: ["owner.alpha@test.com", "member.candidate@test.com", "target.proctor@test.com"] } });

    const alphaOwner = await User.create({
      firstName: "Alpha",
      lastName: "Owner",
      email: "owner.alpha@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const alphaOwnerToken = generateAccessToken({ sub: alphaOwner._id.toString() });

    await UserMembership.create({
      userId: alphaOwner._id,
      organizationId: orgAlpha._id,
      roleId: orgOwnerRole._id,
      status: "ACTIVE",
    });

    const testMember = await User.create({
      firstName: "Target",
      lastName: "Proctor",
      email: "target.proctor@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const testMemberToken = generateAccessToken({ sub: testMember._id.toString() });

    const candidateUser = await User.create({
      firstName: "Member",
      lastName: "Candidate",
      email: "member.candidate@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const candidateToken = generateAccessToken({ sub: candidateUser._id.toString() });

    // Add candidate to Org Alpha
    await UserMembership.create({
      userId: candidateUser._id,
      organizationId: orgAlpha._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    console.log("\n[TEST 1] Org Owner assigns PROCTOR role to testMember in Org Alpha...");
    const addRes = await request(server, {
      method: "POST",
      path: `/api/v1/users/${testMember._id}/memberships`,
      headers: { Authorization: `Bearer ${alphaOwnerToken}` },
    }, {
      organizationId: orgAlpha._id.toString(),
      roleId: proctorRole._id.toString(),
    });
    console.log("POST /api/v1/users/:userId/memberships ->", addRes.status, "Role:", addRes.body?.data?.role?.name);
    if (addRes.status !== 201 || addRes.body?.data?.role?.name !== "PROCTOR") throw new Error("Test 1 Failed");

    const membershipId = addRes.body?.data?.id;

    console.log("\n[TEST 2] GET /api/v1/users/me/memberships (Logged-in user memberships)...");
    const meRes = await request(server, {
      method: "GET",
      path: "/api/v1/users/me/memberships",
      headers: { Authorization: `Bearer ${testMemberToken}` },
    });
    console.log("GET /api/v1/users/me/memberships ->", meRes.status, "Count:", meRes.body?.data?.length);
    if (meRes.status !== 200 || meRes.body?.data?.length !== 1) throw new Error("Test 2 Failed");

    console.log("\n[TEST 3] GET /api/v1/organizations/:orgId/members (List Org Alpha members)...");
    const membersRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgAlpha._id}/members`,
      headers: { Authorization: `Bearer ${alphaOwnerToken}` },
    });
    console.log(`GET /api/v1/organizations/${orgAlpha._id}/members ->`, membersRes.status, "Total members:", membersRes.body?.data?.pagination?.total);
    if (membersRes.status !== 200 || membersRes.body?.data?.pagination?.total < 3) throw new Error("Test 3 Failed");

    console.log("\n[TEST 4] Tenant Isolation: Org Alpha Owner cannot list Org Beta members...");
    const crossListRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgBeta._id}/members`,
      headers: { Authorization: `Bearer ${alphaOwnerToken}` },
    });
    console.log(`GET /api/v1/organizations/${orgBeta._id}/members ->`, crossListRes.status, "(Expected: 403)");
    if (crossListRes.status !== 403) throw new Error("Test 4 Failed: Tenant boundary breached!");

    console.log("\n[TEST 5] Candidate cannot list organization members...");
    const candidateListRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgAlpha._id}/members`,
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    console.log("Candidate listing members ->", candidateListRes.status, "(Expected: 403)");
    if (candidateListRes.status !== 403) throw new Error("Test 5 Failed");

    console.log("\n[TEST 6] PATCH /api/v1/organizations/:orgId/members/:memId/role (Promote PROCTOR -> EXAMINER)...");
    const updateRoleRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgAlpha._id}/members/${membershipId}/role`,
      headers: { Authorization: `Bearer ${alphaOwnerToken}` },
    }, {
      roleId: examinerRole._id.toString(),
    });
    console.log("Update member role ->", updateRoleRes.status, "New Role:", updateRoleRes.body?.data?.role?.name);
    if (updateRoleRes.status !== 200 || updateRoleRes.body?.data?.role?.name !== "EXAMINER") throw new Error("Test 6 Failed");

    console.log("\n[TEST 7] PATCH /api/v1/organizations/:orgId/members/:memId/status (Update status -> SUSPENDED)...");
    const updateStatusRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgAlpha._id}/members/${membershipId}/status`,
      headers: { Authorization: `Bearer ${alphaOwnerToken}` },
    }, {
      status: "SUSPENDED",
    });
    console.log("Update member status ->", updateStatusRes.status, "New Status:", updateStatusRes.body?.data?.status);
    if (updateStatusRes.status !== 200 || updateStatusRes.body?.data?.status !== "SUSPENDED") throw new Error("Test 7 Failed");

    console.log("\n[TEST 8] DELETE /api/v1/organizations/:orgId/members/:memId (Remove member)...");
    const deleteRes = await request(server, {
      method: "DELETE",
      path: `/api/v1/organizations/${orgAlpha._id}/members/${membershipId}`,
      headers: { Authorization: `Bearer ${alphaOwnerToken}` },
    });
    console.log("DELETE membership ->", deleteRes.status, "(Expected: 200)");
    if (deleteRes.status !== 200) throw new Error("Test 8 Failed");

    console.log("\n=================================================================");
    console.log("✅ ALL STEP 9 USER & MEMBERSHIP CHECKLIST TESTS PASSED!");
    console.log("=================================================================");
  } catch (err) {
    console.error("Step 9 Complete Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep9CompleteTests();
