import router from "./assessmentAssignment.routes.js";
import AssessmentAssignment from "./assessmentAssignment.model.js";
import { AssessmentAssignmentService } from "./assessmentAssignment.service.js";
import { AssessmentAssignmentValidator } from "./assessmentAssignment.validation.js";

export {
  AssessmentAssignment,
  AssessmentAssignmentService,
  AssessmentAssignmentValidator,
};

export default router;
