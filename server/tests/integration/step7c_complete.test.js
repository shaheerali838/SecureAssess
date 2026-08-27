import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { generateAccessToken } from "../../src/utils/token.js";
import http from "http";

/**
 * Lightweight HTTP request helper for testing Express endpoints directly
 */
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

const runStep7cCompleteTest = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 7C Full Suite Verification");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Setup Platform Owner & Non-Platform User
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    if (!platformOwner) {
      throw new Error("PLATFORM_OWNER user not found in DB. Please run database seeders.");
    }
    const ownerToken = generateAccessToken({ sub: platformOwner._id.toString() });

    // Create / find a non-platform regular candidate/staff user
    let regularUser = await User.findOne({ email: "test.staff@gmail.com" });
    if (!regularUser) {
      regularUser = await User.create({
        firstName: "Test",
        lastName: "Staff",
        email: "test.staff@gmail.com",
        passwordHash: "$2b$10$dummyHashForTestingPurposesOnly12345",
        platformRole: null,
        status: "ACTIVE",
        emailVerified: true,
      });
    }
    const regularUserToken = generateAccessToken({ sub: regularUser._id.toString() });

    // Clean up test organizations & test owner before running
    await Organization.deleteMany({ slug: { $regex: /^virtual-university/ } });
    await User.deleteMany({ email: "ahmed@vu.edu.pk" });

    // --- TEST 1: Unauthenticated request ---
    console.log("\n[TEST 1] POST /api/v1/organizations without auth token...");
    const res1 = await request(server, {
      method: "POST",
      path: "/api/v1/organizations",
    }, { name: "Virtual University" });
    console.log("Response Status:", res1.status, "(Expected: 401)");
    if (res1.status !== 401) throw new Error(`Test 1 Failed: Expected 401 but got ${res1.status}`);

    // --- TEST 2: Organization / Regular user attempting platform action ---
    console.log("\n[TEST 2] POST /api/v1/organizations with regular user token...");
    const res2 = await request(server, {
      method: "POST",
      path: "/api/v1/organizations",
      headers: { Authorization: `Bearer ${regularUserToken}` },
    }, {
      name: "Virtual University",
      type: "UNIVERSITY",
      owner: { firstName: "Ahmed", lastName: "Khan", email: "ahmed@vu.edu.pk" },
    });
    console.log("Response Status:", res2.status, "(Expected: 403)");
    if (res2.status !== 403) throw new Error(`Test 2 Failed: Expected 403 but got ${res2.status}`);

    // --- TEST 3: Invalid validation payload ---
    console.log("\n[TEST 3] POST /api/v1/organizations with invalid type & missing owner...");
    const res3 = await request(server, {
      method: "POST",
      path: "/api/v1/organizations",
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      name: "VU",
      type: "INVALID_TYPE",
    });
    console.log("Response Status:", res3.status, "(Expected: 400)");
    console.log("Validation Errors:", res3.body?.errors || res3.body?.message);
    if (res3.status !== 400) throw new Error(`Test 3 Failed: Expected 400 but got ${res3.status}`);

    // --- TEST 4: Successful Organization Creation by PLATFORM_OWNER ---
    console.log("\n[TEST 4] POST /api/v1/organizations as PLATFORM_OWNER (Virtual University)...");
    const payload = {
      name: "Virtual University",
      type: "UNIVERSITY",
      contact: {
        email: "admin@vu.edu.pk",
        phone: "+923001234567",
        website: "https://www.vu.edu.pk",
      },
      address: {
        country: "Pakistan",
        city: "Islamabad",
        addressLine1: "Sir Syed Memorial Building, 19-Ataturk Avenue, G-5/1",
        postalCode: "44000",
      },
      owner: {
        firstName: "Ahmed",
        lastName: "Khan",
        email: "ahmed@vu.edu.pk",
      },
    };

    const res4 = await request(server, {
      method: "POST",
      path: "/api/v1/organizations",
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, payload);

    console.log("Response Status:", res4.status, "(Expected: 201)");
    console.log("Created Organization DTO:", JSON.stringify(res4.body?.data, null, 2));
    if (res4.status !== 201) throw new Error(`Test 4 Failed: Expected 201 but got ${res4.status}`);

    const orgData = res4.body?.data;
    if (!orgData?.id || orgData.name !== "Virtual University" || orgData.slug !== "virtual-university") {
      throw new Error("Test 4 Failed: Output DTO does not match expected fields");
    }

    // --- TEST 5: Direct MongoDB Data Integrity & Transaction Verification ---
    console.log("\n[TEST 5] Verifying MongoDB database entities & relationships...");
    const dbOrg = await Organization.findById(orgData.id);
    const dbOwner = await User.findOne({ email: "ahmed@vu.edu.pk" });
    const ownerRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_OWNER });
    const dbMembership = await UserMembership.findOne({
      userId: dbOwner._id,
      organizationId: dbOrg._id,
    });

    console.log("1. Organization in DB:", {
      id: dbOrg._id.toString(),
      name: dbOrg.name,
      slug: dbOrg.slug,
      code: dbOrg.code,
      status: dbOrg.status,
    });

    console.log("2. Owner User in DB:", {
      id: dbOwner._id.toString(),
      email: dbOwner.email,
      name: `${dbOwner.firstName} ${dbOwner.lastName}`,
      status: dbOwner.status,
      platformRole: dbOwner.platformRole,
    });

    console.log("3. UserMembership in DB:", {
      id: dbMembership._id.toString(),
      userId: dbMembership.userId.toString(),
      organizationId: dbMembership.organizationId.toString(),
      roleId: dbMembership.roleId.toString(),
      isOwnerRole: dbMembership.roleId.toString() === ownerRole._id.toString(),
      status: dbMembership.status,
    });

    if (!dbOrg || !dbOwner || !dbMembership) {
      throw new Error("Test 5 Failed: One or more database records are missing");
    }
    if (dbMembership.roleId.toString() !== ownerRole._id.toString()) {
      throw new Error("Test 5 Failed: Membership roleId is not ORGANIZATION_OWNER");
    }

    console.log("\n========================================================");
    console.log("✅ ALL STEP 7C COMPLETE TESTS & SECURITY CHECKS PASSED!");
    console.log("========================================================");
  } catch (err) {
    console.error("Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep7cCompleteTest();
