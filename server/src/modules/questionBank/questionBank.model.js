import mongoose from "mongoose";

const questionBankSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Question bank name is required"],
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, "Question bank code is required"],
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["PRIVATE", "ORGANIZATION"],
      default: "ORGANIZATION",
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
questionBankSchema.index({ organizationId: 1, code: 1 }, { unique: true });
questionBankSchema.index({ organizationId: 1, subjectId: 1 });
questionBankSchema.index({ organizationId: 1, status: 1 });
questionBankSchema.index({ organizationId: 1, ownerId: 1 });

const QuestionBank =
  mongoose.models.QuestionBank ||
  mongoose.model("QuestionBank", questionBankSchema);

export default QuestionBank;
