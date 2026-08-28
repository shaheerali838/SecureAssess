import router from "./answer.routes.js";
import Answer from "./answer.model.js";
import { AnswerService } from "./answer.service.js";
import { AnswerValidator } from "./answer.validation.js";

export {
  Answer,
  AnswerService,
  AnswerValidator,
};

export default router;
