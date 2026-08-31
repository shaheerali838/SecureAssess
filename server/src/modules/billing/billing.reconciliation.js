import Subscription from "../subscriptions/subscription.model.js";
import { BillingCustomer } from "./billing.model.js";
import { getBillingProvider } from "./providers/index.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { ApiError } from "../../utils/ApiError.js";

const provider = getBillingProvider("MOCK");

export class BillingReconciliationService {
  /**
   * Reconciles external provider subscription with local database records
   */
  static async reconcileSubscription(organizationId, userId = null) {
    const subscription = await Subscription.findOne({ organizationId });
    if (!subscription) {
      throw new ApiError(404, "Subscription not found for reconciliation");
    }

    const customer = await BillingCustomer.findOne({ organizationId });
    const providerSubId = subscription.providerSubscriptionId || customer?.providerCustomerId;

    // Fetch provider state
    const providerState = await provider.getSubscription(providerSubId || "mock_sub");
    let mismatchDetected = false;
    const corrections = {};

    if (providerState && providerState.status && providerState.status !== subscription.status) {
      mismatchDetected = true;
      corrections.oldStatus = subscription.status;
      corrections.newStatus = providerState.status;
      subscription.status = providerState.status;
      await subscription.save();
    }

    // Record audited reconciliation log
    await AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "BILLING",
      description: mismatchDetected
        ? `Billing reconciliation corrected status mismatch (${corrections.oldStatus} -> ${corrections.newStatus})`
        : "Billing reconciliation executed. Local subscription matches provider state.",
      metadata: { mismatchDetected, corrections },
    });

    return {
      reconciled: true,
      mismatchDetected,
      corrections,
      subscription: {
        id: subscription._id,
        plan: subscription.planCode || subscription.plan,
        status: subscription.status,
      },
    };
  }
}
