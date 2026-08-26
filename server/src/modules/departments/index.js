import express from "express";
const router = express.Router();

// Module: departments
router.get("/", (req, res) => {
  res.json({ success: true, message: "departments module initialized" });
});

export default router;
