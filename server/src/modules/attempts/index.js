import router from "./attempt.routes.js";
import Attempt from "./attempt.model.js";
import { AttemptService } from "./attempt.service.js";
import { AttemptValidator } from "./attempt.validation.js";

export {
  Attempt,
  AttemptService,
  AttemptValidator,
};

export default router;
