import mongoose from "mongoose";

const assessmentAssignmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: [true, "Assessment ID is required"],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    candidateGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateGroup",
      default: null,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["ASSIGNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "EXPIRED", "CANCELLED", "REVOKED"],
      default: "ASSIGNED",
      index: true,
    },
    accessCode: {
      type: String,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    availableFrom: {
      type: Date,
      default: null,
    },
    availableUntil: {
      type: Date,
      default: null,
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    attemptLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    instructions: {
      type: String,
      default: "",
    },
    invitation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    invitationSentAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
assessmentAssignmentSchema.index(
  { organizationId: 1, assessmentId: 1, candidateId: 1, status: 1 }
);
assessmentAssignmentSchema.index({ organizationId: 1, candidateId: 1, status: 1 });
assessmentAssignmentSchema.index({ organizationId: 1, assessmentId: 1, status: 1 });

const AssessmentAssignment =
  mongoose.models.AssessmentAssignment ||
  mongoose.model("AssessmentAssignment", assessmentAssignmentSchema);

export default AssessmentAssignment;
