import router from "./questionCategory.routes.js";
import QuestionCategory from "./questionCategory.model.js";
import { QuestionCategoryService } from "./questionCategory.service.js";
import { QuestionCategoryValidator } from "./questionCategory.validation.js";

export {
  QuestionCategory,
  QuestionCategoryService,
  QuestionCategoryValidator,
};

export default router;
