import express from "express";
const router = express.Router();

// Module: assessmentSections
router.get("/", (req, res) => {
  res.json({ success: true, message: "assessmentSections module initialized" });
});

export default router;
