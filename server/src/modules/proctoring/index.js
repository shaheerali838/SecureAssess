import router from "./proctoring.routes.js";
import ProctoringSession from "./proctoringSession.model.js";
import ProctoringEvent from "./proctoringEvent.model.js";
import ProctoringEvidence from "./proctoringEvidence.model.js";
import { ProctoringService } from "./proctoring.service.js";
import { RiskService } from "./risk/risk.service.js";

export {
  ProctoringSession,
  ProctoringEvent,
  ProctoringEvidence,
  ProctoringService,
  RiskService,
};

export default router;
