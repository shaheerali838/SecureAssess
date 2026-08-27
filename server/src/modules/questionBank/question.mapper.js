export class QuestionMapper {
  /**
   * Admin / Examiner DTO: includes correct answers and explanations
   */
  static toAdminDTO(question) {
    if (!question) return null;
    const doc = typeof question.toObject === "function" ? question.toObject() : question;
    return doc;
  }

  static toAdminDTOList(questions) {
    if (!Array.isArray(questions)) return [];
    return questions.map((q) => this.toAdminDTO(q));
  }

  /**
   * Candidate DTO: strips correct answers, explanations, and isCorrect flags
   */
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
      organizationId: doc.organizationId,
      questionBankId: doc.questionBankId,
      categoryId: doc.categoryId,
      subjectId: doc.subjectId,
      type: doc.type,
      title: doc.title,
      prompt: doc.prompt,
      options: safeOptions,
      difficulty: doc.difficulty,
      points: doc.points,
      timeLimit: doc.timeLimit,
      metadata: doc.metadata,
    };
  }

  static toCandidateDTOList(questions) {
    if (!Array.isArray(questions)) return [];
    return questions.map((q) => this.toCandidateDTO(q));
  }
}
