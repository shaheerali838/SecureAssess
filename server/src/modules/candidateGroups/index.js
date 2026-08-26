import express from "express";
const router = express.Router();

// Module: candidateGroups
router.get("/", (req, res) => {
  res.json({ success: true, message: "candidateGroups module initialized" });
});

export default router;
