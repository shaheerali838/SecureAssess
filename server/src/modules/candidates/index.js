import router from "./candidate.routes.js";
import Candidate from "./candidate.model.js";
import { CandidateService } from "./candidate.service.js";
import { CandidateValidator } from "./candidate.validation.js";

export {
  Candidate,
  CandidateService,
  CandidateValidator,
};

export default router;
