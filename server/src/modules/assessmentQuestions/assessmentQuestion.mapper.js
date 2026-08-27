export class AssessmentQuestionMapper {
  static toAdminDTO(question) {
    if (!question) return null;
    const doc = typeof question.toObject === "function" ? question.toObject() : question;
    return doc;
  }

  static toAdminDTOList(questions) {
    if (!Array.isArray(questions)) return [];
    return questions.map((q) => this.toAdminDTO(q));
  }

  static toCandidateDTO(question) {
    if (!question) return null;
    const doc = typeof question.toObject === "function" ? question.toObject() : question;

    const safeOptions = (doc.options || []).map((opt) => ({
      id: opt.id,
      text: opt.text,
    }));

    return {
      _id: doc._id,
      id: doc._id,
      assessmentId: doc.assessmentId,
      sectionId: doc.sectionId,
      questionId: doc.questionId,
      order: doc.order,
      type: doc.type,
      title: doc.title,
      prompt: doc.prompt,
      options: safeOptions,
      points: doc.points,
      difficulty: doc.difficulty,
      metadata: doc.metadata,
    };
  }

  static toCandidateDTOList(questions) {
    if (!Array.isArray(questions)) return [];
    return questions.map((q) => this.toCandidateDTO(q));
  }
}
