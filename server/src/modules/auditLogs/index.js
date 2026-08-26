import express from "express";
const router = express.Router();

// Module: auditLogs
router.get("/", (req, res) => {
  res.json({ success: true, message: "auditLogs module initialized" });
});

export default router;
