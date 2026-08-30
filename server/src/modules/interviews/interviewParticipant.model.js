import mongoose from "mongoose";
import {
  PARTICIPANT_ROLES,
  PARTICIPANT_ROLE_LIST,
  PARTICIPANT_STATUSES,
  PARTICIPANT_STATUS_LIST,
} from "./interview.constants.js";

const interviewParticipantSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: [true, "Interview ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    role: {
      type: String,
      enum: PARTICIPANT_ROLE_LIST,
      default: PARTICIPANT_ROLES.INTERVIEWER,
      index: true,
    },
    status: {
      type: String,
      enum: PARTICIPANT_STATUS_LIST,
      default: PARTICIPANT_STATUSES.INVITED,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    connectionState: {
      type: String,
      default: "DISCONNECTED",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

interviewParticipantSchema.index(
  { interviewId: 1, userId: 1 },
  { unique: true }
);

const InterviewParticipant =
  mongoose.models.InterviewParticipant ||
  mongoose.model("InterviewParticipant", interviewParticipantSchema);

export default InterviewParticipant;
