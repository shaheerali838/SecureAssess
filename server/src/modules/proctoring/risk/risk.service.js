import ProctoringSession from "../proctoringSession.model.js";
import ProctoringEvent from "../proctoringEvent.model.js";
import { RISK_POINT_RULES, calculateRiskLevel } from "./riskRules.js";
import {
  EVENT_SEVERITIES,
  RISK_LEVELS,
  INTEGRITY_STATUSES,
} from "../../../constants/proctoringConstants.js";

export class RiskService {
  /**
   * Calculates points and severity for a given proctoring event type, adjusted by AI confidence
   */
  static calculateEventRisk(eventType, confidence = 1.0) {
    const rule = RISK_POINT_RULES[eventType] || {
      points: 0,
      severity: EVENT_SEVERITIES.INFO,
    };

    const validConfidence = Math.max(0, Math.min(1.0, Number(confidence) || 1.0));
    // Calculate effective points scaled by confidence
    const riskPoints = Math.round(rule.points * validConfidence);

    return {
      riskPoints,
      severity: rule.severity,
    };
  }

  /**
   * Returns human-readable categorical risk level for a numeric risk score
   */
  static getRiskLevel(score) {
    return calculateRiskLevel(score);
  }

  /**
   * Deduplication & event throttling helper:
   * Prevents flooding of identical event types within a 2000ms window per session
   */
  static async isThrottled(proctoringSessionId, eventType, windowMs = 2000) {
    const cutoff = new Date(Date.now() - windowMs);
    const recentDuplicate = await ProctoringEvent.findOne({
      proctoringSessionId,
      type: eventType,
      serverOccurredAt: { $gte: cutoff },
    });

    return Boolean(recentDuplicate);
  }

  /**
   * Recalculates and updates cumulative risk score, level, and integrity status for a session
   */
  static async updateSessionRisk(proctoringSessionId) {
    const events = await ProctoringEvent.find({ proctoringSessionId });

    let totalPoints = 0;
    let violationCount = 0;

    for (const evt of events) {
      // If event was reviewed and marked as FALSE_POSITIVE or DISMISSED, don't count towards risk
      if (evt.reviewed && (evt.resolution === "FALSE_POSITIVE" || evt.resolution === "DISMISSED")) {
        continue;
      }

      if (evt.riskPoints > 0) {
        totalPoints += evt.riskPoints;
        violationCount += 1;
      }
    }

    // Risk score is bounded between 0 and 100
    const riskScore = Math.min(100, Math.max(0, totalPoints));
    const riskLevel = this.getRiskLevel(riskScore);

    const existingSession = await ProctoringSession.findById(proctoringSessionId);
    let integrityStatus = existingSession?.integrityStatus || INTEGRITY_STATUSES.CLEAR;

    // Automatically elevate integrityStatus if not already under human review/confirmed
    if (integrityStatus !== INTEGRITY_STATUSES.UNDER_REVIEW && integrityStatus !== INTEGRITY_STATUSES.CONFIRMED_VIOLATION) {
      if (riskLevel === RISK_LEVELS.CRITICAL) {
        integrityStatus = INTEGRITY_STATUSES.CRITICAL;
      } else if (riskLevel === RISK_LEVELS.HIGH) {
        integrityStatus = INTEGRITY_STATUSES.HIGH_RISK;
      } else if (riskLevel === RISK_LEVELS.MEDIUM) {
        integrityStatus = INTEGRITY_STATUSES.MEDIUM_RISK;
      } else if (riskLevel === RISK_LEVELS.LOW && totalPoints > 0) {
        integrityStatus = INTEGRITY_STATUSES.LOW_RISK;
      } else {
        integrityStatus = INTEGRITY_STATUSES.CLEAR;
      }
    }

    const session = await ProctoringSession.findByIdAndUpdate(
      proctoringSessionId,
      {
        $set: {
          riskScore,
          riskLevel,
          violationCount,
          integrityStatus,
        },
      },
      { returnDocument: "after" }
    );

    return {
      riskScore,
      riskLevel,
      violationCount,
      integrityStatus,
      session,
    };
  }
}
