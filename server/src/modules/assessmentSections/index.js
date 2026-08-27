import router from "./assessmentSection.routes.js";
import AssessmentSection from "./assessmentSection.model.js";
import { AssessmentSectionService } from "./assessmentSection.service.js";
import { AssessmentSectionValidator } from "./assessmentSection.validation.js";

export {
  AssessmentSection,
  AssessmentSectionService,
  AssessmentSectionValidator,
};

export default router;
