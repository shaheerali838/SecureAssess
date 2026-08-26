import express from "express";
const router = express.Router();

// Module: notifications
router.get("/", (req, res) => {
  res.json({ success: true, message: "notifications module initialized" });
});

export default router;
