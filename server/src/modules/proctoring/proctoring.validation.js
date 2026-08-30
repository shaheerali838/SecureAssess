import { PROCTORING_EVENT_TYPE_LIST } from "../../constants/proctoringConstants.js";

export const startProctoringSchema = {
  validate: (body) => {
    const errors = [];
    if (body && typeof body === "object") {
      if (body.cameraEnabled !== undefined && typeof body.cameraEnabled !== "boolean") {
        errors.push({ message: "cameraEnabled must be a boolean" });
      }
      if (body.microphoneEnabled !== undefined && typeof body.microphoneEnabled !== "boolean") {
        errors.push({ message: "microphoneEnabled must be a boolean" });
      }
      if (body.screenShareEnabled !== undefined && typeof body.screenShareEnabled !== "boolean") {
        errors.push({ message: "screenShareEnabled must be a boolean" });
      }
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body || {},
    };
  },
};

export const recordEventSchema = {
  validate: (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
      return {
        error: { details: [{ message: "Request body is required" }] },
        value: body,
      };
    }
    if (!body.type || typeof body.type !== "string") {
      errors.push({ message: "Event type is required" });
    } else if (!PROCTORING_EVENT_TYPE_LIST.includes(body.type)) {
      errors.push({
        message: `Invalid proctoring event type. Must be one of: ${PROCTORING_EVENT_TYPE_LIST.join(", ")}`,
      });
    }
    if (body.clientEventId !== undefined && body.clientEventId !== null && typeof body.clientEventId !== "string") {
      errors.push({ message: "clientEventId must be a string" });
    }
    if (body.duration !== undefined && (typeof body.duration !== "number" || body.duration < 0)) {
      errors.push({ message: "duration must be a non-negative number" });
    }
    if (body.confidence !== undefined && (typeof body.confidence !== "number" || body.confidence < 0 || body.confidence > 1)) {
      errors.push({ message: "confidence must be a number between 0 and 1" });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body,
    };
  },
};

export const endProctoringSchema = {
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

export const reviewEventSchema = {
  validate: (body) => {
    const errors = [];
    if (body && body.reviewerNote !== undefined && typeof body.reviewerNote !== "string") {
      errors.push({ message: "reviewerNote must be a string" });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body || {},
    };
  },
};
