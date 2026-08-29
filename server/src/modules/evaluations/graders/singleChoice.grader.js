/**
 * Single Choice Question Grader
 */
export const gradeSingleChoice = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  const maxPoints = questionSnapshot.marks || questionSnapshot.points || 1;
  const negativeMarks = questionSnapshot.negativeMarks || assessmentSettings.negativeMarkingPenalty || 0;
  const enableNegativeMarking = Boolean(questionSnapshot.negativeMarks > 0 || assessmentSettings.negativeMarking);

  // Support direct string or structured object
  const rawAns = candidateAnswer?.answer !== undefined ? candidateAnswer.answer : candidateAnswer;
  let selectedOptionId = null;

  if (typeof rawAns === "string") {
    selectedOptionId = rawAns;
  } else if (rawAns && typeof rawAns === "object") {
    selectedOptionId = rawAns.selectedOptionId || rawAns.id || rawAns.value;
  }

  // Extract correct option ID from snapshot
  const rawCorrect = questionSnapshot.correctAnswer || questionSnapshot.snapshot?.correctAnswer;
  let correctOptionIds = [];
  if (rawCorrect) {
    if (typeof rawCorrect === "string") {
      correctOptionIds = [rawCorrect];
    } else if (Array.isArray(rawCorrect.optionIds)) {
      correctOptionIds = rawCorrect.optionIds;
    } else if (rawCorrect.selectedOptionId) {
      correctOptionIds = [rawCorrect.selectedOptionId];
    } else if (Array.isArray(rawCorrect)) {
      correctOptionIds = rawCorrect;
    }
  }

  // If unanswered
  if (!selectedOptionId) {
    return {
      earnedPoints: 0,
      scorePercentage: 0,
      isCorrect: false,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "Unanswered",
    };
  }

  const isCorrect = correctOptionIds.map(String).includes(String(selectedOptionId).trim());

  if (isCorrect) {
    return {
      earnedPoints: maxPoints,
      scorePercentage: 100,
      isCorrect: true,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "Correct answer",
    };
  }

  const earnedPoints = enableNegativeMarking ? -Math.abs(negativeMarks) : 0;

  return {
    earnedPoints,
    scorePercentage: 0,
    isCorrect: false,
    status: "EVALUATED",
    evaluationType: "AUTOMATIC",
    feedback: "Incorrect option selected",
  };
};
