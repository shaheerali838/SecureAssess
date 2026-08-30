import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import NotificationPreference from "../../src/modules/notifications/notificationPreference.model.js";
import { NotificationService } from "../../src/modules/notifications/notification.service.js";
import { runNotificationJob } from "../../src/jobs/notification.job.js";
import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from "../../src/modules/notifications/notification.constants.js";
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

const runStep21Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 21 Notifications Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Roles & Clean Collections
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-21"] } });
    await User.deleteMany({ email: { $in: ["vu.examiner21@test.com", "alice21@vu.edu.pk", "bob21@vu.edu.pk"] } });

    // 2. Setup Org & Users
    const orgA = await Organization.create({
      name: "Virtual University 21",
      slug: "org-vu-21",
      code: "VU21",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner21@test.com",
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

    // Alice Candidate
    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice21@vu.edu.pk",
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

    // Bob Candidate
    const bobUser = await User.create({
      firstName: "Bob",
      lastName: "Candidate",
      email: "bob21@vu.edu.pk",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const bobToken = generateAccessToken({ sub: bobUser._id.toString() });

    await UserMembership.create({
      userId: bobUser._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    // 3. Setup Assessment
    const assessmentA = await Assessment.create({
      organizationId: orgA._id,
      title: "Data Structures Final Exam",
      code: "DS-FIN-21",
      type: "MCQ",
      durationSeconds: 3600,
      passingScore: 60,
      createdBy: vuExaminer._id,
      status: "PUBLISHED",
    });

    console.log("\n[TEST 1] Trigger Assessment Assigned Notification...");
    const assignedNotif = await NotificationService.notify({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      data: {
        assessmentTitle: assessmentA.title,
        accessCode: "SA-1234-5678",
      },
    });

    console.log("Assigned Notifications Created Count ->", assignedNotif.length);
    if (assignedNotif.length === 0) throw new Error("Test 1 Failed: Notification was not generated!");

    console.log("\n[TEST 2] Retrieve Candidate Notifications & Unread Count...");
    const notifRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Candidate Notifications Status ->", notifRes.status, "Items:", notifRes.body?.data?.items?.length, "Unread Count:", notifRes.body?.data?.unreadCount);
    if (notifRes.status !== 200 || notifRes.body?.data?.items?.length !== 1 || notifRes.body?.data?.unreadCount !== 1) {
      throw new Error("Test 2.1 Failed: Could not retrieve notifications!");
    }

    const unreadRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications/unread-count`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Unread Count API ->", unreadRes.body?.data?.count);
    if (unreadRes.status !== 200 || unreadRes.body?.data?.count !== 1) throw new Error("Test 2.2 Failed");

    const aliceNotifId = notifRes.body.data.items[0]._id;

    console.log("\n[TEST 3] Mark Notification as Read...");
    const markReadRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/${aliceNotifId}/read`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Mark Read Status ->", markReadRes.status, "Status:", markReadRes.body?.data?.status, "ReadAt:", Boolean(markReadRes.body?.data?.readAt));
    if (markReadRes.status !== 200 || markReadRes.body?.data?.status !== "READ" || !markReadRes.body?.data?.readAt) {
      throw new Error("Test 3 Failed: Mark read failed!");
    }

    const unreadAfter = await request(server, {
      method: "GET",
      path: `/api/v1/notifications/unread-count`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Unread Count After Read ->", unreadAfter.body?.data?.count);
    if (unreadAfter.body?.data?.count !== 0) throw new Error("Test 3.2 Failed: Unread count not 0!");

    console.log("\n[TEST 4] Trigger Result Published & Proctoring Review Required Notifications...");
    // 4.1 Candidate Result Published
    await NotificationService.notify({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
      data: { assessmentTitle: assessmentA.title },
    });

    // 4.2 Examiner Proctoring Review Required
    await NotificationService.notify({
      organizationId: orgA._id,
      recipientId: vuExaminer._id,
      type: NOTIFICATION_TYPES.PROCTORING_REVIEW_REQUIRED,
      data: {
        assessmentTitle: assessmentA.title,
        attemptId: "att-12345",
        riskLevel: "HIGH",
      },
    });

    const examinerNotifs = await request(server, {
      method: "GET",
      path: `/api/v1/notifications`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    });
    console.log("Examiner Notifications -> Total:", examinerNotifs.body?.data?.items?.length, "Type:", examinerNotifs.body?.data?.items[0]?.type);
    if (examinerNotifs.status !== 200 || examinerNotifs.body?.data?.items[0]?.type !== "PROCTORING_REVIEW_REQUIRED") {
      throw new Error("Test 4 Failed: Examiner proctoring notification failed!");
    }

    console.log("\n[TEST 5] Mark All Notifications Read...");
    // Create another notification for Alice
    await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      data: { assessmentTitle: assessmentA.title },
    });

    const readAllRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/read-all`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Read All Status ->", readAllRes.status, "Updated Count:", readAllRes.body?.data?.updatedCount);
    if (readAllRes.status !== 200 || readAllRes.body?.data?.updatedCount < 1) throw new Error("Test 5 Failed");

    console.log("\n[TEST 6] Notification Preferences & Critical Bypass...");
    // Alice disables non-critical in-app notifications
    const prefRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/preferences`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      inApp: { enabled: false },
    });
    console.log("Update Preferences Status ->", prefRes.status, "InApp Enabled:", prefRes.body?.data?.inApp?.enabled);

    // Optional notification is skipped
    const optionalNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_UPDATED,
      channel: NOTIFICATION_CHANNELS.IN_APP,
    });
    console.log("Optional Notification Generated When Disabled ->", optionalNotif);
    if (optionalNotif !== null) throw new Error("Test 6.1 Failed: Disabled notification was generated!");

    // Critical notification (SECURITY_ALERT) is delivered regardless
    const criticalNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      data: { message: "Suspicious login attempt blocked" },
    });
    console.log("Critical Notification Generated Regardless of Preference ->", Boolean(criticalNotif));
    if (!criticalNotif || criticalNotif.type !== "SECURITY_ALERT") throw new Error("Test 6.2 Failed: Critical notification was blocked!");

    console.log("\n[TEST 7] User Ownership & Isolation (Bob cannot read Alice's notification)...");
    const bobStealRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/${aliceNotifId}/read`,
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log("Bob Unauthorized Mark Read ->", bobStealRes.status, "Success:", bobStealRes.body?.success);
    if (bobStealRes.status !== 404 && bobStealRes.status !== 403) throw new Error("Test 7 Failed: Cross-user authorization breach!");

    console.log("\n[TEST 8] Notification Queue Job Worker Processing...");
    // Create pending email notification
    await Notification.create({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      title: "Email Assignment Alert",
      message: "Please check your exam dashboard.",
      status: NOTIFICATION_STATUSES.PENDING,
    });

    const jobResult = await runNotificationJob();
    console.log("Notification Job Execution Result -> Processed:", jobResult.processed, "Sent:", jobResult.sent, "Failed:", jobResult.failed);
    if (jobResult.sent < 1) throw new Error("Test 8 Failed: Notification queue worker failed!");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 21 NOTIFICATIONS & COMMUNICATION SYSTEM TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 21 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep21Tests();
