import mongoose from "mongoose";
import {
  INTERVIEW_EVENT_TYPE_LIST,
  INTERVIEW_EVENT_TYPES,
} from "./interview.constants.js";

const interviewEventSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: [true, "Interview ID is required"],
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: INTERVIEW_EVENT_TYPE_LIST,
      default: INTERVIEW_EVENT_TYPES.INTERVIEW_UPDATED,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

interviewEventSchema.index({ interviewId: 1, timestamp: 1 });

const InterviewEvent =
  mongoose.models.InterviewEvent ||
  mongoose.model("InterviewEvent", interviewEventSchema);

export default InterviewEvent;
