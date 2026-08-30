import mongoose from "mongoose";

export const issueCertificateSchema = {
  validate: (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
      return {
        error: { details: [{ message: "Request body is required" }] },
        value: body,
      };
    }
    if (!body.resultId || !mongoose.Types.ObjectId.isValid(body.resultId)) {
      errors.push({ message: "Valid resultId is required" });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body,
    };
  },
};

export const revokeCertificateSchema = {
  validate: (body) => {
    const errors = [];
    if (body && body.reason !== undefined && typeof body.reason !== "string") {
      errors.push({ message: "reason must be a string" });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body || {},
    };
  },
};
