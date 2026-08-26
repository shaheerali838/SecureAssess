import express from "express";
const router = express.Router();

// Module: results
router.get("/", (req, res) => {
  res.json({ success: true, message: "results module initialized" });
});

export default router;
