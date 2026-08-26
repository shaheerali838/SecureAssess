import express from "express";
const router = express.Router();

// Module: roles
router.get("/", (req, res) => {
  res.json({ success: true, message: "roles module initialized" });
});

export default router;
