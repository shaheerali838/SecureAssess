import express from "express";
import {
  getRubrics,
  getRubric,
  createRubric,
  updateRubric,
  deleteRubric,
} from "./rubric.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

router.route("/")
  .get(getRubrics)
  .post(createRubric);

router.route("/:rubricId")
  .get(getRubric)
  .patch(updateRubric)
  .delete(deleteRubric);

export default router;
