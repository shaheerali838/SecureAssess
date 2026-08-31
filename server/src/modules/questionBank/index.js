import questionBankRouter, { questionRouter } from "./questionBank.routes.js";
import QuestionBank from "./questionBank.model.js";
import Question from "./question.model.js";
import QuestionVersion from "./questionVersion.model.js";
import { QuestionBankService } from "./questionBank.service.js";
import { QuestionBankValidator } from "./questionBank.validation.js";
import { QuestionMapper } from "./question.mapper.js";

export {
  QuestionBank,
  Question,
  QuestionVersion,
  QuestionBankService,
  QuestionBankValidator,
  QuestionMapper,
  questionBankRouter,
  questionRouter,
};

export default questionBankRouter;
