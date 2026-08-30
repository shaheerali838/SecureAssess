import mongoose from "mongoose";

const questionVersionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question ID is required"],
      index: true,
    },
    version: {
      type: Number,
      required: [true, "Version number is required"],
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Question snapshot payload is required"],
    },
    changeReason: {
      type: String,
      default: "Question modification / update",
      trim: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author user ID is required"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

questionVersionSchema.index({ organizationId: 1, questionId: 1, version: 1 }, { unique: true });

const QuestionVersion =
  mongoose.models.QuestionVersion || mongoose.model("QuestionVersion", questionVersionSchema);

export default QuestionVersion;
