import mongoose from "mongoose";
import AssessmentQuestion from "./assessmentQuestion.model.js";
import Assessment from "../assessments/assessment.model.js";
import AssessmentSection from "../assessmentSections/assessmentSection.model.js";
import Question from "../questionBank/question.model.js";
import { AssessmentQuestionMapper } from "./assessmentQuestion.mapper.js";
import { EDITABLE_ASSESSMENT_STATUSES } from "../../constants/assessmentStatuses.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";
import { ApiError } from "../../utils/ApiError.js";

export class AssessmentQuestionService {
  /**
   * Helper: Asserts that assessment exists in organization and is editable
   */
  static async assertEditableAssessment(organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      organizationId,
    });

    if (!assessment) {
      throw new ApiError(404, "Assessment not found in this organization");
    }

    if (!EDITABLE_ASSESSMENT_STATUSES.includes(assessment.status)) {
      throw new ApiError(
        400,
        `Assessment is locked in '${assessment.status}' status and questions cannot be added or modified`
      );
    }

    return assessment;
  }

  /**
   * Recalculates total points of the assessment and updates version
   */
  static async recalculateTotalPoints(assessmentId) {
    const questions = await AssessmentQuestion.find({ assessmentId });
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    await Assessment.findByIdAndUpdate(assessmentId, {
      $set: { totalPoints },
      $inc: { version: 1 },
    });
  }

  /**
   * Takes an immutable snapshot of the Question and adds it to the assessment section
   */
  static async addQuestionToAssessment(organizationId, assessmentId, data) {
    const assessment = await this.assertEditableAssessment(organizationId, assessmentId);

    // 1. Verify Section belongs to this assessment and organization
    const section = await AssessmentSection.findOne({
      _id: data.sectionId,
      assessmentId,
      organizationId,
    });
    if (!section) {
      throw new ApiError(400, "Section not found in this assessment");
    }

    // 2. Verify Question belongs to this organization and is ACTIVE
    const question = await Question.findOne({
      _id: data.questionId,
      organizationId,
    });
    if (!question) {
      throw new ApiError(400, "Question not found in this organization");
    }
    if (question.status !== "ACTIVE") {
      throw new ApiError(400, "Only ACTIVE questions can be added to an assessment");
    }

    // 3. Determine order
    const count = await AssessmentQuestion.countDocuments({ assessmentId, sectionId: section._id });
    const order = data.order !== undefined ? data.order : count + 1;
    const points = data.points !== undefined ? data.points : question.points;

    // 4. Create immutable Question Snapshot
    const assessmentQuestion = await AssessmentQuestion.create({
      organizationId,
      assessmentId,
      sectionId: section._id,
      questionId: question._id,
      order,
      type: question.type,
      title: question.title || "",
      prompt: question.prompt,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
      points,
      difficulty: question.difficulty || "MEDIUM",
      snapshotVersion: question.version || 1,
      metadata: question.metadata || {},
    });

    // 5. Recalculate total points
    await this.recalculateTotalPoints(assessmentId);

    return AssessmentQuestionMapper.toAdminDTO(assessmentQuestion);
  }

  static async getAssessmentQuestions(organizationId, assessmentId, query = {}, callerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }

    const filter = { organizationId, assessmentId };
    if (query.sectionId && mongoose.Types.ObjectId.isValid(query.sectionId)) {
      filter.sectionId = query.sectionId;
    }

    const questions = await AssessmentQuestion.find(filter).sort({ order: 1 });

    const isCandidate = callerUser?.organizationRole?.name === ORGANIZATION_ROLES.CANDIDATE;
    return isCandidate
      ? AssessmentQuestionMapper.toCandidateDTOList(questions)
      : AssessmentQuestionMapper.toAdminDTOList(questions);
  }

  static async updateAssessmentQuestion(organizationId, assessmentId, assessmentQuestionId, updateData) {
    await this.assertEditableAssessment(organizationId, assessmentId);

    if (!mongoose.Types.ObjectId.isValid(assessmentQuestionId)) {
      throw new ApiError(400, "Invalid assessment question ID format");
    }

    const safeUpdate = {};
    if (updateData.points !== undefined) safeUpdate.points = updateData.points;
    if (updateData.order !== undefined) safeUpdate.order = updateData.order;

    const updated = await AssessmentQuestion.findOneAndUpdate(
      { _id: assessmentQuestionId, assessmentId, organizationId },
      { $set: safeUpdate },
      { returnDocument: "after", runValidators: true }
    );

    if (!updated) {
      throw new ApiError(404, "Assessment question not found");
    }

    await this.recalculateTotalPoints(assessmentId);
    return AssessmentQuestionMapper.toAdminDTO(updated);
  }

  static async removeAssessmentQuestion(organizationId, assessmentId, assessmentQuestionId) {
    await this.assertEditableAssessment(organizationId, assessmentId);

    if (!mongoose.Types.ObjectId.isValid(assessmentQuestionId)) {
      throw new ApiError(400, "Invalid assessment question ID format");
    }

    const deleted = await AssessmentQuestion.findOneAndDelete({
      _id: assessmentQuestionId,
      assessmentId,
      organizationId,
    });

    if (!deleted) {
      throw new ApiError(404, "Assessment question not found");
    }

    await this.recalculateTotalPoints(assessmentId);
    return { success: true, message: "Question removed from assessment successfully" };
  }
}
