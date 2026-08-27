import router from "./questionBank.routes.js";
import QuestionBank from "./questionBank.model.js";
import Question from "./question.model.js";
import { QuestionBankService } from "./questionBank.service.js";
import { QuestionBankValidator } from "./questionBank.validation.js";
import { QuestionMapper } from "./question.mapper.js";

export {
  QuestionBank,
  Question,
  QuestionBankService,
  QuestionBankValidator,
  QuestionMapper,
};

export default router;
