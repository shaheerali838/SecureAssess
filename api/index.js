import app from "../server/src/app.js";
import { connectDatabase } from "../server/src/config/db.js";

/**
 * Unified Monorepo Vercel Serverless Function Bridge
 * Dispatches all /api/* requests directly to Express with cached MongoDB connections.
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
