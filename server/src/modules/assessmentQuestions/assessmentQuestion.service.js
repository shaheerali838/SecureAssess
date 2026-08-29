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

  static async recalculateTotalPoints(assessmentId) {
    const questions = await AssessmentQuestion.find({ assessmentId });
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || q.marks || 0), 0);
    await Assessment.findByIdAndUpdate(assessmentId, {
      $set: { totalPoints },
      $inc: { version: 1 },
    });
  }

  static async addQuestionToAssessment(organizationId, assessmentId, data) {
    await this.assertEditableAssessment(organizationId, assessmentId);

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

    // 3. Determine order and marks
    const count = await AssessmentQuestion.countDocuments({ assessmentId, sectionId: section._id });
    const order = data.order !== undefined ? data.order : count + 1;
    const points = data.marks !== undefined ? data.marks : (data.points !== undefined ? data.points : question.points || 1);
    const negativeMarks = data.negativeMarks !== undefined ? data.negativeMarks : (question.negativeMarks || 0);

    // 4. Create immutable Question Snapshot
    const snapshot = {
      type: question.type,
      title: question.title || "",
      prompt: question.prompt,
      description: question.description || "",
      content: question.content || {},
      options: question.options || [],
      correctAnswer: question.correctAnswer || question.answer,
      explanation: question.explanation || "",
      difficulty: question.difficulty || "MEDIUM",
      marks: points,
      points,
      negativeMarks,
      coding: question.coding || null,
      fileUpload: question.fileUpload || null,
      version: question.version || 1,
    };

    const assessmentQuestion = await AssessmentQuestion.create({
      organizationId,
      assessmentId,
      sectionId: section._id,
      questionId: question._id,
      questionVersion: question.version || 1,
      order,
      marks: points,
      points,
      negativeMarks,
      isRequired: data.isRequired !== undefined ? data.isRequired : true,
      type: question.type,
      title: question.title || "",
      prompt: question.prompt,
      options: question.options || [],
      correctAnswer: question.correctAnswer || question.answer,
      explanation: question.explanation || "",
      difficulty: question.difficulty || "MEDIUM",
      snapshotVersion: question.version || 1,
      snapshot,
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
    if (updateData.marks !== undefined) {
      safeUpdate.marks = updateData.marks;
      safeUpdate.points = updateData.marks;
    } else if (updateData.points !== undefined) {
      safeUpdate.points = updateData.points;
      safeUpdate.marks = updateData.points;
    }
    if (updateData.negativeMarks !== undefined) safeUpdate.negativeMarks = updateData.negativeMarks;
    if (updateData.order !== undefined) safeUpdate.order = updateData.order;
    if (updateData.isRequired !== undefined) safeUpdate.isRequired = updateData.isRequired;

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

  static async removeAssessmentQuestion(organizationId, assessmentId, questionId) {
    await this.assertEditableAssessment(organizationId, assessmentId);

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }

    const deleted = await AssessmentQuestion.findOneAndDelete({
      _id: questionId,
      assessmentId,
      organizationId,
    });

    if (!deleted) {
      throw new ApiError(404, "Assessment question not found");
    }

    await this.recalculateTotalPoints(assessmentId);
    return { success: true, message: "Question removed from assessment successfully" };
  }

  static async reorderQuestions(organizationId, assessmentId, questionsList) {
    await this.assertEditableAssessment(organizationId, assessmentId);

    if (!Array.isArray(questionsList)) {
      throw new ApiError(400, "Questions array is required for reordering");
    }

    for (const item of questionsList) {
      const id = item.id || item._id || item.questionId;
      if (id && mongoose.Types.ObjectId.isValid(id) && item.order !== undefined) {
        await AssessmentQuestion.updateOne(
          { _id: id, assessmentId, organizationId },
          { $set: { order: item.order } }
        );
      }
    }

    const updated = await AssessmentQuestion.find({ organizationId, assessmentId }).sort({ order: 1 });
    return AssessmentQuestionMapper.toAdminDTOList(updated);
  }

  static async bulkAddQuestions(organizationId, assessmentId, sectionId, questionIds) {
    await this.assertEditableAssessment(organizationId, assessmentId);

    const section = await AssessmentSection.findOne({
      _id: sectionId,
      assessmentId,
      organizationId,
    });
    if (!section) {
      throw new ApiError(400, "Section not found in this assessment");
    }

    const questions = await Question.find({
      _id: { $in: questionIds },
      organizationId,
      status: "ACTIVE",
    });

    const results = [];
    let currentOrder = await AssessmentQuestion.countDocuments({ assessmentId, sectionId });

    for (const q of questions) {
      currentOrder += 1;
      const snapshot = {
        type: q.type,
        title: q.title || "",
        prompt: q.prompt,
        description: q.description || "",
        content: q.content || {},
        options: q.options || [],
        correctAnswer: q.correctAnswer || q.answer,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "MEDIUM",
        marks: q.points || q.marks || 1,
        points: q.points || q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        coding: q.coding || null,
        fileUpload: q.fileUpload || null,
        version: q.version || 1,
      };

      const aq = await AssessmentQuestion.create({
        organizationId,
        assessmentId,
        sectionId,
        questionId: q._id,
        questionVersion: q.version || 1,
        order: currentOrder,
        marks: q.points || q.marks || 1,
        points: q.points || q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        isRequired: true,
        type: q.type,
        title: q.title || "",
        prompt: q.prompt,
        options: q.options || [],
        correctAnswer: q.correctAnswer || q.answer,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "MEDIUM",
        snapshotVersion: q.version || 1,
        snapshot,
        metadata: q.metadata || {},
      });
      results.push(aq);
    }

    await this.recalculateTotalPoints(assessmentId);
    return AssessmentQuestionMapper.toAdminDTOList(results);
  }
}
