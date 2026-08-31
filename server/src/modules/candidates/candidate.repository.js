import Candidate from "./candidate.model.js";

export class CandidateRepository {
  static async create(candidateData, options = {}) {
    if (options.session) {
      const created = await Candidate.create([candidateData], { session: options.session });
      return created[0];
    }
    return Candidate.create(candidateData);
  }

  static async findById(id, options = {}) {
    return Candidate.findById(id, null, options)
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("candidateGroupId", "name code")
      .populate("userId", "firstName lastName email avatar status");
  }

  static async findOne(filter, options = {}) {
    return Candidate.findOne(filter, null, options)
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("candidateGroupId", "name code")
      .populate("userId", "firstName lastName email avatar status");
  }

  static async find(filter, options = {}) {
    const query = Candidate.find(filter, null, options)
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("candidateGroupId", "name code");

    if (options.sort) query.sort(options.sort);
    if (options.skip) query.skip(options.skip);
    if (options.limit) query.limit(options.limit);

    return query;
  }

  static async count(filter) {
    return Candidate.countDocuments(filter);
  }

  static async update(id, organizationId, updateData) {
    return Candidate.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    );
  }

  static async delete(id, organizationId) {
    return Candidate.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: { status: "DEACTIVATED" } },
      { returnDocument: "after" }
    );
  }
}

export default CandidateRepository;
