import router from "./assessmentQuestion.routes.js";
import AssessmentQuestion from "./assessmentQuestion.model.js";
import { AssessmentQuestionService } from "./assessmentQuestion.service.js";
import { AssessmentQuestionValidator } from "./assessmentQuestion.validation.js";
import { AssessmentQuestionMapper } from "./assessmentQuestion.mapper.js";

export {
  AssessmentQuestion,
  AssessmentQuestionService,
  AssessmentQuestionValidator,
  AssessmentQuestionMapper,
};

export default router;
