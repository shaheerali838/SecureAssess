import express from "express";
const router = express.Router();

// Module: programs
router.get("/", (req, res) => {
  res.json({ success: true, message: "programs module initialized" });
});

export default router;
