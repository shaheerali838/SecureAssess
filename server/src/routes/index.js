import express from "express";
import v1Routes from "./v1/index.js";

const router = express.Router();

// Mount v1 API
router.use("/v1", v1Routes);

export default router;
