/**
 * Single Choice Question Grader
 */
export const gradeSingleChoice = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  const maxPoints = questionSnapshot.points || 1;
  const negativeMarkingPenalty = assessmentSettings.negativeMarkingPenalty || 0;
  const enableNegativeMarking = Boolean(assessmentSettings.negativeMarking);

  const selectedOptionId = candidateAnswer?.answer?.selectedOptionId;
  const correctAnswers = Array.isArray(questionSnapshot.correctAnswer)
    ? questionSnapshot.correctAnswer
    : [questionSnapshot.correctAnswer];

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

  const isCorrect = correctAnswers.map(String).includes(String(selectedOptionId));

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

  const earnedPoints = enableNegativeMarking
    ? -Math.abs(negativeMarkingPenalty)
    : 0;

  return {
    earnedPoints,
    scorePercentage: 0,
    isCorrect: false,
    status: "EVALUATED",
    evaluationType: "AUTOMATIC",
    feedback: "Incorrect option selected",
  };
};
