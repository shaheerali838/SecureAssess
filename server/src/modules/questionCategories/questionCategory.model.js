import mongoose from "mongoose";

const questionCategorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    questionBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionBank",
      required: [true, "Question Bank ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    parentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionCategory",
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
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

// Unique category name per question bank within the organization
questionCategorySchema.index(
  { organizationId: 1, questionBankId: 1, name: 1 },
  { unique: true }
);

const QuestionCategory =
  mongoose.models.QuestionCategory ||
  mongoose.model("QuestionCategory", questionCategorySchema);

export default QuestionCategory;
