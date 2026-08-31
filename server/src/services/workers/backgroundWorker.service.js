import mongoose from "mongoose";
import Attempt from "../../modules/attempts/attempt.model.js";
import Subscription from "../../modules/subscriptions/subscription.model.js";
import { BillingReconciliationService } from "../../modules/billing/billing.reconciliation.js";
import { logger } from "../../config/logger.js";

// Distributed Lock Schema for Multi-Instance Workers
const distributedLockSchema = new mongoose.Schema(
  {
    lockKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

export const DistributedLock =
  mongoose.models.DistributedLock ||
  mongoose.model("DistributedLock", distributedLockSchema);

export class BackgroundWorkerService {
  /**
   * Acquire a distributed lock across multiple API/Worker instances
   */
  static async acquireLock(lockKey, ttlMs = 30000, ownerId = `worker_${process.pid}`) {
    const expiresAt = new Date(Date.now() + ttlMs);
    try {
      await DistributedLock.findOneAndUpdate(
        {
          lockKey,
          $or: [{ expiresAt: { $lt: new Date() } }, { lockKey: { $exists: false } }],
        },
        {
          $set: {
            lockKey,
            ownerId,
            acquiredAt: new Date(),
            expiresAt,
          },
        },
        { upsert: true, returnDocument: "after" }
      );
      return { acquired: true, ownerId, lockKey };
    } catch {
      // Lock is held by another instance
      return { acquired: false, ownerId: null, lockKey };
    }
  }

  /**
   * Release a distributed lock
   */
  static async releaseLock(lockKey, ownerId) {
    try {
      await DistributedLock.deleteOne({ lockKey, ownerId });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Idempotent Attempt Expiry Task (Safe across multiple worker instances)
   */
  static async processExpiredAttempts(workerId = `worker_${process.pid}`) {
    const lock = await this.acquireLock("job:process_expired_attempts", 15000, workerId);
    if (!lock.acquired) {
      return { skipped: true, reason: "Lock held by another instance" };
    }

    try {
      const now = new Date();
      const expiredAttempts = await Attempt.find({
        status: "IN_PROGRESS",
        expiresAt: { $lte: now },
      }).limit(50);

      let processedCount = 0;
      for (const attempt of expiredAttempts) {
        attempt.status = "EXPIRED";
        attempt.submittedAt = now;
        await attempt.save();
        processedCount++;
      }

      logger.info(`[BackgroundWorker] Processed ${processedCount} expired attempts`);
      return { success: true, processedCount };
    } finally {
      await this.releaseLock("job:process_expired_attempts", workerId);
    }
  }

  /**
   * Idempotent Subscription Reconciliation Worker
   */
  static async processSubscriptionReconciliation(workerId = `worker_${process.pid}`) {
    const lock = await this.acquireLock("job:subscription_reconciliation", 30000, workerId);
    if (!lock.acquired) {
      return { skipped: true, reason: "Lock held by another instance" };
    }

    try {
      const activeSubs = await Subscription.find({
        status: { $in: ["ACTIVE", "PAST_DUE"] },
      }).limit(20);

      let reconciledCount = 0;
      for (const sub of activeSubs) {
        await BillingReconciliationService.reconcileSubscription(sub.organizationId).catch(() => {});
        reconciledCount++;
      }

      return { success: true, reconciledCount };
    } finally {
      await this.releaseLock("job:subscription_reconciliation", workerId);
    }
  }
}
