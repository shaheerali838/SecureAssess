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

const runStep8Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 8 Organization Management Test Suite");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server listening on port:", server.address().port);

  try {
    // 1. Setup Users
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const ownerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    // Org A Owner
    let orgAOwner = await User.findOne({ email: "owner.orgA@test.com" });
    if (!orgAOwner) {
      orgAOwner = await User.create({
        firstName: "OrgA",
        lastName: "Owner",
        email: "owner.orgA@test.com",
        passwordHash: "$2b$10$dummyHash123",
        platformRole: null,
        status: "ACTIVE",
        emailVerified: true,
      });
    }
    const orgAOwnerToken = generateAccessToken({ sub: orgAOwner._id.toString() });

    // Org B Owner
    let orgBOwner = await User.findOne({ email: "owner.orgB@test.com" });
    if (!orgBOwner) {
      orgBOwner = await User.create({
        firstName: "OrgB",
        lastName: "Owner",
        email: "owner.orgB@test.com",
        passwordHash: "$2b$10$dummyHash123",
        platformRole: null,
        status: "ACTIVE",
        emailVerified: true,
      });
    }
    const orgBOwnerToken = generateAccessToken({ sub: orgBOwner._id.toString() });

    // Candidate User
    let candidateUser = await User.findOne({ email: "candidate@test.com" });
    if (!candidateUser) {
      candidateUser = await User.create({
        firstName: "Candidate",
        lastName: "User",
        email: "candidate@test.com",
        passwordHash: "$2b$10$dummyHash123",
        platformRole: null,
        status: "ACTIVE",
        emailVerified: true,
      });
    }
    const candidateToken = generateAccessToken({ sub: candidateUser._id.toString() });

    // Find Roles
    const orgOwnerRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_OWNER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    // Clean test organizations
    await Organization.deleteMany({ slug: { $in: ["tenant-alpha", "tenant-beta"] } });

    // Create 2 distinct organizations for tenant isolation testing
    const orgA = await Organization.create({
      name: "Tenant Alpha",
      slug: "tenant-alpha",
      code: "TA1001",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });
    await UserMembership.deleteMany({ organizationId: orgA._id });
    await UserMembership.create({
      userId: orgAOwner._id,
      organizationId: orgA._id,
      roleId: orgOwnerRole._id,
      status: "ACTIVE",
    });

    const orgB = await Organization.create({
      name: "Tenant Beta",
      slug: "tenant-beta",
      code: "TB2002",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });
    await UserMembership.deleteMany({ organizationId: orgB._id });
    await UserMembership.create({
      userId: orgBOwner._id,
      organizationId: orgB._id,
      roleId: orgOwnerRole._id,
      status: "ACTIVE",
    });

    // Add candidate to Org A
    await UserMembership.create({
      userId: candidateUser._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    console.log("\n--- TEST 1: Unauthenticated Requests (401) ---");
    const unauthRes = await request(server, { method: "GET", path: "/api/v1/organizations" });
    console.log("GET /api/v1/organizations without token ->", unauthRes.status, "(Expected: 401)");
    if (unauthRes.status !== 401) throw new Error("Test 1 Failed: Expected 401");

    console.log("\n--- TEST 2: Platform Owner Lists All Organizations ---");
    const listRes = await request(server, {
      method: "GET",
      path: "/api/v1/organizations",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("GET /api/v1/organizations as PLATFORM_OWNER ->", listRes.status, "Items count:", listRes.body?.data?.items?.length);
    if (listRes.status !== 200 || !listRes.body?.data?.items?.length) throw new Error("Test 2 Failed");

    console.log("\n--- TEST 3: Platform Owner Views & Updates Organization ---");
    const getRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`GET /api/v1/organizations/${orgA._id} ->`, getRes.status, "Name:", getRes.body?.data?.name);
    if (getRes.status !== 200 || getRes.body?.data?.name !== "Tenant Alpha") throw new Error("Test 3.1 Failed");

    const patchRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      name: "Tenant Alpha International",
      contact: { email: "contact@alpha.com", phone: "+1234567890" },
    });
    console.log(`PATCH /api/v1/organizations/${orgA._id} ->`, patchRes.status, "Updated name:", patchRes.body?.data?.name);
    if (patchRes.status !== 200 || patchRes.body?.data?.name !== "Tenant Alpha International") throw new Error("Test 3.2 Failed");

    console.log("\n--- TEST 4: Platform Owner Changes Organization Status ---");
    const statusRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/status`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, { status: "SUSPENDED" });
    console.log(`PATCH /api/v1/organizations/${orgA._id}/status ->`, statusRes.status, "New Status:", statusRes.body?.data?.status);
    if (statusRes.status !== 200 || statusRes.body?.data?.status !== "SUSPENDED") throw new Error("Test 4.1 Failed");

    // Restore to ACTIVE
    await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}/status`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, { status: "ACTIVE" });

    console.log("\n--- TEST 5: Tenant Isolation (Org A Owner Cannot Access Org B) ---");
    const crossTenantGet = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgB._id}`,
      headers: { Authorization: `Bearer ${orgAOwnerToken}` },
    });
    console.log(`Org A Owner querying Org B ->`, crossTenantGet.status, "(Expected: 403)");
    if (crossTenantGet.status !== 403) throw new Error("Test 5.1 Failed: Cross-tenant access was not blocked!");

    const crossTenantPatch = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgB._id}`,
      headers: { Authorization: `Bearer ${orgAOwnerToken}` },
    }, { name: "Malicious Rename" });
    console.log(`Org A Owner modifying Org B ->`, crossTenantPatch.status, "(Expected: 403)");
    if (crossTenantPatch.status !== 403) throw new Error("Test 5.2 Failed: Cross-tenant update was not blocked!");

    console.log("\n--- TEST 6: Candidate Cannot Administer Organization ---");
    const candidatePatch = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}`,
      headers: { Authorization: `Bearer ${candidateToken}` },
    }, { name: "Candidate Hack" });
    console.log("Candidate modifying Org A ->", candidatePatch.status, "(Expected: 403)");
    if (candidatePatch.status !== 403) throw new Error("Test 6 Failed: Candidate was not blocked!");

    console.log("\n--- TEST 7: Security Rejection of Forbidden Immutable Fields ---");
    const securityCheck = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgA._id}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, { slug: "new-slug", code: "HACKED_CODE", status: "DEACTIVATED" });
    console.log("Modifying slug/code/status on PATCH /:id ->", securityCheck.status, "(Expected: 400)");
    console.log("Validation Errors:", securityCheck.body?.errors);
    if (securityCheck.status !== 400) throw new Error("Test 7 Failed: Expected 400 for forbidden fields");

    console.log("\n========================================================");
    console.log("✅ ALL STEP 8 ORGANIZATION MANAGEMENT TESTS PASSED!");
    console.log("========================================================");
  } catch (err) {
    console.error("Step 8 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep8Tests();
