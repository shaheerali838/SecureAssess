import { AssessmentRepository } from "./assessment.repository.js";
import { AssessmentMapper } from "./assessment.mapper.js";
import { ASSESSMENT_STATUS } from "./assessment.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateAssessmentCode } from "../../utils/generateCode.js";
import { eventBus } from "../../events/eventBus.js";
import { ASSESSMENT_EVENTS } from "../../events/assessment.events.js";

export class AssessmentService {
  static async createAssessment({ organizationId, userId, data }) {
    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required to create an assessment");
    }

    const accessCode = generateAssessmentCode(6);
    const assessmentData = {
      ...data,
      organizationId,
      createdBy: userId,
      accessCode,
      status: ASSESSMENT_STATUS.DRAFT,
    };

    const created = await AssessmentRepository.create(assessmentData);
    eventBus.emit(ASSESSMENT_EVENTS.CREATED, { id: created._id, organizationId });

    return AssessmentMapper.toDTO(created);
  }

  static async getAssessmentById(id, organizationId) {
    const assessment = await AssessmentRepository.findByIdAndOrganization(id, organizationId);
    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }
    return AssessmentMapper.toDTO(assessment);
  }

  static async listAssessments(organizationId, filter, pagination) {
    const { items, total } = await AssessmentRepository.findByOrganization(
      organizationId,
      filter,
      pagination
    );
    return {
      items: AssessmentMapper.toDTOList(items),
      total,
    };
  }

  static async updateAssessment(id, organizationId, updateData) {
    const updated = await AssessmentRepository.update(id, organizationId, updateData);
    if (!updated) {
      throw new ApiError(404, "Assessment not found");
    }
    return AssessmentMapper.toDTO(updated);
  }

  static async publishAssessment(id, organizationId) {
    const assessment = await AssessmentRepository.findByIdAndOrganization(id, organizationId);
    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    assessment.status = ASSESSMENT_STATUS.PUBLISHED;
    await assessment.save();

    eventBus.emit(ASSESSMENT_EVENTS.PUBLISHED, { id: assessment._id, organizationId });
    return AssessmentMapper.toDTO(assessment);
  }

  static async deleteAssessment(id, organizationId) {
    const deleted = await AssessmentRepository.delete(id, organizationId);
    if (!deleted) {
      throw new ApiError(404, "Assessment not found");
    }
    return { success: true, message: "Assessment deleted successfully" };
  }
}
