import express from "express";
const router = express.Router();

// Module: answers
router.get("/", (req, res) => {
  res.json({ success: true, message: "answers module initialized" });
});

export default router;
