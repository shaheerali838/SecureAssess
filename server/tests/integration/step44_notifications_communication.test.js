import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import NotificationPreference from "../../src/modules/notifications/notificationPreference.model.js";
import { NotificationService } from "../../src/modules/notifications/notification.service.js";
import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from "../../src/modules/notifications/notification.constants.js";
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
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runStep44Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 44 Notifications & Communication Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean state
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-vu-44", "org-alien-44"] } });
    await User.deleteMany({ email: { $in: ["alice44@vu.edu.pk", "bob44@vu.edu.pk", "eve44@alien.com"] } });
    await Notification.deleteMany({});
    await NotificationPreference.deleteMany({});

    // 2. Setup Organization A & Users
    const orgA = await Organization.create({
      name: "Virtual University 44",
      slug: "org-vu-44",
      code: "VU44",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const aliceUser = await User.create({
      firstName: "Alice",
      lastName: "Notify",
      email: "alice44@vu.edu.pk",
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
      lastName: "Recipient",
      email: "bob44@vu.edu.pk",
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
      name: "Alien Org 44",
      slug: "org-alien-44",
      code: "ALIEN44",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const eveUser = await User.create({
      firstName: "Eve",
      lastName: "Alien",
      email: "eve44@alien.com",
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

    console.log("\n[TEST 1] Creating Domain Event Notifications...");
    // 1.1 Alice Notification 1: Assessment Assigned
    const notif1 = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      title: "New Assessment Assigned",
      message: "You have been assigned the CS801 Final Examination.",
      data: { assessmentId: new mongoose.Types.ObjectId() },
    });

    // 1.2 Alice Notification 2: Interview Scheduled
    const notif2 = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
      title: "Technical Interview Scheduled",
      message: "Your interview is confirmed for tomorrow at 10:00 AM.",
      data: { interviewId: new mongoose.Types.ObjectId() },
    });

    // 1.3 Alice Notification 3: Result Published
    const notif3 = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
      title: "Assessment Result Published",
      message: "Your exam result is ready. Grade: A+.",
      data: { resultId: new mongoose.Types.ObjectId() },
    });

    // 1.4 Bob Notification: Assignment
    const bobNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: bobUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      title: "Bob Assessment Assignment",
      message: "Bob's private assessment assignment.",
    });

    console.log("Created Notifications -> Alice:", 3, "Bob:", 1);
    if (!notif1?._id || !notif2?._id || !notif3?._id || !bobNotif?._id) {
      throw new Error("Test 1 Failed: Notification creation failed!");
    }

    console.log("\n[TEST 2] Recipient Scoping & Feed Isolation...");
    // 2.1 Alice queries her notifications
    const aliceListRes = await request(server, {
      method: "GET",
      path: "/api/v1/notifications",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Notifications Count ->", aliceListRes.body?.data?.items?.length, "Unread Count:", aliceListRes.body?.data?.unreadCount);
    if (aliceListRes.status !== 200 || aliceListRes.body?.data?.items?.length !== 3 || aliceListRes.body?.data?.unreadCount !== 3) {
      throw new Error("Test 2.1 Failed: Alice notification feed returned invalid count!");
    }

    // 2.2 Bob queries his notifications -> receives ONLY 1 item (never sees Alice's)
    const bobListRes = await request(server, {
      method: "GET",
      path: "/api/v1/notifications",
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log("Bob Notifications Count ->", bobListRes.body?.data?.items?.length);
    if (bobListRes.status !== 200 || bobListRes.body?.data?.items?.length !== 1) {
      throw new Error("Test 2.2 Failed: Recipient feed isolation failed!");
    }

    console.log("\n[TEST 3] Pagination & Unread Counter...");
    const pagedRes = await request(server, {
      method: "GET",
      path: "/api/v1/notifications?page=1&limit=2",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Paged Items:", pagedRes.body?.data?.items?.length, "Total:", pagedRes.body?.data?.pagination?.total, "Pages:", pagedRes.body?.data?.pagination?.totalPages);
    if (pagedRes.status !== 200 || pagedRes.body?.data?.items?.length !== 2 || pagedRes.body?.data?.pagination?.total !== 3) {
      throw new Error("Test 3.1 Failed: Notification pagination failed!");
    }

    const unreadRes = await request(server, {
      method: "GET",
      path: "/api/v1/notifications/unread-count",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Unread Count API ->", unreadRes.body?.data?.count);
    if (unreadRes.status !== 200 || unreadRes.body?.data?.count !== 3) {
      throw new Error("Test 3.2 Failed: Unread count endpoint failed!");
    }

    console.log("\n[TEST 4] Marking Notification as Read & Ownership Security...");
    // 4.1 Bob attempts to mark Alice's notification as read -> blocked
    const bobHackRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/${notif1._id}/read`,
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log("Bob Unauthorized Mark Read Status ->", bobHackRes.status);
    if (bobHackRes.status !== 404 && bobHackRes.status !== 403) {
      throw new Error("Test 4.1 Failed: User was able to mark another user's notification as read!");
    }

    // 4.2 Alice marks her notification as read
    const aliceReadRes = await request(server, {
      method: "PATCH",
      path: `/api/v1/notifications/${notif1._id}/read`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Alice Mark Read Status ->", aliceReadRes.status, "Status:", aliceReadRes.body?.data?.status);
    if (aliceReadRes.status !== 200 || aliceReadRes.body?.data?.status !== "READ") {
      throw new Error("Test 4.2 Failed: Marking notification read failed!");
    }

    // Check unread count is now 2
    const unreadAfter1 = await NotificationService.getUnreadCount(aliceUser._id);
    if (unreadAfter1.count !== 2) {
      throw new Error("Test 4.3 Failed: Unread count did not decrement!");
    }

    console.log("\n[TEST 5] Mark All As Read...");
    const readAllRes = await request(server, {
      method: "PATCH",
      path: "/api/v1/notifications/read-all",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Mark All Read Status ->", readAllRes.status, "Modified Count:", readAllRes.body?.data?.updatedCount);
    if (readAllRes.status !== 200 || readAllRes.body?.data?.updatedCount !== 2) {
      throw new Error("Test 5.1 Failed: Mark all read failed!");
    }

    const unreadAfterAll = await NotificationService.getUnreadCount(aliceUser._id);
    if (unreadAfterAll.count !== 0) {
      throw new Error("Test 5.2 Failed: Unread count was not 0 after mark-all-read!");
    }

    console.log("\n[TEST 6] Soft Delete Notification...");
    const deleteRes = await request(server, {
      method: "DELETE",
      path: `/api/v1/notifications/${notif1._id}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Delete Status ->", deleteRes.status, "Success:", deleteRes.body?.data?.success);
    if (deleteRes.status !== 200 || deleteRes.body?.data?.success !== true) {
      throw new Error("Test 6.1 Failed: Notification deletion failed!");
    }

    // Ensure deleted notification is no longer in feed
    const listAfterDel = await request(server, {
      method: "GET",
      path: "/api/v1/notifications",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Feed Count After Delete ->", listAfterDel.body?.data?.items?.length);
    if (listAfterDel.body?.data?.items?.length !== 2) {
      throw new Error("Test 6.2 Failed: Deleted notification still appeared in feed!");
    }

    console.log("\n[TEST 7] Idempotency & Duplicate Notification Prevention...");
    const idempKey = "ASSIGNMENT_REMINDER_ALICE_44";
    const firstNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.EXAM_REMINDER,
      title: "Exam Reminder",
      message: "Reminder: Exam starts in 1 hour.",
      idempotencyKey: idempKey,
    });

    const secondNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: aliceUser._id,
      type: NOTIFICATION_TYPES.EXAM_REMINDER,
      title: "Exam Reminder",
      message: "Reminder: Exam starts in 1 hour.",
      idempotencyKey: idempKey,
    });

    console.log("First Notif ID:", firstNotif._id, "Second Notif ID:", secondNotif._id);
    const countWithKey = await Notification.countDocuments({ idempotencyKey: idempKey });
    if (countWithKey !== 1 || firstNotif._id.toString() !== secondNotif._id.toString()) {
      throw new Error("Test 7 Failed: Duplicate notification created despite idempotency key!");
    }

    console.log("\n[TEST 8] User Notification Preferences...");
    // 8.1 Get default preferences
    const prefRes = await request(server, {
      method: "GET",
      path: "/api/v1/notifications/preferences",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log("Default Prefs Status ->", prefRes.status, "In-App Enabled:", prefRes.body?.data?.inApp?.enabled);
    if (prefRes.status !== 200 || prefRes.body?.data?.inApp?.enabled !== true) {
      throw new Error("Test 8.1 Failed: Default preferences retrieval failed!");
    }

    // 8.2 Update preferences
    const updatePrefRes = await request(server, {
      method: "PATCH",
      path: "/api/v1/notifications/preferences",
      headers: { Authorization: `Bearer ${aliceToken}` },
    }, {
      inApp: { enabled: false },
    });
    console.log("Updated Prefs Status ->", updatePrefRes.status, "In-App Enabled:", updatePrefRes.body?.data?.inApp?.enabled);
    if (updatePrefRes.status !== 200 || updatePrefRes.body?.data?.inApp?.enabled !== false) {
      throw new Error("Test 8.2 Failed: Notification preference update failed!");
    }

    // Restore preferences
    await NotificationService.updatePreferences(aliceUser._id, { inApp: { enabled: true } });

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 44 NOTIFICATIONS & COMMUNICATION TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 44 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep44Tests();
