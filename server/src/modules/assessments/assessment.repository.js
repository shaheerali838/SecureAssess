import Assessment from "./assessment.model.js";

export class AssessmentRepository {
  static async findById(id) {
    return Assessment.findById(id).populate("createdBy", "name email");
  }

  static async findByIdAndOrganization(id, organizationId) {
    return Assessment.findOne({ _id: id, organizationId }).populate("createdBy", "name email");
  }

  static async findByOrganization(organizationId, filter = {}, pagination = { skip: 0, limit: 10 }) {
    const query = { ...filter, organizationId };
    const [items, total] = await Promise.all([
      Assessment.find(query)
        .populate("createdBy", "name email")
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Assessment.countDocuments(query),
    ]);
    return { items, total };
  }

  static async create(assessmentData) {
    return Assessment.create(assessmentData);
  }

  static async update(id, organizationId, updateData) {
    return Assessment.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");
  }

  static async delete(id, organizationId) {
    return Assessment.findOneAndDelete({ _id: id, organizationId });
  }
}
