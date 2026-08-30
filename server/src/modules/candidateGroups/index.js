import router from "./candidateGroup.routes.js";
import CandidateGroup from "./candidateGroup.model.js";
import CandidateGroupMember from "./candidateGroupMember.model.js";
import { CandidateGroupService } from "./candidateGroup.service.js";
import { CandidateGroupValidator } from "./candidateGroup.validation.js";

export {
  CandidateGroup,
  CandidateGroupMember,
  CandidateGroupService,
  CandidateGroupValidator,
};

export default router;
