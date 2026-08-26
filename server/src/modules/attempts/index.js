import express from "express";
const router = express.Router();

// Module: attempts
router.get("/", (req, res) => {
  res.json({ success: true, message: "attempts module initialized" });
});

export default router;
