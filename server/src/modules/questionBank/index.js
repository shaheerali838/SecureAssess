import express from "express";
const router = express.Router();

// Module: questionBank
router.get("/", (req, res) => {
  res.json({ success: true, message: "questionBank module initialized" });
});

export default router;
