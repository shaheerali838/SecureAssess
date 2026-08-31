import { SECURITY_RULES } from "./security.constants.js";

export class SecurityRuleEngine {
  /**
   * Matches an event against security governance thresholds
   */
  static shouldTriggerAlert(ruleType, incidentCount) {
    const rule = SECURITY_RULES[ruleType];
    if (!rule) return false;
    return incidentCount >= rule.threshold;
  }

  static getRuleSeverity(ruleType) {
    const rule = SECURITY_RULES[ruleType];
    return rule ? rule.severity : "HIGH";
  }
}
