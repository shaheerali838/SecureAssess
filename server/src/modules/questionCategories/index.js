import express from "express";
const router = express.Router();

// Module: questionCategories
router.get("/", (req, res) => {
  res.json({ success: true, message: "questionCategories module initialized" });
});

export default router;
