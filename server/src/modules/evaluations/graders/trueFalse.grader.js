/**
 * True / False Question Grader
 */
export const gradeTrueFalse = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  const maxPoints = questionSnapshot.points || 1;
  const selectedOptionId = candidateAnswer?.answer?.selectedOptionId || candidateAnswer?.answer?.text;
  const correctAnswers = Array.isArray(questionSnapshot.correctAnswer)
    ? questionSnapshot.correctAnswer.map((a) => String(a).toUpperCase())
    : [String(questionSnapshot.correctAnswer).toUpperCase()];

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

  const isCorrect = correctAnswers.includes(String(selectedOptionId).toUpperCase().trim());

  return {
    earnedPoints: isCorrect ? maxPoints : 0,
    scorePercentage: isCorrect ? 100 : 0,
    isCorrect,
    status: "EVALUATED",
    evaluationType: "AUTOMATIC",
    feedback: isCorrect ? "Correct answer" : "Incorrect answer",
  };
};
