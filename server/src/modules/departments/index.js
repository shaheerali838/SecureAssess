import router from "./department.routes.js";
import Department from "./department.model.js";
import { DepartmentService } from "./department.service.js";
import { DepartmentValidator } from "./department.validation.js";

export {
  Department,
  DepartmentService,
  DepartmentValidator,
};

export default router;
