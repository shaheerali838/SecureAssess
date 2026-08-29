import mongoose from "mongoose";

const questionResultSchema = new mongoose.Schema(
  {
    attemptQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttemptQuestion",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    questionType: {
      type: String,
      required: true,
    },
    marksAvailable: {
      type: Number,
      required: true,
      default: 1,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["EVALUATED", "NEEDS_MANUAL_REVIEW", "PENDING_EVALUATION"],
      default: "EVALUATED",
    },
    candidateAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    correctAnswerUsed: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: [true, "Attempt ID is required"],
      unique: true,
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
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PARTIALLY_GRADED", "COMPLETED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    gradingMethod: {
      type: String,
      enum: ["AUTOMATIC", "MANUAL", "HYBRID"],
      default: "AUTOMATIC",
    },
    objectiveScore: {
      type: Number,
      default: 0,
    },
    subjectiveScore: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pendingManualReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    questionResults: {
      type: [questionResultSchema],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
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

evaluationSchema.index({ organizationId: 1, status: 1 });
evaluationSchema.index({ organizationId: 1, pendingManualReview: 1 });
evaluationSchema.index({ assessmentId: 1, status: 1 });

const Evaluation =
  mongoose.models.Evaluation || mongoose.model("Evaluation", evaluationSchema);

export default Evaluation;
