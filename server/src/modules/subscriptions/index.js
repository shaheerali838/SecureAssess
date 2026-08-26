import express from "express";
const router = express.Router();

// Module: subscriptions
router.get("/", (req, res) => {
  res.json({ success: true, message: "subscriptions module initialized" });
});

export default router;
