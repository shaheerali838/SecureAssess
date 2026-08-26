import express from "express";
const router = express.Router();

// Module: billing
router.get("/", (req, res) => {
  res.json({ success: true, message: "billing module initialized" });
});

export default router;
