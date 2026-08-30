import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
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

const runStep46Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 46 Organization Management & Tenant Administration Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const platformOwnerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    await Organization.deleteMany({ slug: { $in: ["org-vu-46", "org-fast-46", "org-alien-46"] } });
    await User.deleteMany({ email: { $in: ["rector46@vu.edu.pk", "examiner46@vu.edu.pk", "owner46@fast.edu.pk", "eve46@alien.com"] } });
    await Subscription.deleteMany({});

    console.log("\n[TEST 1] Platform Owner Provisions New Organization (Transactional Flow)...");
    const createOrgRes = await request(server, {
      method: "POST",
      path: "/api/v1/organizations",
      headers: { Authorization: `Bearer ${platformOwnerToken}` },
    }, {
      name: "Virtual University 46",
      type: "UNIVERSITY",
      description: "Premier Distance Learning University",
      contact: {
        email: "contact@vu.edu.pk",
        phone: "+92 42 111 880 880",
        website: "https://www.vu.edu.pk",
      },
      address: {
        street: "Sir Syed Memorial Building",
        city: "Islamabad",
        country: "Pakistan",
      },
      settings: {
        timezone: "Asia/Karachi",
        branding: {
          primaryColor: "#0f766e",
          secondaryColor: "#14b8a6",
        },
      },
      owner: {
        firstName: "Dr. Rector",
        lastName: "VU",
        email: "rector46@vu.edu.pk",
      },
    });

    console.log("Create Org Status ->", createOrgRes.status, "Org ID:", createOrgRes.body?.data?.id, "Code:", createOrgRes.body?.data?.code);
    if (createOrgRes.status !== 201 || !createOrgRes.body?.data?.id) {
      throw new Error("Test 1 Failed: Organization creation failed!");
    }

    const orgAId = createOrgRes.body.data.id;

    // Verify Subscription Auto-Created
    const subA = await Subscription.findOne({ organizationId: orgAId });
    console.log("Auto-Provisioned Subscription -> Plan:", subA?.plan, "Status:", subA?.status);
    if (!subA || subA.plan !== "FREE_TRIAL" || subA.status !== "TRIALING") {
      throw new Error("Test 1.2 Failed: Auto-provisioned subscription missing!");
    }

    // Verify Owner User & Membership Created
    const ownerUser = await User.findOne({ email: "rector46@vu.edu.pk" });
    const ownerMembership = await UserMembership.findOne({
      userId: ownerUser._id,
      organizationId: orgAId,
    }).populate("roleId");

    console.log("Owner Role ->", ownerMembership?.roleId?.name, "Membership Status:", ownerMembership?.status);
    if (ownerMembership?.roleId?.name !== ORGANIZATION_ROLES.ORGANIZATION_OWNER || ownerMembership?.status !== "ACTIVE") {
      throw new Error("Test 1.3 Failed: Owner user membership creation failed!");
    }

    const ownerToken = generateAccessToken({ sub: ownerUser._id.toString() });

    console.log("\n[TEST 2] Organization Owner Updates Settings & Branding...");
    const updateRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgAId}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      description: "Updated Description: Leading Online Education Institution",
      settings: {
        branding: {
          primaryColor: "#1e3a8a",
          secondaryColor: "#3b82f6",
        },
      },
    });
    console.log("Update Org Status ->", updateRes.status, "New Primary Color:", updateRes.body?.data?.settings?.branding?.primaryColor);
    if (updateRes.status !== 200 || updateRes.body?.data?.settings?.branding?.primaryColor !== "#1e3a8a") {
      throw new Error("Test 2 Failed: Organization update failed!");
    }

    console.log("\n[TEST 3] Organization Staff Invitation Workflow...");
    const inviteRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgAId}/members/invite`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      email: "examiner46@vu.edu.pk",
      firstName: "Prof. Tariq",
      lastName: "Examiner",
      roleName: ORGANIZATION_ROLES.EXAMINER,
    });
    console.log("Staff Invite Status ->", inviteRes.status, "Invited Email:", inviteRes.body?.data?.email, "Role:", inviteRes.body?.data?.role);
    if (inviteRes.status !== 201 || inviteRes.body?.data?.role !== ORGANIZATION_ROLES.EXAMINER) {
      throw new Error("Test 3.1 Failed: Staff invitation failed!");
    }

    // List Members
    const listMembersRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgAId}/members`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("Organization Member Count ->", listMembersRes.body?.data?.items?.length);
    if (listMembersRes.status !== 200 || listMembersRes.body?.data?.items?.length !== 2) {
      throw new Error("Test 3.2 Failed: Member list count mismatch!");
    }

    console.log("\n[TEST 4] Multi-Organization Membership & Context Switching...");
    // Create Org B (FAST)
    const orgB = await Organization.create({
      name: "FAST University 46",
      slug: "org-fast-46",
      code: "FAST46",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    // Make Dr. Rector an Examiner in Org B as well
    await UserMembership.create({
      userId: ownerUser._id,
      organizationId: orgB._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    // 4.1 Switch context into Org B
    const switchRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgB._id}/switch`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("Switch Status ->", switchRes.status, "New Org Context:", switchRes.body?.data?.organizationName, "Role:", switchRes.body?.data?.role);
    if (switchRes.status !== 200 || switchRes.body?.data?.organizationName !== "FAST University 46" || switchRes.body?.data?.role !== ORGANIZATION_ROLES.EXAMINER) {
      throw new Error("Test 4.1 Failed: Organization context switching failed!");
    }

    // 4.2 Switch to unauthorized Org C -> Blocked
    const alienOrg = await Organization.create({
      name: "Alien Org 46",
      slug: "org-alien-46",
      code: "ALIEN46",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const unauthSwitchRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${alienOrg._id}/switch`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("Unauthorized Switch Status ->", unauthSwitchRes.status);
    if (unauthSwitchRes.status !== 403) {
      throw new Error("Test 4.2 Failed: Allowed switching into unauthorized organization!");
    }

    console.log("\n[TEST 5] Organization Lifecycle: Suspension & Activation...");
    // 5.1 Platform Owner suspends Org A
    const suspendRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgAId}/suspend`,
      headers: { Authorization: `Bearer ${platformOwnerToken}` },
    });
    console.log("Suspend Status ->", suspendRes.status, "Org Status:", suspendRes.body?.data?.status);
    if (suspendRes.status !== 200 || suspendRes.body?.data?.status !== "SUSPENDED") {
      throw new Error("Test 5.1 Failed: Organization suspension failed!");
    }

    // Non-platform user cannot suspend -> Blocked
    const hackerSuspendRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgAId}/suspend`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("Non-Platform Suspend Status ->", hackerSuspendRes.status);
    if (hackerSuspendRes.status !== 403) {
      throw new Error("Test 5.2 Failed: Non-platform user was able to suspend organization!");
    }

    // 5.2 Platform Owner activates Org A
    const activateRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgAId}/activate`,
      headers: { Authorization: `Bearer ${platformOwnerToken}` },
    });
    console.log("Activate Status ->", activateRes.status, "Org Status:", activateRes.body?.data?.status);
    if (activateRes.status !== 200 || activateRes.body?.data?.status !== "ACTIVE") {
      throw new Error("Test 5.3 Failed: Organization activation failed!");
    }

    console.log("\n[TEST 6] Cross-Tenant Security Isolation...");
    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Alien",
      email: "eve46@alien.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const eveToken = generateAccessToken({ sub: eveUser._id.toString() });

    // Eve from Alien Org tries to view Org A members -> Blocked
    const eveMemberRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgAId}/members`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Alien Member Access Status ->", eveMemberRes.status);
    if (eveMemberRes.status !== 403) {
      throw new Error("Test 6.1 Failed: Cross-tenant member query was not blocked with 403!");
    }

    // Eve tries to update Org A -> Blocked
    const eveUpdateRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/organizations/${orgAId}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    }, { name: "Hacked Org Name" });
    console.log("Eve Alien Update Status ->", eveUpdateRes.status);
    if (eveUpdateRes.status !== 403) {
      throw new Error("Test 6.2 Failed: Cross-tenant update was not blocked with 403!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 46 ORGANIZATION MANAGEMENT & TENANT ADMIN TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 46 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep46Tests();
