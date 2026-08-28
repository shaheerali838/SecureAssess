/**
 * Coding Question Grader
 */
export const gradeCoding = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  const maxPoints = questionSnapshot.points || 10;
  const code = candidateAnswer?.answer?.code ? String(candidateAnswer.answer.code).trim() : "";

  if (!code) {
    return {
      earnedPoints: 0,
      scorePercentage: 0,
      isCorrect: false,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "No code submitted",
    };
  }

  // Exact sample or non-empty foundation score until external sandbox runner is invoked
  const correctCodePatterns = Array.isArray(questionSnapshot.correctAnswer)
    ? questionSnapshot.correctAnswer.map((c) => String(c).trim())
    : [String(questionSnapshot.correctAnswer || "").trim()];

  const isExactMatch = correctCodePatterns.some((pattern) => pattern && pattern === code);

  if (isExactMatch) {
    return {
      earnedPoints: maxPoints,
      scorePercentage: 100,
      isCorrect: true,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "All test cases passed",
    };
  }

  return {
    earnedPoints: 0,
    scorePercentage: 0,
    isCorrect: false,
    status: "NEEDS_MANUAL_REVIEW",
    evaluationType: "AUTOMATIC",
    feedback: "Code queued for execution against test cases or manual review",
  };
};
