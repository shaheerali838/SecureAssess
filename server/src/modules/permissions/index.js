import express from "express";
const router = express.Router();

// Module: permissions
router.get("/", (req, res) => {
  res.json({ success: true, message: "permissions module initialized" });
});

export default router;
