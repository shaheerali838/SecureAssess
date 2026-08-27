import router from "./subject.routes.js";
import Subject from "./subject.model.js";
import { SubjectService } from "./subject.service.js";
import { SubjectValidator } from "./subject.validation.js";

export {
  Subject,
  SubjectService,
  SubjectValidator,
};

export default router;
