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

const runStep9Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 9 User & Membership Test Suite");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server listening on port:", server.address().port);

  try {
    // 1. Setup Platform Owner & Roles
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const ownerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    const orgOwnerRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });
    const platformOwnerRole = await Role.findOne({ name: PLATFORM_ROLES.PLATFORM_OWNER });

    // 2. Setup Test Organizations
    await Organization.deleteMany({ slug: { $in: ["vu-step9", "saylani-step9"] } });

    const vuOrg = await Organization.create({
      name: "VU Step9",
      slug: "vu-step9",
      code: "VU9001",
      type: "UNIVERSITY",
      status: "ACTIVE",
    });

    const saylaniOrg = await Organization.create({
      name: "Saylani Step9",
      slug: "saylani-step9",
      code: "SA9002",
      type: "TRAINING_INSTITUTE",
      status: "ACTIVE",
    });

    // 3. Setup Users
    await User.deleteMany({ email: { $in: ["vu.admin@test.com", "target.examiner@test.com", "target.candidate@test.com"] } });

    const vuAdmin = await User.create({
      firstName: "VU",
      lastName: "Admin",
      email: "vu.admin@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const vuAdminToken = generateAccessToken({ sub: vuAdmin._id.toString() });

    // Assign VU Admin as ORGANIZATION_OWNER of VU
    await UserMembership.create({
      userId: vuAdmin._id,
      organizationId: vuOrg._id,
      roleId: orgOwnerRole._id,
      status: "ACTIVE",
    });

    const targetUser = await User.create({
      firstName: "Target",
      lastName: "Examiner",
      email: "target.examiner@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    const candidateUser = await User.create({
      firstName: "Test",
      lastName: "Candidate",
      email: "target.candidate@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const candidateToken = generateAccessToken({ sub: candidateUser._id.toString() });

    console.log("\n--- TEST 1: Unauthenticated Requests (401) ---");
    const res1 = await request(server, { method: "GET", path: "/api/v1/users" });
    console.log("GET /api/v1/users without token ->", res1.status, "(Expected: 401)");
    if (res1.status !== 401) throw new Error("Test 1 Failed");

    console.log("\n--- TEST 2: Platform Owner Lists & Manages Users ---");
    const listRes = await request(server, {
      method: "GET",
      path: "/api/v1/users",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("GET /api/v1/users as PLATFORM_OWNER ->", listRes.status, "Count:", listRes.body?.data?.items?.length);
    if (listRes.status !== 200) throw new Error("Test 2.1 Failed");

    const getRes = await request(server, {
      method: "GET",
      path: `/api/v1/users/${targetUser._id}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`GET /api/v1/users/${targetUser._id} ->`, getRes.status, "Name:", getRes.body?.data?.fullName);
    if (getRes.status !== 200 || getRes.body?.data?.email !== "target.examiner@test.com") throw new Error("Test 2.2 Failed");

    const patchUserRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/users/${targetUser._id}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      firstName: "TargetUpdated",
      profile: { phone: "+923001112233", timezone: "Asia/Karachi" },
    });
    console.log("PATCH /api/v1/users/:id ->", patchUserRes.status, "Updated Name:", patchUserRes.body?.data?.firstName);
    if (patchUserRes.status !== 200 || patchUserRes.body?.data?.firstName !== "TargetUpdated") throw new Error("Test 2.3 Failed");

    console.log("\n--- TEST 3: Organization Owner Adds Examiner to their Organization ---");
    const addMemberRes = await request(server, {
      method: "POST",
      path: `/api/v1/users/${targetUser._id}/memberships`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    }, {
      organizationId: vuOrg._id.toString(),
      roleId: examinerRole._id.toString(),
    });
    console.log("POST /api/v1/users/:id/memberships ->", addMemberRes.status, "(Expected: 201)");
    console.log("Created Membership:", addMemberRes.body?.data?.role?.name);
    if (addMemberRes.status !== 201 || addMemberRes.body?.data?.role?.name !== "EXAMINER") throw new Error("Test 3 Failed");

    const membershipId = addMemberRes.body?.data?.id;

    console.log("\n--- TEST 4: Duplicate Membership is Rejected (409 Conflict) ---");
    const duplicateRes = await request(server, {
      method: "POST",
      path: `/api/v1/users/${targetUser._id}/memberships`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    }, {
      organizationId: vuOrg._id.toString(),
      roleId: examinerRole._id.toString(),
    });
    console.log("Duplicate membership attempt ->", duplicateRes.status, "(Expected: 409)");
    if (duplicateRes.status !== 409) throw new Error("Test 4 Failed: Duplicate membership was not rejected!");

    console.log("\n--- TEST 5: Tenant Isolation (Org Owner Cannot Add Member to Another Org) ---");
    const crossOrgRes = await request(server, {
      method: "POST",
      path: `/api/v1/users/${targetUser._id}/memberships`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    }, {
      organizationId: saylaniOrg._id.toString(),
      roleId: examinerRole._id.toString(),
    });
    console.log("VU Admin attempting to add member to Saylani Org ->", crossOrgRes.status, "(Expected: 403)");
    if (crossOrgRes.status !== 403) throw new Error("Test 5 Failed: Cross-organization management was not blocked!");

    console.log("\n--- TEST 6: Rejection of Platform Role Injection as Membership Role ---");
    const platformRoleRes = await request(server, {
      method: "POST",
      path: `/api/v1/users/${targetUser._id}/memberships`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      organizationId: vuOrg._id.toString(),
      roleId: platformOwnerRole._id.toString(), // PLATFORM_OWNER role with scope=PLATFORM
    });
    console.log("Assigning PLATFORM_OWNER as org membership role ->", platformRoleRes.status, "(Expected: 400)");
    console.log("Error Message:", platformRoleRes.body?.message);
    if (platformRoleRes.status !== 400) throw new Error("Test 6 Failed: Platform role in membership was not blocked!");

    console.log("\n--- TEST 7: Candidate Cannot Manage Memberships ---");
    const candidateManageRes = await request(server, {
      method: "POST",
      path: `/api/v1/users/${targetUser._id}/memberships`,
      headers: { Authorization: `Bearer ${candidateToken}` },
    }, {
      organizationId: vuOrg._id.toString(),
      roleId: examinerRole._id.toString(),
    });
    console.log("Candidate attempting to manage memberships ->", candidateManageRes.status, "(Expected: 403)");
    if (candidateManageRes.status !== 403) throw new Error("Test 7 Failed: Candidate was not blocked!");

    console.log("\n--- TEST 8: Update & Delete Membership ---");
    const patchMemberRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/users/${targetUser._id}/memberships/${membershipId}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    }, {
      status: "SUSPENDED",
    });
    console.log("PATCH membership status ->", patchMemberRes.status, "New Status:", patchMemberRes.body?.data?.status);
    if (patchMemberRes.status !== 200 || patchMemberRes.body?.data?.status !== "SUSPENDED") throw new Error("Test 8.1 Failed");

    const deleteMemberRes = await request(server, {
      method: "DELETE",
      path: `/api/v1/users/${targetUser._id}/memberships/${membershipId}`,
      headers: { Authorization: `Bearer ${vuAdminToken}` },
    });
    console.log("DELETE membership ->", deleteMemberRes.status, "(Expected: 200)");
    if (deleteMemberRes.status !== 200) throw new Error("Test 8.2 Failed");

    console.log("\n========================================================");
    console.log("✅ ALL STEP 9 USER & MEMBERSHIP TESTS PASSED!");
    console.log("========================================================");
  } catch (err) {
    console.error("Step 9 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep9Tests();
