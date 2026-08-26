import express from "express";
const router = express.Router();

// Module: candidates
router.get("/", (req, res) => {
  res.json({ success: true, message: "candidates module initialized" });
});

export default router;
