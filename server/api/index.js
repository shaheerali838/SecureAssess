import app from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";

/**
 * Vercel Serverless Function Bridge
 * Dispatches HTTP requests to Express with cached MongoDB connection pooling.
 */
export default async function handler(req, res) {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("[Vercel Serverless Error]", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Serverless Execution Error",
      error: error.message,
    });
  }
}
