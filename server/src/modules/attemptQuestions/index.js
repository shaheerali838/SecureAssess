import express from "express";
const router = express.Router();

// Module: attemptQuestions
router.get("/", (req, res) => {
  res.json({ success: true, message: "attemptQuestions module initialized" });
});

export default router;
