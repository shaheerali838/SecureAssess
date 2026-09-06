import mongoose from "mongoose";
import AssessmentSection from "./assessmentSection.model.js";
import Assessment from "../assessments/assessment.model.js";
import { EDITABLE_ASSESSMENT_STATUSES } from "../../constants/assessmentStatuses.js";
import { ApiError } from "../../utils/ApiError.js";

export class AssessmentSectionService {
  static async assertEditableAssessment(organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const query = { _id: assessmentId };
    if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
      query.organizationId = organizationId;
    }

    let assessment = await Assessment.findOne(query);
    if (!assessment) {
      assessment = await Assessment.findById(assessmentId);
    }

    if (!assessment) {
      throw new ApiError(404, "Assessment not found in database");
    }

    if (!EDITABLE_ASSESSMENT_STATUSES.includes(assessment.status)) {
      throw new ApiError(
        400,
        `Assessment is locked in '${assessment.status}' status and its structure cannot be modified`
      );
    }

    return assessment;
  }

  static async createSection(organizationId, assessmentId, data) {
    const assessment = await this.assertEditableAssessment(organizationId, assessmentId);

    const count = await AssessmentSection.countDocuments({ assessmentId });
    const order = data.order !== undefined ? data.order : count + 1;

    const section = await AssessmentSection.create({
      organizationId: organizationId || assessment.organizationId,
      assessmentId,
      title: data.title ? data.title.trim() : "General Section",
      description: data.description || "",
      order,
      instructions: data.instructions || "",
      points: data.points || 0,
      questionLimit: data.questionLimit || 0,
      duration: data.duration || 0,
      settings: data.settings || {},
    });

    assessment.version = (assessment.version || 1) + 1;
    await assessment.save();

    return section;
  }

  static async getSections(organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const sections = await AssessmentSection.find({
      organizationId,
      assessmentId,
    }).sort({ order: 1 });

    return sections;
  }

  static async updateSection(organizationId, assessmentId, sectionId, updateData) {
    const assessment = await this.assertEditableAssessment(organizationId, assessmentId);

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      throw new ApiError(400, "Invalid section ID format");
    }

    const safeUpdate = {};
    if (updateData.title) safeUpdate.title = updateData.title.trim();
    if (updateData.description !== undefined) safeUpdate.description = updateData.description;
    if (updateData.order !== undefined) safeUpdate.order = updateData.order;
    if (updateData.instructions !== undefined) safeUpdate.instructions = updateData.instructions;
    if (updateData.points !== undefined) safeUpdate.points = updateData.points;
    if (updateData.questionLimit !== undefined) safeUpdate.questionLimit = updateData.questionLimit;
    if (updateData.duration !== undefined) safeUpdate.duration = updateData.duration;
    if (updateData.settings) safeUpdate.settings = updateData.settings;

    const section = await AssessmentSection.findOneAndUpdate(
      { _id: sectionId, assessmentId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    );

    if (!section) {
      throw new ApiError(404, "Section not found in this assessment");
    }

    assessment.version = (assessment.version || 1) + 1;
    await assessment.save();

    return section;
  }

  static async deleteSection(organizationId, assessmentId, sectionId) {
    const assessment = await this.assertEditableAssessment(organizationId, assessmentId);

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      throw new ApiError(400, "Invalid section ID format");
    }

    const deleted = await AssessmentSection.findOneAndDelete({
      _id: sectionId,
      assessmentId,
      organizationId,
    });

    if (!deleted) {
      throw new ApiError(404, "Section not found in this assessment");
    }

    assessment.version = (assessment.version || 1) + 1;
    await assessment.save();

    return { success: true, message: "Section deleted successfully" };
  }

  static async reorderSections(organizationId, assessmentId, sectionsList) {
    await this.assertEditableAssessment(organizationId, assessmentId);

    if (!Array.isArray(sectionsList)) {
      throw new ApiError(400, "Sections array is required for reordering");
    }

    for (const item of sectionsList) {
      const id = item.id || item._id || item.sectionId;
      if (id && mongoose.Types.ObjectId.isValid(id) && item.order !== undefined) {
        await AssessmentSection.updateOne(
          { _id: id, assessmentId, organizationId },
          { $set: { order: item.order } }
        );
      }
    }

    const updated = await AssessmentSection.find({ organizationId, assessmentId }).sort({ order: 1 });
    return updated;
  }
}
