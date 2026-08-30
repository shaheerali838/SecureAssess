import mongoose from "mongoose";

const candidateGroupMemberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateGroup",
      required: [true, "Group ID is required"],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique candidate per group in an organization
candidateGroupMemberSchema.index(
  { organizationId: 1, groupId: 1, candidateId: 1 },
  { unique: true }
);

const CandidateGroupMember =
  mongoose.models.CandidateGroupMember ||
  mongoose.model("CandidateGroupMember", candidateGroupMemberSchema);

export default CandidateGroupMember;
