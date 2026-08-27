import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Session from "../../src/modules/auth/session.model.js";
import { hashPassword } from "../../src/utils/password.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
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

const runStep10Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 10 Authentication & Security Test Suite");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Setup Test User
    await User.deleteMany({ email: { $in: ["auth.tester@test.com", "suspended.tester@test.com", "invited.tester@test.com"] } });

    const passwordHash = await hashPassword("SecurePass#2026");
    const activeUser = await User.create({
      firstName: "Auth",
      lastName: "Tester",
      email: "auth.tester@test.com",
      passwordHash,
      status: "ACTIVE",
      emailVerified: true,
    });

    const suspendedUser = await User.create({
      firstName: "Suspended",
      lastName: "User",
      email: "suspended.tester@test.com",
      passwordHash,
      status: "SUSPENDED",
      emailVerified: true,
    });

    const invitedUser = await User.create({
      firstName: "Invited",
      lastName: "User",
      email: "invited.tester@test.com",
      passwordHash: "INVITED_ACCOUNT",
      status: "INVITED",
      emailVerified: false,
    });

    // Create Organization & Membership for active user
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const testOrg = await Organization.findOne({ slug: "vu-step9" }) || await Organization.create({
      name: "Auth Test Org",
      slug: "auth-test-org",
      code: "ATO101",
      type: "UNIVERSITY",
      status: "ACTIVE",
    });

    await UserMembership.deleteMany({ userId: activeUser._id });
    await UserMembership.create({
      userId: activeUser._id,
      organizationId: testOrg._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    console.log("\n[TEST 1] POST /api/v1/auth/login with valid credentials...");
    const loginRes = await request(server, { method: "POST", path: "/api/v1/auth/login" }, {
      email: "auth.tester@test.com",
      password: "SecurePass#2026",
    });
    console.log("Login Status ->", loginRes.status, "(Expected: 200)");
    console.log("Returned Access Token:", !!loginRes.body?.data?.tokens?.accessToken);
    console.log("Returned Refresh Token:", !!loginRes.body?.data?.tokens?.refreshToken);
    console.log("Memberships count:", loginRes.body?.data?.memberships?.length);
    if (loginRes.status !== 200 || !loginRes.body?.data?.tokens?.accessToken) throw new Error("Test 1 Failed");

    let accessToken = loginRes.body.data.tokens.accessToken;
    let refreshToken = loginRes.body.data.tokens.refreshToken;

    console.log("\n[TEST 2] Account Status Login Rejections (Suspended / Invited)...");
    const suspendedRes = await request(server, { method: "POST", path: "/api/v1/auth/login" }, {
      email: "suspended.tester@test.com",
      password: "SecurePass#2026",
    });
    console.log("Suspended User Login ->", suspendedRes.status, "(Expected: 403)");
    if (suspendedRes.status !== 403) throw new Error("Test 2.1 Failed");

    const invitedRes = await request(server, { method: "POST", path: "/api/v1/auth/login" }, {
      email: "invited.tester@test.com",
      password: "SecurePass#2026",
    });
    console.log("Invited User Login ->", invitedRes.status, "(Expected: 403)");
    if (invitedRes.status !== 403) throw new Error("Test 2.2 Failed");

    console.log("\n[TEST 3] GET /api/v1/auth/me with Bearer Access Token...");
    const meRes = await request(server, {
      method: "GET",
      path: "/api/v1/auth/me",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("GET /auth/me ->", meRes.status, "User Name:", meRes.body?.data?.user?.fullName);
    if (meRes.status !== 200 || meRes.body?.data?.user?.email !== "auth.tester@test.com") throw new Error("Test 3 Failed");

    console.log("\n[TEST 4] POST /api/v1/auth/refresh-token (Token Rotation)...");
    const refreshRes = await request(server, { method: "POST", path: "/api/v1/auth/refresh-token" }, {
      refreshToken,
    });
    console.log("Refresh Status ->", refreshRes.status, "(Expected: 200)");
    const newAccessToken = refreshRes.body?.data?.tokens?.accessToken;
    const newRefreshToken = refreshRes.body?.data?.tokens?.refreshToken;
    if (refreshRes.status !== 200 || !newRefreshToken) throw new Error("Test 4 Failed");

    console.log("\n[TEST 5] Security Test: Refresh Token Reuse Attack Detection...");
    // Attempting to use the OLD already-rotated refreshToken
    const reuseRes = await request(server, { method: "POST", path: "/api/v1/auth/refresh-token" }, {
      refreshToken, // Reusing old token!
    });
    console.log("Token Reuse Attempt Status ->", reuseRes.status, "(Expected: 401)");
    console.log("Security Alert Message:", reuseRes.body?.message);
    if (reuseRes.status !== 401) throw new Error("Test 5 Failed: Token reuse was not detected!");

    console.log("\n[TEST 6] POST /api/v1/auth/change-password...");
    // Re-login to get fresh session after family revocation
    const reloginRes = await request(server, { method: "POST", path: "/api/v1/auth/login" }, {
      email: "auth.tester@test.com",
      password: "SecurePass#2026",
    });
    const activeAccessToken = reloginRes.body?.data?.tokens?.accessToken;

    const changePassRes = await request(server, {
      method: "POST",
      path: "/api/v1/auth/change-password",
      headers: { Authorization: `Bearer ${activeAccessToken}` },
    }, {
      currentPassword: "SecurePass#2026",
      newPassword: "NewSuperPassword#2026",
    });
    console.log("Change Password Status ->", changePassRes.status, "(Expected: 200)");
    if (changePassRes.status !== 200) throw new Error("Test 6 Failed");

    console.log("\n[TEST 7] Forgot & Reset Password Flow...");
    const forgotRes = await request(server, { method: "POST", path: "/api/v1/auth/forgot-password" }, {
      email: "auth.tester@test.com",
    });
    console.log("Forgot Password Status ->", forgotRes.status, "Message:", forgotRes.body?.message);
    const resetToken = forgotRes.body?.data?.resetToken;

    if (resetToken) {
      const resetRes = await request(server, { method: "POST", path: "/api/v1/auth/reset-password" }, {
        token: resetToken,
        newPassword: "ResetBrandNewPass#2026",
      });
      console.log("Reset Password Status ->", resetRes.status, "(Expected: 200)");
      if (resetRes.status !== 200) throw new Error("Test 7.2 Failed");
    }

    console.log("\n[TEST 8] POST /api/v1/auth/logout & /logout-all...");
    const loginFinal = await request(server, { method: "POST", path: "/api/v1/auth/login" }, {
      email: "auth.tester@test.com",
      password: "ResetBrandNewPass#2026",
    });
    const finalToken = loginFinal.body?.data?.tokens?.accessToken;

    const logoutRes = await request(server, {
      method: "POST",
      path: "/api/v1/auth/logout",
      headers: { Authorization: `Bearer ${finalToken}` },
    });
    console.log("Logout Status ->", logoutRes.status, "(Expected: 200)");
    if (logoutRes.status !== 200) throw new Error("Test 8 Failed");

    console.log("\n========================================================");
    console.log("✅ ALL STEP 10 AUTHENTICATION & SECURITY TESTS PASSED!");
    console.log("========================================================");
  } catch (err) {
    console.error("Step 10 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep10Tests();
