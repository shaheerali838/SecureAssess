import AuditLog from "../auditLog.model.js";
import { AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITIES } from "../auditLog.constants.js";
import { AuditLogService } from "../auditLog.service.js";
import { SecurityRuleEngine } from "./security.rules.js";
import { NotificationService } from "../../notifications/notification.service.js";
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from "../../notifications/notification.constants.js";

export class SecurityMonitoringService {
  /**
   * Evaluates security events against configurable thresholds and creates alerts & notifications
   */
  static async evaluateEvent({
    organizationId = null,
    actorId = null,
    ipAddress = null,
    eventType,
    ruleType = "FAILED_LOGIN",
    description,
    metadata = {},
  }) {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000); // 15 min window

    const recentIncidents = await AuditLog.countDocuments({
      ...(organizationId ? { organizationId } : {}),
      action: eventType,
      createdAt: { $gte: windowStart },
      ...(ipAddress ? { ipAddress } : {}),
    });

    const isThresholdMet = SecurityRuleEngine.shouldTriggerAlert(ruleType, recentIncidents);
    const severity = SecurityRuleEngine.getRuleSeverity(ruleType);

    if (isThresholdMet) {
      // Record Security Alert in AuditLog
      const alertLog = await AuditLogService.createAuditLog({
        organizationId,
        actorId,
        action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        resource: AUDIT_RESOURCES.SECURITY,
        description: `Security Alert: ${description} (Threshold reached: ${recentIncidents} events)`,
        severity,
        ipAddress,
        metadata: {
          ...metadata,
          eventType,
          incidentCount: recentIncidents,
        },
      });

      // Dispatch security notification to organization or system admins
      if (organizationId) {
        NotificationService.createNotification({
          organizationId,
          type: NOTIFICATION_TYPES.SECURITY_ALERT,
          title: "Security Threat Alert",
          message: `Threshold exceeded for ${eventType}: ${description}`,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          data: {
            eventType,
            incidentCount: recentIncidents,
            ipAddress,
          },
        }).catch(() => {});
      }

      return { alertTriggered: true, alertLog, incidentCount: recentIncidents };
    }

    return { alertTriggered: false, incidentCount: recentIncidents };
  }
}
