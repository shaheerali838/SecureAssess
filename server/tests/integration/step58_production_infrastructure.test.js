import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import { seedRBAC } from "../../src/database/seeders/rbac.seeder.js";
import User from "../../src/modules/users/user.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Attempt from "../../src/modules/attempts/attempt.model.js";
import Assessment from "../../src/modules/assessments/assessment.model.js";
import { StorageService } from "../../src/services/storage/storage.service.js";
import { BackgroundWorkerService, DistributedLock } from "../../src/services/workers/backgroundWorker.service.js";
import { PLATFORM_ROLES } from "../../src/constants/roles.js";
import { ENV } from "../../src/config/env.js";
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
            resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

const runStep58Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 58 Production Infrastructure & Observability Test Suite");

  await seedRBAC();
  console.log("RBAC roles & permissions synchronized");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    await DistributedLock.deleteMany({});
    await Organization.deleteMany({ slug: "org-prod-test" });
    await Attempt.deleteMany({});
    await Assessment.deleteMany({});

    const org = await Organization.create({
      name: "Global Production Testing Corp",
      slug: "org-prod-test",
      code: "PROD-TEST",
      type: "CORPORATE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    // =========================================================================
    // [TEST 1] Root & API Health, Liveness & Readiness Probes
    // =========================================================================
    console.log("\n[TEST 1] Testing Health, Liveness & Readiness Probes...");

    const healthRes = await request(server, { method: "GET", path: "/api/v1/health" });
    console.log("General Health -> Status:", healthRes.status, "Database:", healthRes.body?.data?.database);
    if (healthRes.status !== 200 || healthRes.body?.data?.database !== "connected") {
      throw new Error("General health check failed!");
    }

    const liveRes = await request(server, { method: "GET", path: "/api/v1/health/live" });
    console.log("Liveness Probe -> Status:", liveRes.status, "Status Code in Payload:", liveRes.body?.data?.status);
    if (liveRes.status !== 200 || liveRes.body?.data?.status !== "LIVE") {
      throw new Error("Liveness probe failed!");
    }

    const readyRes = await request(server, { method: "GET", path: "/api/v1/health/ready" });
    console.log("Readiness Probe -> Status:", readyRes.status, "Readiness:", readyRes.body?.data?.status);
    if (readyRes.status !== 200 || readyRes.body?.data?.status !== "READY") {
      throw new Error("Readiness probe failed!");
    }

    // =========================================================================
    // [TEST 2] Production Security Headers & Content-Security-Policy
    // =========================================================================
    console.log("\n[TEST 2] Verifying Production Security Headers...");

    const headersRes = await request(server, { method: "GET", path: "/api/v1/health" });
    const xContentType = headersRes.headers["x-content-type-options"];
    const xFrame = headersRes.headers["x-frame-options"];
    const hsts = headersRes.headers["strict-transport-security"];
    const csp = headersRes.headers["content-security-policy"];

    console.log("Security Headers -> X-Content-Type-Options:", xContentType, "| X-Frame-Options:", xFrame, "| HSTS:", Boolean(hsts), "| CSP:", Boolean(csp));
    if (xContentType !== "nosniff" || xFrame !== "DENY" || !hsts || !csp) {
      throw new Error("Required security headers missing from API responses!");
    }

    // =========================================================================
    // [TEST 3] Sanitized Error Responses with Correlation Request IDs
    // =========================================================================
    console.log("\n[TEST 3] Sanitized Error Responses & Request ID Correlation...");

    const notFoundRes = await request(server, {
      method: "GET",
      path: "/api/v1/non-existent-endpoint-route",
      headers: { "x-request-id": "req_trace_prod_999" },
    });

    console.log("Error Response -> Status:", notFoundRes.status, "Success:", notFoundRes.body?.success, "Request ID:", notFoundRes.body?.requestId);
    if (notFoundRes.status !== 404 || notFoundRes.body?.success !== false) {
      throw new Error("Standardized error response format invalid!");
    }

    // =========================================================================
    // [TEST 4] Private File Storage & Short-Lived Signed URL Verification
    // =========================================================================
    console.log("\n[TEST 4] Private File Storage & Cryptographic Signed URLs...");

    const dummyEvidenceBuffer = Buffer.from("SECURE_PROCTORING_EVIDENCE_SNAPSHOT_DATA_2026");
    const uploaded = await StorageService.uploadPrivateFile(
      dummyEvidenceBuffer,
      "webcam_snapshot.jpg",
      org._id,
      "evidence"
    );

    console.log("Private File Uploaded -> Key:", uploaded.objectKey);
    if (!uploaded.success || !uploaded.objectKey) {
      throw new Error("Private file upload failed!");
    }

    // Generate signed URL (expires in 60 seconds)
    const signedUrl = StorageService.generateSignedUrl(uploaded.objectKey, org._id.toString(), 60);
    console.log("Signed URL Generated -> URL Path:", signedUrl.url.split("?")[0], "Signature:", signedUrl.signature?.slice(0, 16) + "...");

    // Verify valid signed URL
    const verifyValid = StorageService.verifySignedUrl(
      uploaded.objectKey,
      org._id.toString(),
      Math.floor(Date.now() / 1000) + 60,
      signedUrl.signature
    );
    console.log("Signed URL Verification (Valid) ->", verifyValid.valid);
    if (!verifyValid.valid) {
      throw new Error("Signed URL verification failed for valid token!");
    }

    // Verify tampered signed URL
    const verifyTampered = StorageService.verifySignedUrl(
      uploaded.objectKey,
      org._id.toString(),
      Math.floor(Date.now() / 1000) + 60,
      "forged_invalid_signature_hex"
    );
    console.log("Signed URL Verification (Tampered) ->", verifyTampered.valid, "(Expected false)");
    if (verifyTampered.valid !== false) {
      throw new Error("Signed URL accepted forged signature!");
    }

    // Verify expired signed URL
    const verifyExpired = StorageService.verifySignedUrl(
      uploaded.objectKey,
      org._id.toString(),
      Math.floor(Date.now() / 1000) - 10, // Expired 10 seconds ago
      signedUrl.signature
    );
    console.log("Signed URL Verification (Expired) -> Valid:", verifyExpired.valid, "Reason:", verifyExpired.reason);
    if (verifyExpired.valid !== false || verifyExpired.reason !== "EXPIRED") {
      throw new Error("Signed URL allowed expired token access!");
    }

    // =========================================================================
    // [TEST 5] Distributed Locking Engine (Multi-Instance Coordination)
    // =========================================================================
    console.log("\n[TEST 5] Distributed Locking Engine Across Multiple Worker Instances...");

    // Worker 1 acquires lock
    const lock1 = await BackgroundWorkerService.acquireLock("job:certificate_generation", 10000, "worker_pod_alpha");
    console.log("Worker Alpha Lock Acquisition -> Acquired:", lock1.acquired);
    if (!lock1.acquired) {
      throw new Error("Worker Alpha failed to acquire distributed lock!");
    }

    // Worker 2 attempts to acquire same lock simultaneously
    const lock2 = await BackgroundWorkerService.acquireLock("job:certificate_generation", 10000, "worker_pod_beta");
    console.log("Worker Beta Lock Acquisition (Concurrent) -> Acquired:", lock2.acquired, "(Expected false)");
    if (lock2.acquired !== false) {
      throw new Error("Distributed lock allowed concurrent lock acquisition by Worker Beta!");
    }

    // Worker 1 releases lock
    const released = await BackgroundWorkerService.releaseLock("job:certificate_generation", "worker_pod_alpha");
    console.log("Worker Alpha Lock Released ->", released);

    // Worker 2 re-attempts and succeeds
    const lock2Retry = await BackgroundWorkerService.acquireLock("job:certificate_generation", 10000, "worker_pod_beta");
    console.log("Worker Beta Lock Acquisition (After Release) -> Acquired:", lock2Retry.acquired);
    if (!lock2Retry.acquired) {
      throw new Error("Worker Beta failed to acquire lock after release!");
    }
    await BackgroundWorkerService.releaseLock("job:certificate_generation", "worker_pod_beta");

    // =========================================================================
    // [TEST 6] Idempotent Attempt Expiry Background Worker
    // =========================================================================
    console.log("\n[TEST 6] Idempotent Multi-Instance Attempt Expiry Worker...");

    const assessment = await Assessment.create({
      organizationId: org._id,
      title: "Production Resilience Exam",
      code: "PROD-EXAM-101",
      passingScore: 60,
      totalPoints: 100,
      status: "PUBLISHED",
      createdBy: platformOwner._id,
    });

    const overdueAttempt = await Attempt.create({
      organizationId: org._id,
      assessmentId: assessment._id,
      assignmentId: new mongoose.Types.ObjectId(),
      candidateId: new mongoose.Types.ObjectId(),
      attemptNumber: 1,
      durationSeconds: 3600,
      status: "IN_PROGRESS",
      startedAt: new Date(Date.now() - 3600000),
      expiresAt: new Date(Date.now() - 1800000), // Expired 30 mins ago
    });

    const workerResult = await BackgroundWorkerService.processExpiredAttempts("worker_test_runner");
    console.log("Attempt Expiry Worker Result -> Processed Count:", workerResult.processedCount);
    if (workerResult.processedCount < 1) {
      throw new Error("Background worker failed to process overdue attempt!");
    }

    const updatedAttempt = await Attempt.findById(overdueAttempt._id);
    console.log("Updated Attempt Status ->", updatedAttempt.status, "(Expected EXPIRED)");
    if (updatedAttempt.status !== "EXPIRED") {
      throw new Error("Attempt status was not transitioned to EXPIRED!");
    }

    // Run again to verify idempotency (0 processed)
    const workerResult2 = await BackgroundWorkerService.processExpiredAttempts("worker_test_runner");
    console.log("Attempt Expiry Worker Idempotency Run -> Processed Count:", workerResult2.processedCount, "(Expected 0)");
    if (workerResult2.processedCount !== 0) {
      throw new Error("Attempt expiry worker is not idempotent!");
    }

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 58 PRODUCTION INFRASTRUCTURE & OBSERVABILITY TESTS PASSED!");
    console.log("==========================================================================");
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep58Tests().catch((err) => {
  console.error("❌ Step 58 Test Suite Failed:", err);
  process.exit(1);
});
