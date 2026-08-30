import mongoose from "mongoose";

export const createInterviewSchema = {
  validate: (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { error: { details: [{ message: "Request body is required" }] }, value: body };
    }
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      errors.push({ message: "Interview title is required" });
    }
    if (!body.scheduledStartAt) {
      errors.push({ message: "scheduledStartAt is required" });
    }
    if (!body.scheduledEndAt) {
      errors.push({ message: "scheduledEndAt is required" });
    }
    if (!body.candidateId || !mongoose.Types.ObjectId.isValid(body.candidateId)) {
      errors.push({ message: "Valid candidateId is required" });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body,
    };
  },
};

export const updateInterviewSchema = {
  validate: (body) => {
    return {
      error: null,
      value: body || {},
    };
  },
};

export const addParticipantSchema = {
  validate: (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { error: { details: [{ message: "Request body is required" }] }, value: body };
    }
    if (!body.userId || !mongoose.Types.ObjectId.isValid(body.userId)) {
      errors.push({ message: "Valid userId is required" });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body,
    };
  },
};
