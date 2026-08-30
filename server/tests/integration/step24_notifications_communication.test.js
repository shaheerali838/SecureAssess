import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import NotificationPreference from "../../src/modules/notifications/notification.preferences.model.js";
import { NotificationService } from "../../src/modules/notifications/notification.service.js";
import { runNotificationJob } from "../../src/jobs/notification.job.js";
import { NOTIFICATION_TYPES } from "../../src/modules/notifications/notification.constants.js";
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

const runStep24Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 24 Notifications & Communication Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Roles & Clean State
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-24", "org-alien-24"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner24@test.com", "alice24@vu.edu.pk", "eve24@alien.com"] } });
    await Notification.deleteMany({});
    await NotificationPreference.deleteMany({});

    // 2. Setup Org & Users
    const orgA = await Organization.create({
      name: "Virtual University 24",
      slug: "org-vu-24",
      code: "VU24",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner24@test.com",
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
      email: "alice24@vu.edu.pk",
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
      candidateCode: "VU-CAND-24",
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice24@vu.edu.pk",
      status: "ACTIVE",
    });

    // Alien Org B & Eve (For Isolation)
    const orgB = await Organization.create({
      name: "Alien Org 24",
      slug: "org-alien-24",
      code: "ALIEN24",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve24@alien.com",
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

    console.log("\n[TEST 1] Assessment Assignment Notification Dispatch...");
    await NotificationService.notify({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      data: {
        assessmentTitle: "Cloud Security Architecture",
        startDate: "2026-09-01",
        deadline: "2026-09-05",
      },
    });

    const inAppCount = await Notification.countDocuments({
      recipientId: aliceUser._id,
      channel: "IN_APP",
    });
    const emailCount = await Notification.countDocuments({
      recipientId: aliceUser._id,
      channel: "EMAIL",
    });
    console.log("Created Notifications -> In-App Count:", inAppCount, "Email Count:", emailCount);
    if (inAppCount < 1 || emailCount < 1) throw new Error("Test 1 Failed: Notifications were not dispatched across channels!");

    console.log("\n[TEST 2] Unread Counter & Paginated List APIs...");
    const unreadCountRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications/unread-count`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const unreadAliasRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications/unread`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Unread Count API -> Status:", unreadCountRes.status, "Count:", unreadCountRes.body?.data?.count);
    console.log("Unread Alias API -> Status:", unreadAliasRes.status, "Count:", unreadAliasRes.body?.data?.count);
    if (unreadCountRes.body?.data?.count < 1 || unreadAliasRes.body?.data?.count !== unreadCountRes.body?.data?.count) {
      throw new Error("Test 2.1 Failed: Unread count mismatch!");
    }

    const listRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications?page=1&limit=10`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("List Notifications -> Status:", listRes.status, "Items Returned:", listRes.body?.data?.items?.length);
    if (listRes.status !== 200 || !listRes.body?.data?.items?.length) {
      throw new Error("Test 2.2 Failed: Could not fetch user notifications list!");
    }
    const sampleNotif = listRes.body.data.items[0];

    console.log("\n[TEST 3] Mark Single Notification as Read...");
    const readRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/${sampleNotif._id}/read`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Mark as Read -> Status:", readRes.status, "Notification Status:", readRes.body?.data?.status, "ReadAt:", readRes.body?.data?.readAt);
    if (readRes.status !== 200 || readRes.body?.data?.status !== "READ" || !readRes.body?.data?.readAt) {
      throw new Error("Test 3 Failed: Notification mark as read failed!");
    }

    console.log("\n[TEST 4] Create Multiple Notifications & Mark All as Read...");
    await NotificationService.notify({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
      data: { assessmentTitle: "Cloud Security Architecture", score: 95, grade: "A+" },
    });
    await NotificationService.notify({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
      data: { assessmentTitle: "Cloud Security Architecture", certificateNumber: "SA-2026-000001", verificationCode: "8Q77-3BZW-8UH6" },
    });

    const readAllRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/read-all`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Mark All as Read -> Status:", readAllRes.status, "Modified:", readAllRes.body?.data?.modifiedCount);

    const postReadAllUnread = await request(server, {
      method: "GET",
      path: `/api/v1/notifications/unread`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Post Read-All Unread Count ->", postReadAllUnread.body?.data?.count);
    if (postReadAllUnread.body?.data?.count !== 0) {
      throw new Error("Test 4 Failed: Mark all as read did not clear unread count!");
    }

    console.log("\n[TEST 5] Soft Delete Notification...");
    const deleteRes = await request(server, {
      method: "DELETE",
      path: `/api/v1/notifications/${sampleNotif._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Delete Notification Status ->", deleteRes.status, "Success:", deleteRes.body?.success);
    if (deleteRes.status !== 200) {
      throw new Error("Test 5 Failed: Notification soft delete failed!");
    }

    console.log("\n[TEST 6] Notification Preferences & Security Alerts Protection...");
    const getPrefsRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications/preferences`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Get Preferences Status ->", getPrefsRes.status, "Email Enabled:", getPrefsRes.body?.data?.email?.enabled);

    const updatePrefsRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/preferences`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      email: { interviewReminder: false },
    });
    console.log("Update Preferences Status ->", updatePrefsRes.status, "Interview Reminder:", updatePrefsRes.body?.data?.email?.interviewReminder);
    if (updatePrefsRes.body?.data?.email?.interviewReminder !== false) {
      throw new Error("Test 6.1 Failed: Preferences update failed!");
    }

    console.log("\n[TEST 7] Proctoring Alert Ingestion & Platform Notifications...");
    // 1. Proctoring Alert
    await NotificationService.notify({
      organizationId: orgA._id,
      recipientId: vuExaminer._id,
      type: NOTIFICATION_TYPES.PROCTORING_ALERT,
      data: {
        candidateName: "Alice Candidate",
        riskLevel: "HIGH",
        event: "Multiple faces detected in frame",
      },
    });
    const procAlert = await Notification.findOne({ recipientId: vuExaminer._id, type: NOTIFICATION_TYPES.PROCTORING_ALERT }).lean();
    console.log("Proctoring Alert Created -> Title:", procAlert?.title, "Message:", procAlert?.message);
    if (!procAlert) throw new Error("Test 7.1 Failed: Proctoring alert notification was not created!");

    // 2. Platform Broadcast (organizationId = null)
    await NotificationService.notify({
      organizationId: null,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      data: { maintenanceWindow: "Tonight at 02:00 UTC" },
    });
    const platformAlert = await Notification.findOne({ recipientId: aliceUser._id, organizationId: null }).lean();
    console.log("Platform Alert Created (orgId null) ->", Boolean(platformAlert), "Title:", platformAlert?.title);
    if (!platformAlert) throw new Error("Test 7.2 Failed: Platform-level notification creation failed!");

    console.log("\n[TEST 8] User Ownership & Cross-Tenant Security Isolation...");
    // Eve cannot mark Alice's notification as read
    const eveReadAliceRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/${procAlert._id}/read`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Access to Examiner Alert -> Status:", eveReadAliceRes.status, "Success:", eveReadAliceRes.body?.success);
    if (eveReadAliceRes.status !== 404) {
      throw new Error("Test 8 Failed: Cross-user notification modification was not prevented!");
    }

    console.log("\n[TEST 9] Asynchronous Notification Email Batch Queue Job...");
    const jobResult = await runNotificationJob();
    console.log("Notification Email Job -> Processed:", jobResult.processed, "Sent:", jobResult.sent);
    if (jobResult.processed < 1) {
      throw new Error("Test 9 Failed: Background notification job failed to process pending queue!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 24 NOTIFICATIONS & COMMUNICATION SYSTEM TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 24 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep24Tests();
