import express from "express";
const router = express.Router();

// Module: rubrics
router.get("/", (req, res) => {
  res.json({ success: true, message: "rubrics module initialized" });
});

export default router;
