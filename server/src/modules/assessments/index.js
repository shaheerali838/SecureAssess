import router from "./assessment.routes.js";
import Assessment from "./assessment.model.js";
import { AssessmentService } from "./assessment.service.js";
import { AssessmentValidator } from "./assessment.validation.js";

export {
  Assessment,
  AssessmentService,
  AssessmentValidator,
};

export default router;
