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

const runStep12Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 12 Organization Management Suite");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Setup Platform Owner
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const ownerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    const orgOwnerRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });

    // Clean up test orgs
    await Organization.deleteMany({ slug: { $in: ["virtual-university-12", "abc-corp-12"] } });
    await User.deleteMany({ email: { $in: ["owner.vu12@test.com", "examiner.vu12@test.com"] } });

    console.log("\n[TEST 1] Platform Owner creates Organization A (Virtual University 12)...");
    const createRes = await request(server, {
      method: "POST",
      path: "/api/v1/organizations",
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      name: "Virtual University 12",
      type: "UNIVERSITY",
      description: "Premier online virtual university",
      contact: { email: "admin@vu.edu.pk", phone: "+923001234567" },
      owner: { firstName: "Ahmed", lastName: "Khan", email: "owner.vu12@test.com" },
    });
    console.log("Create Org Status ->", createRes.status, "(Expected: 201)");
    console.log("Generated Slug:", createRes.body?.data?.slug);
    console.log("Generated Code:", createRes.body?.data?.code);
    if (createRes.status !== 201 || createRes.body?.data?.slug !== "virtual-university-12") throw new Error("Test 1 Failed");

    const orgAId = createRes.body?.data?.id;
    const orgAOwnerId = createRes.body?.data?.owner?.id;

    // Simulate owner accepting invitation & activating account
    await User.findByIdAndUpdate(orgAOwnerId, { status: "ACTIVE" });
    const orgAOwnerToken = generateAccessToken({ sub: orgAOwnerId.toString() });

    // Create Organization B for cross-tenant testing
    const orgB = await Organization.create({
      name: "ABC Corp 12",
      slug: "abc-corp-12",
      code: "ABC-9002",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    // Create Examiner in Organization A
    const examinerUser = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "examiner.vu12@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const examinerToken = generateAccessToken({ sub: examinerUser._id.toString() });

    await UserMembership.create({
      userId: examinerUser._id,
      organizationId: orgAId,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    console.log("\n[TEST 2] Organization Owner attempts to create another organization (403 Forbidden)...");
    const orgOwnerCreateRes = await request(server, {
      method: "POST",
      path: "/api/v1/organizations",
      headers: { Authorization: `Bearer ${orgAOwnerToken}` },
    }, {
      name: "Rogue Organization",
      type: "CORPORATE",
      owner: { firstName: "Rogue", lastName: "Owner", email: "rogue@test.com" },
    });
    console.log("Org Owner Create Org Status ->", orgOwnerCreateRes.status, "(Expected: 403)");
    if (orgOwnerCreateRes.status !== 403) throw new Error("Test 2 Failed: Org Owner created organization!");

    console.log("\n[TEST 3] Organization A Admin requests Organization B (403 Forbidden)...");
    const crossOrgRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgB._id}`,
      headers: { Authorization: `Bearer ${orgAOwnerToken}` },
    });
    console.log("Cross Org Request Status ->", crossOrgRes.status, "(Expected: 403)");
    if (crossOrgRes.status !== 403) throw new Error("Test 3 Failed: Cross tenant access was not blocked!");

    console.log("\n[TEST 4] Organization Owner updates Organization A (200 OK)...");
    const updateRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgAId}`,
      headers: { Authorization: `Bearer ${orgAOwnerToken}` },
    }, {
      description: "Updated description for Virtual University",
      settings: {
        timezone: "Asia/Karachi",
        assessmentSettings: { allowCandidatePause: true, defaultDurationMinutes: 90 },
      },
    });
    console.log("Update Org Status ->", updateRes.status, "(Expected: 200)");
    console.log("Updated Duration:", updateRes.body?.data?.settings?.assessmentSettings?.defaultDurationMinutes);
    if (updateRes.status !== 200 || updateRes.body?.data?.settings?.assessmentSettings?.defaultDurationMinutes !== 90) throw new Error("Test 4 Failed");

    console.log("\n[TEST 5] Examiner attempts to modify organization settings (403 Forbidden)...");
    const examinerUpdateRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgAId}`,
      headers: { Authorization: `Bearer ${examinerToken}` },
    }, {
      description: "Hacked by examiner",
    });
    console.log("Examiner Update Status ->", examinerUpdateRes.status, "(Expected: 403)");
    if (examinerUpdateRes.status !== 403) throw new Error("Test 5 Failed: Examiner was not blocked!");

    console.log("\n[TEST 6] Suspended Organization Status Update & Tenant Middleware Protection...");
    const suspendRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgAId}/status`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      status: "SUSPENDED",
    });
    console.log("Suspend Status ->", suspendRes.status, "New Status:", suspendRes.body?.data?.status);
    if (suspendRes.status !== 200 || suspendRes.body?.data?.status !== "SUSPENDED") throw new Error("Test 6.1 Failed");

    // Reactivate for further tests
    await Organization.findByIdAndUpdate(orgAId, { status: "ACTIVE" });

    console.log("\n[TEST 7] Platform Owner accesses Organization A...");
    const platformViewRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgAId}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("Platform View Status ->", platformViewRes.status, "(Expected: 200)");
    if (platformViewRes.status !== 200) throw new Error("Test 7 Failed");

    console.log("\n[TEST 8] Soft Delete / Deactivate Organization (Platform Owner)...");
    const deleteRes = await request(server, {
      method: "DELETE",
      path: `/api/v1/organizations/${orgAId}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("Delete Status ->", deleteRes.status, "(Expected: 200)");
    const deactivatedOrg = await Organization.findById(orgAId);
    console.log("Deactivated Org in DB Status:", deactivatedOrg.status);
    if (deleteRes.status !== 200 || deactivatedOrg.status !== "DEACTIVATED") throw new Error("Test 8 Failed");

    console.log("\n========================================================");
    console.log("✅ ALL STEP 12 ORGANIZATION MANAGEMENT TESTS PASSED!");
    console.log("========================================================");
  } catch (err) {
    console.error("Step 12 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep12Tests();
