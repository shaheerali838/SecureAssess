import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Department from "../../src/modules/departments/department.model.js";
import Program from "../../src/modules/programs/program.model.js";
import Subject from "../../src/modules/subjects/subject.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import AssessmentAssignment from "../../src/modules/assessmentAssignments/assessmentAssignment.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import NotificationPreference from "../../src/modules/notifications/notificationPreference.model.js";
import { NotificationService } from "../../src/modules/notifications/notification.service.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS, NOTIFICATION_PRIORITIES } from "../../src/modules/notifications/notification.constants.js";
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

const runStep31Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 31 Notifications & Communication System Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions freshly synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state & Roles
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-31", "org-alien-31"] } });
    await User.deleteMany({ email: { $in: ["vu.admin31@test.com", "alice31@vu.edu.pk", "bob31@vu.edu.pk", "eve31@alien.com"] } });
    await Notification.deleteMany({});
    await NotificationPreference.deleteMany({});

    // 2. Setup Organizations & Users
    const orgA = await Organization.create({
      name: "Virtual University 31",
      slug: "org-vu-31",
      code: "VU31",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const vuAdmin = await User.create({
      firstName: "VU",
      lastName: "Admin",
      email: "vu.admin31@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const vuAdminToken = generateAccessToken({ sub: vuAdmin._id.toString() });

    await UserMembership.create({
      userId: vuAdmin._id,
      organizationId: orgA._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Candidate",
      email: "alice31@vu.edu.pk",
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

    const bobUser = await User.create({
      firstName: "Bob",
      lastName: "Candidate",
      email: "bob31@vu.edu.pk",
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

    // Alien Org B & Eve
    const orgB = await Organization.create({
      name: "Alien Org 31",
      slug: "org-alien-31",
      code: "ALIEN31",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Attacker",
      email: "eve31@alien.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const eveToken = generateAccessToken({ sub: eveUser._id.toString() });

    console.log("\n[TEST 1] Trigger Assessment Assigned Notification...");
    const assignmentNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      senderId: vuAdmin._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: "Network Security Assessment Assigned",
      message: "You have been assigned to CS504 Midterm Exam.",
      data: { assessmentId: "assessment_123", assignmentId: "assign_456" },
      idempotencyKey: "assessment:assign_456:alice:in_app",
    });

    console.log("Notification Created -> ID:", assignmentNotif._id, "Status:", assignmentNotif.status, "Priority:", assignmentNotif.priority);
    if (!assignmentNotif || assignmentNotif.status !== "SENT" || assignmentNotif.priority !== "NORMAL") {
      throw new Error("Test 1 Failed: Assessment assigned notification creation failed!");
    }

    console.log("\n[TEST 2] Candidate Queries Unread Count & Notification Feed...");
    // 2.1 Unread Count
    const unreadRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications/unread-count?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Unread Count ->", unreadRes.body?.data?.count);
    if (unreadRes.status !== 200 || unreadRes.body?.data?.count !== 1) {
      throw new Error("Test 2.1 Failed: Unread count query failed!");
    }

    // 2.2 Notification Feed
    const listRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Notification Count ->", listRes.body?.data?.items?.length, "Title:", listRes.body?.data?.items?.[0]?.title);
    if (listRes.status !== 200 || listRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 2.2 Failed: Notification list retrieval failed!");
    }

    console.log("\n[TEST 3] Idempotency Protection against Duplicate Notifications...");
    const duplicateNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      idempotencyKey: "assessment:assign_456:alice:in_app",
      title: "Duplicate notification attempt",
      message: "Duplicate message",
    });
    console.log("Duplicate Check -> Same ID:", duplicateNotif._id.toString() === assignmentNotif._id.toString());
    const totalCountAfterDup = await Notification.countDocuments({ recipientId: aliceUser._id });
    if (totalCountAfterDup !== 1 || duplicateNotif._id.toString() !== assignmentNotif._id.toString()) {
      throw new Error("Test 3 Failed: Idempotency failed to prevent duplicate notification!");
    }

    console.log("\n[TEST 4] Candidate Marks Notification as Read & Mark All As Read...");
    // 4.1 Mark single as read
    const markRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/${assignmentNotif._id}/read?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Mark as Read Status ->", markRes.status, "ReadAt:", markRes.body?.data?.readAt);
    if (markRes.status !== 200 || !markRes.body?.data?.readAt) {
      throw new Error("Test 4.1 Failed: Mark as read failed!");
    }

    // Check unread count is now 0
    const unreadPostRead = await request(server, {
      method: "GET",
      path: `/api/v1/notifications/unread-count?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    if (unreadPostRead.body?.data?.count !== 0) {
      throw new Error("Test 4.1 Failed: Unread count did not decrease to 0!");
    }

    // 4.2 Create 2 more notifications and mark all as read
    await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
      title: "Result Published",
      message: "Your exam result is ready.",
    });
    await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.EXAM_REMINDER,
      title: "Exam Reminder",
      message: "Exam starts in 24 hours.",
    });

    const markAllRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/read-all?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Mark All Read -> Updated Count:", markAllRes.body?.data?.updatedCount);
    if (markAllRes.status !== 200 || markAllRes.body?.data?.updatedCount !== 2) {
      throw new Error("Test 4.2 Failed: Mark all as read failed!");
    }

    console.log("\n[TEST 5] Notification Preferences & Security Alert Delivery...");
    // 5.1 Alice disables in-app notifications
    const prefUpdateRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/preferences?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      inApp: { enabled: false },
    });
    console.log("Preferences Updated -> InApp Enabled:", prefUpdateRes.body?.data?.inApp?.enabled);
    if (prefUpdateRes.status !== 200 || prefUpdateRes.body?.data?.inApp?.enabled !== false) {
      throw new Error("Test 5.1 Failed: Preferences update failed!");
    }

    // 5.2 Attempt non-critical notification -> Should be suppressed
    const suppressedNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      title: "Suppressed Notification",
      message: "This should be suppressed.",
    });
    console.log("Suppressed Non-Critical Notification ->", suppressedNotif);
    if (suppressedNotif !== null) {
      throw new Error("Test 5.2 Failed: Disabled in-app preference was not respected!");
    }

    // 5.3 Critical Security Alert -> Must NOT be suppressed
    const securityAlertNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
      priority: NOTIFICATION_PRIORITIES.URGENT,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      title: "Security Alert",
      message: "Suspicious login detected.",
    });
    console.log("Security Alert Created -> ID:", securityAlertNotif?._id, "Priority:", securityAlertNotif?.priority);
    if (!securityAlertNotif || securityAlertNotif.priority !== "URGENT") {
      throw new Error("Test 5.3 Failed: Security alert was improperly suppressed!");
    }

    console.log("\n[TEST 6] Bulk Notifications Dispatch...");
    await NotificationService.updatePreferences(aliceUser._id, { inApp: { enabled: true } });
    const bulkResult = await NotificationService.sendBulkNotifications({
      organizationId: orgA._id,
      recipientIds: [aliceUser._id, bobUser._id],
      type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
      title: "System Maintenance Notice",
      message: "Scheduled maintenance tonight at midnight UTC.",
      priority: NOTIFICATION_PRIORITIES.NORMAL,
    });
    console.log("Bulk Dispatch Count ->", bulkResult.count);
    if (bulkResult.count !== 2) {
      throw new Error("Test 6 Failed: Bulk notifications dispatch failed!");
    }

    console.log("\n[TEST 7] Cross-User & Tenant Isolation Verification...");
    // 7.1 Bob cannot mark Alice's notification as read
    const crossReadRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/${assignmentNotif._id}/read?organizationId=${orgA._id}`,
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log("Bob Mark Alice Notif -> Status:", crossReadRes.status);
    if (crossReadRes.status !== 404) {
      throw new Error("Test 7.1 Failed: Cross-user notification modification was not blocked!");
    }

    // 7.2 Eve in Org B cannot see Alice's notifications
    const eveListRes = await request(server, {
      method: "GET",
      path: `/api/v1/notifications?organizationId=${orgB._id}`,
      headers: { Authorization: `Bearer ${eveToken}` },
    });
    console.log("Eve Notifications Count ->", eveListRes.body?.data?.items?.length);
    if (eveListRes.status !== 200 || eveListRes.body?.data?.items?.length !== 0) {
      throw new Error("Test 7.2 Failed: Cross-tenant notification leakage detected!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 31 NOTIFICATIONS & COMMUNICATION SYSTEM TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 31 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep31Tests();
