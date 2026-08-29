/**
 * Multiple Choice Question Grader (Supports EXACT_MATCH, PARTIAL_CREDIT, ALL_OR_NOTHING)
 */
export const gradeMultipleChoice = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  const maxPoints = questionSnapshot.marks || questionSnapshot.points || 1;
  const negativeMarks = questionSnapshot.negativeMarks || assessmentSettings.negativeMarkingPenalty || 0;
  
  // Extract grading policy from any of the potential setting locations
  const gradingPolicy =
    assessmentSettings.multipleChoiceGradingPolicy ||
    assessmentSettings.gradingSettings?.multipleChoiceGradingPolicy ||
    questionSnapshot.multipleChoiceGradingPolicy ||
    questionSnapshot.snapshot?.multipleChoiceGradingPolicy ||
    "PARTIAL_CREDIT"; // Default to partial credit for multi-select

  const rawAns = candidateAnswer?.answer !== undefined ? candidateAnswer.answer : candidateAnswer;
  let selectedOptionIds = [];

  if (Array.isArray(rawAns)) {
    selectedOptionIds = rawAns.map(String);
  } else if (rawAns && typeof rawAns === "object") {
    selectedOptionIds = (rawAns.selectedOptionIds || []).map(String);
  } else if (typeof rawAns === "string" && rawAns.length > 0) {
    selectedOptionIds = [rawAns];
  }

  const rawCorrect = questionSnapshot.correctAnswer || questionSnapshot.snapshot?.correctAnswer;
  let correctOptionIds = [];
  if (rawCorrect) {
    if (Array.isArray(rawCorrect.optionIds)) {
      correctOptionIds = rawCorrect.optionIds.map(String);
    } else if (Array.isArray(rawCorrect)) {
      correctOptionIds = rawCorrect.map(String);
    } else if (typeof rawCorrect === "string") {
      correctOptionIds = [rawCorrect];
    }
  }

  if (selectedOptionIds.length === 0) {
    return {
      earnedPoints: 0,
      scorePercentage: 0,
      isCorrect: false,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "Unanswered",
    };
  }

  const correctlySelected = selectedOptionIds.filter((id) => correctOptionIds.includes(id));
  const incorrectlySelected = selectedOptionIds.filter((id) => !correctOptionIds.includes(id));

  const isExactMatch =
    correctlySelected.length === correctOptionIds.length &&
    incorrectlySelected.length === 0;

  if (isExactMatch) {
    return {
      earnedPoints: maxPoints,
      scorePercentage: 100,
      isCorrect: true,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "All correct options selected",
    };
  }

  if ((gradingPolicy === "PARTIAL_CREDIT" || gradingPolicy === "PARTIAL") && correctOptionIds.length > 0) {
    const fractionPerOption = maxPoints / correctOptionIds.length;
    let earned = correctlySelected.length * fractionPerOption;
    if (incorrectlySelected.length > 0) {
      earned -= incorrectlySelected.length * fractionPerOption * 0.5;
    }
    earned = Math.max(0, Number(earned.toFixed(2)));
    return {
      earnedPoints: earned,
      scorePercentage: Math.round((earned / maxPoints) * 100),
      isCorrect: false,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: `Partially correct (${correctlySelected.length}/${correctOptionIds.length} matching)`,
    };
  }

  const penalty = Boolean(questionSnapshot.negativeMarks > 0 || assessmentSettings.negativeMarking)
    ? -Math.abs(negativeMarks)
    : 0;

  return {
    earnedPoints: penalty,
    scorePercentage: 0,
    isCorrect: false,
    status: "EVALUATED",
    evaluationType: "AUTOMATIC",
    feedback: "Incorrect selection combination",
  };
};
