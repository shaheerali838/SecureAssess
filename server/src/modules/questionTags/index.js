import router from "./questionTag.routes.js";
import QuestionTag from "./questionTag.model.js";
import { QuestionTagService } from "./questionTag.service.js";
import { QuestionTagValidator } from "./questionTag.validation.js";

export {
  QuestionTag,
  QuestionTagService,
  QuestionTagValidator,
};

export default router;
