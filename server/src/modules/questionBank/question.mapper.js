export class QuestionMapper {
  /**
   * Admin / Examiner DTO: includes full authoring information, answer keys, explanations, and test cases
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
   * Candidate DTO: strictly sanitizes and strips correct answers, explanations, rubrics, and hidden test cases
   */
  static toCandidateDTO(question) {
    if (!question) return null;
    const doc = typeof question.toObject === "function" ? question.toObject() : question;

    // Sanitize Options (Never leak isCorrect)
    const safeOptions = (doc.options || []).map((opt) => ({
      id: opt.id || opt._id,
      text: opt.text,
      label: opt.label,
    }));

    // Sanitize Coding Configuration (Only public examples, never hidden evaluation test cases)
    let safeCoding = null;
    if (doc.coding) {
      const publicTestCases = (doc.coding.testCases || [])
        .filter((tc) => tc.isPublic || !tc.isHidden)
        .map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          explanation: tc.explanation,
        }));

      safeCoding = {
        problemStatement: doc.coding.problemStatement || doc.prompt,
        constraints: doc.coding.constraints || [],
        inputFormat: doc.coding.inputFormat || "",
        outputFormat: doc.coding.outputFormat || "",
        examples: doc.coding.examples || publicTestCases,
        publicTestCases,
        allowedLanguages: doc.coding.allowedLanguages || ["javascript", "python", "java", "cpp"],
        starterCode: doc.coding.starterCode || {},
        timeLimitMs: doc.coding.timeLimitMs || 2000,
        memoryLimitMb: doc.coding.memoryLimitMb || 256,
      };
    }

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
      description: doc.description,
      options: safeOptions,
      coding: safeCoding,
      difficulty: doc.difficulty,
      points: doc.points || doc.marks || 1,
      marks: doc.marks || doc.points || 1,
      estimatedTime: doc.estimatedTime || 60,
      metadata: doc.metadata || {},
    };
  }

  static toCandidateDTOList(questions) {
    if (!Array.isArray(questions)) return [];
    return questions.map((q) => this.toCandidateDTO(q));
  }
}

export default QuestionMapper;
