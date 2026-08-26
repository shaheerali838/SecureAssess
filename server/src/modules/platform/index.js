import express from "express";
const router = express.Router();

// Module: platform
router.get("/", (req, res) => {
  res.json({ success: true, message: "platform module initialized" });
});

export default router;
