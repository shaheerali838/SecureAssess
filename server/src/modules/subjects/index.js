import express from "express";
const router = express.Router();

// Module: subjects
router.get("/", (req, res) => {
  res.json({ success: true, message: "subjects module initialized" });
});

export default router;
