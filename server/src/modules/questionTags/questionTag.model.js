import mongoose from "mongoose";

const questionTagSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: [true, "Tag slug is required"],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique tag slug per organization
questionTagSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

const QuestionTag =
  mongoose.models.QuestionTag ||
  mongoose.model("QuestionTag", questionTagSchema);

export default QuestionTag;
