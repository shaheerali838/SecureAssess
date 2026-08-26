import express from "express";
const router = express.Router();

// Module: assessmentQuestions
router.get("/", (req, res) => {
  res.json({ success: true, message: "assessmentQuestions module initialized" });
});

export default router;
