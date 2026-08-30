import mongoose from "mongoose";

export class AttemptValidator {
  static validateStart(body) {
    const errors = [];
    if (body && typeof body === "object") {
      if (body.accessCode && typeof body.accessCode !== "string") {
        errors.push("Invalid accessCode format");
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}
