/**
 * Multiple Choice Question Grader (with Partial Credit & Negative Marking Support)
 */
export const gradeMultipleChoice = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  const maxPoints = questionSnapshot.points || 1;
  const allowPartialCredit = assessmentSettings.allowPartialCredit !== false;
  const negativeMarkingPenalty = assessmentSettings.negativeMarkingPenalty || 0;
  const enableNegativeMarking = Boolean(assessmentSettings.negativeMarking);

  const selectedOptionIds = Array.isArray(candidateAnswer?.answer?.selectedOptionIds)
    ? candidateAnswer.answer.selectedOptionIds.map(String)
    : [];

  const correctAnswers = Array.isArray(questionSnapshot.correctAnswer)
    ? questionSnapshot.correctAnswer.map(String)
    : [String(questionSnapshot.correctAnswer)];

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

  const correctSelected = selectedOptionIds.filter((id) => correctAnswers.includes(id));
  const incorrectSelected = selectedOptionIds.filter((id) => !correctAnswers.includes(id));

  // Exact Match
  if (
    correctSelected.length === correctAnswers.length &&
    incorrectSelected.length === 0
  ) {
    return {
      earnedPoints: maxPoints,
      scorePercentage: 100,
      isCorrect: true,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "All correct options selected",
    };
  }

  // Partial Match
  if (allowPartialCredit && correctSelected.length > 0 && incorrectSelected.length === 0) {
    const fraction = correctSelected.length / correctAnswers.length;
    const earnedPoints = Number((maxPoints * fraction).toFixed(2));
    const scorePercentage = Number((fraction * 100).toFixed(2));

    return {
      earnedPoints,
      scorePercentage,
      isCorrect: false,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: `Partially correct (${correctSelected.length}/${correctAnswers.length} options)`,
    };
  }

  // Incorrect
  const earnedPoints = enableNegativeMarking
    ? -Math.abs(negativeMarkingPenalty)
    : 0;

  return {
    earnedPoints,
    scorePercentage: 0,
    isCorrect: false,
    status: "EVALUATED",
    evaluationType: "AUTOMATIC",
    feedback: "Incorrect options selected",
  };
};
