import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Candidate from "../../src/modules/candidates/candidate.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import Notification from "../../src/modules/notifications/notification.model.js";
import NotificationPreference from "../../src/modules/notifications/notificationPreference.model.js";
import { NotificationService } from "../../src/modules/notifications/notification.service.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_PRIORITIES,
} from "../../src/modules/notifications/notification.constants.js";
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

const runStep52Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 52 Notifications & Communication Engine Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Clean State
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgAdminRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_ADMIN });
    const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

    await Organization.deleteMany({ slug: { $in: ["org-notif-a", "org-notif-b"] } });
    await User.deleteMany({ email: { $in: ["cand52@org-a.com", "admin52@org-a.com", "alien52@org-b.com"] } });
    await Candidate.deleteMany({});
    await Assessment.deleteMany({});
    await Notification.deleteMany({});
    await NotificationPreference.deleteMany({});

    // 2. Setup Organization A & Users
    const orgA = await Organization.create({
      name: "Global Quantum Institute Alpha",
      slug: "org-notif-a",
      code: "NOTIF-A",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const adminUser = await User.create({
      firstName: "Admin",
      lastName: "Alpha",
      email: "admin52@org-a.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: adminUser._id,
      organizationId: orgA._id,
      roleId: orgAdminRole._id,
      status: "ACTIVE",
    });

    const candidateUser = await User.create({
      firstName: "Marie",
      lastName: "Curie",
      email: "cand52@org-a.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: candidateUser._id,
      organizationId: orgA._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    const candProfile = await Candidate.create({
      organizationId: orgA._id,
      userId: candidateUser._id,
      candidateCode: "CAND-52-MARIE",
      firstName: "Marie",
      lastName: "Curie",
      email: "cand52@org-a.com",
      status: "ACTIVE",
    });

    const candToken = generateAccessToken({ sub: candidateUser._id.toString() });

    // 3. Setup Organization B & Alien User
    const orgB = await Organization.create({
      name: "Alien Testing Hub Beta",
      slug: "org-notif-b",
      code: "NOTIF-B",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const alienUser = await User.create({
      firstName: "Eve",
      lastName: "Snooper",
      email: "alien52@org-b.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });

    await UserMembership.create({
      userId: alienUser._id,
      organizationId: orgB._id,
      roleId: candidateRole._id,
      status: "ACTIVE",
    });

    const alienToken = generateAccessToken({ sub: alienUser._id.toString() });

    // =========================================================================
    // [TEST 1] Domain Event Notification Dispatch (Assessment, Interview, Result, Certificate)
    // =========================================================================
    console.log("\n[TEST 1] Dispatching Domain Event Notifications...");

    // 1a. Assessment Assigned
    const notif1 = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: candidateUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      title: "New Assessment Assigned: Advanced Particle Physics",
      message: "You have been assigned to 'Advanced Particle Physics'. Duration: 90 mins.",
      data: { assessmentId: new mongoose.Types.ObjectId().toString(), code: "PHY-901" },
      idempotencyKey: `ASSIGNMENT_001:${candidateUser._id}`,
    });

    console.log("Notif 1 Created -> ID:", notif1._id, "Status:", notif1.status, "Type:", notif1.type);
    if (!notif1 || notif1.type !== "ASSESSMENT_ASSIGNED") {
      throw new Error("Failed to create assessment assigned notification");
    }

    // 1b. Result Published
    const notif2 = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: candidateUser._id,
      type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
      title: "Assessment Result Published",
      message: "Official results for 'Advanced Particle Physics' are now available.",
      data: { score: 98, grade: "A+" },
    });

    // 1c. Certificate Issued
    const notif3 = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: candidateUser._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
      title: "Certificate of Excellence Issued",
      message: "Your verified credential is ready to download.",
      data: { certificateNumber: "CERT-PHYS-2026-001" },
    });

    // =========================================================================
    // [TEST 2] Candidate Notification Feed & Unread Counter
    // =========================================================================
    console.log("\n[TEST 2] Retrieving Candidate In-App Notifications & Unread Count...");

    const feedRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/notifications`,
        headers: {
          Authorization: `Bearer ${candToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      }
    );

    console.log("Candidate Feed -> Status:", feedRes.status, "Total Count:", feedRes.body?.data?.pagination?.total, "Unread:", feedRes.body?.data?.unreadCount);
    if (feedRes.status !== 200 || feedRes.body?.data?.pagination?.total !== 3 || feedRes.body?.data?.unreadCount !== 3) {
      throw new Error(`Expected 3 total & 3 unread notifications, got total: ${feedRes.body?.data?.pagination?.total}, unread: ${feedRes.body?.data?.unreadCount}`);
    }

    const unreadRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/notifications/unread-count`,
        headers: {
          Authorization: `Bearer ${candToken}`,
          "x-organization-id": orgA._id.toString(),
        },
      }
    );
    console.log("Unread Badge Counter -> Count:", unreadRes.body?.data?.count);
    if (unreadRes.body?.data?.count !== 3) {
      throw new Error(`Expected unread count 3, got ${unreadRes.body?.data?.count}`);
    }

    // =========================================================================
    // [TEST 3] User Ownership & Cross-User Security Guards
    // =========================================================================
    console.log("\n[TEST 3] User Ownership & Cross-Tenant Security Isolation...");

    // Alien User attempts to mark Candidate User's notification as read
    const alienMarkRes = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/notifications/${notif1._id}/read`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );

    console.log("Alien User Unauthorized Mark Read -> Status:", alienMarkRes.status, "(Expected 404/403)");
    if (alienMarkRes.status !== 404) {
      throw new Error(`Expected 404 for unauthorized notification modification, got ${alienMarkRes.status}`);
    }

    // Alien User attempts to soft delete Candidate User's notification
    const alienDelRes = await request(
      server,
      {
        method: "DELETE",
        path: `/api/v1/notifications/${notif1._id}`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );
    console.log("Alien User Unauthorized Delete -> Status:", alienDelRes.status, "(Expected 404/403)");
    if (alienDelRes.status !== 404) {
      throw new Error(`Expected 404 for unauthorized notification deletion, got ${alienDelRes.status}`);
    }

    // Alien User checks own feed (must be 0)
    const alienFeedRes = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/notifications`,
        headers: { Authorization: `Bearer ${alienToken}` },
      }
    );
    console.log("Alien User Clean Feed -> Total:", alienFeedRes.body?.data?.pagination?.total, "(Expected 0)");
    if (alienFeedRes.body?.data?.pagination?.total !== 0) {
      throw new Error("Cross-tenant bleed: Alien user saw foreign notifications!");
    }

    // =========================================================================
    // [TEST 4] Read & Read-All Lifecycle
    // =========================================================================
    console.log("\n[TEST 4] Read and Read-All Operations...");

    // 4a. Mark single notification as read
    const markRes = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/notifications/${notif1._id}/read`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );
    console.log("Mark Read -> Status:", markRes.status, "readAt:", markRes.body?.data?.readAt);
    if (markRes.status !== 200 || !markRes.body?.data?.readAt) {
      throw new Error("Failed to mark single notification as read");
    }

    // 4b. Mark all remaining notifications as read
    const readAllRes = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/notifications/read-all`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );
    console.log("Mark All As Read -> Status:", readAllRes.status, "Modified Count:", readAllRes.body?.data?.updatedCount);
    if (readAllRes.status !== 200 || readAllRes.body?.data?.updatedCount !== 2) {
      throw new Error(`Expected 2 updated notifications in read-all, got ${readAllRes.body?.data?.updatedCount}`);
    }

    const postReadAllUnread = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/notifications/unread-count`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );
    console.log("Unread Count after Read-All ->", postReadAllUnread.body?.data?.count, "(Expected 0)");
    if (postReadAllUnread.body?.data?.count !== 0) {
      throw new Error(`Expected unread count 0, got ${postReadAllUnread.body?.data?.count}`);
    }

    // =========================================================================
    // [TEST 5] Idempotency Protection
    // =========================================================================
    console.log("\n[TEST 5] Testing Domain Event Idempotency...");

    const duplicateAttempt = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: candidateUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
      title: "Duplicate Event Attempt",
      message: "This should be ignored due to duplicate idempotencyKey.",
      idempotencyKey: `ASSIGNMENT_001:${candidateUser._id}`,
    });

    console.log("Duplicate Dispatch -> Returned Existing ID:", duplicateAttempt._id.toString() === notif1._id.toString());
    if (duplicateAttempt._id.toString() !== notif1._id.toString()) {
      throw new Error("Idempotency failed: Duplicate event created new notification record!");
    }

    // =========================================================================
    // [TEST 6] Soft Delete Lifecycle
    // =========================================================================
    console.log("\n[TEST 6] Soft Deleting a Notification...");

    const delRes = await request(
      server,
      {
        method: "DELETE",
        path: `/api/v1/notifications/${notif3._id}`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );
    console.log("Soft Delete -> Status:", delRes.status, "Success:", delRes.body?.data?.success);
    if (delRes.status !== 200 || !delRes.body?.data?.success) {
      throw new Error("Soft delete request failed");
    }

    const feedAfterDel = await request(
      server,
      {
        method: "GET",
        path: `/api/v1/notifications`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );
    console.log("Feed Count after Deletion -> Total:", feedAfterDel.body?.data?.pagination?.total, "(Expected 2 active)");
    if (feedAfterDel.body?.data?.pagination?.total !== 2) {
      throw new Error(`Expected 2 active notifications after delete, got ${feedAfterDel.body?.data?.pagination?.total}`);
    }

    // =========================================================================
    // [TEST 7] User Notification Preferences & Critical Security Override
    // =========================================================================
    console.log("\n[TEST 7] User Notification Preferences & Critical Override...");

    // 7a. Disable inApp notifications in user preferences
    const prefUpdateRes = await request(
      server,
      {
        method: "PATCH",
        path: `/api/v1/notifications/preferences`,
        headers: { Authorization: `Bearer ${candToken}` },
      },
      {
        inApp: { enabled: false },
      }
    );
    console.log("Update Preferences -> Status:", prefUpdateRes.status, "inApp.enabled:", prefUpdateRes.body?.data?.inApp?.enabled);
    if (prefUpdateRes.body?.data?.inApp?.enabled !== false) {
      throw new Error("Failed to update notification preferences");
    }

    // 7b. Non-critical notification must be suppressed according to preferences
    const suppressedNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: candidateUser._id,
      type: NOTIFICATION_TYPES.ASSESSMENT_UPDATED,
      title: "Suppressed Schedule Update",
      message: "This should be suppressed because inApp notifications are disabled.",
    });
    console.log("Non-Critical Notification Suppression -> Returned:", suppressedNotif);
    if (suppressedNotif !== null) {
      throw new Error("Preferences failed: Non-critical notification was not suppressed!");
    }

    // 7c. Critical Security Alert MUST bypass preferences and deliver
    const securityNotif = await NotificationService.createNotification({
      organizationId: orgA._id,
      recipientId: candidateUser._id,
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
      priority: NOTIFICATION_PRIORITIES.URGENT,
      title: "CRITICAL: Password Changed from New IP",
      message: "Your account password was updated from an unrecognized location.",
    });
    console.log("Critical Security Notification Bypass -> Delivered ID:", securityNotif?._id);
    if (!securityNotif || securityNotif.type !== NOTIFICATION_TYPES.SECURITY_ALERT) {
      throw new Error("Security policy violated: Critical alert was suppressed by user preferences!");
    }

    // =========================================================================
    // [TEST 8] Failed Delivery & Bounded Retry Handling
    // =========================================================================
    console.log("\n[TEST 8] Failed Delivery Recording & Bounded Retry Handling...");

    const failedNotif = await Notification.create({
      organizationId: orgA._id,
      recipientId: candidateUser._id,
      type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      title: "Email Dispatch Failure Test",
      message: "Testing retry mechanics.",
      status: NOTIFICATION_STATUSES.FAILED,
      failureReason: "SMTP Connection Timeout",
      failedAt: new Date(),
      retryCount: 0,
    });

    const retryRes = await request(
      server,
      {
        method: "POST",
        path: `/api/v1/notifications/${failedNotif._id}/retry`,
        headers: { Authorization: `Bearer ${candToken}` },
      }
    );
    console.log("Retry Execution -> Status:", retryRes.status, "New Notification Status:", retryRes.body?.data?.status, "Retry Count:", retryRes.body?.data?.retryCount);
    if (retryRes.status !== 200 || retryRes.body?.data?.retryCount !== 1) {
      throw new Error(`Expected retry count 1, got ${retryRes.body?.data?.retryCount}`);
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 52 NOTIFICATIONS & COMMUNICATION ENGINE TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep52Tests().catch((err) => {
  console.error("❌ Step 52 Test Suite Failed:", err);
  process.exit(1);
});
