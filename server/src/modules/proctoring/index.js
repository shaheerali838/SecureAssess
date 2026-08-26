import express from "express";
const router = express.Router();

// Module: proctoring
router.get("/", (req, res) => {
  res.json({ success: true, message: "proctoring module initialized" });
});

export default router;
