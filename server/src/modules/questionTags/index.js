import express from "express";
const router = express.Router();

// Module: questionTags
router.get("/", (req, res) => {
  res.json({ success: true, message: "questionTags module initialized" });
});

export default router;
