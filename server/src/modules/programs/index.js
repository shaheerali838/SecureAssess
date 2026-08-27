import router from "./program.routes.js";
import Program from "./program.model.js";
import { ProgramService } from "./program.service.js";
import { ProgramValidator } from "./program.validation.js";

export {
  Program,
  ProgramService,
  ProgramValidator,
};

export default router;
