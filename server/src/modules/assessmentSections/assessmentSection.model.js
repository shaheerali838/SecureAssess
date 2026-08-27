import mongoose from "mongoose";

const assessmentSectionSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    order: {
      type: Number,
      default: 1,
    },
    instructions: {
      type: String,
      default: "",
    },
    points: {
      type: Number,
      default: 0,
    },
    questionLimit: {
      type: Number,
      default: 0, // 0 = unlimited
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

assessmentSectionSchema.index({ assessmentId: 1, order: 1 });
assessmentSectionSchema.index({ organizationId: 1, assessmentId: 1 });

const AssessmentSection =
  mongoose.models.AssessmentSection ||
  mongoose.model("AssessmentSection", assessmentSectionSchema);

export default AssessmentSection;
