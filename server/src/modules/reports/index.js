import express from "express";
const router = express.Router();

// Module: reports
router.get("/", (req, res) => {
  res.json({ success: true, message: "reports module initialized" });
});

export default router;
