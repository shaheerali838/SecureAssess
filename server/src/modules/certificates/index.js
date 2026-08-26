import express from "express";
const router = express.Router();

// Module: certificates
router.get("/", (req, res) => {
  res.json({ success: true, message: "certificates module initialized" });
});

export default router;
