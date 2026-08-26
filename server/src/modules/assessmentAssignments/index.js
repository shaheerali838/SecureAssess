import express from "express";
const router = express.Router();

// Module: assessmentAssignments
router.get("/", (req, res) => {
  res.json({ success: true, message: "assessmentAssignments module initialized" });
});

export default router;
