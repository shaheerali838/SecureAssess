import mongoose from "mongoose";

const bandSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    desc: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const criterionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    weight: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 10,
    },
    bands: {
      type: [bandSchema],
      default: [],
    },
  },
  { _id: true }
);

const rubricSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Rubric title is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Rubric code is required"],
      uppercase: true,
      trim: true,
    },
    discipline: {
      type: String,
      default: "General",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    totalMaxScore: {
      type: Number,
      default: 100,
    },
    criteria: {
      type: [criterionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DRAFT", "ARCHIVED"],
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

rubricSchema.index({ organizationId: 1, code: 1 });
rubricSchema.index({ organizationId: 1, status: 1 });

const Rubric = mongoose.models.Rubric || mongoose.model("Rubric", rubricSchema);

export default Rubric;
