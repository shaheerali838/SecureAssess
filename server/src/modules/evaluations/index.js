import express from "express";
const router = express.Router();

// Module: evaluations
router.get("/", (req, res) => {
  res.json({ success: true, message: "evaluations module initialized" });
});

export default router;
